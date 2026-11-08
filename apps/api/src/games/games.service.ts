import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GameType, Level, Word } from '@prisma/client';
import { decrypt, encrypt } from '../auth/crypto.js';
import { calcAge } from '../auth/auth.utils.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AnswerDto, MatchAnswerDto, TypedAnswerDto } from './games.dto.js';
import { dayBefore, levelFromXp, nextState, nextStreak, shuffle, tashkentDay, XP_PER_CORRECT } from './srs.js';

const QUESTION_TTL_MS = 10 * 60 * 1000;
const PURPOSE = 'quiz';
const PURPOSE_MATCH = 'match';
const PURPOSE_BUILDER = 'builder';
const PURPOSE_LISTEN = 'listen';

interface MatchPayload { u: string; e: number; w: string[]; m: number[] }
interface TypedPayload { u: string; e: number; w: string }

/** Turkcha kichik harfga o'tkazish (I → ı, İ → i) va NFC normallashtirish */
const normTr = (s: string) => s.normalize('NFC').trim().toLocaleLowerCase('tr-TR');
/** Diakritiklarni olib tashlash: ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u */
const fold = (s: string) => normTr(s).replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

interface QuestionPayload {
  u: string; // foydalanuvchi
  w: string; // so'z ID si
  c: number; // to'g'ri javob indeksi (shifrlangan tokenda: klient ko'ra olmaydi)
  e: number; // amal qilish muddati
}

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get secret() {
    return this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  /**
   * Savollar to'plami: avval takrorlash vaqti kelgan so'zlar, keyin yangilari.
   * To'g'ri javob klientga YUBORILMAYDI, u shifrlangan tokenda turadi.
   */
  async quiz(userId: string, level: Level | undefined, limit = 10) {
    const now = new Date();
    const learned = await this.prisma.userWord.findMany({
      where: { userId },
      select: { wordId: true, nextReviewAt: true },
    });
    const learnedIds = new Set(learned.map((u) => u.wordId));
    const dueIds = learned
      .filter((u) => u.nextReviewAt <= now)
      .sort((a, b) => a.nextReviewAt.getTime() - b.nextReviewAt.getTime())
      .map((u) => u.wordId);

    const allWords = await this.prisma.word.findMany({ orderBy: [{ level: 'asc' }, { position: 'asc' }] });
    if (allWords.length < 4) throw new BadRequestException("So'zlar yetarli emas. Ustoz so'z qo'shishi kerak");

    const byId = new Map(allWords.map((w) => [w.id, w]));
    const due = dueIds.map((id) => byId.get(id)).filter((w) => !!w).slice(0, limit);
    const fresh = allWords
      .filter((w) => !learnedIds.has(w.id) && (!level || w.level === level))
      .slice(0, Math.max(0, limit - due.length));
    const targets = [...due, ...fresh];

    const questions = targets.map((w) => {
      const others = allWords.filter((o) => o.id !== w.id && o.uzbek !== w.uzbek);
      const same = others.filter((o) => o.level === w.level); // noto'g'ri variantlar ham o'sha darajadan (aks holda javobni osongina topib bo'ladi)
      const distractors = shuffle(same.length >= 6 ? same : others).slice(0, 3);
      const options = shuffle([w, ...distractors]);
      const payload: QuestionPayload = {
        u: userId,
        w: w.id,
        c: options.findIndex((o) => o.id === w.id),
        e: Date.now() + QUESTION_TTL_MS,
      };
      return {
        token: encrypt(JSON.stringify(payload), this.secret, PURPOSE),
        prompt: w.turkish,
        example: w.exampleTr,
        audioUrl: w.audioUrl,
        options: options.map((o) => o.uzbek),
      };
    });

    return { questions, dueCount: dueIds.length };
  }

  // ───────── Umumiy yordamchilar ─────────
  private seal(purpose: string, payload: object) {
    return encrypt(JSON.stringify({ ...payload, e: Date.now() + QUESTION_TTL_MS }), this.secret, purpose);
  }

  /** Token shifrini ochadi; boshqa foydalanuvchiniki, buzilgan yoki muddati o'tgan bo'lsa xato beradi. */
  private open<T extends { u: string; e: number }>(purpose: string, token: string): T {
    const raw = decrypt(token, this.secret, purpose);
    let payload: T | null = null;
    try {
      payload = raw ? (JSON.parse(raw) as T) : null;
    } catch {
      payload = null;
    }
    return payload as T; // tekshiruv chaqiruvchida (userId bilan)
  }

  private validOrThrow<T extends { u: string; e: number }>(purpose: string, token: string, userId: string): T {
    const p = this.open<T>(purpose, token);
    if (!p || p.u !== userId || p.e < Date.now()) {
      throw new BadRequestException("Savol yaroqsiz yoki muddati tugagan. Yangi savollarni oling");
    }
    return p;
  }

  /** Avval takrorlash vaqti kelgan so'zlar, keyin yangilari (tartib bo'yicha). */
  private async pickTargets(userId: string, level: Level | undefined, limit: number, only?: (w: Word) => boolean) {
    const now = new Date();
    const learned = await this.prisma.userWord.findMany({ where: { userId }, select: { wordId: true, nextReviewAt: true } });
    const learnedIds = new Set(learned.map((u) => u.wordId));
    const dueIds = learned
      .filter((u) => u.nextReviewAt <= now)
      .sort((a, b) => a.nextReviewAt.getTime() - b.nextReviewAt.getTime())
      .map((u) => u.wordId);
    const allWords = await this.prisma.word.findMany({ orderBy: [{ level: 'asc' }, { position: 'asc' }] });
    const byId = new Map(allWords.map((w) => [w.id, w]));
    const ok = (w: Word) => !only || only(w);
    const due = dueIds.map((id) => byId.get(id)).filter((w): w is Word => !!w && ok(w)).slice(0, limit);
    const fresh = allWords.filter((w) => !learnedIds.has(w.id) && (!level || w.level === level) && ok(w)).slice(0, Math.max(0, limit - due.length));
    return { allWords, targets: [...due, ...fresh], dueCount: dueIds.length };
  }

  /**
   * Natijalarni yozadi. Mukofot (XP, seriya, takrorlash holati) faqat so'z "vaqti kelganda" beriladi,
   * shuning uchun bir savolni qayta-qayta yuborib XP "ishlab" bo'lmaydi (hamma o'yinlarda bir xil qoida).
   */
  private async settle(userId: string, game: GameType, results: { wordId: string; correct: boolean }[]) {
    const now = new Date();
    let xp = 0;
    let anyDue = false;
    for (const r of results) {
      const progress = await this.prisma.userWord.findUnique({ where: { userId_wordId: { userId, wordId: r.wordId } } });
      if (progress && progress.nextReviewAt > now) continue; // hali vaqti kelmagan
      anyDue = true;
      const state = nextState(progress?.box ?? 1, r.correct, now);
      await this.prisma.userWord.upsert({
        where: { userId_wordId: { userId, wordId: r.wordId } },
        create: { userId, wordId: r.wordId, ...state, correctCount: r.correct ? 1 : 0, wrongCount: r.correct ? 0 : 1 },
        update: { ...state, ...(r.correct ? { correctCount: { increment: 1 } } : { wrongCount: { increment: 1 } }) },
      });
      if (r.correct) xp += XP_PER_CORRECT;
    }
    if (anyDue) {
      await this.addActivity(userId, xp, now);
      if (xp > 0) await this.prisma.gameResult.create({ data: { userId, game, score: xp } });
    }
    return xp;
  }

  // ───────── 1) So'z mashqi (variantlar) ─────────
  async answer(userId: string, dto: AnswerDto) {
    const payload = this.validOrThrow<QuestionPayload>(PURPOSE, dto.token, userId);
    const correct = dto.choice === payload.c;
    const xpGained = await this.settle(userId, 'FLASHCARDS', [{ wordId: payload.w, correct }]);
    return { correct, correctIndex: payload.c, xpGained, stats: await this.myStats(userId) };
  }

  // ───────── 2) Juftlikni top ─────────
  async matchSet(userId: string, level: Level | undefined) {
    const { targets } = await this.pickTargets(userId, level, 6);
    const seen = new Set<string>();
    const words = targets.filter((w) => (seen.has(w.uzbek) ? false : (seen.add(w.uzbek), true))); // bir xil tarjima bo'lmasin
    if (words.length < 3) return { token: null, left: [], right: [] };
    const order = shuffle(words.map((_, i) => i)); // o'ng ustundagi j-element: chapdagi order[j]-so'zning tarjimasi
    const token = this.seal(PURPOSE_MATCH, { u: userId, w: words.map((w) => w.id), m: order });
    return { token, left: words.map((w) => w.turkish), right: order.map((i) => words[i].uzbek) };
  }

  async matchAnswer(userId: string, dto: MatchAnswerDto) {
    const p = this.validOrThrow<MatchPayload>(PURPOSE_MATCH, dto.token, userId);
    const n = p.w.length;
    const lefts = new Set<number>();
    const rights = new Set<number>();
    for (const pr of dto.pairs) {
      if (pr.left >= n || pr.right >= n || lefts.has(pr.left) || rights.has(pr.right)) {
        throw new BadRequestException("Juftliklar noto'g'ri");
      }
      lefts.add(pr.left);
      rights.add(pr.right);
    }
    const results = dto.pairs.map((pr) => ({ left: pr.left, right: pr.right, correct: p.m[pr.right] === pr.left }));
    const xpGained = await this.settle(userId, 'MATCH_PAIRS', results.map((r) => ({ wordId: p.w[r.left], correct: r.correct })));
    const correctRight = p.w.map((_, i) => p.m.indexOf(i)); // har bir chap so'z uchun to'g'ri o'ng indeks
    return { results, correctRight, xpGained, stats: await this.myStats(userId) };
  }

  // ───────── 3) Harflardan so'z / 4) Tinglab yozish ─────────
  async typedSet(userId: string, level: Level | undefined, limit: number, kind: 'builder' | 'listen') {
    const usable = (w: Word) => /^\p{L}+$/u.test(w.turkish) && [...w.turkish].length >= 3 && [...w.turkish].length <= 12; // faqat harflar (probel va tinish belgilarisiz)
    const { targets } = await this.pickTargets(userId, level, limit, usable);
    const items = targets.map((w) => {
      const letters = [...normTr(w.turkish)];
      let tiles = shuffle(letters);
      for (let i = 0; i < 10 && tiles.join('') === letters.join('') && new Set(letters).size > 1; i++) tiles = shuffle(letters);
      return {
        token: this.seal(kind === 'builder' ? PURPOSE_BUILDER : PURPOSE_LISTEN, { u: userId, w: w.id }),
        hint: w.uzbek,
        example: w.exampleTr,
        length: letters.length,
        // Harflar faqat "yig'ish" o'yinida beriladi; "tinglash"da so'z ovoz chiqarish uchun yuboriladi
        ...(kind === 'builder' ? { tiles } : { text: w.turkish }),
      };
    });
    return { items };
  }

  async typedAnswer(userId: string, kind: 'builder' | 'listen', dto: TypedAnswerDto) {
    const p = this.validOrThrow<TypedPayload>(kind === 'builder' ? PURPOSE_BUILDER : PURPOSE_LISTEN, dto.token, userId);
    const word = await this.prisma.word.findUnique({ where: { id: p.w } });
    if (!word) throw new BadRequestException("So'z topilmadi");
    const correct = normTr(dto.answer) === normTr(word.turkish);
    const almost = !correct && fold(dto.answer) === fold(word.turkish); // diakritiksiz yozilgan: ç, ğ, ı, ö, ş, ü
    const xpGained = await this.settle(userId, kind === 'builder' ? 'WORD_BUILDER' : 'LISTEN_AND_WRITE', [{ wordId: word.id, correct }]);
    return { correct, almost, answer: word.turkish, xpGained, stats: await this.myStats(userId) };
  }

  private async addActivity(userId: string, xp: number, now: Date) {
    const stats = await this.prisma.userStats.upsert({ where: { userId }, create: { userId }, update: {} });
    const today = tashkentDay(now);
    const last = stats.lastActiveDay ? stats.lastActiveDay.toISOString().slice(0, 10) : null;
    const streak = nextStreak(last, today, stats.streak);
    const newXp = stats.xp + xp;
    await this.prisma.userStats.update({
      where: { userId },
      data: {
        xp: newXp,
        level: levelFromXp(newXp),
        streak,
        longestStreak: Math.max(stats.longestStreak, streak),
        lastActiveDay: new Date(`${today}T00:00:00Z`),
      },
    });
  }

  async myStats(userId: string) {
    const stats = await this.prisma.userStats.upsert({ where: { userId }, create: { userId }, update: {} });
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { leaderboardOptIn: true } });
    const learned = await this.prisma.userWord.findMany({
      where: { userId },
      select: { nextReviewAt: true, box: true },
    });
    const now = new Date();
    // Seriya bugun yoki kecha davom etgan bo'lsa ko'rsatiladi, aks holda uzilgan hisoblanadi
    const last = stats.lastActiveDay ? stats.lastActiveDay.toISOString().slice(0, 10) : null;
    const today = tashkentDay(now);
    const alive = last === today || last === dayBefore(today);
    return {
      xp: stats.xp,
      level: stats.level,
      streak: alive ? stats.streak : 0,
      longestStreak: stats.longestStreak,
      learnedWords: learned.length,
      masteredWords: learned.filter((u) => u.box >= 5).length,
      dueWords: learned.filter((u) => u.nextReviewAt <= now).length,
      leaderboardOptIn: user?.leaderboardOptIn ?? false,
    };
  }

  /** Haftalik reyting: faqat o'zi rozilik bergan foydalanuvchilar. Ism: "Aziza K." */
  async leaderboard() {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.gameResult.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since }, user: { leaderboardOptIn: true } },
      _sum: { score: true },
      orderBy: { _sum: { score: 'desc' } },
      take: 20,
    });
    const users = await this.prisma.user.findMany({
      where: { id: { in: rows.map((r) => r.userId) } },
      select: { id: true, firstName: true, lastName: true },
    });
    const names = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName.charAt(0)}.`]));
    return rows.map((r, i) => ({ rank: i + 1, name: names.get(r.userId) ?? '?', xp: r._sum.score ?? 0, userId: r.userId }));
  }

  /** Voyaga yetmaganlar reytingda ko'rinishi uchun ota-ona roziligi kerak. */
  async setLeaderboardOptIn(userId: string, optIn: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { birthDate: true, parentConsent: true },
    });
    if (optIn && user?.birthDate && calcAge(user.birthDate) < 18 && !user.parentConsent) {
      throw new ForbiddenException("18 yoshgacha bo'lganlar uchun ota-ona roziligi kerak. Ustoz bilan bog'laning");
    }
    await this.prisma.user.update({ where: { id: userId }, data: { leaderboardOptIn: optIn } });
    return { optIn };
  }
}

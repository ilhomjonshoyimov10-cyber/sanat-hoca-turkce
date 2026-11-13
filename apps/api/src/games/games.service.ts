import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GameType, Level, Word } from '@prisma/client';
import { decrypt, encrypt } from '../auth/crypto.js';
import { calcAge } from '../auth/auth.utils.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AnswerDto, MatchAnswerDto, TypedAnswerDto } from './games.dto.js';
import { isVerb, nearlySameAsTranslation, pickDistractors, sameAsTranslation, soften } from './distractors.js';
import { dropRecentlySeen, markSeen, pickFresh } from './rotation.js';
import { dayBefore, levelFromXp, nextState, nextStreak, shuffle, tashkentDay, XP_PER_CORRECT } from './srs.js';

const QUESTION_TTL_MS = 10 * 60 * 1000;
const PURPOSE = 'quiz';
const PURPOSE_MATCH = 'match';
const PURPOSE_BUILDER = 'builder';
const PURPOSE_LISTEN = 'listen';
const PURPOSE_SENTENCE = 'sentence';
const PURPOSE_SUFFIX = 'suffix';
const PURPOSE_CHAIN = 'chain';
const PURPOSE_CLOZE = 'cloze';
const PURPOSE_VERB = 'verb';
const PURPOSE_DIALOGUE = 'dialogue';
const PURPOSE_PAIR = 'pair';
const PURPOSE_ODD = 'odd';

/** So'z zanjiri necha qadamda tugaydi. Tokenning hajmini ham cheklaydi. */
const CHAIN_LENGTH = 10;

/**
 * Gap tuzish va qo'shimcha mashqlarida so'zlarning takrorlash jadvali yo'q,
 * ya'ni "vaqti kelganda beriladi" qoidasi ishlamaydi. Shuning uchun bu
 * o'yinlarda XP ga KUNLIK CHEGARA qo'yamiz: aks holda bitta mashqni
 * qayta-qayta yuborib cheksiz XP yig'ish mumkin bo'lardi.
 */
const DAILY_XP_CAP_PER_GAME = 120;

/** Ma'no bo'yicha mavzu tegining boshlanishi, masalan "mavzu:ovqat". */
const TOPIC_TAG = 'mavzu:';

interface MatchPayload { u: string; e: number; w: string[]; m: number[] }
interface TypedPayload { u: string; e: number; w: string }
interface SentencePayload { u: string; e: number; s: string }
interface SuffixPayload { u: string; e: number; d: string }
/** Variantli o'yinlar: i = element ID si, c = to'g'ri variant indeksi */
interface ChoicePayload { u: string; e: number; i: string; c: number }
/** c = hozirgi so'z, used = ishlatilgan so'zlar, n = qadam raqami */
interface ChainPayload { u: string; e: number; c: string; used: string[]; n: number }

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
    // DIQQAT: bu yerda avval o'z nusxasidagi tanlash mantig'i bor edi.
    // Natijada takrorlanishdan himoya `pickTargets` ga qo'shilganda
    // aynan shu o'yin — eng ko'p o'ynaladigani — tashqarida qolgan edi.
    // Endi hamma o'yin bitta manbadan foydalanadi.
    const { allWords, targets, dueCount } = await this.pickTargets(userId, level, limit);
    if (allWords.length < 4) throw new BadRequestException("So'zlar yetarli emas. Ustoz so'z qo'shishi kerak");

    const questions = targets.map((w) => {
      // Chalg'ituvchilar mavzu -> darslik bo'limi -> daraja tartibida
      // tanlanadi (sababi distractors.ts da). Ilgari butun lug'atdan
      // tasodifiy olinardi: "üzüm" ga "televizor boshlovchisi" varianti.
      const distractors = pickDistractors(w, allWords, 3);
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
        // Harf o'lchami bir xil bo'lsin: lug'atda ba'zi tarjimalar bosh harf
        // bilan, ba'zilari kichik — va faqat to'g'ri javob kichik bo'lsa,
        // u o'zini o'zi oshkor qilardi.
        options: options.map((o) => soften(o.uzbek, 'uz')),
      };
    });

    return { questions, dueCount };
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
    // Tarjimasi o'zi bilan bir xil so'zlar (tuz/tuz, taksi/taksi) bu
    // o'yinlarda savol bo'la olmaydi — javob ekranda yozilgan bo'ladi.
    const ok = (w: Word) => !sameAsTranslation(w) && (!only || only(w));
    const due = dueIds.map((id) => byId.get(id)).filter((w): w is Word => !!w && ok(w)).slice(0, limit);

    // Yangi so'zlar: dars tartibida, lekin yaqinda ko'rsatilganlari
    // o'tkazib yuboriladi — javobsiz qolgan so'z keyingi safar yana
    // birinchi bo'lib chiqmasin.
    const freshPool = allWords.filter(
      (w) => !learnedIds.has(w.id) && (!level || w.level === level) && ok(w),
    );
    const need = Math.max(0, limit - due.length);
    const fresh = need > 0
      ? (await dropRecentlySeen(this.prisma, userId, 'word', freshPool)).slice(0, need)
      : [];

    const targets = [...due, ...fresh];
    await markSeen(this.prisma, userId, 'word', targets.map((w) => w.id));
    return { allWords, targets, dueCount: dueIds.length };
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
    return {
      token,
      left: words.map((w) => soften(w.turkish, 'tr')),
      right: order.map((i) => soften(words[i].uzbek, 'uz')),
    };
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
    // Faqat harflar (probel va tinish belgilarisiz), 3–12 harf.
    // Va tarjimasi turkchasiga deyarli teng bo'lmasin: bu o'yinlarda
    // tarjima ko'rsatiladi va turkchasi YOZILADI — "Tarjimasi: tennis"
    // deb turib "tenis" ni so'rash savol emas.
    const usable = (w: Word) =>
      /^\p{L}+$/u.test(w.turkish) &&
      [...w.turkish].length >= 3 &&
      [...w.turkish].length <= 12 &&
      !nearlySameAsTranslation(w);
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

  // ═══════════════ Chegaralangan mukofot (so'zga bog'liq bo'lmagan o'yinlar) ═══════════════

  /** Bugun shu o'yindan qancha XP olingani. */
  private async xpToday(userId: string, game: GameType): Promise<number> {
    const today = tashkentDay(new Date());
    const rows = await this.prisma.gameResult.findMany({
      where: { userId, game, createdAt: { gte: new Date(`${today}T00:00:00Z`) } },
      select: { score: true },
    });
    return rows.reduce((sum, r) => sum + r.score, 0);
  }

  /** So'zga bog'lanmagan o'yinlar uchun mukofot. Kunlik chegaraga bo'ysunadi. */
  private async settleFree(userId: string, game: GameType, correct: boolean) {
    if (!correct) return { xpGained: 0, capped: false };
    const already = await this.xpToday(userId, game);
    const room = DAILY_XP_CAP_PER_GAME - already;
    if (room <= 0) {
      // Chegara tugadi: javob to'g'ri, lekin XP berilmaydi. Mashq qilish
      // mumkin, faqat reyting uchun "ishlab olish" to'xtaydi.
      return { xpGained: 0, capped: true };
    }
    const xp = Math.min(XP_PER_CORRECT, room);
    const now = new Date();
    await this.addActivity(userId, xp, now);
    await this.prisma.gameResult.create({ data: { userId, game, score: xp } });
    return { xpGained: xp, capped: false };
  }

  // ═══════════════ 5) Gap tuzish ═══════════════

  async sentenceSet(userId: string, level: Level | undefined, limit = 5) {
    const rows = await this.prisma.sentence.findMany({
      where: { verified: true, ...(level ? { level } : {}) },
      orderBy: { position: 'asc' },
      take: 200,
      select: { id: true, turkish: true, uzbek: true, note: true },
    });
    if (rows.length === 0) return { items: [] };

    const chosen = shuffle(rows).slice(0, limit);
    return {
      items: chosen.map((s) => ({
        token: this.seal(PURPOSE_SENTENCE, { u: userId, s: s.id }),
        uzbek: s.uzbek,
        note: s.note,
        // So'zlar aralashtirilgan holda beriladi. To'g'ri tartib klientga
        // YUBORILMAYDI — u faqat serverda tekshiriladi.
        // Gap boshidagi so'z kichik harf bilan beriladi: bosh harf
        // "men birinchiman" deb o'zini oshkor qilardi. Javob katta-kichik
        // harfni hisobga olmay tekshiriladi, shuning uchun bu xavfsiz.
        words: shuffle(
          s.turkish
            .split(/\s+/)
            .filter(Boolean)
            .map((w, i) => (i === 0 ? soften(w, 'tr') : w)),
        ),
      })),
    };
  }

  async sentenceAnswer(userId: string, dto: { token: string; answer: string }) {
    const p = this.validOrThrow<SentencePayload>(PURPOSE_SENTENCE, dto.token, userId);
    const sentence = await this.prisma.sentence.findUnique({
      where: { id: p.s },
      select: { turkish: true, uzbek: true, note: true },
    });
    if (!sentence) throw new BadRequestException('Gap topilmadi');

    // Tinish belgilari va ortiqcha bo'shliqlar hisobga olinmaydi
    const clean = (s: string) => normTr(s).replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ');
    const correct = clean(dto.answer) === clean(sentence.turkish);
    const almost = !correct && fold(clean(dto.answer)) === fold(clean(sentence.turkish));

    const { xpGained, capped } = await this.settleFree(userId, 'SENTENCE_BUILDER', correct);
    return { correct, almost, answer: sentence.turkish, note: sentence.note, xpGained, capped, stats: await this.myStats(userId) };
  }

  // ═══════════════ 6) Qo'shimchalar mashqi ═══════════════

  async suffixSet(userId: string, level: Level | undefined, limit = 5, rule?: string) {
    const rows = await this.prisma.suffixDrill.findMany({
      where: { verified: true, ...(level ? { level } : {}), ...(rule ? { rule } : {}) },
      orderBy: { position: 'asc' },
      take: 200,
      select: { id: true, base: true, prompt: true, rule: true },
    });
    if (rows.length === 0) return { items: [] };

    const chosen = shuffle(rows).slice(0, limit);
    return {
      items: chosen.map((d) => ({
        token: this.seal(PURPOSE_SUFFIX, { u: userId, d: d.id }),
        base: d.base,
        prompt: d.prompt,
        // Qaysi qoida mashq qilinayotgani — o'quvchi nima so'ralayotganini bilsin
        rule: d.rule,
      })),
    };
  }

  async suffixAnswer(userId: string, dto: { token: string; answer: string }) {
    const p = this.validOrThrow<SuffixPayload>(PURPOSE_SUFFIX, dto.token, userId);
    const drill = await this.prisma.suffixDrill.findUnique({
      where: { id: p.d },
      select: { answer: true, alternates: true, explanation: true },
    });
    if (!drill) throw new BadRequestException('Mashq topilmadi');

    const accepted = [drill.answer, ...drill.alternates].map(normTr);
    const given = normTr(dto.answer);
    const correct = accepted.includes(given);
    // Turkcha harflarsiz yozgan bo'lsa ("gozden") — "deyarli to'g'ri"
    const almost = !correct && accepted.map(fold).includes(fold(given));

    const { xpGained, capped } = await this.settleFree(userId, 'SUFFIX_TRAINER', correct);
    return { correct, almost, answer: drill.answer, explanation: drill.explanation, xpGained, capped, stats: await this.myStats(userId) };
  }

  // ═══════════════ 7) So'z zanjiri ═══════════════

  /** Oxirgi harf: turkcha kichik harfga o'tkazib olinadi. */
  private lastLetter(word: string): string {
    const w = normTr(word).replace(/[^\p{L}]/gu, '');
    return w.slice(-1);
  }

  async chainStart(userId: string, level: Level | undefined) {
    const words = await this.prisma.word.findMany({
      where: { verified: true, ...(level ? { level } : {}) },
      select: { id: true, turkish: true, uzbek: true },
      take: 500,
    });
    if (words.length < CHAIN_LENGTH) {
      throw new BadRequestException("Bu darajada so'z zanjiri uchun so'z yetarli emas");
    }
    const start = shuffle(words)[0];
    return {
      token: this.seal(PURPOSE_CHAIN, { u: userId, c: start.turkish, used: [normTr(start.turkish)], n: 1 }),
      current: soften(start.turkish, 'tr'),
      currentUz: start.uzbek,
      nextLetter: this.lastLetter(start.turkish),
      step: 1,
      total: CHAIN_LENGTH,
    };
  }

  async chainAnswer(userId: string, dto: { token: string; answer: string }) {
    const p = this.validOrThrow<ChainPayload>(PURPOSE_CHAIN, dto.token, userId);
    const given = normTr(dto.answer).trim();
    const needLetter = this.lastLetter(p.c);

    if (!given) throw new BadRequestException("So'z yozilmadi");

    // 1) Kerakli harfdan boshlanishi
    if (!given.startsWith(needLetter)) {
      return {
        correct: false,
        reason: `So'z \u00ab${needLetter}\u00bb harfidan boshlanishi kerak`,
        nextLetter: needLetter,
        step: p.n,
        total: CHAIN_LENGTH,
        xpGained: 0,
      };
    }

    // 2) Takrorlanmasligi
    if (p.used.includes(given)) {
      return {
        correct: false,
        reason: "Bu so'z allaqachon ishlatilgan",
        nextLetter: needLetter,
        step: p.n,
        total: CHAIN_LENGTH,
        xpGained: 0,
      };
    }

    // 3) Lug'atda borligi. Turkcha harflar bilan ham, ularsiz ham qabul
    //    qilamiz, lekin javobda to'g'ri yozilishi ko'rsatiladi.
    const candidates = await this.prisma.word.findMany({
      where: { verified: true },
      select: { turkish: true, uzbek: true },
      take: 5000,
    });
    const hit =
      candidates.find((w) => normTr(w.turkish) === given) ??
      candidates.find((w) => fold(w.turkish) === fold(given));
    if (!hit) {
      return {
        correct: false,
        reason: "Bu so'z lug'atda yo'q",
        nextLetter: needLetter,
        step: p.n,
        total: CHAIN_LENGTH,
        xpGained: 0,
      };
    }

    const step = p.n + 1;
    const used = [...p.used, normTr(hit.turkish)];
    const finished = step >= CHAIN_LENGTH;
    const { xpGained, capped } = await this.settleFree(userId, 'WORD_CHAIN', true);

    return {
      correct: true,
      accepted: hit.turkish,
      acceptedUz: hit.uzbek,
      finished,
      step,
      total: CHAIN_LENGTH,
      nextLetter: finished ? null : this.lastLetter(hit.turkish),
      token: finished ? null : this.seal(PURPOSE_CHAIN, { u: userId, c: hit.turkish, used, n: step }),
      xpGained,
      capped,
      stats: await this.myStats(userId),
    };
  }

  // ═══════════════ 9) Bo'shliqni to'ldirish ═══════════════
  //
  // Bu va keyingi to'rt o'yin bir xil naqsh bo'yicha ishlaydi:
  //   • material darajaga qarab tanlanadi,
  //   • TAKRORLANMASLIK uchun pickFresh ishlatiladi,
  //   • to'g'ri javob indeksi SHIFRLANGAN tokenda ketadi — brauzer uni
  //     ko'ra olmaydi, shuning uchun javobni oldindan bilib bo'lmaydi,
  //   • mukofot settleFree orqali, kunlik chegara bilan.

  /** Variantlarni aralashtirib, to'g'ri javob indeksini qaytaradi. */
  private mixOptions(answer: string, wrong: string[], max = 4) {
    const picked = shuffle(wrong.filter((w) => w && w !== answer)).slice(0, max - 1);
    const options = shuffle([answer, ...picked]);
    return { options, correctIndex: options.indexOf(answer) };
  }

  async clozeSet(userId: string, level: Level | undefined, limit = 5) {
    const pool = await this.prisma.clozeItem.findMany({
      where: { verified: true, ...(level ? { level } : {}) },
      orderBy: { position: 'asc' },
      take: 300,
    });
    const chosen = await pickFresh(this.prisma, userId, 'cloze', pool, limit);
    await markSeen(this.prisma, userId, 'cloze', chosen.map((c) => c.id));

    return {
      items: chosen.map((c) => {
        const { options, correctIndex } = this.mixOptions(c.answer, c.options);
        return {
          token: this.seal(PURPOSE_CLOZE, { u: userId, i: c.id, c: correctIndex }),
          masked: c.masked,
          uzbek: c.uzbek,
          topic: c.topic,
          options,
        };
      }),
    };
  }

  async clozeAnswer(userId: string, dto: { token: string; choice: number }) {
    const p = this.validOrThrow<ChoicePayload>(PURPOSE_CLOZE, dto.token, userId);
    const item = await this.prisma.clozeItem.findUnique({
      where: { id: p.i },
      select: { full: true, answer: true, explanation: true },
    });
    if (!item) throw new BadRequestException('Mashq topilmadi');
    const correct = dto.choice === p.c;
    const { xpGained, capped } = await this.settleFree(userId, 'FILL_GAP', correct);
    return {
      correct,
      correctIndex: p.c,
      answer: item.answer,
      full: item.full,
      explanation: item.explanation,
      xpGained,
      capped,
      stats: await this.myStats(userId),
    };
  }

  // ═══════════════ 10) Fe'l shakli ═══════════════

  async verbSet(userId: string, level: Level | undefined, limit = 5) {
    const pool = await this.prisma.verbForm.findMany({
      where: { verified: true, ...(level ? { level } : {}) },
      orderBy: { position: 'asc' },
      take: 300,
    });
    const chosen = await pickFresh(this.prisma, userId, 'verb', pool, limit);
    await markSeen(this.prisma, userId, 'verb', chosen.map((c) => c.id));

    return {
      items: chosen.map((v) => ({
        // Bu o'yinda javob YOZILADI, variant tanlanmaydi — shuning uchun
        // tokenda faqat element ID si (to'g'ri indeks kerak emas).
        token: this.seal(PURPOSE_VERB, { u: userId, i: v.id, c: 0 }),
        infinitive: v.infinitive,
        person: v.person,
        tense: v.tense,
        negative: v.negative,
        uzbek: v.uzbek,
      })),
    };
  }

  async verbAnswer(userId: string, dto: { token: string; answer: string }) {
    const p = this.validOrThrow<ChoicePayload>(PURPOSE_VERB, dto.token, userId);
    const item = await this.prisma.verbForm.findUnique({
      where: { id: p.i },
      select: { answer: true, explanation: true },
    });
    if (!item) throw new BadRequestException('Mashq topilmadi');
    const correct = normTr(dto.answer) === normTr(item.answer);
    // Turkcha harflarsiz yozilgan bo'lsa — "deyarli to'g'ri"
    const almost = !correct && fold(dto.answer) === fold(item.answer);
    const { xpGained, capped } = await this.settleFree(userId, 'VERB_FORM', correct);
    return {
      correct,
      almost,
      answer: item.answer,
      explanation: item.explanation,
      xpGained,
      capped,
      stats: await this.myStats(userId),
    };
  }

  // ═══════════════ 11) Suhbat ═══════════════

  async dialogueSet(userId: string, level: Level | undefined, limit = 5) {
    const pool = await this.prisma.dialogueItem.findMany({
      where: { verified: true, ...(level ? { level } : {}) },
      orderBy: { position: 'asc' },
      take: 300,
    });
    const chosen = await pickFresh(this.prisma, userId, 'dialogue', pool, limit);
    await markSeen(this.prisma, userId, 'dialogue', chosen.map((c) => c.id));

    return {
      items: chosen.map((d) => {
        const { options, correctIndex } = this.mixOptions(d.answer, d.options);
        return {
          token: this.seal(PURPOSE_DIALOGUE, { u: userId, i: d.id, c: correctIndex }),
          prompt: d.prompt,
          situation: d.situation,
          uzbek: d.uzbek,
          options,
        };
      }),
    };
  }

  async dialogueAnswer(userId: string, dto: { token: string; choice: number }) {
    const p = this.validOrThrow<ChoicePayload>(PURPOSE_DIALOGUE, dto.token, userId);
    const item = await this.prisma.dialogueItem.findUnique({
      where: { id: p.i },
      select: { answer: true, uzbek: true },
    });
    if (!item) throw new BadRequestException('Mashq topilmadi');
    const correct = dto.choice === p.c;
    const { xpGained, capped } = await this.settleFree(userId, 'DIALOGUE', correct);
    return { correct, correctIndex: p.c, answer: item.answer, xpGained, capped, stats: await this.myStats(userId) };
  }

  // ═══════════════ 12) Zid ma'noli so'z ═══════════════

  async pairSet(userId: string, level: Level | undefined, limit = 5) {
    const pool = await this.prisma.wordPair.findMany({
      where: { kind: 'ANTONYM', verified: true, ...(level ? { level } : {}) },
      orderBy: { position: 'asc' },
      take: 300,
    });
    if (pool.length < 4) return { items: [] };
    const chosen = await pickFresh(this.prisma, userId, 'pair', pool, limit);
    await markSeen(this.prisma, userId, 'pair', chosen.map((c) => c.id));

    return {
      items: chosen.map((pair) => {
        // Chalg'ituvchilar — boshqa juftliklarning "ikkinchi" so'zlari.
        //
        // Jonli o'yinda topilgan ikki kamchilik shu yerda edi:
        //  • "temiz" (A2, sifat) savoliga "geçicilik" (C1) va "reddetmek"
        //    (fe'l) variantlari chiqardi — darajasi va so'z turi boshqa
        //    variantni o'ylamasdan chiqarib tashlash mumkin.
        //  • Shu sababli avval O'SHA darajadan va O'SHA so'z turidan
        //    olinadi, yetmasa — kengaytiriladi.
        const others = pool.filter((o) => o.id !== pair.id && o.second !== pair.second);
        const verb = isVerb(pair.second);
        const tiers = [
          others.filter((o) => o.level === pair.level && isVerb(o.second) === verb),
          others.filter((o) => isVerb(o.second) === verb),
          others,
        ];
        const wrong: string[] = [];
        for (const tier of tiers) {
          for (const o of shuffle(tier)) {
            if (wrong.length >= 3) break;
            if (!wrong.includes(o.second)) wrong.push(o.second);
          }
          if (wrong.length >= 3) break;
        }
        const { options, correctIndex } = this.mixOptions(pair.second, wrong);
        return {
          token: this.seal(PURPOSE_PAIR, { u: userId, i: pair.id, c: correctIndex }),
          word: pair.first,
          // MUHIM: kontentda tarjima "toza — kir" shaklida, ya'ni IKKALA so'z.
          // Ikkinchi yarmi javobni aytib qo'yardi — faqat birinchisi ko'rsatiladi.
          uzbek: pair.uzbek ? pair.uzbek.split(/\s+[—–-]\s+/)[0] : null,
          options: options.map((o) => soften(o, 'tr')),
        };
      }),
    };
  }

  async pairAnswer(userId: string, dto: { token: string; choice: number }) {
    const p = this.validOrThrow<ChoicePayload>(PURPOSE_PAIR, dto.token, userId);
    const item = await this.prisma.wordPair.findUnique({
      where: { id: p.i },
      select: { first: true, second: true },
    });
    if (!item) throw new BadRequestException('Mashq topilmadi');
    const correct = dto.choice === p.c;
    const { xpGained, capped } = await this.settleFree(userId, 'ANTONYM', correct);
    return { correct, correctIndex: p.c, answer: item.second, xpGained, capped, stats: await this.myStats(userId) };
  }

  // ═══════════════ 13) Ortiqcha so'zni top ═══════════════
  //
  // MUHIM: mavzu `category` dan OLINMAYDI. Lug'at darslikdan import
  // qilingan va u yerda category = "Ünite 1", ya'ni darslik bo'limi.
  // Bir bo'limda "salom", "qalam" va "dushanba" birga turishi mumkin —
  // bunday guruhdan "ortiqchasini top" savoli ma'nosiz chiqadi.
  //
  // Shuning uchun faqat MA'NO bo'yicha teglangan so'zlar ishlatiladi:
  // teg "mavzu:" bilan boshlanadi (masalan "mavzu:ovqat"). Teg qo'yilgan
  // so'zlar prisma/content/topics.ts da.

  async oddSet(userId: string, level: Level | undefined, limit = 5) {
    const words = await this.prisma.word.findMany({
      where: {
        verified: true,
        // Prisma massiv ichidagi "shu bilan boshlanadi" ni qo'llab-quvvatlamaydi,
        // shuning uchun tegi borlarini olamiz va prefiksni pastda tekshiramiz.
        tags: { isEmpty: false },
        ...(level ? { level } : {}),
      },
      select: { id: true, turkish: true, uzbek: true, tags: true },
      take: 2000,
    });

    // Mavzular bo'yicha guruhlaymiz; kamida 3 so'zi borlari yaroqli
    const byCategory = new Map<string, typeof words>();
    for (const w of words) {
      for (const tag of w.tags) {
        if (!tag.startsWith(TOPIC_TAG)) continue;
        const list = byCategory.get(tag) ?? [];
        list.push(w);
        byCategory.set(tag, list);
      }
    }
    const usable = [...byCategory.entries()].filter(([, list]) => list.length >= 3);
    if (usable.length < 2) return { items: [] };

    // Har bir savol bitta mavzuga tegishli -> takrorlanmaslikni mavzu
    // bo'yicha hisoblaymiz
    const pool = usable.map(([category]) => ({ id: category }));
    const chosen = await pickFresh(this.prisma, userId, 'odd', pool, limit);
    await markSeen(this.prisma, userId, 'odd', chosen.map((c) => c.id));

    const items = chosen.map(({ id: category }) => {
      const same = shuffle(byCategory.get(category) ?? []).slice(0, 3);
      const otherCats = usable.filter(([c]) => c !== category);
      const [, otherList] = otherCats[Math.floor(Math.random() * otherCats.length)];
      const stranger = shuffle(otherList)[0];
      // Harf o'lchami bir xil bo'lsin ("Satranç" va "ders" — bosh harf
      // savolga aloqasi yo'q belgi bo'lib, e'tiborni chalg'itardi)
      const { options, correctIndex } = this.mixOptions(
        soften(stranger.turkish, 'tr'),
        same.map((w) => soften(w.turkish, 'tr')),
      );
      return {
        // Mavzu nomi ID o'rnida — bu o'yinda saqlanadigan element yo'q
        token: this.seal(PURPOSE_ODD, { u: userId, i: category, c: correctIndex }),
        options,
        hint: category.slice(TOPIC_TAG.length),
      };
    });
    return { items };
  }

  async oddAnswer(userId: string, dto: { token: string; choice: number }) {
    const p = this.validOrThrow<ChoicePayload>(PURPOSE_ODD, dto.token, userId);
    const correct = dto.choice === p.c;
    const { xpGained, capped } = await this.settleFree(userId, 'ODD_ONE_OUT', correct);
    return { correct, correctIndex: p.c, category: p.i, xpGained, capped, stats: await this.myStats(userId) };
  }
}

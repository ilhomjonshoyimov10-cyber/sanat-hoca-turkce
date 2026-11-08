import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateQuestionDto,
  CreateTextDto,
  GlossaryItemDto,
  ReadingQueryDto,
  SubmitDto,
  UpdateTextDto,
} from './reading.dto.js';

/** Qisqa javobni solishtirish: katta-kichik harf, ortiqcha bo'shliq va
 *  tinish belgilari hisobga olinmaydi. "Evet." va "evet" bir xil javob. */
function normalize(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/[.,!?;:"'()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lotin harflarini turkcha qoidaga ko'ra solishtirish uchun yordamchi.
 *  i/İ va ı/I farqi turk tilida muhim, shuning uchun toLocaleLowerCase('tr'). */

@Injectable()
export class ReadingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Nashr qilingan matnlar ro'yxati. Qoralamalarni faqat ustoz ko'radi. */
  async list(userId: string, role: string, q: ReadingQueryDto) {
    const canSeeDrafts = role === 'TEACHER' || role === 'ADMIN';
    const texts = await this.prisma.readingText.findMany({
      where: {
        ...(canSeeDrafts ? {} : { publishedAt: { not: null } }),
        ...(q.level ? { level: q.level } : {}),
      },
      orderBy: [{ level: 'asc' }, { position: 'asc' }],
      take: 200,
      select: {
        id: true,
        slug: true,
        title: true,
        level: true,
        topic: true,
        wordCount: true,
        publishedAt: true,
        _count: { select: { questions: true } },
      },
    });

    // O'quvchining eng yaxshi natijasi — ro'yxatda ko'rinadi
    const attempts = await this.prisma.readingAttempt.findMany({
      where: { userId, textId: { in: texts.map((t) => t.id) } },
      select: { textId: true, score: true, total: true },
    });
    const best = new Map<string, { score: number; total: number }>();
    for (const a of attempts) {
      const prev = best.get(a.textId);
      if (!prev || a.score / a.total > prev.score / prev.total) best.set(a.textId, { score: a.score, total: a.total });
    }

    return texts.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      level: t.level,
      topic: t.topic,
      wordCount: t.wordCount,
      questionCount: t._count.questions,
      isDraft: t.publishedAt === null,
      best: best.get(t.id) ?? null,
    }));
  }

  /**
   * Bitta matn: tanasi, lug'ati va savollari.
   *
   * MUHIM: savollar TO'G'RI JAVOBSIZ qaytariladi. correctIndex,
   * correctText va explanation faqat javob yuborilgandan keyin beriladi.
   * Aks holda o'quvchi brauzerning tarmoq oynasidan javobni ko'rib oladi.
   */
  async one(userId: string, role: string, slug: string) {
    const canSeeDrafts = role === 'TEACHER' || role === 'ADMIN';
    const text = await this.prisma.readingText.findFirst({
      where: { slug, ...(canSeeDrafts ? {} : { publishedAt: { not: null } }) },
      select: {
        id: true,
        slug: true,
        title: true,
        level: true,
        topic: true,
        body: true,
        bodyUz: true,
        wordCount: true,
        audioUrl: true,
        publishedAt: true,
        glossary: { orderBy: { position: 'asc' }, select: { id: true, turkish: true, uzbek: true } },
        questions: {
          orderBy: { position: 'asc' },
          // Diqqat: correctIndex / correctText / explanation YO'Q
          select: { id: true, kind: true, prompt: true, options: true, position: true },
        },
      },
    });
    if (!text) throw new NotFoundException('Matn topilmadi');

    const attempts = await this.prisma.readingAttempt.findMany({
      where: { userId, textId: text.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { score: true, total: true, createdAt: true },
    });
    return { ...text, isDraft: text.publishedAt === null, attempts };
  }

  /** Javoblarni tekshirish. Baho serverda hisoblanadi, brauzerda emas. */
  async submit(userId: string, role: string, slug: string, dto: SubmitDto) {
    const canSeeDrafts = role === 'TEACHER' || role === 'ADMIN';
    const text = await this.prisma.readingText.findFirst({
      where: { slug, ...(canSeeDrafts ? {} : { publishedAt: { not: null } }) },
      select: {
        id: true,
        questions: {
          orderBy: { position: 'asc' },
          select: { id: true, kind: true, correctIndex: true, correctText: true, explanation: true },
        },
      },
    });
    if (!text) throw new NotFoundException('Matn topilmadi');
    if (!text.questions.length) throw new BadRequestException('Bu matnda savol yo\'q');

    const given = new Map(dto.answers.map((a) => [a.questionId, a]));
    const results = text.questions.map((q) => {
      const answer = given.get(q.id);
      let correct = false;
      if (answer) {
        if (q.kind === 'SHORT_ANSWER') {
          const want = q.correctText.map(normalize);
          correct = want.length > 0 && want.includes(normalize(answer.text ?? ''));
        } else {
          correct = q.correctIndex !== null && answer.choice === q.correctIndex;
        }
      }
      return {
        questionId: q.id,
        correct,
        correctIndex: q.correctIndex,
        correctText: q.correctText,
        explanation: q.explanation,
      };
    });

    const score = results.filter((r) => r.correct).length;
    const total = text.questions.length;

    // Ustozning o'z sinovi natija sifatida yozilmaydi — statistikani buzmasin
    if (role === 'STUDENT' || role === 'PARENT') {
      await this.prisma.readingAttempt.create({ data: { userId, textId: text.id, score, total } });
    }
    return { score, total, results };
  }

  // ───────────── Ustoz uchun boshqaruv ─────────────

  /** URL uchun qisqa nom. Turkcha harflar lotinga o'giriladi. */
  private slugify(title: string): string {
    const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };
    return title
      .toLocaleLowerCase('tr')
      .replace(/[çğıİöşüâîû]/g, (c) => map[c] ?? c)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
  }

  private countWords(body: string): number {
    return body.split(/\s+/).filter(Boolean).length;
  }

  async create(dto: CreateTextDto) {
    const base = this.slugify(dto.title) || 'matn';
    // Bir xil nomli matn bo'lsa, oxiriga raqam qo'shamiz
    let slug = base;
    for (let i = 2; await this.prisma.readingText.findUnique({ where: { slug }, select: { id: true } }); i++) {
      slug = `${base}-${i}`;
    }
    return this.prisma.readingText.create({
      data: {
        slug,
        title: dto.title,
        level: dto.level,
        body: dto.body,
        bodyUz: dto.bodyUz,
        topic: dto.topic,
        position: dto.position ?? 0,
        wordCount: this.countWords(dto.body),
      },
      select: { id: true, slug: true, title: true, level: true },
    });
  }

  async update(id: string, dto: UpdateTextDto) {
    const exists = await this.prisma.readingText.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Matn topilmadi');
    const { published, ...rest } = dto;
    return this.prisma.readingText.update({
      where: { id },
      data: {
        ...rest,
        ...(dto.body ? { wordCount: this.countWords(dto.body) } : {}),
        ...(published === undefined ? {} : { publishedAt: published ? new Date() : null }),
      },
      select: { id: true, slug: true, title: true, level: true, publishedAt: true },
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.readingText.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Matn topilmadi');
    await this.prisma.readingText.delete({ where: { id } });
    return { ok: true };
  }

  async addQuestion(textId: string, dto: CreateQuestionDto) {
    const exists = await this.prisma.readingText.findUnique({ where: { id: textId }, select: { id: true } });
    if (!exists) throw new NotFoundException('Matn topilmadi');

    // Savol turiga mos to'g'ri javob berilganini tekshiramiz, aks holda
    // o'quvchi hech qachon to'g'ri javob bera olmaydigan savol paydo bo'ladi.
    if (dto.kind === 'MULTIPLE_CHOICE') {
      if (!dto.options || dto.options.length < 2) throw new BadRequestException('Kamida 2 variant kerak');
      if (dto.correctIndex === undefined || dto.correctIndex >= dto.options.length) {
        throw new BadRequestException("To'g'ri variantni belgilang");
      }
    } else if (dto.kind === 'TRUE_FALSE') {
      if (dto.correctIndex !== 0 && dto.correctIndex !== 1) {
        throw new BadRequestException("To'g'ri javobni belgilang (0 = to'g'ri, 1 = xato)");
      }
    } else if (!dto.correctText?.length) {
      throw new BadRequestException("Qabul qilinadigan javobni yozing");
    }

    return this.prisma.readingQuestion.create({
      data: {
        textId,
        kind: dto.kind,
        prompt: dto.prompt,
        options: dto.kind === 'MULTIPLE_CHOICE' ? (dto.options ?? []) : [],
        correctIndex: dto.kind === 'SHORT_ANSWER' ? null : dto.correctIndex,
        correctText: dto.kind === 'SHORT_ANSWER' ? (dto.correctText ?? []) : [],
        explanation: dto.explanation,
        position: dto.position ?? 0,
      },
      select: { id: true, kind: true, prompt: true, position: true },
    });
  }

  async removeQuestion(id: string) {
    const exists = await this.prisma.readingQuestion.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Savol topilmadi');
    await this.prisma.readingQuestion.delete({ where: { id } });
    return { ok: true };
  }

  async setGlossary(textId: string, items: GlossaryItemDto[]) {
    const exists = await this.prisma.readingText.findUnique({ where: { id: textId }, select: { id: true } });
    if (!exists) throw new NotFoundException('Matn topilmadi');
    // Butun lug'atni almashtiramiz: ustoz ro'yxatni tahrirlab yuboradi
    await this.prisma.$transaction([
      this.prisma.readingGlossary.deleteMany({ where: { textId } }),
      this.prisma.readingGlossary.createMany({
        data: items.map((it, i) => ({ textId, turkish: it.turkish, uzbek: it.uzbek, position: it.position ?? i })),
        skipDuplicates: true,
      }),
    ]);
    return this.prisma.readingGlossary.findMany({
      where: { textId },
      orderBy: { position: 'asc' },
      select: { id: true, turkish: true, uzbek: true, position: true },
    });
  }
}

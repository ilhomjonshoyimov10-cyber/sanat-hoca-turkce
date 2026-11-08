import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { BookQueryDto, ChapterDto, CreateBookDto, ProgressDto, UpdateBookDto } from './books.dto.js';

/** Kitob ro'yxatida qaytariladigan maydonlar. fileUrl faqat bitta kitob
 *  ochilganda beriladi — ro'yxatdan hamma havolani qirib olishning ma'nosi yo'q. */
const LIST_FIELDS = {
  id: true,
  title: true,
  author: true,
  description: true,
  level: true,
  kind: true,
  visibility: true,
  coverUrl: true,
  pageCount: true,
  fileName: true,
  fileSize: true,
  createdAt: true,
  groupId: true,
  uploadedById: true,
} satisfies Prisma.BookSelect;

@Injectable()
export class BooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Foydalanuvchi qaysi guruhlarda va qaysi darajalarda — ko'rish huquqi shundan. */
  private async reach(userId: string) {
    const [memberships, taught] = await Promise.all([
      this.prisma.groupMember.findMany({ where: { userId }, select: { groupId: true } }),
      this.prisma.group.findMany({ where: { teacherId: userId }, select: { id: true, level: true } }),
    ]);
    // A'zo bo'lgan guruhlarning darajasini alohida olamiz (ichma-ich select
    // o'rniga) — so'rov bitta ko'proq, lekin kod ham, test ham oddiyroq.
    const memberGroups = memberships.length
      ? await this.prisma.group.findMany({
          where: { id: { in: memberships.map((m) => m.groupId) } },
          select: { id: true, level: true },
        })
      : [];
    const all = [...memberGroups, ...taught];
    return { groupIds: all.map((g) => g.id), levels: [...new Set(all.map((g) => g.level))] };
  }

  /** Kim nimani ko'radi. Admin hammasini, qolganlar quyidagi qoida bo'yicha. */
  private async visibilityWhere(userId: string, role: string): Promise<Prisma.BookWhereInput> {
    if (role === 'ADMIN') return {};
    const { groupIds, levels } = await this.reach(userId);
    return {
      OR: [
        { uploadedById: userId }, // o'zi yuklagani
        { visibility: 'PUBLIC' },
        { visibility: 'LEVEL', level: { in: levels } },
        { visibility: 'GROUP', groupId: { in: groupIds } },
      ],
    };
  }

  async list(userId: string, role: string, q: BookQueryDto) {
    const where: Prisma.BookWhereInput = {
      AND: [
        await this.visibilityWhere(userId, role),
        q.level ? { level: q.level } : {},
        q.kind ? { kind: q.kind } : {},
        q.q ? { OR: [{ title: { contains: q.q, mode: 'insensitive' } }, { author: { contains: q.q, mode: 'insensitive' } }] } : {},
      ],
    };
    const books = await this.prisma.book.findMany({
      where,
      orderBy: [{ level: 'asc' }, { createdAt: 'desc' }],
      take: 100,
      select: LIST_FIELDS,
    });
    // O'qilgan sahifani ham qo'shamiz, shunda ro'yxatda "davom etish" ko'rinadi
    const progress = await this.prisma.bookProgress.findMany({
      where: { userId, bookId: { in: books.map((b) => b.id) } },
      select: { bookId: true, lastPage: true, finishedAt: true },
    });
    const byId = new Map(progress.map((p) => [p.bookId, p]));
    return books.map((b) => ({
      ...b,
      isMine: b.uploadedById === userId,
      progress: byId.get(b.id) ? { lastPage: byId.get(b.id)!.lastPage, finished: Boolean(byId.get(b.id)!.finishedAt) } : null,
    }));
  }

  async one(userId: string, role: string, id: string) {
    const book = await this.prisma.book.findFirst({
      where: { AND: [{ id }, await this.visibilityWhere(userId, role)] },
      select: {
        ...LIST_FIELDS,
        fileUrl: true,
        mimeType: true,
        updatedAt: true,
        uploadedBy: { select: { firstName: true, lastName: true } },
        chapters: { orderBy: { position: 'asc' }, select: { id: true, title: true, position: true, startPage: true } },
      },
    });
    // Ko'rish huquqi yo'q bo'lsa ham 404: kitob BORLIGI ham bilinmasin.
    if (!book) throw new NotFoundException('Kitob topilmadi');
    const progress = await this.prisma.bookProgress.findUnique({
      where: { userId_bookId: { userId, bookId: id } },
      select: { lastPage: true, finishedAt: true },
    });
    return {
      ...book,
      isMine: book.uploadedById === userId,
      progress: progress ? { lastPage: progress.lastPage, finished: Boolean(progress.finishedAt) } : null,
    };
  }

  /** Guruh ko'rinishi tanlangan bo'lsa, ustoz AYNAN shu guruhning ustozi bo'lishi kerak. */
  private async assertGroupOwnership(userId: string, role: string, groupId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId }, select: { teacherId: true } });
    if (!group) throw new BadRequestException('Guruh topilmadi');
    if (role !== 'ADMIN' && group.teacherId !== userId) {
      throw new ForbiddenException("Bu guruh sizning guruhingiz emas");
    }
  }

  async create(userId: string, role: string, dto: CreateBookDto) {
    const visibility = dto.visibility ?? 'PRIVATE';
    if (visibility === 'GROUP') {
      if (!dto.groupId) throw new BadRequestException("Guruhga biriktirish uchun guruhni tanlang");
      await this.assertGroupOwnership(userId, role, dto.groupId);
    }
    // PUBLIC = internetdagi har kim ko'radi. Mualliflik huquqi xatarini
    // kamaytirish uchun bu faqat adminning qarori bo'ladi.
    if (visibility === 'PUBLIC' && role !== 'ADMIN') {
      throw new ForbiddenException("Hammaga ochiq qilishni administrator hal qiladi");
    }

    const book = await this.prisma.book.create({
      data: {
        title: dto.title,
        author: dto.author,
        description: dto.description,
        level: dto.level,
        kind: dto.kind ?? 'OTHER',
        visibility,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        pageCount: dto.pageCount,
        coverUrl: dto.coverUrl,
        groupId: visibility === 'GROUP' ? dto.groupId : null,
        uploadedById: userId,
      },
      select: LIST_FIELDS,
    });

    // Guruhga biriktirilgan bo'lsa a'zolarga xabar beramiz
    if (book.visibility === 'GROUP' && book.groupId) {
      const members = await this.prisma.groupMember.findMany({ where: { groupId: book.groupId }, select: { userId: true } });
      await this.notifications.pushMany(
        members.filter((m) => m.userId !== userId).map((m) => m.userId),
        { type: 'ANNOUNCEMENT', title: 'Yangi material', body: book.title, link: `/kitoblar/${book.id}` },
      );
    }
    return book;
  }

  /** O'zgartirish/o'chirish huquqi: faqat yuklagan odam yoki admin. */
  private async assertCanEdit(userId: string, role: string, id: string) {
    const book = await this.prisma.book.findUnique({ where: { id }, select: { uploadedById: true } });
    if (!book) throw new NotFoundException('Kitob topilmadi');
    if (role !== 'ADMIN' && book.uploadedById !== userId) throw new NotFoundException('Kitob topilmadi');
  }

  async update(userId: string, role: string, id: string, dto: UpdateBookDto) {
    await this.assertCanEdit(userId, role, id);
    if (dto.visibility === 'GROUP') {
      if (!dto.groupId) throw new BadRequestException("Guruhga biriktirish uchun guruhni tanlang");
      await this.assertGroupOwnership(userId, role, dto.groupId);
    }
    if (dto.visibility === 'PUBLIC' && role !== 'ADMIN') {
      throw new ForbiddenException("Hammaga ochiq qilishni administrator hal qiladi");
    }
    return this.prisma.book.update({
      where: { id },
      data: {
        ...dto,
        groupId: dto.visibility && dto.visibility !== 'GROUP' ? null : dto.groupId,
      },
      select: LIST_FIELDS,
    });
  }

  async remove(userId: string, role: string, id: string) {
    await this.assertCanEdit(userId, role, id);
    await this.prisma.book.delete({ where: { id } });
    return { ok: true };
  }

  // ───────────── Boblar ─────────────

  async addChapter(userId: string, role: string, bookId: string, dto: ChapterDto) {
    await this.assertCanEdit(userId, role, bookId);
    return this.prisma.bookChapter.create({
      data: { bookId, title: dto.title, position: dto.position ?? 0, startPage: dto.startPage },
      select: { id: true, title: true, position: true, startPage: true },
    });
  }

  async removeChapter(userId: string, role: string, chapterId: string) {
    const chapter = await this.prisma.bookChapter.findUnique({ where: { id: chapterId }, select: { bookId: true } });
    if (!chapter) throw new NotFoundException('Bob topilmadi');
    await this.assertCanEdit(userId, role, chapter.bookId);
    await this.prisma.bookChapter.delete({ where: { id: chapterId } });
    return { ok: true };
  }

  // ───────────── O'qish jarayoni ─────────────

  async saveProgress(userId: string, role: string, bookId: string, dto: ProgressDto) {
    // Ko'rish huquqi bo'lmagan kitobga belgi qo'yib bo'lmaydi
    await this.one(userId, role, bookId);
    const finishedAt = dto.finished === true ? new Date() : dto.finished === false ? null : undefined;
    const row = await this.prisma.bookProgress.upsert({
      where: { userId_bookId: { userId, bookId } },
      create: { userId, bookId, lastPage: dto.lastPage, finishedAt: finishedAt ?? null },
      update: { lastPage: dto.lastPage, ...(finishedAt === undefined ? {} : { finishedAt }) },
      select: { lastPage: true, finishedAt: true },
    });
    return { lastPage: row.lastPage, finished: Boolean(row.finishedAt) };
  }

  /** "Mening javonim": boshlangan va tugatilmagan kitoblar. */
  async shelf(userId: string) {
    const rows = await this.prisma.bookProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        lastPage: true,
        finishedAt: true,
        updatedAt: true,
        book: { select: { id: true, title: true, author: true, level: true, coverUrl: true, pageCount: true } },
      },
    });
    return rows.map((r) => ({
      ...r.book,
      lastPage: r.lastPage,
      finished: Boolean(r.finishedAt),
      updatedAt: r.updatedAt,
      percent: r.book.pageCount ? Math.min(100, Math.round((r.lastPage / r.book.pageCount) * 100)) : null,
    }));
  }
}

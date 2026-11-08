import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateSetDto, CreateWordDto, SetWordsDto, UpdateWordDto, WordQueryDto } from './dictionary.dto.js';

const WORD_FIELDS = {
  id: true,
  turkish: true,
  uzbek: true,
  russian: true,
  level: true,
  category: true,
  exampleTr: true,
  exampleUz: true,
  exampleRu: true,
  partOfSpeech: true,
  pronunciation: true,
  tags: true,
  frequency: true,
  verified: true,
  notes: true,
  position: true,
} satisfies Prisma.WordSelect;

@Injectable()
export class DictionaryService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ustoz uchun lug'at ro'yxati: filtr, qidiruv va sahifalash bilan. */
  async list(q: WordQueryDto) {
    const where: Prisma.WordWhereInput = {
      ...(q.level ? { level: q.level } : {}),
      ...(q.category ? { category: q.category } : {}),
      ...(q.verified === undefined ? {} : { verified: q.verified === '1' }),
      ...(q.q
        ? {
            OR: [
              { turkish: { contains: q.q, mode: 'insensitive' } },
              { uzbek: { contains: q.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const take = q.take ?? 50;
    const [rows, total] = await Promise.all([
      this.prisma.word.findMany({
        where,
        orderBy: [{ level: 'asc' }, { position: 'asc' }],
        skip: q.skip ?? 0,
        take,
        select: WORD_FIELDS,
      }),
      this.prisma.word.count({ where }),
    ]);
    return { rows, total, skip: q.skip ?? 0, take };
  }

  /** Lug'atning holati: ustoz nimani tekshirishi kerakligini ko'rsatadi. */
  async stats() {
    const [total, verified, byLevel, categories] = await Promise.all([
      this.prisma.word.count(),
      this.prisma.word.count({ where: { verified: true } }),
      this.prisma.word.groupBy({ by: ['level'], _count: { _all: true } }),
      this.prisma.word.findMany({
        where: { category: { not: null } },
        distinct: ['category'],
        select: { category: true },
        take: 100,
      }),
    ]);
    return {
      total,
      verified,
      unverified: total - verified,
      byLevel: byLevel.map((r) => ({ level: r.level, count: r._count._all })),
      categories: categories.map((c) => c.category).filter((c): c is string => Boolean(c)),
    };
  }

  async create(dto: CreateWordDto) {
    try {
      return await this.prisma.word.create({
        data: {
          ...dto,
          tags: dto.tags ?? [],
          // Ustoz o'zi qo'shgan so'z darhol tasdiqlangan hisoblanadi —
          // uni kim qo'shganini bilamiz va u javobgar.
          verified: true,
        },
        select: WORD_FIELDS,
      });
    } catch (error) {
      // Prisma P2002 = unique buzilishi (turkish + uzbek juftligi)
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
        throw new BadRequestException("Bu so'z lug'atda allaqachon bor");
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateWordDto) {
    const exists = await this.prisma.word.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException("So'z topilmadi");
    try {
      return await this.prisma.word.update({ where: { id }, data: dto, select: WORD_FIELDS });
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
        throw new BadRequestException("Bunday so'z lug'atda allaqachon bor");
      }
      throw error;
    }
  }

  async remove(id: string) {
    const exists = await this.prisma.word.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException("So'z topilmadi");
    // O'quvchilarning takrorlash tarixi Cascade bilan o'chadi (sxemada shunday).
    await this.prisma.word.delete({ where: { id } });
    return { ok: true };
  }

  // ───────────── Mavzuli to'plamlar ─────────────

  async sets() {
    const rows = await this.prisma.wordSet.findMany({
      orderBy: [{ level: 'asc' }, { position: 'asc' }],
      take: 200,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        level: true,
        position: true,
        _count: { select: { items: true } },
      },
    });
    return rows.map((r) => ({ ...r, wordCount: r._count.items, _count: undefined }));
  }

  async setDetail(id: string) {
    const set = await this.prisma.wordSet.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        level: true,
        items: { orderBy: { position: 'asc' }, select: { wordId: true, position: true } },
      },
    });
    if (!set) throw new NotFoundException("To'plam topilmadi");
    const words = await this.prisma.word.findMany({
      where: { id: { in: set.items.map((i) => i.wordId) } },
      select: WORD_FIELDS,
    });
    const byId = new Map(words.map((w) => [w.id, w]));
    return {
      ...set,
      items: undefined,
      words: set.items.map((i) => byId.get(i.wordId)).filter(Boolean),
    };
  }

  private slugify(title: string): string {
    const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u', ʻ: '', "'": '' };
    return (
      title
        .toLocaleLowerCase('tr')
        .replace(/[çğıİöşüʻ']/g, (c) => map[c] ?? c)
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50) || 'toplam'
    );
  }

  async createSet(dto: CreateSetDto) {
    const base = this.slugify(dto.title);
    let slug = base;
    for (let i = 2; await this.prisma.wordSet.findUnique({ where: { slug }, select: { id: true } }); i++) {
      slug = `${base}-${i}`;
    }
    return this.prisma.wordSet.create({
      data: { slug, title: dto.title, description: dto.description, level: dto.level, position: dto.position ?? 0 },
      select: { id: true, slug: true, title: true, level: true },
    });
  }

  async setWords(id: string, dto: SetWordsDto) {
    const set = await this.prisma.wordSet.findUnique({ where: { id }, select: { id: true } });
    if (!set) throw new NotFoundException("To'plam topilmadi");

    // Faqat haqiqatan mavjud so'zlarni qo'shamiz — yo'q ID tashqi kalit
    // xatosiga olib kelardi va ustoz tushunarsiz xato ko'rardi.
    const found = await this.prisma.word.findMany({
      where: { id: { in: dto.wordIds } },
      select: { id: true },
    });
    const valid = new Set(found.map((w) => w.id));
    const ordered = dto.wordIds.filter((id2) => valid.has(id2));

    await this.prisma.$transaction([
      this.prisma.wordSetItem.deleteMany({ where: { setId: id } }),
      this.prisma.wordSetItem.createMany({
        data: ordered.map((wordId, i) => ({ setId: id, wordId, position: i })),
        skipDuplicates: true,
      }),
    ]);
    return { count: ordered.length, skipped: dto.wordIds.length - ordered.length };
  }

  async removeSet(id: string) {
    const set = await this.prisma.wordSet.findUnique({ where: { id }, select: { id: true } });
    if (!set) throw new NotFoundException("To'plam topilmadi");
    await this.prisma.wordSet.delete({ where: { id } });
    return { ok: true };
  }
}

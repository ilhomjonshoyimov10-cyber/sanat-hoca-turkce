import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AnnouncementAudience, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateAnnouncementDto, UpdateAnnouncementDto } from './announcements.dto.js';

/** Foydalanuvchiga ko'rinadigan maydonlar. Kim yozgani ichki ma'lumot. */
const PUBLIC = {
  id: true,
  kind: true,
  title: true,
  body: true,
  imageUrl: true,
  linkUrl: true,
  linkLabel: true,
  dismissible: true,
  pinned: true,
  createdAt: true,
} as const;

/** Qaysi rol qaysi auditoriyani ko'radi. */
function audiencesFor(role: Role): AnnouncementAudience[] {
  const map: Record<Role, AnnouncementAudience[]> = {
    STUDENT: ['ALL', 'STUDENTS'],
    PARENT: ['ALL', 'PARENTS'],
    TEACHER: ['ALL', 'TEACHERS'],
    // Admin hamma e'lonni ko'radi — o'zi yuborganini tekshirish uchun
    ADMIN: ['ALL', 'STUDENTS', 'PARENTS', 'TEACHERS'],
  };
  return map[role];
}

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Foydalanuvchining ekranida ko'rinadigan e'lonlar.
   *
   * Uchta shart: faol, vaqti kelgan (va o'tmagan), roliga mos.
   * Yopib qo'yilganlari chiqmaydi.
   */
  async forUser(userId: string, role: Role) {
    const now = new Date();
    const rows = await this.prisma.announcement.findMany({
      where: {
        isActive: true,
        audience: { in: audiencesFor(role) },
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        dismissals: { none: { userId } },
      },
      orderBy: [{ pinned: 'desc' }, { startsAt: 'desc' }],
      take: 10,
      select: PUBLIC,
    });
    return rows;
  }

  async dismiss(userId: string, id: string) {
    const row = await this.prisma.announcement.findUnique({
      where: { id },
      select: { id: true, dismissible: true },
    });
    if (!row) throw new NotFoundException('E’lon topilmadi');
    if (!row.dismissible) {
      throw new BadRequestException("Bu e’lonni yopib bo'lmaydi");
    }
    // upsert: ikki marta bosilsa xato bermasin
    await this.prisma.announcementDismissal.upsert({
      where: { announcementId_userId: { announcementId: id, userId } },
      create: { announcementId: id, userId },
      update: {},
    });
    return { ok: true };
  }

  // ───────────────────────── Admin ─────────────────────────

  /** Admin ro'yxati: faol bo'lmaganlar ham, nechta odam yopgani ham ko'rinadi. */
  async list() {
    const rows = await this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        _count: { select: { dismissals: true } },
      },
    });
    return rows.map(({ _count, createdBy, ...a }) => ({
      ...a,
      dismissedBy: _count.dismissals,
      author: `${createdBy.firstName} ${createdBy.lastName}`,
    }));
  }

  private dates(dto: { startsAt?: string; endsAt?: string }) {
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : undefined;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : undefined;
    if (startsAt && endsAt && endsAt <= startsAt) {
      throw new BadRequestException("Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak");
    }
    return { startsAt, endsAt };
  }

  async create(adminId: string, dto: CreateAnnouncementDto) {
    const { startsAt, endsAt } = this.dates(dto);
    if (dto.linkLabel && !dto.linkUrl) {
      throw new BadRequestException("Havola matni bor, lekin havolaning o'zi yo'q");
    }
    return this.prisma.announcement.create({
      data: {
        kind: dto.kind ?? 'INFO',
        audience: dto.audience ?? 'ALL',
        title: dto.title.trim(),
        body: dto.body.trim(),
        imageUrl: dto.imageUrl || null,
        linkUrl: dto.linkUrl || null,
        linkLabel: dto.linkLabel?.trim() || null,
        dismissible: dto.dismissible ?? true,
        pinned: dto.pinned ?? false,
        startsAt: startsAt ?? new Date(),
        endsAt: endsAt ?? null,
        isActive: dto.isActive ?? true,
        createdById: adminId,
      },
    });
  }

  async update(id: string, dto: UpdateAnnouncementDto) {
    const existing = await this.prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('E’lon topilmadi');

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : existing.startsAt;
    const endsAt = dto.endsAt === undefined ? existing.endsAt : dto.endsAt ? new Date(dto.endsAt) : null;
    if (endsAt && endsAt <= startsAt) {
      throw new BadRequestException("Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak");
    }

    return this.prisma.announcement.update({
      where: { id },
      data: {
        kind: dto.kind,
        audience: dto.audience,
        title: dto.title?.trim(),
        body: dto.body?.trim(),
        // Bo'sh satr yuborilsa — o'chirish. undefined — tegmaslik.
        imageUrl: dto.imageUrl === undefined ? undefined : dto.imageUrl || null,
        linkUrl: dto.linkUrl === undefined ? undefined : dto.linkUrl || null,
        linkLabel: dto.linkLabel === undefined ? undefined : dto.linkLabel?.trim() || null,
        dismissible: dto.dismissible,
        pinned: dto.pinned,
        startsAt: dto.startsAt ? startsAt : undefined,
        endsAt: dto.endsAt === undefined ? undefined : endsAt,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    const row = await this.prisma.announcement.findUnique({ where: { id }, select: { id: true } });
    if (!row) throw new NotFoundException('E’lon topilmadi');
    await this.prisma.announcement.delete({ where: { id } });
    return { ok: true };
  }
}

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Level, Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateLiveDto, UpdateLiveDto } from './live.dto.js';

/** Efirga boshlanishidan 15 daqiqa oldin kirish mumkin. */
const EARLY_JOIN_MS = 15 * 60 * 1000;
const NOT_FOUND = 'Topilmadi';

@Injectable()
export class LiveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Xona nomi SERVERDA yaratiladi.
   * Jitsi'ning ommaviy serverida xona nomi — yagona himoya: nomni bilgan
   * odam kiradi. Shuning uchun 160 bit tasodif.
   */
  private newRoomName(): string {
    return `sanat-live-${randomBytes(20).toString('base64url')}`;
  }

  private joinable(startsAt: Date, durationMin: number, status: string): boolean {
    if (status === 'CANCELLED' || status === 'ENDED') return false;
    const now = Date.now();
    return (
      now >= startsAt.getTime() - EARLY_JOIN_MS &&
      now <= startsAt.getTime() + durationMin * 60_000
    );
  }

  /** Foydalanuvchining darajasi (eng yuqori a'zolik darajasi bo'yicha). */
  private async userLevels(userId: string): Promise<Level[]> {
    const rows = await this.prisma.groupMember.findMany({
      where: { userId },
      select: { group: { select: { level: true } } },
    });
    return [...new Set(rows.map((r) => r.group.level))];
  }

  /**
   * Ro'yxat. Xona nomi BERILMAYDI — u faqat "join" chaqirilganda,
   * vaqti kelganda qaytariladi.
   */
  async list(userId: string, role: Role) {
    const staff = role === 'TEACHER' || role === 'ADMIN';
    const levels = staff ? [] : await this.userLevels(userId);

    const rows = await this.prisma.liveSession.findMany({
      where: {
        status: { in: ['SCHEDULED', 'LIVE'] },
        // O'quvchi faqat o'z darajasiga yoki hammaga ochiq efirni ko'radi
        ...(staff ? {} : { OR: [{ level: null }, { level: { in: levels } }] }),
      },
      orderBy: { startsAt: 'asc' },
      take: 50,
      include: {
        host: { select: { firstName: true, lastName: true, avatarUrl: true } },
        _count: { select: { attendees: true } },
      },
    });

    return rows.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      startsAt: s.startsAt,
      durationMin: s.durationMin,
      level: s.level,
      status: s.status,
      host: `${s.host.firstName} ${s.host.lastName}`,
      hostAvatar: s.host.avatarUrl,
      attendeeCount: s._count.attendees,
      joinable: this.joinable(s.startsAt, s.durationMin, s.status),
      isHost: s.hostId === userId,
    }));
  }

  async create(hostId: string, dto: CreateLiveDto) {
    const startsAt = new Date(dto.startsAt);
    if (startsAt.getTime() < Date.now() - 60_000) {
      throw new BadRequestException("Efir vaqti o'tib ketgan");
    }
    const row = await this.prisma.liveSession.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        startsAt,
        durationMin: dto.durationMin ?? 60,
        level: dto.level ?? null,
        roomName: this.newRoomName(),
        hostId,
      },
    });

    // Kimga tegishli bo'lsa, xabar beramiz
    const targets = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: 'STUDENT',
        ...(dto.level
          ? { memberships: { some: { group: { level: dto.level } } } }
          : {}),
      },
      select: { id: true },
      take: 2000,
    });
    await Promise.all(
      targets.map((t) =>
        this.notifications.push({
          userId: t.id,
          type: 'LESSON_SOON',
          title: 'Jonli dars rejalashtirildi',
          body: row.title,
          link: '/jonli',
        }),
      ),
    );
    return { id: row.id };
  }

  private async owned(id: string, actor: { id: string; role: Role }) {
    const row = await this.prisma.liveSession.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(NOT_FOUND);
    if (row.hostId !== actor.id && actor.role !== 'ADMIN') throw new NotFoundException(NOT_FOUND);
    return row;
  }

  async update(id: string, actor: { id: string; role: Role }, dto: UpdateLiveDto) {
    await this.owned(id, actor);
    return this.prisma.liveSession.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description === undefined ? undefined : dto.description.trim() || null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        durationMin: dto.durationMin,
        level: dto.clearLevel ? null : dto.level,
      },
    });
  }

  /** Efirni boshlash/tugatish — faqat uy egasi. */
  async setStatus(id: string, actor: { id: string; role: Role }, status: 'LIVE' | 'ENDED' | 'CANCELLED') {
    await this.owned(id, actor);
    return this.prisma.liveSession.update({ where: { id }, data: { status } });
  }

  async remove(id: string, actor: { id: string; role: Role }) {
    await this.owned(id, actor);
    await this.prisma.liveSession.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * Kirish. Xona nomi shu yerda, faqat vaqti kelganda beriladi.
   * Uy egasi istalgan vaqtda kira oladi (sozlashni oldindan tekshirish uchun).
   */
  async join(id: string, userId: string, role: Role) {
    const row = await this.prisma.liveSession.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(NOT_FOUND);

    const isHost = row.hostId === userId;
    if (!isHost) {
      if (row.level) {
        const levels = await this.userLevels(userId);
        const staff = role === 'TEACHER' || role === 'ADMIN';
        if (!staff && !levels.includes(row.level)) throw new NotFoundException(NOT_FOUND);
      }
      if (!this.joinable(row.startsAt, row.durationMin, row.status)) {
        throw new ForbiddenException({
          message: 'Efir hali boshlanmadi yoki tugadi',
          code: 'NOT_JOINABLE',
        });
      }
    }

    await this.prisma.liveAttendee.upsert({
      where: { sessionId_userId: { sessionId: id, userId } },
      create: { sessionId: id, userId },
      update: {},
    });

    return { roomName: row.roomName, title: row.title, isHost };
  }
}

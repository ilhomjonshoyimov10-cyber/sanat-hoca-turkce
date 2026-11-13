import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Level, Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { jitsiUrl } from '../common/jitsi.js';
import { tashkentTime } from '../common/time.js';
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

  /**
   * Kirish mumkinmi. Ustoz "Efirni boshlash"ni bosgan bo'lsa (LIVE) — vaqtdan
   * qat'i nazar ochiq. Aks holda: boshlanishidan 15 daqiqa oldin ochiladi.
   */
  private joinable(startsAt: Date, durationMin: number, status: string): boolean {
    if (status === 'CANCELLED' || status === 'ENDED') return false;
    if (status === 'LIVE') return true;
    const now = Date.now();
    return (
      now >= startsAt.getTime() - EARLY_JOIN_MS &&
      now <= startsAt.getTime() + durationMin * 60_000
    );
  }

  /** Foydalanuvchining guruhlari va darajalari. */
  private async memberships(userId: string) {
    const rows = await this.prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true, group: { select: { level: true } } },
    });
    return { groupIds: rows.map((r) => r.groupId), levels: [...new Set(rows.map((r) => r.group.level))] };
  }

  /** Bu efirni foydalanuvchi ko'ra oladimi (ustoz va admin — hammasini). */
  private visibleWhere(staff: boolean, m: { groupIds: string[]; levels: Level[] }) {
    if (staff) return {};
    return {
      OR: [
        { groupId: null, level: null }, // hamma o'quvchilar uchun ochiq
        { groupId: null, level: { in: m.levels } },
        { groupId: { in: m.groupIds } },
      ],
    };
  }

  /**
   * Ro'yxat. Xona nomi / havola BERILMAYDI — u faqat "join" chaqirilganda,
   * vaqti kelganda qaytariladi.
   */
  async list(userId: string, role: Role) {
    const staff = role === 'TEACHER' || role === 'ADMIN';
    const m = staff ? { groupIds: [], levels: [] } : await this.memberships(userId);

    const rows = await this.prisma.liveSession.findMany({
      where: { status: { in: ['SCHEDULED', 'LIVE'] }, ...this.visibleWhere(staff, m) },
      orderBy: { startsAt: 'asc' },
      take: 50,
      include: {
        host: { select: { firstName: true, lastName: true, avatarUrl: true } },
        group: { select: { id: true, name: true } },
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
      group: s.group,
      provider: s.provider,
      maxParticipants: s.maxParticipants,
      status: s.status,
      host: `${s.host.firstName} ${s.host.lastName}`,
      hostAvatar: s.host.avatarUrl,
      attendeeCount: s._count.attendees,
      joinable: this.joinable(s.startsAt, s.durationMin, s.status),
      isHost: s.hostId === userId,
    }));
  }

  /** Efirga kim taklif qilinadi: guruh a'zolari, daraja yoki hamma o'quvchilar. */
  private async targets(s: { groupId: string | null; level: Level | null }): Promise<string[]> {
    if (s.groupId) {
      const rows = await this.prisma.groupMember.findMany({ where: { groupId: s.groupId }, select: { userId: true } });
      return rows.map((r) => r.userId);
    }
    const rows = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: 'STUDENT',
        ...(s.level ? { memberships: { some: { group: { level: s.level } } } } : {}),
      },
      select: { id: true },
      take: 5000,
    });
    return rows.map((r) => r.id);
  }

  async create(host: { id: string; role: Role }, dto: CreateLiveDto) {
    const startsAt = new Date(dto.startsAt);
    if (startsAt.getTime() < Date.now() - 60_000) {
      throw new BadRequestException("Efir vaqti o'tib ketgan");
    }
    const provider = dto.provider ?? 'JITSI';
    if (provider === 'EXTERNAL' && !dto.externalUrl) {
      throw new BadRequestException("Tashqi efir uchun havola kerak (Zoom, Google Meet yoki Telegram)");
    }
    let groupName: string | null = null;
    if (dto.groupId) {
      const g = await this.prisma.group.findUnique({ where: { id: dto.groupId }, select: { id: true, name: true, teacherId: true } });
      // Ustoz faqat o'z guruhiga efir qo'ya oladi (admin — istalganiga)
      if (!g || (host.role !== 'ADMIN' && g.teacherId !== host.id)) throw new NotFoundException('Guruh topilmadi');
      groupName = g.name;
    }
    const row = await this.prisma.liveSession.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        startsAt,
        durationMin: dto.durationMin ?? 60,
        level: dto.groupId ? null : (dto.level ?? null),
        groupId: dto.groupId ?? null,
        provider,
        externalUrl: provider === 'EXTERNAL' ? dto.externalUrl : null,
        maxParticipants: dto.maxParticipants ?? 100,
        roomName: this.newRoomName(),
        hostId: host.id,
      },
    });

    const ids = await this.targets(row);
    await this.notifications.pushMany(ids.filter((id) => id !== host.id), {
      type: 'LIVE',
      title: groupName ? `${groupName}: jonli dars rejalashtirildi` : 'Jonli dars rejalashtirildi',
      body: `${row.title} — ${tashkentTime(startsAt)}`,
      link: '/jonli',
    });
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
        externalUrl: dto.externalUrl,
        maxParticipants: dto.maxParticipants,
      },
    });
  }

  /** Efirni boshlash/tugatish — faqat uy egasi. */
  async setStatus(id: string, actor: { id: string; role: Role }, status: 'LIVE' | 'ENDED' | 'CANCELLED') {
    const wasLive = (await this.owned(id, actor)).status === 'LIVE';
    const row = await this.prisma.liveSession.update({ where: { id }, data: { status } });
    // "Boshlandi!" — onlayn o'quvchining ekranida darhol chiqadi
    if (status === 'LIVE' && !wasLive) {
      const ids = await this.targets(row);
      await this.notifications.pushMany(ids.filter((u) => u !== actor.id), {
        type: 'LIVE',
        title: 'Jonli dars boshlandi — kiring!',
        body: row.title,
        link: '/jonli',
      });
    }
    return row;
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
    const me = await this.prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } });
    const user = { id: userId, role, name: me ? `${me.firstName} ${(me.lastName ?? "").charAt(0)}.` : 'O‘quvchi' };

    const isHost = row.hostId === user.id;
    const staff = user.role === 'TEACHER' || user.role === 'ADMIN';
    if (!isHost) {
      if (!staff) {
        // Guruhga yoki darajaga bog'langan efir: faqat tegishli o'quvchi
        const m = await this.memberships(user.id);
        const allowed =
          (row.groupId ? m.groupIds.includes(row.groupId) : true) &&
          (row.level && !row.groupId ? m.levels.includes(row.level) : true);
        if (!allowed) throw new NotFoundException(NOT_FOUND);
      }
      if (!this.joinable(row.startsAt, row.durationMin, row.status)) {
        throw new ForbiddenException({
          message: 'Efir hali boshlanmadi yoki tugadi',
          code: 'NOT_JOINABLE',
        });
      }
      // Sig'im: allaqachon kirgan odam qayta kira oladi
      const already = await this.prisma.liveAttendee.findUnique({
        where: { sessionId_userId: { sessionId: id, userId: user.id } },
        select: { id: true },
      });
      if (!already) {
        const count = await this.prisma.liveAttendee.count({ where: { sessionId: id } });
        if (count >= row.maxParticipants) {
          throw new ForbiddenException({ message: `Joy qolmadi (${row.maxParticipants} kishi)`, code: 'LIVE_FULL' });
        }
      }
    }

    await this.prisma.liveAttendee.upsert({
      where: { sessionId_userId: { sessionId: id, userId: user.id } },
      create: { sessionId: id, userId: user.id },
      update: {},
    });

    return { title: row.title, isHost, provider: row.provider, url: this.joinUrl(row, user.name, isHost) };
  }

  private joinUrl(row: { provider: string; roomName: string; externalUrl: string | null }, name: string, isHost: boolean) {
    if (row.provider === 'EXTERNAL' && row.externalUrl) return row.externalUrl;
    return jitsiUrl(row.roomName, name, isHost);
  }

}

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateLessonDto, UpdateLessonDto } from './lessons.dto.js';

export interface Actor { id: string; role: Role }

const NOT_FOUND = 'Topilmadi';
/** Darsga kirish oynasi: boshlanishidan 15 daqiqa oldin ochiladi. */
const EARLY_JOIN_MS = 15 * 60 * 1000;

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async access(groupId: string, actor: Actor) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException(NOT_FOUND);
    const canManage = actor.role === 'ADMIN' || (actor.role === 'TEACHER' && group.teacherId === actor.id);
    if (!canManage) {
      const member = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: actor.id } },
      });
      if (!member) throw new NotFoundException(NOT_FOUND);
    }
    return { group, canManage };
  }

  /**
   * Xona nomi SERVERDA yaratiladi va taxmin qilib bo'lmaydi.
   * Jitsi ning ommaviy serverida xona nomi — yagona himoya: nomni bilgan
   * odam kira oladi. Shuning uchun 160 bit tasodif ishlatiladi.
   */
  private newRoomName(): string {
    return `sanat-${randomBytes(20).toString('base64url')}`;
  }

  async list(groupId: string, actor: Actor) {
    await this.access(groupId, actor);
    const lessons = await this.prisma.lesson.findMany({
      where: { groupId },
      orderBy: { startsAt: 'desc' },
      take: 50,
      include: { _count: { select: { attendees: true } } },
    });
    // Xona nomi ro'yxatda BERILMAYDI — faqat "join" chaqirilganda, vaqti kelganda.
    return lessons.map((l) => ({
      id: l.id,
      title: l.title,
      startsAt: l.startsAt,
      durationMin: l.durationMin,
      status: l.status,
      attendeeCount: l._count.attendees,
      joinable: this.isJoinable(l.startsAt, l.durationMin, l.status),
    }));
  }

  private isJoinable(startsAt: Date, durationMin: number, status: string): boolean {
    if (status === 'CANCELLED' || status === 'ENDED') return false;
    const now = Date.now();
    return now >= startsAt.getTime() - EARLY_JOIN_MS
      && now <= startsAt.getTime() + durationMin * 60_000;
  }

  async create(groupId: string, actor: Actor, dto: CreateLessonDto) {
    const { group, canManage } = await this.access(groupId, actor);
    if (!canManage) throw new ForbiddenException('Bu amal faqat guruh ustozi uchun');

    const startsAt = new Date(dto.startsAt);
    if (Number.isNaN(startsAt.getTime())) throw new BadRequestException('Sana noto’g’ri');
    if (startsAt.getTime() < Date.now() - 60 * 60_000) {
      throw new BadRequestException('Dars vaqti o’tib ketgan');
    }

    const lesson = await this.prisma.lesson.create({
      data: {
        groupId,
        title: dto.title.trim(),
        startsAt,
        durationMin: dto.durationMin ?? 60,
        roomName: this.newRoomName(),
        createdById: actor.id,
      },
    });

    const members = await this.prisma.groupMember.findMany({
      where: { groupId }, select: { userId: true },
    });
    await this.notifications.pushMany(members.map((m) => m.userId), {
      type: 'LESSON_SOON',
      title: `${group.name}: video dars rejalashtirildi`,
      body: `${lesson.title} — ${startsAt.toISOString()}`,
      link: `/guruh?id=${groupId}`,
    });

    return { id: lesson.id, title: lesson.title, startsAt: lesson.startsAt, durationMin: lesson.durationMin, status: lesson.status };
  }

  async update(lessonId: string, actor: Actor, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException(NOT_FOUND);
    const { canManage } = await this.access(lesson.groupId, actor);
    if (!canManage) throw new ForbiddenException('Bu amal faqat guruh ustozi uchun');

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: dto.title?.trim(),
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        durationMin: dto.durationMin,
      },
      select: { id: true, title: true, startsAt: true, durationMin: true, status: true },
    });
  }

  async cancel(lessonId: string, actor: Actor) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException(NOT_FOUND);
    const { canManage } = await this.access(lesson.groupId, actor);
    if (!canManage) throw new ForbiddenException('Bu amal faqat guruh ustozi uchun');
    await this.prisma.lesson.update({ where: { id: lessonId }, data: { status: 'CANCELLED' } });
    return { ok: true };
  }

  /**
   * Darsga qo'shilish. Xona nomi FAQAT shu yerda beriladi va faqat
   * vaqti kelganda — shuning uchun havola oldindan tarqalib ketmaydi.
   */
  async join(lessonId: string, actor: Actor) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException(NOT_FOUND);
    const { canManage } = await this.access(lesson.groupId, actor);

    if (!this.isJoinable(lesson.startsAt, lesson.durationMin, lesson.status)) {
      throw new ForbiddenException('Dars hali boshlanmadi yoki tugagan');
    }

    if (lesson.status === 'SCHEDULED') {
      await this.prisma.lesson.update({ where: { id: lessonId }, data: { status: 'LIVE' } });
    }
    // Kim kirgani yoziladi; ikkinchi marta kirsa yangi yozuv yaratilmaydi.
    await this.prisma.lessonAttendee
      .create({ data: { lessonId, userId: actor.id } })
      .catch(() => undefined);

    return {
      roomName: lesson.roomName,
      title: lesson.title,
      /** Ustoz xonada moderator bo'ladi */
      isModerator: canManage,
      durationMin: lesson.durationMin,
    };
  }

  async end(lessonId: string, actor: Actor) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException(NOT_FOUND);
    const { canManage } = await this.access(lesson.groupId, actor);
    if (!canManage) throw new ForbiddenException('Bu amal faqat guruh ustozi uchun');
    await this.prisma.lesson.update({ where: { id: lessonId }, data: { status: 'ENDED' } });
    return { ok: true };
  }
}

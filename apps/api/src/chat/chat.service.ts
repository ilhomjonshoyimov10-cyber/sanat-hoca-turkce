import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { HistoryQuery, SendMessageDto } from './chat.dto.js';

export interface Actor { id: string; role: Role }

const NOT_FOUND = 'Topilmadi';
const PAGE = 50;
/** Spamga qarshi: bir foydalanuvchi 10 soniyada 5 tadan ko'p xabar yubormasin. */
const BURST_WINDOW_MS = 10_000;
const BURST_MAX = 5;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Guruh chatiga kirish huquqi. Guruhlar moduli bilan bir xil qoida:
   * begona odamga 403 emas, 404 beriladi — guruh borligini ham bilmasin.
   */
  private async access(groupId: string, actor: Actor) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException(NOT_FOUND);
    const canModerate = actor.role === 'ADMIN' || (actor.role === 'TEACHER' && group.teacherId === actor.id);
    if (!canModerate) {
      const member = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: actor.id } },
      });
      if (!member) throw new NotFoundException(NOT_FOUND);
    }
    return { group, canModerate };
  }

  async history(groupId: string, actor: Actor, q: HistoryQuery) {
    await this.access(groupId, actor);

    // Kursor: `after` jonli yangilanish uchun, `before` eski tarix uchun.
    const cursorMsg = q.after || q.before
      ? await this.prisma.message.findFirst({
          where: { id: q.after ?? q.before, groupId },
          select: { createdAt: true },
        })
      : null;

    const where = {
      groupId,
      ...(cursorMsg && q.after ? { createdAt: { gt: cursorMsg.createdAt } } : {}),
      ...(cursorMsg && q.before ? { createdAt: { lt: cursorMsg.createdAt } } : {}),
    };

    const rows = await this.prisma.message.findMany({
      where,
      orderBy: { createdAt: q.after ? 'asc' : 'desc' },
      take: PAGE,
      include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });

    const items = (q.after ? rows : rows.reverse()).map((m) => ({
      id: m.id,
      content: m.isDeleted ? null : m.content, // o'chirilgan xabar matni berilmaydi
      isDeleted: m.isDeleted,
      isAnnouncement: m.isAnnouncement,
      createdAt: m.createdAt,
      sender: m.sender,
      mine: m.senderId === actor.id,
    }));
    return { items, hasMore: rows.length === PAGE };
  }

  async send(groupId: string, actor: Actor, dto: SendMessageDto) {
    const { group, canModerate } = await this.access(groupId, actor);

    const since = new Date(Date.now() - BURST_WINDOW_MS);
    const recent = await this.prisma.message.count({
      where: { senderId: actor.id, groupId, createdAt: { gte: since } },
    });
    if (recent >= BURST_MAX) {
      throw new ForbiddenException('Juda tez yozyapsiz. Bir oz kuting.');
    }

    // E'lonni faqat ustoz va admin yubora oladi
    const isAnnouncement = !!dto.isAnnouncement && canModerate;

    const msg = await this.prisma.message.create({
      data: { groupId, senderId: actor.id, content: dto.content.trim(), isAnnouncement },
      include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });

    if (isAnnouncement) {
      const members = await this.prisma.groupMember.findMany({
        where: { groupId },
        select: { userId: true },
      });
      await this.notifications.pushMany(
        members.map((m) => m.userId).filter((id) => id !== actor.id),
        {
          type: 'ANNOUNCEMENT',
          title: `${group.name}: yangi e'lon`,
          body: dto.content.slice(0, 200),
          link: `/guruh?id=${groupId}`,
        },
      );
    }

    return {
      id: msg.id,
      content: msg.content,
      isDeleted: false,
      isAnnouncement: msg.isAnnouncement,
      createdAt: msg.createdAt,
      sender: msg.sender,
      mine: true,
    };
  }

  /** O'chirish: o'z xabarini har kim, boshqanikini faqat ustoz/admin.
   *  Yozuv bazada qoladi (moderatsiya tarixi uchun), faqat matni berilmaydi. */
  async remove(messageId: string, actor: Actor) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg || msg.isDeleted) throw new NotFoundException(NOT_FOUND);
    const { canModerate } = await this.access(msg.groupId, actor);
    if (msg.senderId !== actor.id && !canModerate) throw new ForbiddenException('Ruxsat yo’q');

    await this.prisma.$transaction([
      this.prisma.message.update({ where: { id: messageId }, data: { isDeleted: true } }),
      this.prisma.auditLog.create({
        data: {
          action: 'MESSAGE_DELETED',
          userId: actor.id,
          entity: 'message',
          entityId: messageId,
          meta: { byModerator: msg.senderId !== actor.id },
        },
      }),
    ]);
    return { ok: true };
  }
}

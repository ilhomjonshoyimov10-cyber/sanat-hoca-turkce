import { Injectable } from '@nestjs/common';
import type { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

/** Bitta bildirishnoma yaratish uchun kerakli ma'lumot. */
export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  /** Faqat sayt ichidagi yo'l ("/guruh?id=abc"). Tashqi URL qabul qilinmaydi. */
  link?: string;
}

const MAX_LIST = 50;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Sayt ichidagi yo'lmi? "//evil.com" va "https://..." rad etiladi (ochiq yo'naltirish himoyasi). */
  private safeLink(link?: string): string | undefined {
    if (!link) return undefined;
    return /^\/(?!\/)[\w\-/?=&.]*$/.test(link) ? link.slice(0, 200) : undefined;
  }

  /**
   * Bildirishnoma yuborish. Hech qachon chaqiruvchi amalni buzmaydi:
   * xato bo'lsa jim o'tadi, chunki vazifa berish bildirishnoma tufayli
   * bekor bo'lib qolmasligi kerak.
   */
  async push(input: NotifyInput): Promise<void> {
    await this.prisma.notification
      .create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title.slice(0, 160),
          body: input.body?.slice(0, 500),
          link: this.safeLink(input.link),
        },
      })
      .catch(() => undefined);
  }

  /** Bir nechta foydalanuvchiga bir xil xabar (masalan guruhga e'lon). */
  async pushMany(userIds: string[], input: Omit<NotifyInput, 'userId'>): Promise<void> {
    if (!userIds.length) return;
    await this.prisma.notification
      .createMany({
        data: userIds.map((userId) => ({
          userId,
          type: input.type,
          title: input.title.slice(0, 160),
          body: input.body?.slice(0, 500),
          link: this.safeLink(input.link),
        })),
      })
      .catch(() => undefined);
  }

  async list(userId: string) {
    const [items, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: MAX_LIST,
      }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { items, unread };
  }

  /** Faqat o'z bildirishnomasini o'qilgan deb belgilay oladi (IDOR himoyasi). */
  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true, count };
  }
}

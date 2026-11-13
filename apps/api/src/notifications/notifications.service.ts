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

  /** Barcha faol adminlarga (murojaat, bepul dars arizasi). */
  async pushToAdmins(input: Omit<NotifyInput, 'userId'>): Promise<void> {
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
    await this.pushMany(admins.map((a) => a.id), input);
  }

  /**
   * Bir xil manbadan ketma-ket xabar kelsa (ustoz chatda 10 ta xabar
   * yozsa) — o'quvchiga 10 ta bildirishnoma emas, bitta boradi. Shu
   * havola bo'yicha o'qilmagan bildirishnomasi bor odamga yangisi
   * yuborilmaydi (oyna ichida).
   */
  async pushManyCoalesced(userIds: string[], input: Omit<NotifyInput, 'userId'>, windowMs = 30 * 60 * 1000): Promise<void> {
    const link = this.safeLink(input.link);
    if (!userIds.length) return;
    if (!link) return this.pushMany(userIds, input);
    const already = await this.prisma.notification.findMany({
      // Turi ham mos bo'lsin: "yangi o'quvchi qo'shildi" (ACCOUNT) bildirishnomasi
      // shu guruh havolasida turibdi, deb chat xabari yutilib ketmasin.
      where: { userId: { in: userIds }, type: input.type, link, readAt: null, createdAt: { gte: new Date(Date.now() - windowMs) } },
      select: { userId: true },
    }).catch(() => []);
    const skip = new Set(already.map((a) => a.userId));
    await this.pushMany(userIds.filter((id) => !skip.has(id)), input);
  }

  /**
   * Yengil so'rov: brauzer har daqiqada so'raydi. Faqat o'qilmaganlar
   * soni va `since` dan keyingi yangilari (ekranda "Sizga xabar keldi"
   * oynasini ko'rsatish uchun).
   */
  async pulse(userId: string, since?: Date) {
    // Vaqt so'rovdan OLDIN olinadi: so'rov paytida yozilgan bildirishnoma
    // keyingi safar ham "yangi" bo'lib keladi (brauzer id bo'yicha takrorni
    // tashlab yuboradi) — aks holda u hech qachon ekranga chiqmay qolardi.
    const now = new Date();
    const [unread, fresh] = await Promise.all([
      this.prisma.notification.count({ where: { userId, readAt: null } }),
      since
        ? this.prisma.notification.findMany({
            where: { userId, createdAt: { gt: since } },
            orderBy: { createdAt: 'desc' },
            take: 10,
          })
        : Promise.resolve([]),
    ]);
    return { unread, fresh, now };
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

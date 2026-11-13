import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AssignVideoDto,
  CreateVideoDto,
  LeadMessageDto,
  LeadStatusDto,
  LinkLeadDto,
  UpdateVideoDto,
} from './freelesson.dto.js';

@Injectable()
export class FreeLessonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private isStaff(role: Role) {
    return role === 'ADMIN' || role === 'TEACHER';
  }

  // ═════════════ Video kutubxonasi (admin) ═════════════

  listVideos() {
    return this.prisma.lessonVideo.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { assignments: true } } },
    });
  }

  async createVideo(adminId: string, dto: CreateVideoDto) {
    // Asosiy video faqat bitta bo'ladi
    if (dto.isDefault) await this.prisma.lessonVideo.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    return this.prisma.lessonVideo.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        url: dto.url,
        coverUrl: dto.coverUrl || null,
        level: dto.level ?? null,
        position: dto.position ?? 0,
        isActive: dto.isActive ?? true,
        isDefault: dto.isDefault ?? false,
        createdById: adminId,
      },
    });
  }

  async updateVideo(id: string, dto: UpdateVideoDto) {
    const row = await this.prisma.lessonVideo.findUnique({ where: { id }, select: { id: true } });
    if (!row) throw new NotFoundException('Video topilmadi');
    if (dto.isDefault) {
      await this.prisma.lessonVideo.updateMany({ where: { isDefault: true, id: { not: id } }, data: { isDefault: false } });
    }
    return this.prisma.lessonVideo.update({
      where: { id },
      data: {
        isDefault: dto.isDefault,
        title: dto.title?.trim(),
        description: dto.description === undefined ? undefined : dto.description.trim() || null,
        url: dto.url,
        coverUrl: dto.coverUrl === undefined ? undefined : dto.coverUrl || null,
        level: dto.level,
        position: dto.position,
        isActive: dto.isActive,
      },
    });
  }

  async removeVideo(id: string) {
    const row = await this.prisma.lessonVideo.findUnique({ where: { id }, select: { id: true } });
    if (!row) throw new NotFoundException('Video topilmadi');
    await this.prisma.lessonVideo.delete({ where: { id } });
    return { ok: true };
  }

  // ═════════════ Arizalar (admin/ustoz) ═════════════

  async listLeads(status?: string) {
    const rows = await this.prisma.lead.findMany({
      where: status ? { status: status as never } : {},
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 200,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        videos: { include: { video: { select: { id: true, title: true } } } },
        _count: { select: { messages: true } },
      },
    });
    return rows;
  }

  async setLeadStatus(id: string, dto: LeadStatusDto) {
    const row = await this.prisma.lead.findUnique({ where: { id }, select: { id: true } });
    if (!row) throw new NotFoundException('Ariza topilmadi');
    return this.prisma.lead.update({ where: { id }, data: { status: dto.status } });
  }

  /** Arizani hisobga qo'lda bog'lash (raqam boshqacha yozilgan bo'lsa). */
  async linkLead(id: string, dto: LinkLeadDto) {
    const [lead, user] = await Promise.all([
      this.prisma.lead.findUnique({ where: { id }, select: { id: true } }),
      this.prisma.user.findUnique({ where: { id: dto.userId }, select: { id: true } }),
    ]);
    if (!lead) throw new NotFoundException('Ariza topilmadi');
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return this.prisma.lead.update({ where: { id }, data: { userId: dto.userId } });
  }

  /**
   * Arizachiga bepul dars videosini biriktirish.
   *
   * Agar ariza hisobga bog'langan bo'lsa, foydalanuvchiga bildirishnoma
   * ketadi. Bog'lanmagan bo'lsa ham biriktirish saqlanadi — u ro'yxatdan
   * o'tgan kuni videolarni ko'radi.
   */
  async assignVideo(staffId: string, leadId: string, dto: AssignVideoDto) {
    const [lead, video] = await Promise.all([
      this.prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, userId: true } }),
      this.prisma.lessonVideo.findUnique({
        where: { id: dto.videoId },
        select: { id: true, title: true, isActive: true },
      }),
    ]);
    if (!lead) throw new NotFoundException('Ariza topilmadi');
    if (!video) throw new NotFoundException('Video topilmadi');
    if (!video.isActive) throw new BadRequestException("Bu video o'chirilgan");

    const existing = await this.prisma.leadVideo.findUnique({
      where: { leadId_videoId: { leadId, videoId: dto.videoId } },
      select: { id: true },
    });
    if (existing) throw new BadRequestException('Bu video allaqachon biriktirilgan');

    const row = await this.prisma.leadVideo.create({
      data: { leadId, videoId: dto.videoId, assignedById: staffId },
    });

    if (lead.userId) {
      await this.notifications.push({
        userId: lead.userId,
        type: 'FREE_LESSON',
        title: 'Sizga bepul dars videosi biriktirildi',
        body: video.title,
        link: '/bepul-dars',
      });
    }
    return row;
  }

  /**
   * "1-darsni yuborish" — bitta tugma.
   *
   * Asosiy video (isDefault) biriktiriladi; u bo'lmasa — birinchi faol
   * video. Allaqachon biriktirilgan bo'lsa xato emas: yana yuborish
   * oddiy holat (admin "yubordimmi?" deb ikkinchi marta bosadi).
   * Javobda Telegram orqali yuborish uchun tayyor matn ham bor — ariza
   * egasi saytda ro'yxatdan o'tmagan bo'lsa ham dars unga yetsin.
   */
  async sendFirstLesson(staffId: string, leadId: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, name: true, phone: true, userId: true, status: true } });
    if (!lead) throw new NotFoundException('Ariza topilmadi');
    const video =
      (await this.prisma.lessonVideo.findFirst({ where: { isDefault: true, isActive: true } })) ??
      (await this.prisma.lessonVideo.findFirst({ where: { isActive: true }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] }));
    if (!video) throw new BadRequestException("Avval video qo'shing (Bepul dars → Videolar)");

    const existing = await this.prisma.leadVideo.findUnique({
      where: { leadId_videoId: { leadId, videoId: video.id } },
      select: { id: true },
    });
    if (!existing) {
      await this.prisma.leadVideo.create({ data: { leadId, videoId: video.id, assignedById: staffId } });
    }
    if (lead.userId && !existing) {
      await this.notifications.push({
        userId: lead.userId,
        type: 'FREE_LESSON',
        title: 'Bepul 1-dars sizga yuborildi',
        body: video.title,
        link: '/bepul-dars',
      });
    }
    if (lead.status === 'NEW') {
      await this.prisma.lead.update({ where: { id: leadId }, data: { status: 'CONTACTED' } }).catch(() => undefined);
    }
    const text = `Assalomu alaykum, ${lead.name}! Sanat Hoca Türkçe bepul 1-darsini shu yerda ko'rishingiz mumkin: ${video.url}`;
    return {
      ok: true,
      alreadySent: !!existing,
      onSite: !!lead.userId,
      video: { id: video.id, title: video.title, url: video.url },
      shareText: text,
      // Telegram'ning rasmiy "ulashish" oynasi: admin kimga yuborishni tanlaydi
      telegramShare: `https://t.me/share/url?url=${encodeURIComponent(video.url)}&text=${encodeURIComponent(text.replace(`: ${video.url}`, ':'))}`,
    };
  }

  async unassignVideo(leadId: string, videoId: string) {
    const row = await this.prisma.leadVideo.findUnique({
      where: { leadId_videoId: { leadId, videoId } },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Biriktirish topilmadi');
    await this.prisma.leadVideo.delete({ where: { id: row.id } });
    return { ok: true };
  }

  // ═════════════ Foydalanuvchi tomoni ═════════════

  /**
   * "Bepul dars" sahifasi: arizam qabul qilinganmi, qaysi videolar
   * biriktirilgan, ustoz bilan yozishma.
   */
  async mine(userId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        videos: {
          orderBy: { assignedAt: 'asc' },
          include: {
            video: {
              select: { id: true, title: true, description: true, url: true, coverUrl: true, level: true },
            },
          },
        },
      },
    });
    if (!lead) return { lead: null, videos: [], messages: [] };

    const messages = await this.prisma.leadMessage.findMany({
      where: { leadId: lead.id },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });

    // Ustoz yozgan o'qilmagan xabarlarni o'qilgan deb belgilaymiz
    await this.prisma.leadMessage.updateMany({
      where: { leadId: lead.id, readAt: null, senderId: { not: userId } },
      data: { readAt: new Date() },
    });

    const { videos, ...rest } = lead;
    return {
      lead: { id: rest.id, status: rest.status, level: rest.level, createdAt: rest.createdAt },
      videos: videos.map((v) => ({ ...v.video, assignedAt: v.assignedAt, watchedAt: v.watchedAt })),
      messages,
    };
  }

  /** Video ko'rildi deb belgilash — ustoz kim boshlaganini ko'radi. */
  async markWatched(userId: string, videoId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (!lead) throw new NotFoundException('Ariza topilmadi');
    const link = await this.prisma.leadVideo.findUnique({
      where: { leadId_videoId: { leadId: lead.id, videoId } },
      select: { id: true, watchedAt: true },
    });
    if (!link) throw new NotFoundException('Bu video sizga biriktirilmagan');
    if (link.watchedAt) return { ok: true };
    await this.prisma.leadVideo.update({ where: { id: link.id }, data: { watchedAt: new Date() } });
    return { ok: true };
  }

  /**
   * Yozishma.
   *
   * Arizachi faqat O'Z arizasiga yozadi; xodim istalganiga. Begona
   * ariza uchun 404 — 403 "bunday ariza bor" degan ma'lumotni beradi.
   */
  async sendMessage(userId: string, role: Role, leadId: string, dto: LeadMessageDto) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, userId: true, name: true },
    });
    if (!lead) throw new NotFoundException('Ariza topilmadi');

    const staff = this.isStaff(role);
    if (!staff && lead.userId !== userId) throw new NotFoundException('Ariza topilmadi');
    if (staff && !lead.userId) {
      throw new BadRequestException(
        "Bu ariza hali hisobga bog'lanmagan. Arizachi ro'yxatdan o'tgach yozishish mumkin",
      );
    }

    const msg = await this.prisma.leadMessage.create({
      data: { leadId, senderId: userId, body: dto.body.trim() },
    });

    if (staff && lead.userId) {
      await this.notifications.push({
        userId: lead.userId,
        type: 'FREE_LESSON',
        title: 'Ustozdan xabar',
        body: dto.body.slice(0, 200),
        link: '/bepul-dars',
      });
    } else if (!staff) {
      await this.notifications.pushToAdmins({
        type: 'FREE_LESSON',
        title: `Bepul dars: ${lead.name} yozdi`.slice(0, 160),
        body: dto.body.slice(0, 200),
        link: `/admin?tab=free&lead=${lead.id}`,
      });
    }
    return msg;
  }

  /** Xodim uchun: bitta arizaning yozishmasi. */
  async threadForStaff(leadId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        videos: { include: { video: { select: { id: true, title: true } } } },
      },
    });
    if (!lead) throw new NotFoundException('Ariza topilmadi');
    const messages = await this.prisma.leadMessage.findMany({
      where: { leadId },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });
    return { lead, messages };
  }
}

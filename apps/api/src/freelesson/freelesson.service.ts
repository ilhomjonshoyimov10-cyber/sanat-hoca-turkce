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

  createVideo(adminId: string, dto: CreateVideoDto) {
    return this.prisma.lessonVideo.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        url: dto.url,
        coverUrl: dto.coverUrl || null,
        level: dto.level ?? null,
        position: dto.position ?? 0,
        isActive: dto.isActive ?? true,
        createdById: adminId,
      },
    });
  }

  async updateVideo(id: string, dto: UpdateVideoDto) {
    const row = await this.prisma.lessonVideo.findUnique({ where: { id }, select: { id: true } });
    if (!row) throw new NotFoundException('Video topilmadi');
    return this.prisma.lessonVideo.update({
      where: { id },
      data: {
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
        type: 'ACCOUNT',
        title: 'Sizga bepul dars videosi biriktirildi',
        body: video.title,
        link: '/bepul-dars',
      });
    }
    return row;
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
        type: 'ACCOUNT',
        title: 'Ustozdan xabar',
        body: dto.body.slice(0, 120),
        link: '/bepul-dars',
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

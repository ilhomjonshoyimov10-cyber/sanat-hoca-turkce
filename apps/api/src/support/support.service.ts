import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateSupportDto, ReplyDto, SetStatusDto } from './support.dto.js';

/** Bir foydalanuvchi bir vaqtda nechta ochiq murojaat qoldira oladi. */
const MAX_OPEN_PER_USER = 5;

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private isStaff(role: Role) {
    return role === 'ADMIN' || role === 'TEACHER';
  }

  async create(userId: string, dto: CreateSupportDto) {
    const open = await this.prisma.supportRequest.count({
      where: { userId, status: { in: ['OPEN', 'ANSWERED'] } },
    });
    if (open >= MAX_OPEN_PER_USER) {
      throw new BadRequestException(
        "Sizda ochiq murojaatlar ko'p. Avvalgilariga javob kutib turing",
      );
    }

    const row = await this.prisma.supportRequest.create({
      data: {
        userId,
        topic: dto.topic ?? 'OTHER',
        subject: dto.subject.trim(),
        body: dto.body.trim(),
      },
    });

    // Adminlarga xabar beramiz — murojaat e'tiborsiz qolmasin
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });
    await Promise.all(
      admins.map((a) =>
        this.notifications.push({
          userId: a.id,
          type: 'ACCOUNT',
          title: 'Yangi murojaat',
          body: row.subject,
          link: `/admin/murojaatlar?id=${row.id}`,
        }),
      ),
    );
    return row;
  }

  /** Foydalanuvchining o'z murojaatlari. */
  mine(userId: string) {
    return this.prisma.supportRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        topic: true,
        subject: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { replies: true } },
      },
    });
  }

  /**
   * Bitta murojaat va yozishmalar.
   *
   * Begona murojaat uchun 404 (403 emas): 403 "bu id mavjud" degan
   * ma'lumotni beradi, 404 esa hech narsa aytmaydi.
   */
  async one(userId: string, role: Role, id: string) {
    const row = await this.prisma.supportRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, firstName: true, lastName: true, role: true } } },
        },
      },
    });
    if (!row) throw new NotFoundException('Murojaat topilmadi');
    if (row.userId !== userId && !this.isStaff(role)) throw new NotFoundException('Murojaat topilmadi');
    return row;
  }

  async reply(userId: string, role: Role, id: string, dto: ReplyDto) {
    const row = await this.prisma.supportRequest.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, subject: true },
    });
    if (!row) throw new NotFoundException('Murojaat topilmadi');

    const staff = this.isStaff(role);
    if (row.userId !== userId && !staff) throw new NotFoundException('Murojaat topilmadi');
    if (row.status === 'CLOSED') {
      throw new BadRequestException('Bu murojaat yopilgan. Yangi murojaat qoldiring');
    }

    const reply = await this.prisma.supportReply.create({
      data: { requestId: id, authorId: userId, body: dto.body.trim() },
    });

    await this.prisma.supportRequest.update({
      where: { id },
      data: {
        // Xodim javob bersa "javob berildi", foydalanuvchi yozsa yana "ochiq"
        status: staff ? 'ANSWERED' : 'OPEN',
        handledById: staff ? userId : undefined,
      },
    });

    // Xabar faqat qarama-qarshi tomonga ketadi
    if (staff) {
      await this.notifications.push({
        userId: row.userId,
        type: 'ACCOUNT',
        title: 'Murojaatingizga javob keldi',
        body: row.subject,
        link: `/murojaat?id=${row.id}`,
      });
    }
    return reply;
  }

  // ───────────────────────── Admin ─────────────────────────

  list(status?: string) {
    return this.prisma.supportRequest.findMany({
      where: status ? { status: status as never } : {},
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 100,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true, phone: true } },
        _count: { select: { replies: true } },
      },
    });
  }

  async setStatus(adminId: string, id: string, dto: SetStatusDto) {
    const row = await this.prisma.supportRequest.findUnique({ where: { id }, select: { id: true } });
    if (!row) throw new NotFoundException('Murojaat topilmadi');
    return this.prisma.supportRequest.update({
      where: { id },
      data: { status: dto.status, handledById: adminId },
    });
  }
}

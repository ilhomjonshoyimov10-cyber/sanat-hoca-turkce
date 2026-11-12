import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, Role } from '@prisma/client';
import { hashPassword } from '../auth/argon.js';
import { normalizeEmail, normalizePhone } from '../auth/auth.utils.js';
import { checkPassword } from '../auth/password.policy.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateUserDto, ListUsersQuery, ResetPasswordDto, UpdateUserDto } from './admin.dto.js';

export interface Actor { id: string; role: Role }

const USER_FIELDS = {
  id: true, email: true, phone: true, firstName: true, lastName: true, role: true,
  isActive: true, twoFactorEnabled: true, createdAt: true, lastLoginAt: true, lockedUntil: true,
} as const;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private audit(action: string, actor: Actor, entityId: string, meta?: Prisma.InputJsonValue) {
    return this.prisma.auditLog
      .create({ data: { action, userId: actor.id, entity: 'user', entityId, meta } })
      .catch(() => undefined);
  }

  // ───────── Ko'rsatkichlar ─────────
  async stats() {
    const [users, byRole, groups, activeGroups, leads, newLeads, words, submissions, ungraded, lessons] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
        this.prisma.group.count(),
        this.prisma.group.count({ where: { isActive: true } }),
        this.prisma.lead.count(),
        this.prisma.lead.count({ where: { status: 'NEW' } }),
        this.prisma.word.count(),
        this.prisma.submission.count(),
        this.prisma.submission.count({ where: { score: null } }),
        this.prisma.lesson.count(),
      ]);

    const roles: Record<string, number> = {};
    for (const r of byRole) roles[r.role] = r._count._all;

    return {
      users, roles, groups, activeGroups, leads, newLeads, words,
      submissions, ungraded, lessons,
    };
  }

  // ───────── Foydalanuvchilar ─────────
  async listUsers(q: ListUsersQuery) {
    const take = q.take ?? 25;
    const skip = q.skip ?? 0;
    const term = q.q?.trim();

    const where: Prisma.UserWhereInput = {
      ...(q.role ? { role: q.role } : {}),
      ...(term
        ? {
            OR: [
              { firstName: { contains: term, mode: 'insensitive' as const } },
              { lastName: { contains: term, mode: 'insensitive' as const } },
              { email: { contains: term.toLowerCase() } },
              { phone: { contains: term } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({ where, select: USER_FIELDS, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, skip, take };
  }

  async createUser(actor: Actor, dto: CreateUserDto) {
    // Kirish sahifasi bilan bir xil qoida: '@' bo'lsa email, aks holda telefon.
    const raw = dto.identifier.trim();
    const email = raw.includes('@') ? normalizeEmail(raw) : null;
    const phone = email ? null : normalizePhone(raw);
    if (!email && !phone) throw new BadRequestException('Email yoki telefon raqam noto’g’ri');
    if (email && !/^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/.test(email)) {
      throw new BadRequestException('Email noto’g’ri');
    }

    const policyError = checkPassword(dto.password, {
      firstName: dto.firstName, lastName: dto.lastName, email: email ?? undefined,
    });
    if (policyError) throw new BadRequestException(policyError);

    const exists = await this.prisma.user.findFirst({
      where: email ? { email } : { phone: phone! }, select: { id: true },
    });
    if (exists) throw new ConflictException('Bu email yoki telefon band');

    const user = await this.prisma.user.create({
      data: {
        email, phone,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role: dto.role,
        passwordHash: await hashPassword(dto.password),
      },
      select: USER_FIELDS,
    });
    await this.audit('ADMIN_USER_CREATED', actor, user.id, { role: dto.role });
    return user;
  }

  async updateUser(actor: Actor, userId: string, dto: UpdateUserDto) {
    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new NotFoundException('Topilmadi');

    // Admin o'z rolini tushira olmaydi va o'zini o'chira olmaydi:
    // aks holda tizimda bitta ham admin qolmasligi mumkin.
    if (userId === actor.id && (dto.role && dto.role !== 'ADMIN')) {
      throw new BadRequestException('O’z rolingizni o’zgartira olmaysiz');
    }
    if (userId === actor.id && dto.isActive === false) {
      throw new BadRequestException('O’z hisobingizni o’chira olmaysiz');
    }
    // Oxirgi adminni olib tashlashga yo'l qo'yilmaydi
    if (target.role === 'ADMIN' && (dto.role && dto.role !== 'ADMIN' || dto.isActive === false)) {
      const admins = await this.prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
      if (admins <= 1) throw new BadRequestException('Tizimda kamida bitta faol admin qolishi kerak');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName?.trim(),
        lastName: dto.lastName?.trim(),
        role: dto.role,
        isActive: dto.isActive,
      },
      select: USER_FIELDS,
    });

    // Hisob o'chirilsa, barcha sessiyalari ham uziladi
    if (dto.isActive === false) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null }, data: { revokedAt: new Date() },
      });
    }
    if (dto.role && dto.role !== target.role) {
      await this.notifications.push({
        userId, type: 'ACCOUNT',
        title: 'Hisobingiz roli o’zgardi',
        body: `Yangi rol: ${dto.role}`,
      });
    }
    await this.audit('ADMIN_USER_UPDATED', actor, userId, {
      role: dto.role ?? null, isActive: dto.isActive ?? null,
    });
    return user;
  }

  /** Parolni tiklash: yangi parol beriladi va barcha sessiyalar uziladi. */
  async resetPassword(actor: Actor, userId: string, dto: ResetPasswordDto) {
    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new NotFoundException('Topilmadi');

    const policyError = checkPassword(dto.newPassword, {
      firstName: target.firstName, lastName: target.lastName, email: target.email ?? undefined,
    });
    if (policyError) throw new BadRequestException(policyError);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: await hashPassword(dto.newPassword), failedLoginCount: 0, lockedUntil: null },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null }, data: { revokedAt: new Date() },
      }),
    ]);
    await this.audit('ADMIN_PASSWORD_RESET', actor, userId);
    await this.notifications.push({
      userId, type: 'ACCOUNT',
      title: 'Parolingiz administrator tomonidan tiklandi',
      body: 'Agar bu siz so’ramagan bo’lsangiz, darhol ustoz bilan bog’laning.',
    });
    return { ok: true };
  }

  /** 2FA ni o'chirish: foydalanuvchi telefonini yo'qotgan holat uchun. */
  async clearTwoFactor(actor: Actor, userId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new NotFoundException('Topilmadi');
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorLastStep: null },
      }),
      this.prisma.recoveryCode.deleteMany({ where: { userId } }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null }, data: { revokedAt: new Date() },
      }),
    ]);
    await this.audit('ADMIN_2FA_CLEARED', actor, userId);
    return { ok: true };
  }

  /** Qulfni ochish (5 marta xato parol kiritilgandan keyin). */
  async unlock(actor: Actor, userId: string) {
    await this.prisma.user.update({
      where: { id: userId }, data: { failedLoginCount: 0, lockedUntil: null },
    });
    await this.audit('ADMIN_USER_UNLOCKED', actor, userId);
    return { ok: true };
  }

  /**
   * Bitta foydalanuvchining kirish tarixi: qachon, qaysi qurilmadan,
   * qaysi IP dan. Admin shuni so'ragan edi.
   *
   * PAROL BU YERDA YO'Q va bo'lishi ham mumkin emas: parollar Argon2id
   * bilan xeshlangan, ya'ni ularni hech kim — admin ham, biz ham —
   * qaytara olmaydi. Bu kamchilik emas, himoya: baza sizib ketsa
   * o'quvchilarning parollari ko'chaga chiqmaydi (odamlar ko'pincha
   * bir xil parolni Telegram va pochtada ham ishlatadi).
   * Nazorat uchun kerak bo'lgani — kim, qachon, qayerdan kirgani va
   * parolni majburan tiklash tugmasi — hammasi bor.
   */
  async userActivity(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        role: true, isActive: true, twoFactorEnabled: true,
        createdAt: true, lastLoginAt: true, lockedUntil: true, failedLoginCount: true,
      },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const [sessions, events] = await Promise.all([
      this.prisma.refreshToken.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
        // tokenHash SO'RALMAYDI: u sessiyaning kaliti, admin uni ko'rmasligi kerak
        select: { id: true, userAgent: true, ip: true, createdAt: true, expiresAt: true, revokedAt: true },
      }),
      this.prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, action: true, ip: true, createdAt: true, meta: true },
      }),
    ]);
    return { user, sessions, events };
  }

  /** Foydalanuvchini barcha qurilmalardan chiqarish. */
  async revokeSessions(actor: Actor, userId: string) {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit('ADMIN_SESSIONS_REVOKED', actor, userId);
    return { revoked: count };
  }

  // ───────── Audit jurnali ─────────
  async auditLog(skip = 0, take = 50) {
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip, take: Math.min(take, 100),
        include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total };
  }
}

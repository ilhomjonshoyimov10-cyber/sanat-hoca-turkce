import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { hashPassword, verifyPassword } from '../auth/argon.js';
import { checkPassword } from '../auth/password.policy.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ChangePasswordDto, UpdateProfileDto } from './users.dto.js';

/** Profilda ko'rsatiladigan maydonlar. Parol xeshi va 2FA siri hech qachon chiqmaydi. */
const PUBLIC_FIELDS = {
  id: true, email: true, phone: true, firstName: true, lastName: true, role: true,
  bio: true, timezone: true, avatarUrl: true, birthDate: true, locale: true,
  twoFactorEnabled: true, leaderboardOptIn: true, createdAt: true, lastLoginAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  me(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId }, select: PUBLIC_FIELDS });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Rol, email va telefon bu yerdan o'zgarmaydi: ularni faqat admin o'zgartiradi.
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName?.trim(),
        lastName: dto.lastName?.trim(),
        bio: dto.bio?.trim() || null,
        timezone: dto.timezone,
      },
      select: PUBLIC_FIELDS,
    });
  }

  /**
   * Profil rasmini saqlash.
   *
   * Fayl bu yerdan o'tmaydi — brauzer uni to'g'ridan-to'g'ri omborga
   * yuklaydi (kitoblardagi bilan bir xil mantiq). Bu yerda faqat
   * manzil saqlanadi, va u albatta bizning omborimizdan bo'lishi
   * DTO darajasida tekshirilgan.
   */
  async setAvatar(userId: string, url: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
      select: PUBLIC_FIELDS,
    });
  }

  /** Rasmni olib tashlash — profil yana bosh harflar bilan ko'rinadi. */
  async removeAvatar(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      select: PUBLIC_FIELDS,
    });
  }

  /**
   * Foydalanuvchining ochiq sessiyalari: qachon, qaysi qurilmadan.
   *
   * Foydalanuvchining o'zi ham ko'rishi kerak — begona kirishni
   * birinchi bo'lib egasi sezadi.
   */
  async sessions(userId: string) {
    const rows = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, userAgent: true, ip: true, createdAt: true, expiresAt: true },
    });
    return rows;
  }

  /** Boshqa barcha qurilmalardan chiqish. */
  async revokeOtherSessions(userId: string, ip?: string) {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.prisma.auditLog
      .create({ data: { action: 'SESSIONS_REVOKED', userId, ip, meta: { count } } })
      .catch(() => undefined);
    return { revoked: count };
  }

  /**
   * Parolni almashtirish. Joriy parol tekshiriladi, yangi parol siyosatdan
   * o'tadi, so'ng BARCHA refresh tokenlar bekor qilinadi — parol o'g'irlangan
   * bo'lsa, o'g'ri sessiyasi ham uziladi.
   */
  async changePassword(userId: string, dto: ChangePasswordDto, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const ok = await verifyPassword(user.passwordHash, dto.currentPassword);
    if (!ok) {
      await this.prisma.auditLog
        .create({ data: { action: 'PASSWORD_CHANGE_FAILED', userId, ip } })
        .catch(() => undefined);
      throw new BadRequestException('Joriy parol noto’g’ri');
    }

    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException('Yangi parol eskisidan farq qilishi kerak');
    }
    const policyError = checkPassword(dto.newPassword, {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email ?? undefined,
    });
    if (policyError) throw new BadRequestException(policyError);

    const passwordHash = await hashPassword(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.auditLog.create({ data: { action: 'PASSWORD_CHANGED', userId, ip } }),
    ]);
    return { ok: true };
  }
}

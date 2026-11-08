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

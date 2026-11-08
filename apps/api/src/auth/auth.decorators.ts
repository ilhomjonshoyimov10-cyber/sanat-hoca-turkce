import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Role } from '@prisma/client';

export const IS_PUBLIC_KEY = 'isPublic';
/** Standart holatda HAMMA yo'l yopiq. Ochiq qilish uchun @Public() yozing. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
/** Masalan: @Roles('TEACHER', 'ADMIN') */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const ALLOW_WITHOUT_2FA_KEY = 'allowWithout2fa';
/** Ustoz/admin 2FA ni yoqmagan bo'lsa ham kira oladigan yo'llar (2FA ni yoqish uchun kerak). */
export const AllowWithout2fa = () => SetMetadata(ALLOW_WITHOUT_2FA_KEY, true);

export interface AuthUser {
  id: string;
  role: Role;
  twoFactorEnabled: boolean;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);

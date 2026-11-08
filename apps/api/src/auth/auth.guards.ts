import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Role } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { ALLOW_WITHOUT_2FA_KEY, AuthUser, IS_PUBLIC_KEY, ROLES_KEY } from './auth.decorators.js';
import { ACCESS_COOKIE } from './cookies.js';

type AuthedRequest = Request & { user?: AuthUser };

/**
 * Global guard: @Public() bo'lmagan har bir yo'l uchun kirish talab qilinadi.
 * Har so'rovda foydalanuvchi bazadan tekshiriladi, shuning uchun bloklangan
 * yoki roli o'zgargan foydalanuvchi darhol ta'sir ko'radi (token 15 daqiqa
 * yashasa ham).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const token: string | undefined = req.cookies?.[ACCESS_COOKIE];
    if (!token) throw new UnauthorizedException();

    let userId: string;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        algorithms: ['HS256'],
      });
      userId = payload.sub;
    } catch {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true, twoFactorEnabled: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException();

    req.user = { id: user.id, role: user.role, twoFactorEnabled: user.twoFactorEnabled };
    return true;
  }
}

/**
 * Ustoz va admin uchun 2FA majburiy. Yoqilmaguncha server ularni faqat 2FA sozlash
 * yo'llariga kiritadi. Bu frontend'ga emas, serverga tayanadi: API'ni to'g'ridan-to'g'ri
 * chaqirib 2FA'ni chetlab o'tib bo'lmaydi.
 */
@Injectable()
export class MfaGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
    if (!user) return true; // ochiq yo'llar
    const mustHave2fa = user.role === 'TEACHER' || user.role === 'ADMIN';
    if (!mustHave2fa || user.twoFactorEnabled) return true;

    const allowed = this.reflector.getAllAndOverride<boolean>(ALLOW_WITHOUT_2FA_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (allowed) return true;
    throw new ForbiddenException({
      statusCode: 403,
      code: '2FA_SETUP_REQUIRED',
      message: 'Hisobingiz himoyasi uchun avval ikki bosqichli tasdiqlashni yoqing',
    });
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!roles?.length) return true;
    const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
    return !!user && roles.includes(user.role);
  }
}

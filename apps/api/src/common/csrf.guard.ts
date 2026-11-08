import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * Cookie asosidagi autentifikatsiya uchun CSRF himoyasi.
 * Qiymat o'zgartiradigan (POST/PUT/PATCH/DELETE) so'rovlarda:
 *  1) Origin sarlavhasi bo'lsa, u bizning frontend manzilimiz bo'lishi shart
 *  2) "X-Requested-With: XMLHttpRequest" sarlavhasi shart (boshqa saytdan
 *     bu sarlavhani CORS ruxsatisiz yuborib bo'lmaydi)
 * Qo'shimcha: cookie'lar SameSite bilan o'rnatiladi.
 * Eslatma: Payme/Click webhook'lari uchun keyinroq alohida istisno qo'shiladi.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;

    const origin = req.headers.origin;
    if (origin && origin !== this.config.get<string>('WEB_URL')) {
      throw new ForbiddenException("Ruxsat yo'q");
    }
    if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
      throw new ForbiddenException("Ruxsat yo'q");
    }
    return true;
  }
}

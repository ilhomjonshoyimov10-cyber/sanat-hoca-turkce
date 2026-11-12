import { Body, Controller, Delete, ForbiddenException, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { timingSafeEqual } from 'node:crypto';
import { AllowWithout2fa, CurrentUser, Public, SkipCsrf } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfirmCodeDto } from './verify.dto.js';
import { readVerifyConfig } from './verify.provider.js';
import { VerifyService } from './verify.service.js';

@Controller('verify')
export class VerifyController {
  constructor(
    private readonly verify: VerifyService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Ustoz/admin 2FA ni yoqmagan bo'lsa ham email tasdiqlashi mumkin:
   * ikkisi bir-biridan mustaqil va foydalanuvchini qulflab qo'ymaymiz.
   */
  @AllowWithout2fa()
  @Get('status')
  async status(@CurrentUser() u: AuthUser) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: u.id },
      select: { email: true, emailVerifiedAt: true, telegramVerifiedAt: true },
    });
    return this.verify.status(user);
  }

  // Daqiqalik tezlik chegarasi: xizmatdagi soatlik chegaradan oldingi qatlam.
  @Throttle({ default: { limit: 3, ttl: 60 * 1000 } })
  @AllowWithout2fa()
  @Post('email/send')
  sendEmail(@CurrentUser() u: AuthUser) {
    return this.verify.sendEmail(u.id);
  }

  // Kod topishga urinishlar ham cheklangan (xizmatda 5 urinish, bu yerda tezlik)
  @Throttle({ default: { limit: 10, ttl: 60 * 1000 } })
  @AllowWithout2fa()
  @Post('email/confirm')
  confirmEmail(@CurrentUser() u: AuthUser, @Body() dto: ConfirmCodeDto) {
    return this.verify.confirmEmail(u.id, dto.code);
  }

  @Throttle({ default: { limit: 3, ttl: 60 * 1000 } })
  @AllowWithout2fa()
  @Post('telegram/link')
  telegramStart(@CurrentUser() u: AuthUser) {
    return this.verify.telegramStart(u.id);
  }

  @AllowWithout2fa()
  @Delete('telegram')
  telegramUnlink(@CurrentUser() u: AuthUser) {
    return this.verify.telegramUnlink(u.id);
  }

  /**
   * Telegram webhook.
   *
   * Himoya: manzildagi maxfiy qism. Uni faqat biz va Telegram bilamiz
   * (setWebhook da shu manzilni beramiz). Solishtirish doimiy vaqtli —
   * sekin-asta harf-harf topib bo'lmaydi.
   *
   * CSRF o'tkazib yuborilgan, chunki Telegram "X-Requested-With" yubormaydi.
   * Yo'l ochiq (@Public), chunki Telegram bizning cookie'mizga ega emas.
   */
  @Public()
  @SkipCsrf()
  @Throttle({ default: { limit: 60, ttl: 60 * 1000 } })
  @Post('telegram/webhook/:secret')
  telegramWebhook(@Param('secret') secret: string, @Body() body: Record<string, unknown>) {
    const expected = readVerifyConfig().telegramWebhookSecret;
    // Maxfiy qism sozlanmagan bo'lsa, yo'l butunlay yopiq bo'lishi kerak:
    // bo'sh satrni "to'g'ri" deb hisoblash xavfli bo'lardi.
    if (!expected) throw new ForbiddenException();
    const a = Buffer.from(secret);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new ForbiddenException();
    return this.verify.telegramWebhook(body);
  }
}

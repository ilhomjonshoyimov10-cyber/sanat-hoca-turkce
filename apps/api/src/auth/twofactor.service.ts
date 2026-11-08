import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { verifyPassword } from './argon.js';
import { sha256 } from './auth.utils.js';
import { AuthService, type ReqMeta } from './auth.service.js';
import { decrypt, encrypt } from './crypto.js';
import {
  generateRecoveryCode, generateSecret, normalizeRecoveryCode, verifyTotp,
} from './totp.js';

const ISSUER = 'Sanat Hoca Türkçe';
const RECOVERY_CODES_COUNT = 8;
const PURPOSE = 'totp-secret';

@Injectable()
export class TwoFactorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private get key() {
    return this.config.getOrThrow<string>('TOTP_ENCRYPTION_KEY');
  }

  /** 1-qadam: sir yaratiladi (hali yoqilmagan). Foydalanuvchi uni ilovaga qo'shadi. */
  async setup(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.twoFactorEnabled) throw new ConflictException('2FA allaqachon yoqilgan');

    const secret = generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: encrypt(secret, this.key, PURPOSE), twoFactorLastStep: null },
    });

    const label = encodeURIComponent(`${ISSUER}:${user.email ?? user.phone ?? user.id}`);
    const otpauthUrl =
      `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(ISSUER)}&algorithm=SHA1&digits=6&period=30`;
    return { secret, otpauthUrl };
  }

  /** 2-qadam: ilovadagi kodni kiritib tasdiqlaydi. Tiklash kodlari FAQAT shu yerda bir marta ko'rsatiladi. */
  async enable(userId: string, code: string, meta: ReqMeta) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.twoFactorEnabled) throw new ConflictException('2FA allaqachon yoqilgan');
    if (!user.twoFactorSecret) throw new BadRequestException('Avval 2FA sozlashni boshlang');

    const secret = decrypt(user.twoFactorSecret, this.key, PURPOSE);
    const step = secret ? verifyTotp(secret, code, Date.now()) : null;
    if (step === null) throw new BadRequestException("Kod noto'g'ri. Ilovadagi yangi kodni kiriting");

    const codes = Array.from({ length: RECOVERY_CODES_COUNT }, generateRecoveryCode);
    await this.prisma.recoveryCode.deleteMany({ where: { userId } });
    for (const c of codes) {
      await this.prisma.recoveryCode.create({
        data: { userId, codeHash: sha256(normalizeRecoveryCode(c)) },
      });
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true, twoFactorLastStep: step },
    });
    await this.auth.audit('2FA_ENABLED', userId, meta);
    return { recoveryCodes: codes };
  }

  /** Kirishning 2-bosqichi: parol o'tgandan keyin kod (yoki tiklash kodi) bilan seans olinadi. */
  async loginVerify(challenge: string, code: string, meta: ReqMeta) {
    const userId = await this.auth.verifyChallenge(challenge);
    if (!userId) throw new UnauthorizedException('Seans muddati tugadi. Qaytadan kiring');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException();
    }
    await this.auth.assertNotLocked(user, meta);

    if (await this.checkCode(user, code)) return this.auth.completeLogin(user, meta);

    await this.auth.registerFailure(userId, meta, 'bad_2fa_code');
    throw new UnauthorizedException("Kod noto'g'ri");
  }

  /** Faqat o'quvchi/ota-ona o'chira oladi. Ustoz va adminda 2FA doimiy majburiy. */
  async disable(userId: string, password: string, code: string, meta: ReqMeta) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.role === 'TEACHER' || user.role === 'ADMIN') {
      throw new ForbiddenException("Ustoz va administrator uchun 2FA ni o'chirib bo'lmaydi");
    }
    if (!user.twoFactorEnabled) throw new BadRequestException('2FA yoqilmagan');
    await this.auth.assertNotLocked(user, meta);

    const ok = (await verifyPassword(user.passwordHash, password)) && (await this.checkCode(user, code));
    if (!ok) {
      await this.auth.registerFailure(userId, meta, 'bad_2fa_disable');
      throw new UnauthorizedException("Parol yoki kod noto'g'ri");
    }
    await this.prisma.recoveryCode.deleteMany({ where: { userId } });
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorLastStep: null },
    });
    await this.auth.audit('2FA_DISABLED', userId, meta);
    return { ok: true };
  }

  /** TOTP (qayta ishlatilmaydi) yoki bir martalik tiklash kodi. */
  private async checkCode(
    user: { id: string; twoFactorSecret: string | null; twoFactorLastStep: number | null },
    code: string,
  ): Promise<boolean> {
    const trimmed = code.trim();
    if (/^\d{6}$/.test(trimmed)) {
      const secret = user.twoFactorSecret ? decrypt(user.twoFactorSecret, this.key, PURPOSE) : null;
      const step = secret ? verifyTotp(secret, trimmed, Date.now(), user.twoFactorLastStep) : null;
      if (step === null) return false;
      await this.prisma.user.update({ where: { id: user.id }, data: { twoFactorLastStep: step } });
      return true;
    }
    // Tiklash kodi: bir marta ishlaydi. updateMany "usedAt: null" sharti bilan poygadan himoya qiladi.
    const res = await this.prisma.recoveryCode.updateMany({
      where: { userId: user.id, codeHash: sha256(normalizeRecoveryCode(trimmed)), usedAt: null },
      data: { usedAt: new Date() },
    });
    return res.count === 1;
  }
}

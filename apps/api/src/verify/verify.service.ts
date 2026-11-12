import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  emailEnabled,
  readVerifyConfig,
  sendEmailCode,
  sendTelegramMessage,
  telegramEnabled,
  telegramLink,
  VerifySendError,
  type VerifyConfig,
} from './verify.provider.js';

/** Kod qancha yashaydi. Qisqa muddat — o'g'irlangan kod tez kuyadi. */
const TTL_MS = 10 * 60 * 1000;
/** Necha marta xato kiritish mumkin. Keyin kod kuyadi (brute force himoyasi). */
const MAX_ATTEMPTS = 5;
/** Bir soat ichida necha marta kod so'rash mumkin. */
const MAX_PER_HOUR = 3;
/** Ketma-ket so'rovlar orasidagi eng kichik vaqt. */
const RESEND_COOLDOWN_MS = 60 * 1000;

@Injectable()
export class VerifyService {
  private readonly log = new Logger(VerifyService.name);
  private readonly config: VerifyConfig = readVerifyConfig();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kodni XESHLAB saqlaymiz, lekin "pepper" bilan.
   *
   * Nega shunchaki SHA-256 emas: kod 6 raqamli, ya'ni million variant.
   * Baza o'g'irlansa oddiy xeshni bir soniyada ochib bo'ladi. Serverdagi
   * maxfiy kalit bilan HMAC qilsak, baza yetarli bo'lmaydi — kalit ham kerak.
   *
   * Nega argon2 emas: kod qisqa umr ko'radi va urinishlar soni cheklangan,
   * shuning uchun sekin xesh foyda bermaydi, faqat serverni band qiladi.
   */
  private hash(code: string): string {
    const key = process.env.TOTP_ENCRYPTION_KEY ?? '';
    return createHmac('sha256', `${key}:verification-code`).update(code).digest('hex');
  }

  private matches(code: string, storedHash: string): boolean {
    const a = Buffer.from(this.hash(code), 'hex');
    const b = Buffer.from(storedHash, 'hex');
    if (a.length !== b.length) return false;
    // Vaqt bo'yicha hujumni oldini olish uchun doimiy vaqtli solishtirish
    return timingSafeEqual(a, b);
  }

  /** 6 raqamli kod. Math.random EMAS — kriptografik generator. */
  private newCode(): string {
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }

  status(user: { email: string | null; emailVerifiedAt: Date | null; telegramVerifiedAt: Date | null }) {
    return {
      email: {
        available: emailEnabled(this.config),
        address: user.email,
        verified: Boolean(user.emailVerifiedAt),
      },
      telegram: {
        available: telegramEnabled(this.config),
        verified: Boolean(user.telegramVerifiedAt),
      },
      // Ochiq aytamiz: telefon tasdiqlanmaydi.
      phone: {
        available: false,
        note: "Telefon raqami avtomatik tasdiqlanmaydi — ustoz qo'ng'iroq qilib tekshiradi",
      },
    };
  }

  /** So'rov chastotasini tekshiradi. Xato bo'lsa tushunarli xabar beradi. */
  private async assertNotTooOften(userId: string, channel: 'EMAIL' | 'TELEGRAM') {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await this.prisma.verificationCode.findMany({
      where: { userId, channel, createdAt: { gt: hourAgo } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    if (recent.length >= MAX_PER_HOUR) {
      throw new BadRequestException({
        message: "Juda ko'p so'rov. Bir soatdan keyin qayta urinib ko'ring",
        code: 'TOO_MANY',
      });
    }
    if (recent[0] && Date.now() - recent[0].createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - recent[0].createdAt.getTime())) / 1000);
      throw new BadRequestException({ message: `${wait} soniyadan keyin qayta so'rang`, code: 'COOLDOWN' });
    }
  }

  // ───────────────────────── Email ─────────────────────────

  async sendEmail(userId: string) {
    if (!emailEnabled(this.config)) {
      throw new ServiceUnavailableException({
        message: 'Email yuborish sozlanmagan. Administrator sozlashi kerak',
        code: 'EMAIL_DISABLED',
      });
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerifiedAt: true },
    });
    if (!user?.email) throw new BadRequestException("Hisobingizda email yo'q");
    if (user.emailVerifiedAt) return { alreadyVerified: true };

    await this.assertNotTooOften(userId, 'EMAIL');

    const code = this.newCode();
    await this.prisma.verificationCode.create({
      data: {
        userId,
        channel: 'EMAIL',
        target: user.email,
        codeHash: this.hash(code),
        expiresAt: new Date(Date.now() + TTL_MS),
      },
    });

    try {
      await sendEmailCode(this.config, user.email, code);
    } catch (error) {
      if (error instanceof VerifySendError) this.log.error(`Email ${error.status}: ${error.detail}`);
      else this.log.error(`Email yuborilmadi: ${String(error)}`);
      throw new ServiceUnavailableException({
        message: "Xat yuborilmadi. Birozdan keyin qayta urinib ko'ring",
        code: 'SEND_FAILED',
      });
    }
    return { sent: true, to: user.email, expiresInMinutes: TTL_MS / 60000 };
  }

  async confirmEmail(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerifiedAt: true },
    });
    if (!user?.email) throw new BadRequestException("Hisobingizda email yo'q");
    if (user.emailVerifiedAt) return { verified: true, alreadyVerified: true };

    const row = await this.prisma.verificationCode.findFirst({
      where: {
        userId,
        channel: 'EMAIL',
        usedAt: null,
        expiresAt: { gt: new Date() },
        // Email almashtirilgan bo'lsa, eski manzilga yuborilgan kod yaramaydi
        target: user.email,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, codeHash: true, attempts: true },
    });
    if (!row) {
      throw new BadRequestException({ message: "Kod topilmadi yoki muddati o'tgan. Yangi kod so'rang", code: 'NO_CODE' });
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException({ message: "Juda ko'p xato urinish. Yangi kod so'rang", code: 'BURNED' });
    }

    if (!this.matches(code, row.codeHash)) {
      await this.prisma.verificationCode.update({
        where: { id: row.id },
        data: { attempts: { increment: 1 } },
      });
      const left = MAX_ATTEMPTS - row.attempts - 1;
      throw new BadRequestException({
        message: left > 0 ? `Kod to'g'ri kelmadi. ${left} urinish qoldi` : "Urinishlar tugadi. Yangi kod so'rang",
        code: 'WRONG_CODE',
      });
    }

    await this.prisma.$transaction([
      this.prisma.verificationCode.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
      this.prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } }),
      // Shu foydalanuvchining qolgan email kodlarini ham kuydiramiz
      this.prisma.verificationCode.updateMany({
        where: { userId, channel: 'EMAIL', usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);
    return { verified: true };
  }

  // ───────────────────────── Telegram ─────────────────────────

  /**
   * Telegram bog'lash havolasini beradi.
   *
   * Oqim: foydalanuvchi havolani bosadi -> Telegram botga "/start <token>"
   * yuboradi -> bot webhook orqali bizga keladi -> chat id bog'lanadi.
   *
   * Token kodga o'xshab xeshlanadi: baza o'qilsa ham undan foydalanib
   * birovning hisobini bog'lab bo'lmaydi.
   */
  async telegramStart(userId: string) {
    if (!telegramEnabled(this.config)) {
      throw new ServiceUnavailableException({
        message: 'Telegram bot sozlanmagan. Administrator sozlashi kerak',
        code: 'TELEGRAM_DISABLED',
      });
    }
    await this.assertNotTooOften(userId, 'TELEGRAM');

    const token = randomBytes(24).toString('base64url');
    await this.prisma.verificationCode.create({
      data: {
        userId,
        channel: 'TELEGRAM',
        target: 'telegram',
        codeHash: this.hash(token),
        expiresAt: new Date(Date.now() + TTL_MS),
      },
    });
    return { link: telegramLink(this.config, token), expiresInMinutes: TTL_MS / 60000 };
  }

  /**
   * Telegram webhook. Faqat "/start <token>" xabarini qabul qiladi.
   *
   * DIQQAT: bu yo'l autentifikatsiyasiz (Telegram serveri chaqiradi),
   * shuning uchun himoya ikki qatlamli:
   *   1. Manzildagi maxfiy qism (faqat Telegram biladi) — kontrollerda
   *   2. Tokenning o'zi xeshlangan va bir martalik
   */
  async telegramWebhook(update: unknown): Promise<{ ok: true }> {
    const message = (update as { message?: { chat?: { id?: number }; text?: string } })?.message;
    const chatId = message?.chat?.id;
    const text = message?.text ?? '';
    if (!chatId || !text.startsWith('/start ')) return { ok: true };

    const token = text.slice('/start '.length).trim();
    if (!token) return { ok: true };

    const row = await this.prisma.verificationCode.findFirst({
      where: { channel: 'TELEGRAM', usedAt: null, expiresAt: { gt: new Date() }, codeHash: this.hash(token) },
      orderBy: { createdAt: 'desc' },
      select: { id: true, userId: true },
    });

    if (!row) {
      // Noto'g'ri yoki eskirgan token: foydalanuvchiga tushunarli javob,
      // lekin hech qanday ma'lumot ochmaymiz.
      await sendTelegramMessage(
        this.config,
        String(chatId),
        "Havola eskirgan yoki yaroqsiz. Saytdagi profil sahifasidan yangi havola oling.",
      ).catch(() => {});
      return { ok: true };
    }

    // Bu Telegram hisobi boshqa foydalanuvchiga bog'langan bo'lishi mumkin
    const taken = await this.prisma.user.findUnique({
      where: { telegramChatId: String(chatId) },
      select: { id: true },
    });
    if (taken && taken.id !== row.userId) {
      await sendTelegramMessage(
        this.config,
        String(chatId),
        'Bu Telegram hisobi boshqa foydalanuvchiga bog\'langan.',
      ).catch(() => {});
      return { ok: true };
    }

    await this.prisma.$transaction([
      this.prisma.verificationCode.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
      this.prisma.user.update({
        where: { id: row.userId },
        data: { telegramChatId: String(chatId), telegramVerifiedAt: new Date() },
      }),
    ]);

    await sendTelegramMessage(
      this.config,
      String(chatId),
      'Telegram hisobingiz bog\'landi. Endi dars va uy vazifasi haqida xabarlar shu yerga keladi.',
    ).catch(() => {});
    return { ok: true };
  }

  /** Bog'lanishni uzish. */
  async telegramUnlink(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { telegramChatId: null, telegramVerifiedAt: null },
    });
    return { ok: true };
  }
}

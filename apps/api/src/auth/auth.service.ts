import {
  BadRequestException, ConflictException, ForbiddenException, HttpException, HttpStatus,
  Injectable, UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role, type User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { hashPassword, needsRehash, verifyPassword } from './argon.js';
import { ACCESS_TTL_S, REFRESH_TTL_MS } from './cookies.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { calcAge, normalizeEmail, normalizePhone, randomToken, sha256 } from './auth.utils.js';
import { checkPassword } from './password.policy.js';

export interface ReqMeta {
  ip?: string;
  userAgent?: string;
}

const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60 * 1000;
// Ikki tab bir vaqtda refresh qilsa, bu oraliqda "qayta ishlatish" deb hisoblanmaydi
const REUSE_GRACE_MS = 10_000;
const INVALID_CREDENTIALS = "Login yoki parol noto'g'ri";

const isUniqueViolation = (e: unknown) =>
  typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2002';

@Injectable()
export class AuthService {
  private dummyHash: Promise<string> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ───────── Ro'yxatdan o'tish ─────────
  async register(dto: RegisterDto, meta: ReqMeta) {
    const email = dto.email ? normalizeEmail(dto.email) : undefined;
    const phone = dto.phone ? normalizePhone(dto.phone) : undefined;
    if (dto.phone && !phone) {
      throw new BadRequestException("Telefon raqam noto'g'ri. Namuna: +998901234567");
    }
    if (!email && !phone) {
      throw new BadRequestException('Email yoki telefon raqamingizni kiriting');
    }

    const birthDate = new Date(dto.birthDate);
    const age = calcAge(birthDate);
    if (Number.isNaN(age) || age < 5 || age > 100) {
      throw new BadRequestException("Tug'ilgan sana noto'g'ri");
    }

    const passwordError = checkPassword(dto.password, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email,
    });
    if (passwordError) throw new BadRequestException(passwordError);

    const passwordHash = await hashPassword(dto.password);

    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          email,
          phone,
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          birthDate,
          locale: dto.locale ?? 'UZ',
          role: Role.STUDENT, // rolni hech qachon foydalanuvchi tanlamaydi
          stats: { create: {} },
        },
      });
    } catch (e) {
      if (isUniqueViolation(e)) {
        throw new ConflictException('Bu email yoki telefon bilan hisob allaqachon mavjud');
      }
      throw e;
    }

    await this.audit('REGISTER', user.id, meta);
    const session = await this.issueSession(user.id, meta);
    return {
      user: this.publicUser(user),
      // 18 yoshgacha bo'lganlar ota-ona roziligisiz guruhga qo'shilmaydi (keyingi bosqichda)
      needsParentConsent: age < 18 && !user.parentConsent,
      ...session,
    };
  }

  // ───────── Kirish ─────────
  async login(dto: LoginDto, meta: ReqMeta) {
    const identifier = dto.identifier.trim();
    const where = identifier.includes('@')
      ? { email: normalizeEmail(identifier) }
      : { phone: normalizePhone(identifier) ?? '__invalid__' };

    const user = await this.prisma.user.findUnique({ where });

    if (!user) {
      // Vaqt farqi orqali "bunday foydalanuvchi yo'q" ekanini bilib bo'lmasligi uchun
      // soxta xesh bilan ham xuddi shuncha vaqt sarflanadi.
      await verifyPassword(await this.getDummyHash(), dto.password);
      await this.audit('LOGIN_FAILED', null, meta, { reason: 'unknown_user' });
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.assertNotLocked(user, meta);

    const valid = await verifyPassword(user.passwordHash, dto.password);
    if (!valid) {
      await this.registerFailure(user.id, meta, 'bad_password');
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (!user.isActive) throw new ForbiddenException("Hisob o'chirilgan. Ustoz bilan bog'laning");

    // 2FA yoqilgan bo'lsa: parol to'g'ri, lekin seans hali berilmaydi.
    // Hisoblagichlar ham tozalanmaydi, shuning uchun kodni topishga urinish ham bloklanadi.
    if (user.twoFactorEnabled) {
      await this.audit('LOGIN_2FA_REQUIRED', user.id, meta);
      return { twoFactorRequired: true as const, challenge: await this.signChallenge(user.id) };
    }

    return this.completeLogin(user, meta, dto.password);
  }

  /** Barcha tekshiruvlar o'tgach: hisoblagichlarni tozalab, seans beradi. */
  async completeLogin(user: User, meta: ReqMeta, plainPassword?: string) {
    // Eski/zaif parametrlar bilan xeshlangan bo'lsa, yangilab qo'yamiz
    const rehash =
      plainPassword && needsRehash(user.passwordHash) ? { passwordHash: await hashPassword(plainPassword) } : {};
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date(), ...rehash },
    });

    await this.audit('LOGIN_SUCCESS', user.id, meta);
    const session = await this.issueSession(user.id, meta);
    return {
      twoFactorRequired: false as const,
      user: this.publicUser(user),
      // Ustoz va admin 2FA ni yoqmaguncha serverdagi MfaGuard boshqa yo'llarni yopib qo'yadi
      mustSetup2fa: (user.role === Role.TEACHER || user.role === Role.ADMIN) && !user.twoFactorEnabled,
      ...session,
    };
  }

  /** Noto'g'ri parol yoki 2FA kodi: hisoblagichni oshiradi, 5 tadan keyin hisobni bloklaydi. */
  async registerFailure(userId: string, meta: ReqMeta, reason: string) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: { increment: 1 } },
      select: { failedLoginCount: true },
    });
    if (updated.failedLoginCount >= MAX_FAILED_LOGINS) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { failedLoginCount: 0, lockedUntil: new Date(Date.now() + LOCK_MS) },
      });
      await this.audit('ACCOUNT_LOCKED', userId, meta);
    }
    await this.audit('LOGIN_FAILED', userId, meta, { reason });
  }

  async assertNotLocked(user: { id: string; lockedUntil: Date | null }, meta: ReqMeta) {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.audit('LOGIN_BLOCKED', user.id, meta);
      throw new HttpException(
        "Juda ko'p noto'g'ri urinish. 15 daqiqadan keyin qayta urinib ko'ring",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  // 2FA bosqichi uchun qisqa muddatli "chipta": faqat 2FA tekshiruvida ishlaydi, seans emas.
  private challengeSecret() {
    return `${this.config.getOrThrow<string>('JWT_ACCESS_SECRET')}:2fa-challenge`;
  }
  signChallenge(userId: string) {
    return this.jwt.signAsync(
      { sub: userId, purpose: '2fa' },
      { secret: this.challengeSecret(), algorithm: 'HS256', expiresIn: 300 },
    );
  }
  async verifyChallenge(token: string): Promise<string | null> {
    try {
      const p = await this.jwt.verifyAsync<{ sub: string; purpose: string }>(token, {
        secret: this.challengeSecret(),
        algorithms: ['HS256'],
      });
      return p.purpose === '2fa' ? p.sub : null;
    } catch {
      return null;
    }
  }

  // ───────── Tokenni yangilash (rotation + qayta ishlatishni aniqlash) ─────────
  async refresh(rawToken: string | undefined, meta: ReqMeta) {
    if (!rawToken) throw new UnauthorizedException();

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(rawToken) },
      include: { user: { select: { id: true, isActive: true } } },
    });
    if (!stored) throw new UnauthorizedException();

    if (stored.revokedAt) {
      // Allaqachon almashtirilgan token qayta ishlatilmoqda: o'g'irlangan bo'lishi mumkin.
      if (Date.now() - stored.revokedAt.getTime() > REUSE_GRACE_MS) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: stored.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        await this.audit('REFRESH_REUSE_DETECTED', stored.userId, meta);
      }
      throw new UnauthorizedException();
    }
    if (stored.expiresAt <= new Date() || !stored.user.isActive) throw new UnauthorizedException();

    const newRaw = randomToken();
    const rotated = await this.prisma.$transaction(async (tx) => {
      // Faqat bitta so'rov "g'olib" bo'ladi (poyga holatidan himoya)
      const res = await tx.refreshToken.updateMany({
        where: { id: stored.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (res.count === 0) return false;
      await tx.refreshToken.create({
        data: {
          userId: stored.userId,
          tokenHash: sha256(newRaw),
          userAgent: meta.userAgent,
          ip: meta.ip,
          expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        },
      });
      return true;
    });
    if (!rotated) throw new UnauthorizedException();

    return { accessToken: await this.signAccess(stored.userId), refreshToken: newRaw };
  }

  // ───────── Chiqish ─────────
  async logout(rawToken: string | undefined, meta: ReqMeta) {
    if (!rawToken) return;
    const res = await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (res.count > 0) {
      const row = await this.prisma.refreshToken.findUnique({
        where: { tokenHash: sha256(rawToken) },
        select: { userId: true },
      });
      await this.audit('LOGOUT', row?.userId ?? null, meta);
    }
  }

  // ───────── Profil ─────────
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.publicUser(user);
  }

  // ───────── Ichki yordamchilar ─────────
  async issueSession(userId: string, meta: ReqMeta) {
    const refreshToken = randomToken();
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: sha256(refreshToken),
        userAgent: meta.userAgent,
        ip: meta.ip,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    });
    return { accessToken: await this.signAccess(userId), refreshToken };
  }

  private signAccess(userId: string) {
    // Tokenda faqat foydalanuvchi ID si. Rol har so'rovda bazadan olinadi.
    return this.jwt.signAsync(
      { sub: userId },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        algorithm: 'HS256',
        expiresIn: ACCESS_TTL_S,
      },
    );
  }

  private getDummyHash() {
    this.dummyHash ??= hashPassword(randomToken());
    return this.dummyHash;
  }

  /** Javobga parol xeshi, 2FA kaliti kabi maxfiy maydonlar HECH QACHON chiqmaydi. */
  publicUser(u: {
    id: string; email: string | null; phone: string | null; firstName: string; lastName: string;
    role: Role; locale: string; avatarUrl: string | null; twoFactorEnabled: boolean;
  }) {
    return {
      id: u.id, email: u.email, phone: u.phone, firstName: u.firstName, lastName: u.lastName,
      role: u.role, locale: u.locale, avatarUrl: u.avatarUrl, twoFactorEnabled: u.twoFactorEnabled,
    };
  }

  async audit(action: string, userId: string | null, meta: ReqMeta, extra?: Prisma.InputJsonValue) {
    // Jurnal yozilmasa ham asosiy jarayon to'xtamasin
    await this.prisma.auditLog
      .create({
        data: { action, userId, ip: meta.ip, meta: extra ?? { userAgent: meta.userAgent ?? null } },
      })
      .catch(() => undefined);
  }
}

import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AllowWithout2fa, CurrentUser, Public } from './auth.decorators.js';
import type { AuthUser } from './auth.decorators.js';
import { AuthService } from './auth.service.js';
import type { ReqMeta } from './auth.service.js';
import { accessCookie, ACCESS_COOKIE, REFRESH_COOKIE, REFRESH_PATH, refreshCookie } from './cookies.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { CodeDto, DisableTwoFactorDto, TwoFactorLoginDto } from './dto/twofactor.dto.js';
import { TwoFactorService } from './twofactor.service.js';

const meta = (req: Request): ReqMeta => ({
  ip: req.ip,
  userAgent: req.headers['user-agent']?.slice(0, 255),
});

// Eslatma: O'zbekistonda ko'p provayderlar CGNAT ishlatadi (ko'p odam bitta IP'da),
// shuning uchun IP bo'yicha limit juda qattiq bo'lmasin. Asosiy himoya: hisob bloklash.
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly twoFactor: TwoFactorService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60 * 60 * 1000 } }) // soatiga 20 ta
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, ...body } = await this.auth.register(dto, meta(req));
    this.setCookies(res, accessToken, refreshToken);
    return body;
  }

  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60 * 1000 } }) // daqiqasiga 10 ta
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto, meta(req));
    if (result.twoFactorRequired) return result; // seans hali yo'q: 2-bosqich kerak
    const { accessToken, refreshToken, ...body } = result;
    this.setCookies(res, accessToken, refreshToken);
    return body;
  }

  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60 * 1000 } })
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const { accessToken, refreshToken } = await this.auth.refresh(req.cookies?.[REFRESH_COOKIE], meta(req));
      this.setCookies(res, accessToken, refreshToken);
      return { ok: true };
    } catch (e) {
      this.clearCookies(res);
      throw e;
    }
  }

  @Public()
  @HttpCode(200)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE], meta(req));
    this.clearCookies(res);
    return { ok: true };
  }

  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60 * 1000 } })
  @Post('2fa/login')
  async twoFactorLogin(@Body() dto: TwoFactorLoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, ...body } = await this.twoFactor.loginVerify(dto.challenge, dto.code, meta(req));
    this.setCookies(res, accessToken, refreshToken);
    return body;
  }

  @AllowWithout2fa()
  @HttpCode(200)
  @Post('2fa/setup')
  twoFactorSetup(@CurrentUser() user: AuthUser) {
    return this.twoFactor.setup(user.id);
  }

  @AllowWithout2fa()
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60 * 1000 } })
  @Post('2fa/enable')
  twoFactorEnable(@CurrentUser() user: AuthUser, @Body() dto: CodeDto, @Req() req: Request) {
    return this.twoFactor.enable(user.id, dto.code, meta(req));
  }

  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60 * 1000 } })
  @Post('2fa/disable')
  twoFactorDisable(@CurrentUser() user: AuthUser, @Body() dto: DisableTwoFactorDto, @Req() req: Request) {
    return this.twoFactor.disable(user.id, dto.password, dto.code, meta(req));
  }

  @AllowWithout2fa()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(ACCESS_COOKIE, accessToken, accessCookie());
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookie());
  }

  private clearCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE, { ...accessCookie(), maxAge: undefined });
    res.clearCookie(REFRESH_COOKIE, { ...refreshCookie(), path: REFRESH_PATH, maxAge: undefined });
  }
}

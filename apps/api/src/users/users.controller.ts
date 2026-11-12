import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import type { Request } from 'express';
import { AllowWithout2fa, CurrentUser } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { AVATAR_MAX_BYTES, AVATAR_TYPES, safeFileName } from './avatar.js';
import {
  AvatarTokenDto,
  ChangePasswordDto,
  SetAvatarDto,
  UpdateProfileDto,
} from './users.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me/profile')
  profile(@CurrentUser() u: AuthUser) {
    return this.users.me(u.id);
  }

  @Patch('me/profile')
  update(@CurrentUser() u: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(u.id, dto);
  }

  // ───────────── Profil rasmi ─────────────

  @Throttle({ default: { limit: 10, ttl: 60 * 1000 } })
  @Post('me/avatar-token')
  async avatarToken(@CurrentUser() u: AuthUser, @Body() dto: AvatarTokenDto) {
    const rwToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!rwToken) {
      throw new ServiceUnavailableException({
        message: 'Rasm saqlagichi sozlanmagan',
        code: 'BLOB_DISABLED',
      });
    }
    if (!AVATAR_TYPES.includes(dto.contentType)) {
      throw new ServiceUnavailableException({
        message: 'Faqat PNG, JPEG yoki WebP rasm yuklash mumkin',
        code: 'BAD_TYPE',
      });
    }

    // Yo'lni SERVER belgilaydi: foydalanuvchi birovning papkasiga yoza
    // olmaydi. Token aynan shu yo'lga qulflanadi, shuning uchun brauzer
    // ham shu yo'lni ishlatishi SHART — javobda qaytaramiz.
    const pathname = `avatar/${u.id}/${safeFileName(dto.fileName)}`;

    const token = await generateClientTokenFromReadWriteToken({
      token: rwToken,
      pathname,
      allowedContentTypes: [dto.contentType],
      maximumSizeInBytes: AVATAR_MAX_BYTES,
      addRandomSuffix: true,
      validUntil: Date.now() + 10 * 60 * 1000,
    });
    return { token, pathname, maxBytes: AVATAR_MAX_BYTES, allowedTypes: AVATAR_TYPES };
  }

  @Post('me/avatar')
  @HttpCode(200)
  setAvatar(@CurrentUser() u: AuthUser, @Body() dto: SetAvatarDto) {
    return this.users.setAvatar(u.id, dto.url);
  }

  @Delete('me/avatar')
  removeAvatar(@CurrentUser() u: AuthUser) {
    return this.users.removeAvatar(u.id);
  }

  // ───────────── Sessiyalar ─────────────

  @AllowWithout2fa()
  @Get('me/sessions')
  sessions(@CurrentUser() u: AuthUser) {
    return this.users.sessions(u.id);
  }

  @AllowWithout2fa()
  @Post('me/sessions/revoke-all')
  @HttpCode(200)
  revokeAll(@CurrentUser() u: AuthUser, @Req() req: Request) {
    return this.users.revokeOtherSessions(u.id, req.ip);
  }

  @Post('me/password')
  @HttpCode(200)
  password(@CurrentUser() u: AuthUser, @Body() dto: ChangePasswordDto, @Req() req: Request) {
    return this.users.changePassword(u.id, dto, req.ip);
  }
}

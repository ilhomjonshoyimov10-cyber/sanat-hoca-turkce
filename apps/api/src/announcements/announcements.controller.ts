import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { AVATAR_TYPES, safeFileName } from '../users/avatar.js';
import { AnnouncementsService } from './announcements.service.js';
import { CreateAnnouncementDto, ImageTokenDto, UpdateAnnouncementDto } from './announcements.dto.js';

/** Reklama rasmi profil rasmidan kattaroq bo'lishi mumkin. */
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  /** Har bir foydalanuvchining ekranida ko'rinadigan e'lonlar. */
  @Get()
  mine(@CurrentUser() u: AuthUser) {
    return this.service.forUser(u.id, u.role);
  }

  @Post(':id/dismiss')
  @HttpCode(200)
  dismiss(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.service.dismiss(u.id, id);
  }

  // ── Admin ──
  // E'lon butun saytda ko'rinadi, shuning uchun faqat admin yozadi.
  // Guruh ichidagi e'lon uchun ustozda alohida imkoniyat bor.

  @Roles('ADMIN')
  @Get('manage')
  list() {
    return this.service.list();
  }

  /**
   * Reklama rasmi uchun yuklash tokeni.
   *
   * Rasm API dan O'TMAYDI — brauzer uni to'g'ridan-to'g'ri omborga
   * yuklaydi. Yo'lni server belgilaydi va token aynan shunga qulflanadi.
   */
  @Roles('ADMIN')
  @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
  @Post('image-token')
  async imageToken(@CurrentUser() u: AuthUser, @Body() dto: ImageTokenDto) {
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

    const pathname = `elon/${u.id}/${safeFileName(dto.fileName)}`;
    const token = await generateClientTokenFromReadWriteToken({
      token: rwToken,
      pathname,
      allowedContentTypes: [dto.contentType],
      maximumSizeInBytes: IMAGE_MAX_BYTES,
      addRandomSuffix: true,
      validUntil: Date.now() + 10 * 60 * 1000,
    });
    return { token, pathname, maxBytes: IMAGE_MAX_BYTES, allowedTypes: AVATAR_TYPES };
  }

  @Roles('ADMIN')
  @Post()
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateAnnouncementDto) {
    return this.service.create(u.id, dto);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.service.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

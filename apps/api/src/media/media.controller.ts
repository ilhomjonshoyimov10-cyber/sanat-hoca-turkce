import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, Public, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { CreateMediaDto, UpdateMediaDto } from './media.dto.js';
import { MediaService } from './media.service.js';

@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /** Ochiq: kino va musiqa sahifasi mehmonlarga ham ko'rinadi. */
  @Public()
  @Get()
  list() {
    return this.media.list();
  }

  // ── Admin: faqat administrator qo'shadi (butun saytda ko'rinadi) ──

  @Roles('ADMIN')
  @Get('manage')
  manage() {
    return this.media.manage();
  }

  @Roles('ADMIN')
  @Throttle({ default: { limit: 30, ttl: 60 * 1000 } })
  @Post()
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateMediaDto) {
    return this.media.create(u.id, dto);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMediaDto) {
    return this.media.update(id, dto);
  }

  @Roles('ADMIN')
  @Post(':id/recheck')
  recheck(@Param('id') id: string) {
    return this.media.recheck(id);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.media.remove(id);
  }
}

import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { AnnouncementsService } from './announcements.service.js';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './announcements.dto.js';

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

import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.notifications.list(u.id);
  }

  /** Har daqiqada: o'qilmaganlar soni + yangilari. ?since=ISO vaqt */
  @Get('pulse')
  pulse(@CurrentUser() u: AuthUser, @Query('since') since?: string) {
    const d = since ? new Date(since) : undefined;
    return this.notifications.pulse(u.id, d && !Number.isNaN(d.getTime()) ? d : undefined);
  }

  @Patch('read-all')
  readAll(@CurrentUser() u: AuthUser) {
    return this.notifications.markAllRead(u.id);
  }

  @Patch(':id/read')
  read(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.notifications.markRead(u.id, id);
  }
}

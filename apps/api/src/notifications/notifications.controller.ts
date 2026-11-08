import { Controller, Get, Param, Patch } from '@nestjs/common';
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

  @Patch('read-all')
  readAll(@CurrentUser() u: AuthUser) {
    return this.notifications.markAllRead(u.id);
  }

  @Patch(':id/read')
  read(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.notifications.markRead(u.id, id);
  }
}

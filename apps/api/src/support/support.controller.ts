import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AllowWithout2fa, CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { CreateSupportDto, ReplyDto, SetStatusDto } from './support.dto.js';
import { SupportService } from './support.service.js';

@Controller('support')
export class SupportController {
  constructor(private readonly service: SupportService) {}

  // Admin ro'yxati yo'l parametridan OLDIN turishi kerak, aks holda
  // "manage" ":id" deb tushuniladi.
  @Roles('ADMIN', 'TEACHER')
  @Get('manage')
  list(@Query('status') status?: string) {
    return this.service.list(status);
  }

  @Get()
  mine(@CurrentUser() u: AuthUser) {
    return this.service.mine(u.id);
  }

  // Murojaat yozish — 2FA yoqilmagan ustoz ham yoza olsin: aynan
  // "kira olmayapman" degan murojaat ham shu yerdan keladi.
  @AllowWithout2fa()
  @Throttle({ default: { limit: 5, ttl: 10 * 60 * 1000 } })
  @Post()
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateSupportDto) {
    return this.service.create(u.id, dto);
  }

  @AllowWithout2fa()
  @Get(':id')
  one(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.service.one(u.id, u.role, id);
  }

  @AllowWithout2fa()
  @Throttle({ default: { limit: 20, ttl: 10 * 60 * 1000 } })
  @Post(':id/replies')
  reply(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: ReplyDto) {
    return this.service.reply(u.id, u.role, id, dto);
  }

  @Roles('ADMIN')
  @Patch(':id/status')
  setStatus(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: SetStatusDto) {
    return this.service.setStatus(u.id, id, dto);
  }
}

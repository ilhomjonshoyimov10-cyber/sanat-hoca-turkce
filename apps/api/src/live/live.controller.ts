import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { CreateLiveDto, UpdateLiveDto } from './live.dto.js';
import { LiveService } from './live.service.js';

@Controller('live')
export class LiveController {
  constructor(private readonly live: LiveService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.live.list(u.id, u.role);
  }

  @Roles('TEACHER', 'ADMIN')
  @Post()
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateLiveDto) {
    return this.live.create(u, dto);
  }

  @Roles('TEACHER', 'ADMIN')
  @Patch(':id')
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateLiveDto) {
    return this.live.update(id, u, dto);
  }

  @Roles('TEACHER', 'ADMIN')
  @Post(':id/start')
  @HttpCode(200)
  start(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.live.setStatus(id, u, 'LIVE');
  }

  @Roles('TEACHER', 'ADMIN')
  @Post(':id/end')
  @HttpCode(200)
  end(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.live.setStatus(id, u, 'ENDED');
  }

  @Roles('TEACHER', 'ADMIN')
  @Delete(':id')
  remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.live.remove(id, u);
  }

  /** Xona nomi faqat shu yerda beriladi — ro'yxatda emas. */
  @Post(':id/join')
  @HttpCode(200)
  join(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.live.join(id, u.id, u.role);
  }
}

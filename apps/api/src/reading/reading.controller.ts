import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import {
  CreateQuestionDto,
  CreateTextDto,
  GlossaryDto,
  ReadingQueryDto,
  SubmitDto,
  UpdateTextDto,
} from './reading.dto.js';
import { ReadingService } from './reading.service.js';

@Controller('reading')
export class ReadingController {
  constructor(private readonly reading: ReadingService) {}

  @Get()
  list(@CurrentUser() u: AuthUser, @Query() q: ReadingQueryDto) {
    return this.reading.list(u.id, u.role, q);
  }

  @Get(':slug')
  one(@CurrentUser() u: AuthUser, @Param('slug') slug: string) {
    return this.reading.one(u.id, u.role, slug);
  }

  @Throttle({ default: { limit: 30, ttl: 60 * 1000 } })
  @Post(':slug/submit')
  submit(@CurrentUser() u: AuthUser, @Param('slug') slug: string, @Body() dto: SubmitDto) {
    return this.reading.submit(u.id, u.role, slug, dto);
  }

  // ───────────── Ustoz boshqaruvi ─────────────

  @Roles('TEACHER', 'ADMIN')
  @Post('texts')
  create(@Body() dto: CreateTextDto) {
    return this.reading.create(dto);
  }

  @Roles('TEACHER', 'ADMIN')
  @Patch('texts/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTextDto) {
    return this.reading.update(id, dto);
  }

  @Roles('TEACHER', 'ADMIN')
  @Delete('texts/:id')
  remove(@Param('id') id: string) {
    return this.reading.remove(id);
  }

  @Roles('TEACHER', 'ADMIN')
  @Post('texts/:id/questions')
  addQuestion(@Param('id') id: string, @Body() dto: CreateQuestionDto) {
    return this.reading.addQuestion(id, dto);
  }

  @Roles('TEACHER', 'ADMIN')
  @Delete('questions/:qid')
  removeQuestion(@Param('qid') qid: string) {
    return this.reading.removeQuestion(qid);
  }

  @Roles('TEACHER', 'ADMIN')
  @Put('texts/:id/glossary')
  setGlossary(@Param('id') id: string, @Body() dto: GlossaryDto) {
    return this.reading.setGlossary(id, dto.items);
  }
}

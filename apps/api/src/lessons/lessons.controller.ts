import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { CreateLessonDto, UpdateLessonDto } from './lessons.dto.js';
import { LessonsService } from './lessons.service.js';

@Controller()
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}

  @Get('groups/:id/lessons')
  list(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.lessons.list(id, u);
  }

  @Roles('TEACHER', 'ADMIN')
  @Post('groups/:id/lessons')
  create(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: CreateLessonDto) {
    return this.lessons.create(id, u, dto);
  }

  @Roles('TEACHER', 'ADMIN')
  @Patch('lessons/:lid')
  update(@CurrentUser() u: AuthUser, @Param('lid') lid: string, @Body() dto: UpdateLessonDto) {
    return this.lessons.update(lid, u, dto);
  }

  @Roles('TEACHER', 'ADMIN')
  @Delete('lessons/:lid')
  cancel(@CurrentUser() u: AuthUser, @Param('lid') lid: string) {
    return this.lessons.cancel(lid, u);
  }

  /** Xona nomi faqat shu yerda beriladi */
  @Post('lessons/:lid/join')
  join(@CurrentUser() u: AuthUser, @Param('lid') lid: string) {
    return this.lessons.join(lid, u);
  }

  @Roles('TEACHER', 'ADMIN')
  @Post('lessons/:lid/end')
  end(@CurrentUser() u: AuthUser, @Param('lid') lid: string) {
    return this.lessons.end(lid, u);
  }
}

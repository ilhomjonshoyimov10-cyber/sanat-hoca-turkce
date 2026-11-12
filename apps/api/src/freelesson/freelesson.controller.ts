import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import {
  AssignVideoDto,
  CreateVideoDto,
  LeadMessageDto,
  LeadStatusDto,
  LinkLeadDto,
  UpdateVideoDto,
} from './freelesson.dto.js';
import { FreeLessonService } from './freelesson.service.js';

@Controller('free-lesson')
export class FreeLessonController {
  constructor(private readonly service: FreeLessonService) {}

  // ───────── Foydalanuvchi ─────────

  @Get('me')
  mine(@CurrentUser() u: AuthUser) {
    return this.service.mine(u.id);
  }

  @Post('me/videos/:videoId/watched')
  @HttpCode(200)
  watched(@CurrentUser() u: AuthUser, @Param('videoId') videoId: string) {
    return this.service.markWatched(u.id, videoId);
  }

  // ───────── Video kutubxonasi (admin) ─────────

  @Roles('TEACHER', 'ADMIN')
  @Get('videos')
  listVideos() {
    return this.service.listVideos();
  }

  @Roles('ADMIN')
  @Post('videos')
  createVideo(@CurrentUser() u: AuthUser, @Body() dto: CreateVideoDto) {
    return this.service.createVideo(u.id, dto);
  }

  @Roles('ADMIN')
  @Patch('videos/:id')
  updateVideo(@Param('id') id: string, @Body() dto: UpdateVideoDto) {
    return this.service.updateVideo(id, dto);
  }

  @Roles('ADMIN')
  @Delete('videos/:id')
  removeVideo(@Param('id') id: string) {
    return this.service.removeVideo(id);
  }

  // ───────── Arizalar (ustoz/admin) ─────────

  @Roles('TEACHER', 'ADMIN')
  @Get('leads')
  listLeads(@Query('status') status?: string) {
    return this.service.listLeads(status);
  }

  @Roles('TEACHER', 'ADMIN')
  @Get('leads/:id')
  thread(@Param('id') id: string) {
    return this.service.threadForStaff(id);
  }

  @Roles('TEACHER', 'ADMIN')
  @Patch('leads/:id/status')
  setStatus(@Param('id') id: string, @Body() dto: LeadStatusDto) {
    return this.service.setLeadStatus(id, dto);
  }

  @Roles('ADMIN')
  @Patch('leads/:id/link')
  link(@Param('id') id: string, @Body() dto: LinkLeadDto) {
    return this.service.linkLead(id, dto);
  }

  @Roles('TEACHER', 'ADMIN')
  @Post('leads/:id/videos')
  assign(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: AssignVideoDto) {
    return this.service.assignVideo(u.id, id, dto);
  }

  @Roles('TEACHER', 'ADMIN')
  @Delete('leads/:id/videos/:videoId')
  unassign(@Param('id') id: string, @Param('videoId') videoId: string) {
    return this.service.unassignVideo(id, videoId);
  }

  // ───────── Yozishma (ikki tomon ham) ─────────

  @Throttle({ default: { limit: 30, ttl: 60 * 1000 } })
  @Post('leads/:id/messages')
  send(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: LeadMessageDto) {
    return this.service.sendMessage(u.id, u.role, id, dto);
  }
}

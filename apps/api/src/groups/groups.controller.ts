import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import {
  AddMemberByIdDto, AddMemberDto, AttendanceDto, JoinByCodeDto, CreateGroupDto, CreateHomeworkDto, GradeDto, SubmitDto, UpdateGroupDto,
} from './groups.dto.js';
import { GroupsService } from './groups.service.js';

// Barcha yo'llar kirishni talab qiladi (global JwtAuthGuard). Egalik/a'zolik tekshiruvi servisda.
@Controller()
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Get('groups') list(@CurrentUser() u: AuthUser) { return this.groups.list(u); }
  @Roles('TEACHER', 'ADMIN') @Post('groups') create(@CurrentUser() u: AuthUser, @Body() dto: CreateGroupDto) { return this.groups.create(u, dto); }
  @Get('groups/:id') detail(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.groups.detail(id, u); }
  @Roles('TEACHER', 'ADMIN') @Patch('groups/:id') update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateGroupDto) { return this.groups.update(id, u, dto); }

  @Roles('TEACHER', 'ADMIN') @HttpCode(201) @Post('groups/:id/members')
  addMember(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: AddMemberDto) { return this.groups.addMember(id, u, dto); }
  @Roles('TEACHER', 'ADMIN') @HttpCode(201) @Post('groups/:id/members/by-id')
  addMemberById(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: AddMemberByIdDto) {
    return this.groups.addMemberById(id, u, dto.userId, dto.confirmParentConsent);
  }
  @Roles('TEACHER', 'ADMIN') @Get('groups/:id/candidates')
  candidates(@CurrentUser() u: AuthUser, @Param('id') id: string, @Query('q') q = '') { return this.groups.candidates(id, u, String(q).slice(0, 60)); }
  @Roles('TEACHER', 'ADMIN') @Post('groups/:id/join-code')
  newJoinCode(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.groups.newJoinCode(id, u); }
  @Roles('TEACHER', 'ADMIN') @Delete('groups/:id/join-code')
  disableJoinCode(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.groups.disableJoinCode(id, u); }
  /** Kodni taxmin qilishga qarshi: daqiqasiga 10 ta urinish */
  @Throttle({ default: { limit: 10, ttl: 60_000 } }) @HttpCode(200) @Post('groups/join')
  join(@CurrentUser() u: AuthUser, @Body() dto: JoinByCodeDto) { return this.groups.joinByCode(u, dto.code); }

  @Roles('TEACHER', 'ADMIN') @Delete('groups/:id/members/:userId')
  removeMember(@CurrentUser() u: AuthUser, @Param('id') id: string, @Param('userId') userId: string) { return this.groups.removeMember(id, userId, u); }

  @Get('groups/:id/homework') listHomework(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.groups.listHomework(id, u); }
  @Roles('TEACHER', 'ADMIN') @Post('groups/:id/homework')
  createHomework(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: CreateHomeworkDto) { return this.groups.createHomework(id, u, dto); }
  @Get('homework/:hid') homework(@CurrentUser() u: AuthUser, @Param('hid') hid: string) { return this.groups.homeworkDetail(hid, u); }
  @Roles('STUDENT') @Post('homework/:hid/submission')
  submit(@CurrentUser() u: AuthUser, @Param('hid') hid: string, @Body() dto: SubmitDto) { return this.groups.submit(hid, u, dto); }
  @Roles('TEACHER', 'ADMIN') @Patch('submissions/:sid')
  grade(@CurrentUser() u: AuthUser, @Param('sid') sid: string, @Body() dto: GradeDto) { return this.groups.grade(sid, u, dto); }

  @Get('groups/:id/attendance') attendance(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.groups.attendance(id, u); }
  @Roles('TEACHER', 'ADMIN') @Put('groups/:id/attendance')
  saveAttendance(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: AttendanceDto) { return this.groups.saveAttendance(id, u, dto); }
}

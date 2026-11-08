import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { AdminService } from './admin.service.js';
import { CreateUserDto, ListUsersQuery, ResetPasswordDto, UpdateUserDto } from './admin.dto.js';

/** Butun modul faqat ADMIN uchun. 2FA global MfaGuard orqali majburiy. */
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('users')
  listUsers(@Query() q: ListUsersQuery) {
    return this.admin.listUsers(q);
  }

  @Post('users')
  createUser(@CurrentUser() u: AuthUser, @Body() dto: CreateUserDto) {
    return this.admin.createUser(u, dto);
  }

  @Patch('users/:id')
  updateUser(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.admin.updateUser(u, id, dto);
  }

  @Post('users/:id/password')
  resetPassword(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.admin.resetPassword(u, id, dto);
  }

  @Post('users/:id/clear-2fa')
  clear2fa(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.admin.clearTwoFactor(u, id);
  }

  @Post('users/:id/unlock')
  unlock(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.admin.unlock(u, id);
  }

  @Get('audit')
  audit(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.admin.auditLog(Number(skip) || 0, Number(take) || 50);
  }
}

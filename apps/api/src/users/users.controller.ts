import { Body, Controller, Get, HttpCode, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { ChangePasswordDto, UpdateProfileDto } from './users.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me/profile')
  profile(@CurrentUser() u: AuthUser) {
    return this.users.me(u.id);
  }

  @Patch('me/profile')
  update(@CurrentUser() u: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(u.id, dto);
  }

  @Post('me/password')
  @HttpCode(200)
  password(@CurrentUser() u: AuthUser, @Body() dto: ChangePasswordDto, @Req() req: Request) {
    return this.users.changePassword(u.id, dto, req.ip);
  }
}

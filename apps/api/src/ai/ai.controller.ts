import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { AskDto } from './ai.dto.js';
import { AiService } from './ai.service.js';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get('status')
  status(@CurrentUser() u: AuthUser) {
    return this.ai.status(u.id, u.role);
  }

  @Get('conversations')
  conversations(@CurrentUser() u: AuthUser) {
    return this.ai.conversations(u.id);
  }

  @Get('conversations/:id')
  messages(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.ai.messages(u.id, id);
  }

  @Delete('conversations/:id')
  remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.ai.remove(u.id, id);
  }

  // Ikki qatlamli himoya: bu yerda daqiqalik tezlik, xizmatda kunlik kvota.
  // Tezlik chegarasi pulni tejaydi va bitta ochiq sahifa AI ni "bombardimon"
  // qilishidan saqlaydi.
  @Throttle({ default: { limit: 8, ttl: 60 * 1000 } })
  @Post('ask')
  ask(@CurrentUser() u: AuthUser, @Body() dto: AskDto) {
    return this.ai.ask(u.id, u.role, dto.level, dto);
  }
}

import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { ChatService } from './chat.service.js';
import { HistoryQuery, SendMessageDto } from './chat.dto.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('groups/:id/messages')
  history(@CurrentUser() u: AuthUser, @Param('id') id: string, @Query() q: HistoryQuery) {
    return this.chat.history(id, u, q);
  }

  @Post('groups/:id/messages')
  send(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.chat.send(id, u, dto);
  }

  @Delete('messages/:mid')
  remove(@CurrentUser() u: AuthUser, @Param('mid') mid: string) {
    return this.chat.remove(mid, u);
  }
}

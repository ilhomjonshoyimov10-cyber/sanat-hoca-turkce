import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { AnswerDto, MatchAnswerDto, OptInDto, QuizQueryDto, SetQueryDto, TypedAnswerDto } from './games.dto.js';
import { GamesService } from './games.service.js';

@Controller('games')
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Get('quiz')
  quiz(@CurrentUser() user: AuthUser, @Query() q: QuizQueryDto) {
    return this.games.quiz(user.id, q.level, q.limit);
  }

  @Throttle({ default: { limit: 120, ttl: 60 * 1000 } })
  @Post('answer')
  answer(@CurrentUser() user: AuthUser, @Body() dto: AnswerDto) {
    return this.games.answer(user.id, dto);
  }

  @Get('match')
  match(@CurrentUser() user: AuthUser, @Query() q: SetQueryDto) { return this.games.matchSet(user.id, q.level); }

  @Throttle({ default: { limit: 60, ttl: 60 * 1000 } })
  @Post('match/answer')
  matchAnswer(@CurrentUser() user: AuthUser, @Body() dto: MatchAnswerDto) { return this.games.matchAnswer(user.id, dto); }

  @Get('builder')
  builder(@CurrentUser() user: AuthUser, @Query() q: SetQueryDto) { return this.games.typedSet(user.id, q.level, q.limit ?? 5, 'builder'); }

  @Throttle({ default: { limit: 120, ttl: 60 * 1000 } })
  @Post('builder/answer')
  builderAnswer(@CurrentUser() user: AuthUser, @Body() dto: TypedAnswerDto) { return this.games.typedAnswer(user.id, 'builder', dto); }

  @Get('listen')
  listen(@CurrentUser() user: AuthUser, @Query() q: SetQueryDto) { return this.games.typedSet(user.id, q.level, q.limit ?? 5, 'listen'); }

  @Throttle({ default: { limit: 120, ttl: 60 * 1000 } })
  @Post('listen/answer')
  listenAnswer(@CurrentUser() user: AuthUser, @Body() dto: TypedAnswerDto) { return this.games.typedAnswer(user.id, 'listen', dto); }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.games.myStats(user.id);
  }

  @Get('leaderboard')
  async leaderboard(@CurrentUser() user: AuthUser) {
    const rows = await this.games.leaderboard();
    // Boshqalarning ID si chiqmaydi, faqat "bu men" belgisi
    return rows.map(({ userId, ...r }) => ({ ...r, isMe: userId === user.id }));
  }

  @Patch('leaderboard-optin')
  optIn(@CurrentUser() user: AuthUser, @Body() dto: OptInDto) {
    return this.games.setLeaderboardOptIn(user.id, dto.optIn);
  }
}

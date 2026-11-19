import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { CurrentUser } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { TtsService } from './tts.service.js';

class SpeakDto {
  @IsString()
  @MinLength(1)
  @MaxLength(600)
  text!: string;
}

@Controller('tts')
export class TtsController {
  constructor(private readonly tts: TtsService) {}

  // Keshdagi fayl bir zumda qaytadi; yangisi 2–6 soniya oladi.
  // Daqiqasiga 40 ta — o'yin (5 so'z) va o'qish (gap-gap) uchun yetarli.
  @Throttle({ default: { limit: 40, ttl: 60 * 1000 } })
  @Post()
  speak(@CurrentUser() u: AuthUser, @Body() dto: SpeakDto) {
    return this.tts.speak(u.id, u.role, dto.text);
  }
}

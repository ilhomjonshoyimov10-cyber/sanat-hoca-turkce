import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public, Roles } from '../auth/auth.decorators.js';
import { CreateLeadDto } from './leads.dto.js';
import { LeadsService } from './leads.service.js';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  // Hamma yuborishi mumkin (ommaviy ariza formasi). CGNAT sababli limit yumshoq.
  @Public()
  @Throttle({ default: { limit: 15, ttl: 60 * 60 * 1000 } })
  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.leads.create(dto);
  }

  // Arizalarni faqat ustoz va admin ko'radi
  @Roles('TEACHER', 'ADMIN')
  @Get()
  list() {
    return this.leads.list();
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Roles } from '../auth/auth.decorators.js';
import { CreateSetDto, CreateWordDto, SetWordsDto, UpdateWordDto, WordQueryDto } from './dictionary.dto.js';
import { DictionaryService } from './dictionary.service.js';

// Butun kontroller ustoz va admin uchun: lug'atni o'quvchi tahrirlamasligi
// kerak. O'quvchi so'zlarni o'yinlar orqali (/games/*) oladi.
@Roles('TEACHER', 'ADMIN')
@Controller('dictionary')
export class DictionaryController {
  constructor(private readonly dict: DictionaryService) {}

  @Get()
  list(@Query() q: WordQueryDto) {
    return this.dict.list(q);
  }

  @Get('stats')
  stats() {
    return this.dict.stats();
  }

  @Get('sets')
  sets() {
    return this.dict.sets();
  }

  @Get('sets/:id')
  setDetail(@Param('id') id: string) {
    return this.dict.setDetail(id);
  }

  @Post('sets')
  createSet(@Body() dto: CreateSetDto) {
    return this.dict.createSet(dto);
  }

  @Put('sets/:id/words')
  setWords(@Param('id') id: string, @Body() dto: SetWordsDto) {
    return this.dict.setWords(id, dto);
  }

  @Delete('sets/:id')
  removeSet(@Param('id') id: string) {
    return this.dict.removeSet(id);
  }

  @Post()
  create(@Body() dto: CreateWordDto) {
    return this.dict.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWordDto) {
    return this.dict.update(id, dto);
  }

  // So'zni o'chirish o'quvchilarning takrorlash tarixini ham o'chiradi,
  // shuning uchun faqat admin.
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dict.remove(id);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, ServiceUnavailableException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { BookQueryDto, ChapterDto, CreateBookDto, ProgressDto, UpdateBookDto } from './books.dto.js';
import { BooksService } from './books.service.js';
import { UploadTokenDto } from './upload.dto.js';

/** Qanday fayl turlari qabul qilinadi. Bu ro'yxat tokenning ichiga yoziladi,
 *  ya'ni brauzer uni o'zgartira olmaydi. */
const ALLOWED_TYPES = [
  'application/pdf',
  'application/epub+zip',
  'image/png',
  'image/jpeg',
  'image/webp',
  'audio/mpeg',
  'audio/mp4',
];

/** 60 MB. Vercel Blob bundan kattasini ham oladi, lekin maktab materiali
 *  uchun bu yetarli va tasodifan 2 GB video yuklanishini oldini oladi. */
const MAX_BYTES = 60 * 1024 * 1024;

@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  // ───────────── Fayl yuklash tokeni ─────────────
  //
  // Nega shunday: Vercel'ning serverless funksiyasiga 4.5 MB dan katta
  // so'rov yuborilmaydi, PDF darsliklar esa kattaroq. Shuning uchun fayl
  // API orqali O'TMAYDI — brauzer uni to'g'ridan-to'g'ri saqlagichga
  // yuklaydi. Server esa faqat qisqa muddatli, cheklangan token beradi:
  // fayl turi, hajmi va yo'li tokenning ichida qulflangan.

  @Roles('TEACHER', 'ADMIN')
  @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
  @Post('upload-token')
  async uploadToken(@CurrentUser() u: AuthUser, @Body() dto: UploadTokenDto) {
    const rwToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!rwToken) {
      throw new ServiceUnavailableException({
        message: "Fayl saqlagichi sozlanmagan. Hozircha tashqi havola qo'shing",
        code: 'BLOB_DISABLED',
      });
    }
    if (!ALLOWED_TYPES.includes(dto.contentType)) {
      throw new ServiceUnavailableException({
        message: 'Bu fayl turi qabul qilinmaydi. PDF, EPUB, rasm yoki audio yuklang',
        code: 'BAD_TYPE',
      });
    }

    // Fayl nomini tozalaymiz: yo'l belgilari va bo'shliqlar muammo qiladi.
    const safeName = dto.fileName
      .replace(/[^\w.\-]+/g, '-')
      .replace(/-+/g, '-')
      .slice(-80);

    const token = await generateClientTokenFromReadWriteToken({
      token: rwToken,
      // Har ustozning fayllari o'z papkasida — kim nima yuklaganini ko'rish oson.
      pathname: `kitoblar/${u.id}/${safeName}`,
      allowedContentTypes: [dto.contentType],
      maximumSizeInBytes: MAX_BYTES,
      // Bir xil nomli fayl eskisini o'chirib yubormasin
      addRandomSuffix: true,
      // Token 10 daqiqa yashaydi: o'g'irlangan token uzoq ishlamasin
      validUntil: Date.now() + 10 * 60 * 1000,
    });
    return { token, maxBytes: MAX_BYTES, allowedTypes: ALLOWED_TYPES };
  }

  // ───────────── Ro'yxat va o'qish ─────────────

  @Get()
  list(@CurrentUser() u: AuthUser, @Query() q: BookQueryDto) {
    return this.books.list(u.id, u.role, q);
  }

  @Get('shelf')
  shelf(@CurrentUser() u: AuthUser) {
    return this.books.shelf(u.id);
  }

  @Get(':id')
  one(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.books.one(u.id, u.role, id);
  }

  @Put(':id/progress')
  progress(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: ProgressDto) {
    return this.books.saveProgress(u.id, u.role, id, dto);
  }

  // ───────────── Ustoz amallari ─────────────

  @Roles('TEACHER', 'ADMIN')
  @Post()
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateBookDto) {
    return this.books.create(u.id, u.role, dto);
  }

  @Roles('TEACHER', 'ADMIN')
  @Patch(':id')
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateBookDto) {
    return this.books.update(u.id, u.role, id, dto);
  }

  @Roles('TEACHER', 'ADMIN')
  @Delete(':id')
  remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.books.remove(u.id, u.role, id);
  }

  @Roles('TEACHER', 'ADMIN')
  @Post(':id/chapters')
  addChapter(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: ChapterDto) {
    return this.books.addChapter(u.id, u.role, id, dto);
  }

  @Roles('TEACHER', 'ADMIN')
  @Delete('chapters/:cid')
  removeChapter(@CurrentUser() u: AuthUser, @Param('cid') cid: string) {
    return this.books.removeChapter(u.id, u.role, cid);
  }
}

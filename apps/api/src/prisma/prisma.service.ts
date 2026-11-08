import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(PrismaService.name);

  async onModuleInit() {
    // DIQQAT: ulanish xatosi ilovani YIQITMAYDI.
    //
    // Avval bu yerda `await this.$connect()` turgan edi. Serverless muhitda
    // bu xatarli: baza bir soniyaga javob bermasa, Nest'ning init bosqichi
    // yiqiladi va foydalanuvchi "FUNCTION_INVOCATION_FAILED" degan tushunarsiz
    // xatoni ko'radi — hatto bazaga tegmaydigan yo'llarda ham.
    //
    // Prisma baribir kerak bo'lganda o'zi ulanadi, shuning uchun bu yerda
    // faqat "issiq" ulanishga urinib ko'ramiz va muvaffaqiyatsiz bo'lsa
    // jurnalga yozamiz. Shunda har bir so'rov o'z xatosini aniq qaytaradi.
    try {
      await this.$connect();
    } catch (error) {
      this.log.error(`Bazaga ulanib bo'lmadi (so'rov paytida qayta urinadi): ${String(error)}`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch {
      /* yopilishda xato muhim emas */
    }
  }
}

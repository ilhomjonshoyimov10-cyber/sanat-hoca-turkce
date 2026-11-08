// Vercel (serverless) uchun kirish nuqtasi.
//
// Nima uchun alohida fayl: main.ts `app.listen()` qiladi — serverless'da
// port tinglash yo'q, Vercel bizga har so'rovda (req, res) beradi. Shu yerda
// Nest ilovasini QURAMIZ, lekin tinglamaymiz, va Express instansiyasini
// qaytaramiz.
//
// Muhim: ilova bir marta quriladi va keyingi so'rovlarda qayta ishlatiladi
// (Vercel konteynerni issiq saqlaydi). Aks holda har so'rov 1-3 soniya
// Nest + Prisma ishga tushishini kutardi.

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

type ExpressHandler = (req: unknown, res: unknown) => void;

let building: Promise<ExpressHandler> | null = null;

async function build(): Promise<ExpressHandler> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Serverless jurnali qimmat: faqat haqiqiy muammolarni yozamiz
    logger: ['error', 'warn'],
  });
  configureApp(app);
  // listen() EMAS: init() marshrutlarni ro'yxatdan o'tkazadi, port ochmaydi
  await app.init();
  return app.getHttpAdapter().getInstance() as ExpressHandler;
}

/** Vercel funksiyasi shu yerga keladi. Xato bo'lsa keyingi so'rov qayta urinadi. */
export async function handler(req: unknown, res: unknown) {
  try {
    building ??= build();
    const express = await building;
    return express(req, res);
  } catch (error) {
    // Qurish muvaffaqiyatsiz bo'lsa keshni tozalaymiz, aks holda konteyner
    // issiq turgancha HAR so'rov o'sha xatoni qaytarardi.
    building = null;
    throw error;
  }
}

export default handler;

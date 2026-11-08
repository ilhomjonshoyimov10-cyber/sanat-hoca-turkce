import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

/** main.ts va testlar bir xil sozlamalarni ishlatishi uchun alohida funksiya. */
export function configureApp(app: NestExpressApplication) {
  // nginx orqasida haqiqiy IP ni olish uchun (rate limit va jurnal to'g'ri ishlashi shart)
  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.WEB_URL, // faqat bizning frontend
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO da yo'q maydonlar olib tashlanadi
      forbidNonWhitelisted: true, // ortiqcha maydon kelsa, xato (masalan "role": "ADMIN")
      transform: true,
    }),
  );
}

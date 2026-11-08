// Vercel serverless funksiyasi.
//
// DIQQAT: bu fayl ataylab .js (TypeScript emas). Vercel TypeScript fayllarini
// esbuild bilan kompilyatsiya qiladi, esbuild esa `emitDecoratorMetadata` ni
// QO'LLAB-QUVVATLAMAYDI. NestJS dependency injection aynan shu metadata ustida
// ishlaydi — ya'ni .ts kirish nuqtasi qo'yilsa, ilova "Nest can't resolve
// dependencies" xatosi bilan yiqiladi.
//
// Yechim: Nest kodi `nest build` (tsc) bilan dist/ ga oldin kompilyatsiya
// qilinadi, bu fayl esa shunchaki tayyor natijani chaqiradi. Bu faylda
// dekorator yo'q, shuning uchun esbuild'ga xavfsiz.

import { handler } from '../dist/vercel-app.js';

export default handler;

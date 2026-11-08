// Vercel serverless funksiyasi.
//
// Bu fayl YIG'ILGAN (bundled) modulni chaqiradi — to'g'ridan-to'g'ri
// dist/ ni emas.
//
// NEGA: @nestjs/throttler CommonJS, @nestjs/common v12 esa faqat ESM.
// Node 22 mahalliyda require(ESM) ga ruxsat beradi, Vercel'ning ishga
// tushirish qatlami esa bermaydi — natijada funksiya
// ERR_REQUIRE_ESM bilan yiqilardi (mahalliy sinovda ko'rinmaydigan xato).
//
// Yechim: build paytida hamma narsa bitta ESM faylga yig'iladi, shuning
// uchun ishga tushganda umuman require() bo'lmaydi. Qo'shimcha foyda —
// cold start sezilarli tezlashadi.
import { handler } from '../dist-bundle/app.js';

export default handler;

// ZID MA'NOLI SO'ZLAR.
//
// "Zid ma'no" o'yini uchun. Chalg'ituvchi variantlar boshqa
// juftliklarning ikkinchi so'zidan olinadi, shuning uchun bir
// darajada kamida 5-6 ta juftlik bo'lishi kerak.
//
// TEKSHIRISH KERAK: ustoz turkcha yozilish va tarjimani ko'rib chiqsin.

import type { Level } from '@prisma/client';
import { moreAntonyms } from './more.js';

export interface Pair {
  first: string;
  second: string;
  uzbek: string;
  level: Level;
}

export const antonyms: Pair[] = [
  // ── A1 ──
  { first: 'büyük', second: 'küçük', uzbek: 'katta — kichik', level: 'A1' },
  { first: 'uzun', second: 'kısa', uzbek: 'uzun — kalta', level: 'A1' },
  { first: 'sıcak', second: 'soğuk', uzbek: 'issiq — sovuq', level: 'A1' },
  { first: 'yeni', second: 'eski', uzbek: 'yangi — eski', level: 'A1' },
  { first: 'iyi', second: 'kötü', uzbek: 'yaxshi — yomon', level: 'A1' },
  { first: 'açık', second: 'kapalı', uzbek: 'ochiq — yopiq', level: 'A1' },
  { first: 'kolay', second: 'zor', uzbek: 'oson — qiyin', level: 'A1' },
  { first: 'çok', second: 'az', uzbek: 'ko‘p — oz', level: 'A1' },
  { first: 'var', second: 'yok', uzbek: 'bor — yo‘q', level: 'A1' },
  { first: 'evet', second: 'hayır', uzbek: 'ha — yo‘q', level: 'A1' },
  { first: 'gelmek', second: 'gitmek', uzbek: 'kelmoq — ketmoq', level: 'A1' },
  { first: 'almak', second: 'vermek', uzbek: 'olmoq — bermoq', level: 'A1' },
  { first: 'girmek', second: 'çıkmak', uzbek: 'kirmoq — chiqmoq', level: 'A1' },
  { first: 'gündüz', second: 'gece', uzbek: 'kunduz — tun', level: 'A1' },
  { first: 'önce', second: 'sonra', uzbek: 'oldin — keyin', level: 'A1' },

  // ── A2 ──
  { first: 'hızlı', second: 'yavaş', uzbek: 'tez — sekin', level: 'A2' },
  { first: 'temiz', second: 'kirli', uzbek: 'toza — kir', level: 'A2' },
  { first: 'dolu', second: 'boş', uzbek: 'to‘la — bo‘sh', level: 'A2' },
  { first: 'ucuz', second: 'pahalı', uzbek: 'arzon — qimmat', level: 'A2' },
  { first: 'yakın', second: 'uzak', uzbek: 'yaqin — uzoq', level: 'A2' },
  { first: 'genç', second: 'yaşlı', uzbek: 'yosh — keksa', level: 'A2' },
  { first: 'zengin', second: 'fakir', uzbek: 'boy — kambag‘al', level: 'A2' },
  { first: 'güzel', second: 'çirkin', uzbek: 'chiroyli — xunuk', level: 'A2' },
  { first: 'ağır', second: 'hafif', uzbek: 'og‘ir — yengil', level: 'A2' },
  { first: 'kalın', second: 'ince', uzbek: 'qalin — ingichka', level: 'A2' },
  { first: 'doğru', second: 'yanlış', uzbek: 'to‘g‘ri — noto‘g‘ri', level: 'A2' },
  { first: 'erken', second: 'geç', uzbek: 'erta — kech', level: 'A2' },
  { first: 'kazanmak', second: 'kaybetmek', uzbek: 'yutmoq — yutqazmoq', level: 'A2' },
  { first: 'başlamak', second: 'bitirmek', uzbek: 'boshlamoq — tugatmoq', level: 'A2' },
  { first: 'sevmek', second: 'nefret etmek', uzbek: 'sevmoq — nafratlanmoq', level: 'A2' },
  { first: 'mutlu', second: 'üzgün', uzbek: 'baxtli — xafa', level: 'A2' },

  // ── B1 ──
  { first: 'cesur', second: 'korkak', uzbek: 'jasur — qo‘rqoq', level: 'B1' },
  { first: 'sessiz', second: 'gürültülü', uzbek: 'jim — shovqinli', level: 'B1' },
  { first: 'basit', second: 'karmaşık', uzbek: 'oddiy — murakkab', level: 'B1' },
  { first: 'geçici', second: 'kalıcı', uzbek: 'vaqtinchalik — doimiy', level: 'B1' },
  { first: 'gerçek', second: 'sahte', uzbek: 'haqiqiy — soxta', level: 'B1' },
  { first: 'cömert', second: 'cimri', uzbek: 'saxiy — xasis', level: 'B1' },
  { first: 'tembel', second: 'çalışkan', uzbek: 'dangasa — tirishqoq', level: 'B1' },
  { first: 'artmak', second: 'azalmak', uzbek: 'oshmoq — kamaymoq', level: 'B1' },
  { first: 'unutmak', second: 'hatırlamak', uzbek: 'unutmoq — eslamoq', level: 'B1' },
  { first: 'kabul etmek', second: 'reddetmek', uzbek: 'qabul qilmoq — rad etmoq', level: 'B1' },
  { first: 'ayrılmak', second: 'birleşmek', uzbek: 'ajralmoq — birlashmoq', level: 'B1' },
  { first: 'dikkatli', second: 'dikkatsiz', uzbek: 'ehtiyotkor — beparvo', level: 'B1' },

  // ── B2 ──
  { first: 'mütevazı', second: 'kibirli', uzbek: 'kamtar — manman', level: 'B2' },
  { first: 'somut', second: 'soyut', uzbek: 'aniq (moddiy) — mavhum', level: 'B2' },
  { first: 'avantaj', second: 'dezavantaj', uzbek: 'afzallik — kamchilik', level: 'B2' },
  { first: 'iyimser', second: 'kötümser', uzbek: 'optimist — pessimist', level: 'B2' },
  { first: 'bilinçli', second: 'bilinçsiz', uzbek: 'ongli — ongsiz', level: 'B2' },
  { first: 'yeterli', second: 'yetersiz', uzbek: 'yetarli — yetarsiz', level: 'B2' },
  { first: 'esnek', second: 'katı', uzbek: 'moslashuvchan — qat‘iy', level: 'B2' },
  { first: 'açıklamak', second: 'gizlemek', uzbek: 'tushuntirmoq — yashirmoq', level: 'B2' },
  { first: 'desteklemek', second: 'engellemek', uzbek: 'qo‘llamoq — to‘sqinlik qilmoq', level: 'B2' },
  { first: 'geçerli', second: 'geçersiz', uzbek: 'amal qiladigan — bekor', level: 'B2' },

  // ── C1 ──
  { first: 'ihtiyatlı', second: 'pervasız', uzbek: 'ehtiyotkor — beboshvoq', level: 'C1' },
  { first: 'nesnel', second: 'öznel', uzbek: 'obyektiv — subyektiv', level: 'C1' },
  { first: 'ayrıntılı', second: 'yüzeysel', uzbek: 'batafsil — yuzaki', level: 'C1' },
  { first: 'kalıcılık', second: 'geçicilik', uzbek: 'doimiylik — vaqtinchalik', level: 'C1' },
  { first: 'teşvik etmek', second: 'caydırmak', uzbek: 'rag‘batlantirmoq — qaytarmoq', level: 'C1' },
  { first: 'tutarlı', second: 'çelişkili', uzbek: 'izchil — ziddiyatli', level: 'C1' },
];

// Qo'shimcha to'plam (content/more.ts)
antonyms.push(...moreAntonyms);

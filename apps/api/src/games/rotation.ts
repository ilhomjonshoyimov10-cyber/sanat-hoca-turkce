// Mashq materialini TAKRORLANMAYDIGAN tartibda tanlash.
//
// Muammo: ilgari material `shuffle(hammasi).slice(0, 5)` bilan tanlanardi.
// Tasodif adolatli, lekin unutuvchan: o'quvchi ketma-ket uch marta
// o'ynasa, bir xil jumla ikki-uch marta chiqishi mumkin edi.
//
// Yechim: SeenItem jadvali. Tartib shunday:
//   1. umuman ko'rilmaganlar (eng qimmatlisi — yangi material)
//   2. hammasi ko'rilgan bo'lsa: kam marta ko'rilgani, keyin eng uzoq
//      vaqt oldin ko'rilgani
//
// Shunday qilib material aylanib turadi va takrorlanish eng oxirida,
// faqat zaxira tugaganda sodir bo'ladi.

import type { PrismaService } from '../prisma/prisma.service.js';
import { shuffle } from './srs.js';

export type SeenKind =
  | 'word'
  | 'sentence'
  | 'suffix'
  | 'cloze'
  | 'verb'
  | 'dialogue'
  | 'pair'
  | 'odd';

interface HasId {
  id: string;
}

/**
 * Berilgan ro'yxatdan `limit` ta element tanlaydi: avval ko'rilmaganlar.
 *
 * `pool` — nomzodlar (allaqachon daraja bo'yicha filtrlangan).
 * Qaytgan elementlar "ko'rilgan" deb BELGILANMAYDI — buni chaqiruvchi
 * `markSeen` bilan qiladi, chunki foydalanuvchi savolni olgandagina
 * belgilash to'g'ri bo'ladi.
 */
export async function pickFresh<T extends HasId>(
  prisma: PrismaService,
  userId: string,
  kind: SeenKind,
  pool: T[],
  limit: number,
): Promise<T[]> {
  if (pool.length === 0) return [];
  if (pool.length <= limit) return shuffle(pool);

  const seen = await prisma.seenItem.findMany({
    where: { userId, kind, itemId: { in: pool.map((p) => p.id) } },
    select: { itemId: true, times: true, seenAt: true },
  });
  const byId = new Map(seen.map((s) => [s.itemId, s]));

  const unseen = pool.filter((p) => !byId.has(p.id));
  if (unseen.length >= limit) return shuffle(unseen).slice(0, limit);

  // Ko'rilmaganlar yetmadi: qolganini eng "sovuq"laridan to'ldiramiz.
  const rest = pool
    .filter((p) => byId.has(p.id))
    .sort((a, b) => {
      const sa = byId.get(a.id)!;
      const sb = byId.get(b.id)!;
      // Kam ko'rilgani oldinda; teng bo'lsa — uzoq vaqt oldin ko'rilgani
      return sa.times - sb.times || sa.seenAt.getTime() - sb.seenAt.getTime();
    })
    .slice(0, limit - unseen.length);

  return shuffle([...unseen, ...rest]);
}

/**
 * Berilgan elementlarni "ko'rilgan" deb belgilaydi.
 *
 * Hech qachon chaqiruvchi amalni buzmaydi: belgilash xato bo'lsa,
 * o'yin baribir ishlayveradi (eng yomoni — material takrorlanadi).
 */
export async function markSeen(
  prisma: PrismaService,
  userId: string,
  kind: SeenKind,
  itemIds: string[],
): Promise<void> {
  if (itemIds.length === 0) return;
  const now = new Date();
  await Promise.all(
    itemIds.map((itemId) =>
      prisma.seenItem
        .upsert({
          where: { userId_kind_itemId: { userId, kind, itemId } },
          create: { userId, kind, itemId, seenAt: now },
          update: { times: { increment: 1 }, seenAt: now },
        })
        .catch(() => undefined),
    ),
  );
}

/**
 * Yaqinda ko'rsatilgan elementlarni ro'yxatdan chiqaradi, TARTIBNI saqlab.
 *
 * `pickFresh` dan farqi: u aralashtiradi, bu esa asl tartibni qoldiradi.
 * Lug'at so'zlari uchun shu kerak — yangi so'zlar dastur bo'yicha
 * ma'lum ketma-ketlikda o'rgatiladi, uni buzib bo'lmaydi.
 *
 * Nega kerak: o'quvchi savollar to'plamini olib, javob bermasdan
 * chiqib ketsa, o'sha so'zlar keyingi safar yana birinchi bo'lib
 * chiqardi. Javob berilgan so'z esa takrorlash jadvaliga tushadi va
 * o'zi chiqmay qoladi — ya'ni muammo aynan javobsiz qolganlarida edi.
 *
 * Hammasi yaqinda ko'rilgan bo'lsa, ro'yxat o'zgarishsiz qaytadi:
 * mashqni butunlay to'xtatib qo'ygandan ko'ra takrorlagan afzal.
 */
export async function dropRecentlySeen<T extends HasId>(
  prisma: PrismaService,
  userId: string,
  kind: SeenKind,
  pool: T[],
  withinMs = 24 * 60 * 60 * 1000,
): Promise<T[]> {
  if (pool.length === 0) return pool;
  const recent = await prisma.seenItem.findMany({
    where: {
      userId,
      kind,
      itemId: { in: pool.map((p) => p.id) },
      seenAt: { gt: new Date(Date.now() - withinMs) },
    },
    select: { itemId: true },
  });
  if (recent.length === 0) return pool;
  const skip = new Set(recent.map((r) => r.itemId));
  const left = pool.filter((p) => !skip.has(p.id));
  return left.length > 0 ? left : pool;
}

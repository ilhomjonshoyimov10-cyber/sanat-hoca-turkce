import type { PrismaClient } from '@prisma/client';
import type { ParsedWord } from './word-import.js';

/** So'zlarni bazaga qo'shadi. position berilmaganlar daraja bo'yicha mavjudlarning oxiriga, fayl tartibida qo'shiladi. */
export async function insertWords(prisma: PrismaClient, words: ParsedWord[]) {
  const max = await prisma.word.groupBy({ by: ['level'], _max: { position: true } });
  const next = new Map(max.map((m) => [m.level as string, (m._max.position ?? 0) + 1]));
  const data = words.map((w) => {
    const position = w.position ?? next.get(w.level) ?? 1;
    if (w.position === undefined) next.set(w.level, position + 1);
    return { ...w, position };
  });
  let added = 0;
  for (let i = 0; i < data.length; i += 500) {
    added += (await prisma.word.createMany({ data: data.slice(i, i + 500), skipDuplicates: true })).count;
  }
  return { added, skipped: data.length - added };
}

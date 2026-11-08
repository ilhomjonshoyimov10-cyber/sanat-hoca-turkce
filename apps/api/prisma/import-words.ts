// Lug'atni CSV/TSV fayldan bazaga qo'shadi.
//   Tekshirish (bazaga yozmaydi):  pnpm db:import-words ./lugat.csv --dry-run
//   Qo'shish:                       pnpm db:import-words ./lugat.csv
// Mavjud (turkish + uzbek bir xil) so'zlar o'tkazib yuboriladi, ularga tegilmaydi.
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { insertWords } from '../src/seed/word-db.js';
import { parseWords } from '../src/seed/word-import.js';

const file = process.argv[2];
const dry = process.argv.includes('--dry-run');
if (!file || file.startsWith('--')) {
  console.error('Foydalanish: pnpm db:import-words <fayl.csv> [--dry-run]');
  process.exit(1);
}

const report = parseWords(readFileSync(file, 'utf8'));
const byLevel = report.words.reduce<Record<string, number>>((a, w) => ((a[w.level] = (a[w.level] ?? 0) + 1), a), {});

console.log(`\nTekshiruv natijasi: ${file}`);
console.log(`  To'g'ri qatorlar: ${report.words.length}  (${Object.entries(byLevel).map(([l, n]) => `${l}: ${n}`).join(', ') || '-'})`);
console.log(`  Fayl ichida takrorlangan (o'tkaziladi): ${report.duplicates}`);
console.log(`  Xato qatorlar (kiritilmaydi): ${report.errors.length}`);
report.errors.slice(0, 30).forEach((e) => console.log(`    ${e.line}-qator: ${e.message}`));
if (report.errors.length > 30) console.log(`    ... yana ${report.errors.length - 30} ta`);
if (report.warnings.length) {
  console.log(`  Ogohlantirishlar: ${report.warnings.length}`);
  report.warnings.slice(0, 15).forEach((w) => console.log(`    ${w.message}`));
}

if (dry) {
  console.log("\n--dry-run: bazaga hech narsa yozilmadi.");
  process.exit(report.errors.length ? 2 : 0);
}

const prisma = new PrismaClient();
try {
  const { added, skipped } = await insertWords(prisma, report.words);
  console.log(`\nBazaga qo'shildi: ${added} ta so'z (${skipped} tasi bazada allaqachon bor edi).`);
} finally {
  await prisma.$disconnect();
}

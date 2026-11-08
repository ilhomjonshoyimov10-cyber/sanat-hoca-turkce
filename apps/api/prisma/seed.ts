// Boshlang'ich ma'lumotlar: so'zlar va (ixtiyoriy) birinchi ADMIN.
// Ishga tushirish:  pnpm db:seed
import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/auth/argon.js';
import { checkPassword } from '../src/auth/password.policy.js';
import { insertWords } from '../src/seed/word-db.js';
import { loadWordFiles } from '../src/seed/word-data.js';

const prisma = new PrismaClient();

async function seedWords() {
  const report = loadWordFiles(); // prisma/data/*.csv
  if (report.errors.length) console.warn(`Ogohlantirish: ${report.errors.length} ta qator o'tkazib yuborildi`);
  const { added, skipped } = await insertWords(prisma, report.words);
  console.log(`So'zlar: ${added} ta qo'shildi, ${skipped} tasi allaqachon bor (jami ${report.words.length} ta ro'yxatda)`);
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("ADMIN_EMAIL/ADMIN_PASSWORD yo'q: admin yaratish o'tkazib yuborildi");
    return;
  }
  const weak = checkPassword(password, { email });
  if (weak) throw new Error(`ADMIN_PASSWORD: ${weak}`);

  if (await prisma.user.findUnique({ where: { email } })) {
    console.log("Bu email bilan hisob allaqachon bor, o'tkazib yuborildi");
    return;
  }
  await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      firstName: 'Admin',
      lastName: 'Sanat Hoca',
      role: Role.ADMIN,
      emailVerifiedAt: new Date(),
      stats: { create: {} },
    },
  });
  console.log("Admin yaratildi:", email, "\nENDI ADMIN_PASSWORD ni .env dan o'chiring! Birinchi kirishda 2FA sozlash majburiy.");
}

async function main() {
  await seedWords();
  await seedAdmin();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

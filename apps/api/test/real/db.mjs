// Haqiqiy PostgreSQL bilan ishlovchi Prisma mijozi (test/real/* uchun).
//
// Odatda standart Prisma mijozi ishlatiladi: `pnpm test:db` buyrug'i uchun boshqa hech narsa kerak emas.
// USE_PG_ADAPTER=1 bo'lsa, @prisma/adapter-pg orqali ulanadi (ikkilik dvigatel yuklab bo'lmaydigan muhitlar uchun).
import { PrismaClient } from '@prisma/client';

export async function makeDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL o'rnatilmagan");
  if (process.env.USE_PG_ADAPTER !== '1') return new PrismaClient();
  const { PrismaPg } = await import('@prisma/adapter-pg');
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

/** Har sinovdan oldin barcha jadvallarni tozalaydi (tashqi kalitlar sababli birga). */
export async function resetDb(db) {
  const tables = ['AuditLog', 'Attendance', 'Submission', 'Homework', 'Message', 'GroupMember', 'Group',
    'Payment', 'BlogPost', 'UserBadge', 'Badge', 'UserStats', 'GameResult', 'UserWord', 'Word',
    'RecoveryCode', 'OneTimeToken', 'RefreshToken', 'Lead', 'Course', 'User'];
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`);
}

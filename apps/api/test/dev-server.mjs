// DEMO SERVER: PostgreSQL'siz sinab ko'rish uchun. Ma'lumotlar XOTIRADA, o'chirilsa yo'qoladi.
// Faqat ko'rib chiqish uchun, ishlab chiqarishda ishlatilmaydi!
// Ishga tushirish:  pnpm --filter @sanat/api demo   (keyin boshqa terminalda: pnpm dev:web)
import { Test } from '@nestjs/testing';
import { createFakePrisma } from './fake-prisma.mjs';
import { loadWordFiles } from '../dist/seed/word-data.js';

process.env.NODE_ENV ??= 'development';
process.env.JWT_ACCESS_SECRET ??= 'demo-secret-demo-secret-demo-secret-1234';
process.env.TOTP_ENCRYPTION_KEY ??= 'demo-totp-key-demo-totp-key-demo-1234';
process.env.WEB_URL ??= 'http://localhost:3000';
process.env.DATABASE_URL ??= 'postgresql://demo:demo@localhost:5432/demo';

const { AppModule } = await import('../dist/app.module.js');
const { configureApp } = await import('../dist/app.setup.js');
const { PrismaService } = await import('../dist/prisma/prisma.service.js');
const { hashPassword } = await import('../dist/auth/argon.js');

const prisma = createFakePrisma();
const pos = {};
loadWordFiles().words.forEach((w, i) => {
  pos[w.level] = (pos[w.level] ?? 0) + 1;
  prisma.db.words.push({ id: `w${i + 1}`, audioUrl: null, exampleTr: null, exampleUz: null, ...w, position: pos[w.level] });
});

const ADMIN = { email: 'admin@demo.uz', password: 'demo-parol-sakkiz-kuz' };
prisma.db.users.push({
  id: 'admin1', email: ADMIN.email, phone: null, firstName: 'Admin', lastName: 'Demo', role: 'ADMIN', locale: 'UZ',
  avatarUrl: null, isActive: true, twoFactorEnabled: false, twoFactorSecret: null, twoFactorLastStep: null,
  leaderboardOptIn: false, parentConsent: false, failedLoginCount: 0, lockedUntil: null,
  passwordHash: await hashPassword(ADMIN.password),
});

// Namuna uchun tayyor ustoz: admin 2FA talab qiladi, ustozni ko'rish osonroq bo'lsin.
// (Ustozga ham 2FA majburiy — birinchi kirishda sozlanadi.)
const TEACHER = { email: 'ustoz@demo.uz', password: 'demo-parol-sakkiz-kuz' };
prisma.db.users.push({
  id: 'teacher1', email: TEACHER.email, phone: null, firstName: 'Sanat', lastName: 'Hoca', role: 'TEACHER', locale: 'UZ',
  avatarUrl: null, isActive: true, twoFactorEnabled: false, twoFactorSecret: null, twoFactorLastStep: null,
  leaderboardOptIn: false, parentConsent: false, failedLoginCount: 0, lockedUntil: null, bio: null,
  timezone: 'Asia/Tashkent', createdAt: new Date(),
  passwordHash: await hashPassword(TEACHER.password),
});

const mod = await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(PrismaService).useValue(prisma).compile();
const app = mod.createNestApplication();
configureApp(app);
const port = Number(process.env.API_PORT ?? 4000);
await app.listen(port, '127.0.0.1');
console.log(`DEMO API: http://localhost:${port}  (xotirada, PostgreSQL yo'q)`);
console.log(`Admin: ${ADMIN.email} / ${ADMIN.password}  (birinchi kirishda 2FA sozlash majburiy)`);
console.log(`Ustoz: ${TEACHER.email} / ${TEACHER.password}  (2FA majburiy)`);

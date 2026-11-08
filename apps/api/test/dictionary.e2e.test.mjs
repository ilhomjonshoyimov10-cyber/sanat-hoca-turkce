// Lug'at boshqaruvi: ustoz so'z qo'shadi/tahrirlaydi, mavzuli to'plam tuzadi.
//
// Diqqat markazi:
//   1. O'QUVCHI LUG'ATGA TEGMASLIGI — u so'zlarni faqat o'yin orqali oladi.
//   2. O'CHIRISH faqat admin uchun: so'z o'chsa, uning bilan birga
//      o'quvchilarning butun takrorlash tarixi ham o'chadi.
//   3. Takroriy so'z 500 emas, tushunarli 400 xato berishi.
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { createFakePrisma } from './fake-prisma.mjs';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-secret-test-secret-test-secret-1234';
process.env.TOTP_ENCRYPTION_KEY = 'totp-key-totp-key-totp-key-totp-key-12';
process.env.WEB_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://x:y@localhost:5432/z';

const { AppModule } = await import('../dist/app.module.js');
const { configureApp } = await import('../dist/app.setup.js');
const { PrismaService } = await import('../dist/prisma/prisma.service.js');
const { hashPassword } = await import('../dist/auth/argon.js');
const { encrypt } = await import('../dist/auth/crypto.js');
const { totpAt } = await import('../dist/auth/totp.js');

const CSRF = { 'X-Requested-With': 'XMLHttpRequest', Origin: 'http://localhost:3000' };
const PW = 'olma-daraxti-sakkiz-kuz';
const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

let ctx, TEACHER, ADMIN, STUDENT;

async function addStaff(email, role, first) {
  const row = {
    id: `${role.toLowerCase()}-${first}`, email, phone: null, firstName: first, lastName: 'Xodim',
    role, locale: 'UZ', avatarUrl: null, isActive: true, twoFactorEnabled: true,
    twoFactorSecret: encrypt(SECRET, process.env.TOTP_ENCRYPTION_KEY, 'totp-secret'),
    twoFactorLastStep: null, leaderboardOptIn: false, parentConsent: false,
    failedLoginCount: 0, lockedUntil: null, passwordHash: await hashPassword(PW), birthDate: null,
    bio: null, timezone: 'Asia/Tashkent', createdAt: new Date(),
  };
  ctx.prisma.db.users.push(row);
  const agent = request.agent(ctx.server).set(CSRF);
  const step1 = await agent.post('/auth/login').send({ identifier: email, password: PW });
  const r = await agent.post('/auth/2fa/login').send({ challenge: step1.body.challenge, code: totpAt(SECRET, Date.now()) });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return { agent, id: row.id };
}

before(async () => {
  const prisma = createFakePrisma();
  // Boshlang'ich lug'at
  [['merhaba', 'salom', 'A1'], ['kitap', 'kitob', 'A1'], ['pencere', 'deraza', 'A2']].forEach(([turkish, uzbek, level], i) => {
    prisma.db.words.push({
      id: `w${i}`, turkish, uzbek, russian: null, exampleTr: null, exampleUz: null, exampleRu: null,
      audioUrl: null, level, category: i === 0 ? 'salomlashish' : null, position: i,
      partOfSpeech: null, pronunciation: null, tags: [], frequency: null, verified: true,
      notes: null, createdAt: new Date(), updatedAt: new Date(),
    });
  });

  const mod = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService).useValue(prisma).compile();
  const app = mod.createNestApplication();
  configureApp(app);
  await app.init();
  ctx = { app, prisma, server: app.getHttpServer() };

  TEACHER = await addStaff('ustoz@lugat.uz', 'TEACHER', 'Aziz');
  ADMIN = await addStaff('admin@lugat.uz', 'ADMIN', 'Admin');

  const agent = request.agent(ctx.server).set(CSRF);
  const r = await agent.post('/auth/register').send({
    firstName: 'Dilnoza', lastName: 'Karimova', email: 's@lugat.uz', password: PW,
    birthDate: '1995-01-01', acceptTerms: true,
  });
  assert.equal(r.status, 201);
  STUDENT = { agent, id: r.body.user.id };
});
after(() => ctx.app.close());

describe("lug'at ruxsatlari", () => {
  it("o'quvchi lug'atni ko'rolmaydi va tahrirlolmaydi", async () => {
    assert.equal((await STUDENT.agent.get('/dictionary')).status, 403);
    assert.equal((await STUDENT.agent.get('/dictionary/stats')).status, 403);
    assert.equal((await STUDENT.agent.post('/dictionary').send({ turkish: 'x', uzbek: 'y', level: 'A1' })).status, 403);
    assert.equal((await STUDENT.agent.patch('/dictionary/w0').send({ uzbek: 'buzildi' })).status, 403);
    assert.equal((await STUDENT.agent.delete('/dictionary/w0')).status, 403);
    // So'z o'zgarmaganini tekshiramiz
    assert.equal(ctx.prisma.db.words.find((w) => w.id === 'w0').uzbek, 'salom');
  });

  it("ustoz so'z O'CHIRA OLMAYDI, admin o'chiradi", async () => {
    const t = await TEACHER.agent.delete('/dictionary/w2');
    assert.equal(t.status, 403, "ustoz so'zni o'chirdi");
    assert.ok(ctx.prisma.db.words.some((w) => w.id === 'w2'));

    const a = await ADMIN.agent.delete('/dictionary/w2');
    assert.equal(a.status, 200, JSON.stringify(a.body));
    assert.equal(ctx.prisma.db.words.some((w) => w.id === 'w2'), false);
  });
});

describe("lug'at boshqaruvi", () => {
  it('ustoz ro\'yxatni oladi, qidiradi va filtrlaydi', async () => {
    const all = await TEACHER.agent.get('/dictionary');
    assert.equal(all.status, 200, JSON.stringify(all.body));
    assert.ok(all.body.total >= 2);

    const search = await TEACHER.agent.get('/dictionary?q=kitap');
    assert.equal(search.body.rows.length, 1);
    assert.equal(search.body.rows[0].turkish, 'kitap');

    const byLevel = await TEACHER.agent.get('/dictionary?level=A1');
    assert.ok(byLevel.body.rows.every((w) => w.level === 'A1'));
  });

  it("ustoz yangi so'z qo'shadi — boy maydonlar bilan", async () => {
    const r = await TEACHER.agent.post('/dictionary').send({
      turkish: 'gözlük',
      uzbek: 'ko\'zoynak',
      level: 'A2',
      partOfSpeech: 'NOUN',
      category: 'kiyim',
      exampleTr: 'Gözlüğümü evde unuttum.',
      exampleUz: 'Ko\'zoynagimni uyda unutdim.',
      pronunciation: 'gyozlyuk',
      tags: ['kiyim', 'kundalik'],
      frequency: 1200,
    });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.body.partOfSpeech, 'NOUN');
    assert.deepEqual(r.body.tags, ['kiyim', 'kundalik']);
    // Ustoz qo'shgan so'z darhol tasdiqlangan bo'ladi (o'yinga tushadi)
    assert.equal(r.body.verified, true);
  });

  it("takroriy so'z tushunarli xato beradi (500 emas)", async () => {
    const r = await TEACHER.agent.post('/dictionary').send({ turkish: 'kitap', uzbek: 'kitob', level: 'A1' });
    assert.equal(r.status, 400, JSON.stringify(r.body));
    assert.ok(String(r.body.message).includes('allaqachon'));
  });

  it("ustoz so'zni tahrirlaydi", async () => {
    const r = await TEACHER.agent.patch('/dictionary/w1').send({
      exampleTr: 'Bu kitap çok güzel.',
      notes: 'B1 da takrorlanadi',
    });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.exampleTr, 'Bu kitap çok güzel.');
  });

  it('holat (stats) tasdiqlanmagan so\'zlar sonini ko\'rsatadi', async () => {
    // Tasdiqlanmagan so'z qo'shamiz (import qilingan xom ma'lumotga o'xshash)
    ctx.prisma.db.words.push({
      id: 'wx', turkish: 'tekshirilmagan', uzbek: 'xom', russian: null, exampleTr: null, exampleUz: null,
      exampleRu: null, audioUrl: null, level: 'B1', category: null, position: 99, partOfSpeech: null,
      pronunciation: null, tags: [], frequency: null, verified: false, notes: null,
      createdAt: new Date(), updatedAt: new Date(),
    });
    const r = await TEACHER.agent.get('/dictionary/stats');
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.ok(r.body.total > 0);
    assert.equal(r.body.unverified, 1);
    assert.ok(Array.isArray(r.body.byLevel));
    assert.ok(r.body.categories.includes('salomlashish'));
  });

  it("tasdiqlanmagan so'zlarni filtrlab olish mumkin", async () => {
    const r = await TEACHER.agent.get('/dictionary?verified=0');
    assert.equal(r.status, 200);
    assert.ok(r.body.rows.every((w) => w.verified === false));
    assert.ok(r.body.rows.length >= 1);
  });
});

describe("mavzuli to'plamlar", () => {
  let setId;

  it("ustoz to'plam yaratadi", async () => {
    const r = await TEACHER.agent.post('/dictionary/sets').send({
      title: 'Restoranda',
      description: 'Ovqat buyurtma qilish uchun so\'zlar',
      level: 'A2',
    });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.body.slug, 'restoranda');
    setId = r.body.id;
  });

  it("to'plamga so'zlar qo'shiladi; mavjud bo'lmagan ID lar o'tkazib yuboriladi", async () => {
    const r = await TEACHER.agent.put(`/dictionary/sets/${setId}/words`).send({
      wordIds: ['w0', 'w1', 'yoq-bunday-id'],
    });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.count, 2);
    assert.equal(r.body.skipped, 1, "yo'q ID jim-jitlikda qo'shilib ketdi");
  });

  it("to'plam tafsiloti so'zlar bilan keladi", async () => {
    const r = await TEACHER.agent.get(`/dictionary/sets/${setId}`);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.words.length, 2);
    assert.ok(r.body.words[0].turkish);
  });

  it("ro'yxatda so'z soni ko'rinadi", async () => {
    const r = await TEACHER.agent.get('/dictionary/sets');
    const mine = r.body.find((s) => s.id === setId);
    assert.equal(mine.wordCount, 2);
  });

  it("o'quvchi to'plam yaratolmaydi", async () => {
    const r = await STUDENT.agent.post('/dictionary/sets').send({ title: 'Mening to\'plamim' });
    assert.equal(r.status, 403);
  });
});

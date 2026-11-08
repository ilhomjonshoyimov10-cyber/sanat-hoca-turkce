// HAQIQIY PostgreSQL bilan to'liq tekshiruv.
// Soxta baza isbotlay olmaydigan narsalar: SQL cheklovlari, tashqi kalitlar, agregatsiya,
// parallel tranzaksiyalar, sana turlari va haqiqiy lug'at hajmidagi ishlash tezligi.
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { makeDb, resetDb } from './db.mjs';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-secret-test-secret-test-secret-1234';
process.env.TOTP_ENCRYPTION_KEY = 'totp-key-totp-key-totp-key-totp-key-12';
process.env.WEB_URL = 'http://localhost:3000';

const { AppModule } = await import('../../dist/app.module.js');
const { configureApp } = await import('../../dist/app.setup.js');
const { PrismaService } = await import('../../dist/prisma/prisma.service.js');
const { hashPassword } = await import('../../dist/auth/argon.js');
const { encrypt } = await import('../../dist/auth/crypto.js');
const { totpAt } = await import('../../dist/auth/totp.js');
const { loadWordFiles } = await import('../../dist/seed/word-data.js');
const { insertWords } = await import('../../dist/seed/word-db.js');
const { tashkentDay } = await import('../../dist/games/srs.js');
const { decrypt } = await import('../../dist/auth/crypto.js');

/** Savol tokenidan so'z ID si va to'g'ri javob indeksini ochadi (sinov uchun). */
const openQuiz = (token) => JSON.parse(decrypt(token, process.env.JWT_ACCESS_SECRET, 'quiz'));

const CSRF = { 'X-Requested-With': 'XMLHttpRequest', Origin: 'http://localhost:3000' };
const PW = 'olma-daraxti-sakkiz-kuz';
const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

let db, app, server;

before(async () => {
  db = await makeDb();
  await resetDb(db);
  const mod = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService).useValue(db).compile();
  app = mod.createNestApplication();
  configureApp(app);
  await app.init();
  server = app.getHttpServer();
});
after(async () => {
  await app.close();
  await db.$disconnect();
});

const reg = (over = {}) => ({
  firstName: 'Aziza', lastName: 'Karimova', email: 'aziza@example.com',
  password: PW, birthDate: '1995-06-15', acceptTerms: true, ...over,
});
const agent = () => request.agent(server).set(CSRF);
async function student(email) {
  const a = agent();
  const r = await a.post('/auth/register').send(reg({ email }));
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return { a, id: r.body.user.id };
}
async function staff(email, role) {
  const u = await db.user.create({
    data: {
      email, firstName: 'Ustoz', lastName: 'Sanat', role, passwordHash: await hashPassword(PW),
      twoFactorEnabled: true, twoFactorSecret: encrypt(SECRET, process.env.TOTP_ENCRYPTION_KEY, 'totp-secret'),
      stats: { create: {} },
    },
  });
  const a = agent();
  const s1 = await a.post('/auth/login').send({ identifier: email, password: PW });
  assert.equal(s1.body.twoFactorRequired, true);
  const s2 = await a.post('/auth/2fa/login').send({ challenge: s1.body.challenge, code: totpAt(SECRET, Date.now()) });
  assert.equal(s2.status, 200, JSON.stringify(s2.body));
  return { a, id: u.id };
}

describe("lug'atni haqiqiy bazaga yozish", () => {
  let report;
  it("2700+ so'z bitta marta yoziladi; darajalar va tartib raqamlari to'g'ri", async () => {
    report = loadWordFiles();
    assert.equal(report.errors.length, 0);
    const t0 = Date.now();
    const { added, skipped } = await insertWords(db, report.words);
    const ms = Date.now() - t0;
    assert.equal(added, report.words.length);
    assert.equal(skipped, 0);
    assert.ok(ms < 30_000, `juda sekin: ${ms} ms`);
    console.log(`    (${added} ta so'z ${ms} ms da yozildi)`);

    const byLevel = await db.word.groupBy({ by: ['level'], _count: { _all: true } });
    const counts = Object.fromEntries(byLevel.map((r) => [r.level, r._count._all]));
    assert.deepEqual(Object.keys(counts).sort(), ['A1', 'A2', 'B1', 'B2']);
    assert.ok(counts.A1 > 800 && counts.A2 > 900);

    // Har darajada tartib raqamlari 1 dan boshlanib takrorlanmasligi kerak
    for (const level of ['A1', 'A2', 'B1', 'B2']) {
      const rows = await db.word.findMany({ where: { level }, select: { position: true } });
      const positions = rows.map((r) => r.position).sort((a, b) => a - b);
      assert.equal(new Set(positions).size, positions.length, `${level}: tartib raqami takrorlangan`);
      assert.equal(positions[0], 1);
      assert.equal(positions.at(-1), positions.length);
    }
  });

  it("qayta yozilsa takrorlanmaydi (noyob indeks ishlaydi)", async () => {
    const before = await db.word.count();
    const { added, skipped } = await insertWords(db, report.words);
    assert.equal(added, 0);
    assert.equal(skipped, report.words.length);
    assert.equal(await db.word.count(), before);
  });

  it("bir xil turkcha+o'zbekcha juftlikni ikkinchi marta yozib bo'lmaydi (baza darajasida)", async () => {
    const w = await db.word.findFirst();
    await assert.rejects(
      () => db.word.create({ data: { turkish: w.turkish, uzbek: w.uzbek, level: 'C1', position: 9999 } }),
      (e) => e.code === 'P2002',
    );
  });
});

describe('baza cheklovlari va bog\'lanishlari', () => {
  it("bir xil email bilan ikkinchi hisob ochib bo'lmaydi (409)", async () => {
    await student('unique@example.com');
    const r = await agent().post('/auth/register').send(reg({ email: 'unique@example.com' }));
    assert.equal(r.status, 409);
  });

  it("email katta harf bilan yozilsa ham bir xil hisob deb qaraladi", async () => {
    const r = await agent().post('/auth/register').send(reg({ email: 'UNIQUE@Example.com' }));
    assert.equal(r.status, 409);
  });

  it("foydalanuvchi o'chirilsa, uning tokenlari ham o'chadi (tashqi kalit kaskadi)", async () => {
    const { a, id } = await student('cascade@example.com');
    await a.get('/auth/me');
    assert.ok((await db.refreshToken.count({ where: { userId: id } })) > 0);
    await db.user.delete({ where: { id } });
    assert.equal(await db.refreshToken.count({ where: { userId: id } }), 0);
    assert.equal(await db.userStats.count({ where: { userId: id } }), 0);
  });

  it("jurnal yozuvi foydalanuvchi o'chganda saqlanadi (userId null bo'ladi)", async () => {
    const { id } = await student('audit@example.com');
    assert.ok((await db.auditLog.count({ where: { userId: id } })) > 0);
    await db.user.delete({ where: { id } });
    const kept = await db.auditLog.findFirst({ where: { action: 'REGISTER' }, orderBy: { createdAt: 'desc' } });
    assert.ok(kept, 'jurnal yozuvi o\'chib ketmasligi kerak');
  });
});

describe('seans tokenlari: parallel so\'rovlar (haqiqiy tranzaksiya)', () => {
  it("bir vaqtda 5 ta yangilash so'rovidan faqat bittasi muvaffaqiyatli bo'ladi", async () => {
    const { a } = await student('race@example.com');
    const cookies = (await a.post('/auth/login').send({ identifier: 'race@example.com', password: PW }))
      .headers['set-cookie'];
    const rt = cookies.find((c) => c.startsWith('sh_rt=')).split(';')[0].split('=')[1];

    const results = await Promise.all(
      Array.from({ length: 5 }, () => request(server).post('/auth/refresh').set(CSRF).set('Cookie', `sh_rt=${rt}`)),
    );
    const okCount = results.filter((r) => r.status === 200).length;
    assert.equal(okCount, 1, `faqat bitta so'rov o'tishi kerak edi, o'tdi: ${okCount}`);
  });
});

describe("o'yinlar: haqiqiy lug'at hajmida", () => {
  let a, id;
  before(async () => ({ a, id } = await student('game@example.com')));

  it("savollar to'plami tez keladi va faqat tanlangan darajadan bo'ladi", async () => {
    const t0 = Date.now();
    const r = await a.get('/games/quiz?limit=10&level=B1');
    const ms = Date.now() - t0;
    assert.equal(r.status, 200);
    assert.equal(r.body.questions.length, 10);
    console.log(`    (2755 so'zli bazada savollar: ${ms} ms)`);
    assert.ok(ms < 5000, `juda sekin: ${ms} ms`);
    // So'z ID si tokendan olinadi: bir xil turkcha so'z bir nechta darajada bo'lishi mumkin,
    // shuning uchun nom bo'yicha qidirish noto'g'ri natija beradi.
    const ids = r.body.questions.map((q) => openQuiz(q.token).w);
    const rows = await db.word.findMany({ where: { id: { in: ids } }, select: { level: true } });
    assert.equal(rows.length, ids.length);
    assert.ok(rows.every((w) => w.level === 'B1'), "hamma savol B1 darajasidan bo'lishi kerak");
  });

  it("to'g'ri javob yozilgach UserWord (qo'shma kalit) va statistika yangilanadi", async () => {
    const q = (await a.get('/games/quiz?limit=1')).body.questions[0];
    const meta = openQuiz(q.token);
    const r = await a.post('/games/answer').send({ token: q.token, choice: meta.c });
    assert.equal(r.status, 201);
    assert.equal(r.body.correct, true);
    assert.equal(r.body.xpGained, 10);
    const uw = await db.userWord.findUnique({ where: { userId_wordId: { userId: id, wordId: meta.w } } });
    assert.ok(uw, "UserWord yozuvi yaratilishi kerak");
    assert.equal(uw.box, 2);
    assert.ok(uw.nextReviewAt instanceof Date && uw.nextReviewAt > new Date());
    const stats = await db.userStats.findUnique({ where: { userId: id } });
    assert.equal(stats.xp, 10);
    assert.equal(stats.streak, 1);
  });

  it("haftalik reyting SQL agregatsiyasi ishlaydi va faqat rozilik berganlar chiqadi", async () => {
    assert.deepEqual((await a.get('/games/leaderboard')).body, []);
    await a.patch('/games/leaderboard-optin').send({ optIn: true });
    const board = (await a.get('/games/leaderboard')).body;
    assert.equal(board.length, 1);
    assert.equal(board[0].name, 'Aziza K.');
    assert.ok(board[0].xp > 0);
    assert.equal(board[0].isMe, true);
  });
});

describe('guruh, vazifa va davomat (haqiqiy sana turi)', () => {
  let teacher, s1;
  before(async () => {
    teacher = await staff('ustoz@example.com', 'TEACHER');
    s1 = await student('talaba@example.com');
  });

  it("guruh yaratiladi, o'quvchi qo'shiladi, vazifa baholanadi", async () => {
    const g = (await teacher.a.post('/groups').send({ name: 'A1 kechki', level: 'A1' })).body;
    assert.equal((await teacher.a.post(`/groups/${g.id}/members`).send({ identifier: 'talaba@example.com' })).status, 201);
    const hw = (await teacher.a.post(`/groups/${g.id}/homework`).send({ title: 'Oila', description: '5 jumla', maxScore: 50 })).body;
    const sub = (await s1.a.post(`/homework/${hw.id}/submission`).send({ text: 'Mening oilam' })).body;
    const graded = await teacher.a.patch(`/submissions/${sub.id}`).send({ score: 45, feedback: 'Zo\'r' });
    assert.equal(graded.status, 200);
    const row = await db.submission.findUnique({ where: { id: sub.id } });
    assert.equal(row.score, 45);
    assert.equal(row.status, 'GRADED');
    teacher.groupId = g.id;
  });

  it("davomat sanasi DATE turida saqlanadi va bir kunga bitta yozuv bo'ladi", async () => {
    const date = tashkentDay(new Date());
    const body = { date, records: [{ userId: s1.id, present: true }] };
    assert.equal((await teacher.a.put(`/groups/${teacher.groupId}/attendance`).send(body)).status, 200);
    body.records[0].present = false;
    assert.equal((await teacher.a.put(`/groups/${teacher.groupId}/attendance`).send(body)).status, 200);
    const rows = await db.attendance.findMany({ where: { groupId: teacher.groupId, userId: s1.id } });
    assert.equal(rows.length, 1, 'qayta saqlash yangi qator yaratmasligi kerak');
    assert.equal(rows[0].present, false);
    assert.equal(rows[0].date.toISOString().slice(0, 10), date);
  });

  it("boshqa guruhning o'quvchisi kira olmaydi (404)", async () => {
    const other = await student('begona@example.com');
    assert.equal((await other.a.get(`/groups/${teacher.groupId}`)).status, 404);
  });
});

describe('salomatlik tekshiruvi (health)', () => {
  it("kirishsiz ochiq va bazaga haqiqiy so'rov yuboradi", async () => {
    const r = await request(server).get('/health');
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, { status: 'ok' });
  });

  it("baza ishlamasa 503 qaytadi va ichki tafsilot oshkor bo'lmaydi", async () => {
    const broken = { $queryRaw: () => Promise.reject(new Error('parol: maxfiy-parol-123')) };
    const mod = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue(broken).compile();
    const app2 = mod.createNestApplication();
    configureApp(app2);
    await app2.init();
    const r = await request(app2.getHttpServer()).get('/health');
    assert.equal(r.status, 503);
    assert.equal(r.body.database, 'down');
    assert.ok(!JSON.stringify(r.body).includes('maxfiy-parol'), "xato matni oshkor bo'lmasligi kerak");
    await app2.close();
  });
});

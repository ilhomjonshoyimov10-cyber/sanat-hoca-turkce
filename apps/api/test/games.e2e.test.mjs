// O'yinlar: savollar, javob tekshiruvi, XP, takrorlash, seriya, reyting.
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
const { decrypt } = await import('../dist/auth/crypto.js');
const { dayBefore, tashkentDay } = await import('../dist/games/srs.js');

const CSRF = { 'X-Requested-With': 'XMLHttpRequest', Origin: 'http://localhost:3000' };
const PW = 'olma-daraxti-sakkiz-kuz';
const WORDS = ['merhaba:salom', 'su:suv', 'ekmek:non', 'çay:choy', 'elma:olma', 'kitap:kitob', 'kalem:qalam',
  'okul:maktab', 'ev:uy', 'kedi:mushuk', 'köpek:it', 'şehir:shahar'];

async function makeApp() {
  const prisma = createFakePrisma();
  WORDS.forEach((w, i) => {
    const [turkish, uzbek] = w.split(':');
    prisma.db.words.push({ id: `w${i}`, turkish, uzbek, level: 'A1', position: i, exampleTr: null, audioUrl: null });
  });
  const mod = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService).useValue(prisma).compile();
  const app = mod.createNestApplication();
  configureApp(app);
  await app.init();
  return { app, prisma, server: app.getHttpServer() };
}

const reg = (over) => ({ firstName: 'Aziza', lastName: 'Karimova', password: PW, birthDate: '1995-03-10', acceptTerms: true, ...over });
const secretOf = (token) => JSON.parse(decrypt(token, process.env.JWT_ACCESS_SECRET, 'quiz'));
async function login(ctx, email, over = {}) {
  const a = request.agent(ctx.server).set(CSRF);
  const r = await a.post('/auth/register').send(reg({ email, ...over }));
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return a;
}

describe("o'yin: savollar va javoblar", () => {
  let ctx, a, questions;
  before(async () => {
    ctx = await makeApp();
    a = await login(ctx, 'aziza@example.com');
  });
  after(() => ctx.app.close());

  it('kirmagan foydalanuvchi savol ola olmaydi', async () => {
    assert.equal((await request(ctx.server).get('/games/quiz')).status, 401);
  });

  it("savollarda to'g'ri javob ko'rinmaydi: token shifrlangan, so'z ID si oshkor emas", async () => {
    const r = await a.get('/games/quiz?limit=5');
    assert.equal(r.status, 200);
    questions = r.body.questions;
    assert.equal(questions.length, 5);
    for (const q of questions) {
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4, 'variantlar takrorlanmasin');
    }
    const raw = JSON.stringify(r.body);
    assert.ok(!/correct|"w\d+"|"c":/.test(raw), 'javobda to\'g\'ri javob/ID bo\'lmasin');
    assert.equal(r.body.questions[0].prompt, 'merhaba'); // yangi so'zlar tartib bo'yicha
  });

  it("to'g'ri javob: +10 XP, seriya 1, so'z 2-qutiga tushadi", async () => {
    const meta = secretOf(questions[0].token);
    const r = await a.post('/games/answer').send({ token: questions[0].token, choice: meta.c });
    assert.equal(r.status, 201);
    assert.equal(r.body.correct, true);
    assert.equal(r.body.xpGained, 10);
    assert.equal(r.body.stats.xp, 10);
    assert.equal(r.body.stats.streak, 1);
    assert.equal(r.body.stats.learnedWords, 1);
    const row = ctx.prisma.db.userWords.find((u) => u.wordId === meta.w);
    assert.equal(row.box, 2);
    assert.ok(row.nextReviewAt.getTime() - Date.now() > 23 * 3600_000, '1 kundan keyin takrorlanadi');
  });

  it('xuddi shu savolni qayta yuborib XP "ishlab" bo\'lmaydi', async () => {
    const meta = secretOf(questions[0].token);
    const r = await a.post('/games/answer').send({ token: questions[0].token, choice: meta.c });
    assert.equal(r.body.xpGained, 0);
    assert.equal(r.body.stats.xp, 10);
  });

  it("noto'g'ri javob: XP yo'q, so'z 1-qutida, 10 daqiqadan keyin qayta so'raladi", async () => {
    const meta = secretOf(questions[1].token);
    const wrong = (meta.c + 1) % 4;
    const r = await a.post('/games/answer').send({ token: questions[1].token, choice: wrong });
    assert.equal(r.body.correct, false);
    assert.equal(r.body.correctIndex, meta.c);
    assert.equal(r.body.xpGained, 0);
    const row = ctx.prisma.db.userWords.find((u) => u.wordId === meta.w);
    assert.equal(row.box, 1);
    assert.ok(row.nextReviewAt.getTime() - Date.now() < 11 * 60_000);
  });

  it("buzilgan, boshqa odamniki va noto'g'ri formatdagi javoblar rad etiladi", async () => {
    assert.equal((await a.post('/games/answer').send({ token: 'garbage', choice: 0 })).status, 400);
    const tampered = questions[2].token.slice(0, -3) + 'abc';
    assert.equal((await a.post('/games/answer').send({ token: tampered, choice: 0 })).status, 400);
    assert.equal((await a.post('/games/answer').send({ token: questions[2].token, choice: 4 })).status, 400);

    const other = await login(ctx, 'boshqa@example.com');
    const r = await other.post('/games/answer').send({ token: questions[2].token, choice: secretOf(questions[2].token).c });
    assert.equal(r.status, 400, 'boshqa foydalanuvchining tokeni ishlamasligi kerak');
  });

  it("o'rganilgan so'zlar yangi savollarda takrorlanmaydi; vaqti kelgan so'z birinchi chiqadi", async () => {
    let r = await a.get('/games/quiz?limit=20');
    // ANIQ SON TEKSHIRILMAYDI. Sabab: endi javob berilgan so'zlar ham,
    // shunchaki KO'RSATILGAN so'zlar ham darhol qaytmaydi (takrorlanishdan
    // himoya). Avvalgi testlar bir nechta so'zni ko'rsatgan, shuning uchun
    // son ularning sonidan kelib chiqadi. Qoidaning o'zi tekshiriladi:
    //   • o'rganilgan (javob berilgan) so'z yangi savolda chiqmasin
    //   • bitta to'plam ichida so'z ikki marta bo'lmasin
    const learnedIds = new Set(ctx.prisma.db.userWords.map((u) => u.wordId));
    const learnedWords = new Set(
      ctx.prisma.db.words.filter((w) => learnedIds.has(w.id)).map((w) => w.turkish),
    );
    const prompts = r.body.questions.map((q) => q.prompt);
    assert.ok(prompts.length > 0, 'savollar umuman kelmadi');
    assert.equal(new Set(prompts).size, prompts.length, "bitta to'plamda so'z takrorlandi");
    for (const p of prompts) {
      assert.ok(!learnedWords.has(p), `o'rganilgan so'z yana chiqdi: ${p}`);
    }
    assert.equal(r.body.dueCount, 0);

    const wrongWord = ctx.prisma.db.userWords.find((u) => u.box === 1);
    wrongWord.nextReviewAt = new Date(Date.now() - 1000); // vaqti keldi
    r = await a.get('/games/quiz?limit=3');
    assert.equal(r.body.dueCount, 1);
    assert.equal(r.body.questions[0].prompt, 'su', 'takrorlash birinchi keladi');
  });

  it("seriya: kecha faol bo'lgan bo'lsa bugun 2 ga oshadi", async () => {
    const stats = ctx.prisma.db.stats[0];
    stats.lastActiveDay = new Date(`${dayBefore(tashkentDay(new Date()))}T00:00:00Z`);
    stats.streak = 1;
    const q = (await a.get('/games/quiz?limit=1')).body.questions[0];
    const r = await a.post('/games/answer').send({ token: q.token, choice: secretOf(q.token).c });
    assert.equal(r.body.stats.streak, 2);
  });
});

describe('reyting', () => {
  let ctx, adult, minor;
  before(async () => {
    ctx = await makeApp();
    adult = await login(ctx, 'adult@example.com', { firstName: 'Dilnoza', lastName: 'Yusupova' });
    minor = await login(ctx, 'minor@example.com', { birthDate: '2012-05-05' });
  });
  after(() => ctx.app.close());

  const play = async (agent) => {
    const q = (await agent.get('/games/quiz?limit=1')).body.questions[0];
    return agent.post('/games/answer').send({ token: q.token, choice: secretOf(q.token).c });
  };

  it("rozilik bermaganlar reytingda ko'rinmaydi", async () => {
    await play(adult);
    assert.deepEqual((await adult.get('/games/leaderboard')).body, []);
  });

  it("rozilik bergan kattalar \"Ism F.\" ko'rinishida chiqadi, boshqalarning ID si oshkor bo'lmaydi", async () => {
    assert.equal((await adult.patch('/games/leaderboard-optin').send({ optIn: true })).status, 200);
    const r = await adult.get('/games/leaderboard');
    assert.equal(r.body.length, 1);
    assert.deepEqual(r.body[0], { rank: 1, name: 'Dilnoza Y.', xp: 10, isMe: true });
    const asOther = await minor.get('/games/leaderboard');
    assert.equal(asOther.body[0].isMe, false);
  });

  it("18 yoshgacha bo'lgan o'quvchi ota-ona roziligisiz reytingga qo'shila olmaydi", async () => {
    assert.equal((await minor.patch('/games/leaderboard-optin').send({ optIn: true })).status, 403);
    ctx.prisma.db.users.find((u) => u.email === 'minor@example.com').parentConsent = true;
    assert.equal((await minor.patch('/games/leaderboard-optin').send({ optIn: true })).status, 200);
  });
});

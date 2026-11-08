// Yangi o'yinlar: juftlikni top, harflardan so'z yig'ish, tinglab yozish.
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

const CSRF = { 'X-Requested-With': 'XMLHttpRequest', Origin: 'http://localhost:3000' };
const PW = 'olma-daraxti-sakkiz-kuz';
// tartib muhim: yangi so'zlar shu ketma-ketlikda beriladi
const WORDS = ['güzel:chiroyli', 'çay:choy', 'şehir:shahar', 'öğrenci:o\'quvchi', 'ağaç:daraxt', 'kitap:kitob',
  'okul:maktab', 'kedi:mushuk', 'köpek:it', 'iyi akşamlar:xayrli kech', 'su:suv', 'ev:uy'];

let ctx;
const open = (token, purpose) => JSON.parse(decrypt(token, process.env.JWT_ACCESS_SECRET, purpose));
const turkishOf = (id) => ctx.prisma.db.words.find((w) => w.id === id).turkish;
const reg = async (email) => {
  const a = request.agent(ctx.server).set(CSRF);
  const r = await a.post('/auth/register').send({ firstName: 'Aziza', lastName: 'Karimova', email, password: PW, birthDate: '1995-01-01', acceptTerms: true });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return a;
};

before(async () => {
  const prisma = createFakePrisma();
  WORDS.forEach((w, i) => {
    const [turkish, uzbek] = w.split(':');
    prisma.db.words.push({ id: `w${i}`, turkish, uzbek, level: 'A1', position: i, exampleTr: null, audioUrl: null });
  });
  const mod = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(PrismaService).useValue(prisma).compile();
  const app = mod.createNestApplication();
  configureApp(app);
  await app.init();
  ctx = { app, prisma, server: app.getHttpServer() };
});
after(() => ctx.app.close());

describe('Juftlikni top', () => {
  let a, set, meta;
  before(async () => { a = await reg('match@example.com'); });

  it("6 ta juftlik beriladi; to'g'ri moslik klientga oshkor bo'lmaydi", async () => {
    set = (await a.get('/games/match')).body;
    assert.equal(set.left.length, 6);
    assert.deepEqual([...set.right].sort(), set.left.map((tr) => ctx.prisma.db.words.find((w) => w.turkish === tr).uzbek).sort());
    assert.ok(!/"m"|"w"|correct/.test(JSON.stringify(set)), 'javobda moslik/ID bo\'lmasin');
    meta = open(set.token, 'match');
  });
  it("hamma juftlik to'g'ri: 60 XP; xuddi shu tokenni qayta yuborib XP olib bo'lmaydi", async () => {
    const pairs = set.left.map((_, left) => ({ left, right: meta.m.indexOf(left) }));
    const r = await a.post('/games/match/answer').send({ token: set.token, pairs });
    assert.equal(r.status, 201);
    assert.equal(r.body.results.every((x) => x.correct), true);
    assert.equal(r.body.xpGained, 60);
    assert.equal(r.body.stats.xp, 60);
    assert.equal(r.body.stats.learnedWords, 6);
    assert.deepEqual(r.body.correctRight, pairs.map((p) => p.right));
    const again = await a.post('/games/match/answer').send({ token: set.token, pairs });
    assert.equal(again.body.xpGained, 0);
    assert.equal(again.body.stats.xp, 60);
  });
  it("noto'g'ri juftliklar: XP yo'q, so'zlar 1-qutiga qaytadi", async () => {
    const b = await reg('match2@example.com');
    const s = (await b.get('/games/match')).body;
    const m = open(s.token, 'match').m;
    const wrong = s.left.map((_, left) => ({ left, right: m.indexOf((left + 1) % 6) })); // hammasi bitta siljitilgan
    const r = await b.post('/games/match/answer').send({ token: s.token, pairs: wrong });
    assert.equal(r.body.xpGained, 0);
    assert.equal(r.body.results.some((x) => x.correct), false);
    const me = ctx.prisma.db.users.find((u) => u.email === 'match2@example.com');
    assert.ok(ctx.prisma.db.userWords.filter((u) => u.userId === me.id).every((u) => u.box === 1));
  });
  it("noto'g'ri so'rovlar: takroriy indeks, chegaradan tashqari, bo'sh, buzilgan va boshqa odamning tokeni", async () => {
    const s = (await (await reg('match3@example.com')).get('/games/match')).body;
    const c = await reg('match4@example.com');
    const send = (agent, body) => agent.post('/games/match/answer').send({ token: s.token, ...body });
    assert.equal((await send(c, { pairs: [{ left: 0, right: 0 }, { left: 0, right: 1 }] })).status, 400);
    assert.equal((await send(c, { pairs: [{ left: 0, right: 0 }, { left: 1, right: 0 }] })).status, 400);
    assert.equal((await send(c, { pairs: [{ left: 9, right: 0 }] })).status, 400);
    assert.equal((await send(c, { pairs: [] })).status, 400);
    assert.equal((await send(c, { pairs: [{ left: 0, right: 0 }] })).status, 400, 'boshqa foydalanuvchining tokeni');
    assert.equal((await c.post('/games/match/answer').send({ token: s.token.slice(0, -4) + 'abcd', pairs: [{ left: 0, right: 0 }] })).status, 400);
  });
  it("hamma so'z o'rganilgach bo'sh to'plam qaytadi", async () => {
    const d = await reg('match5@example.com');
    for (let round = 0; round < 2; round++) {
      const s = (await d.get('/games/match')).body;
      const m = open(s.token, 'match').m;
      await d.post('/games/match/answer').send({ token: s.token, pairs: s.left.map((_, left) => ({ left, right: m.indexOf(left) })) });
    }
    const empty = (await d.get('/games/match')).body;
    assert.deepEqual(empty, { token: null, left: [], right: [] });
  });
});

describe("Harflardan so'z yig'ish", () => {
  let a, items;
  before(async () => { a = await reg('builder@example.com'); });

  it("harflar aralashtirib beriladi; so'zning o'zi oshkor bo'lmaydi; qisqa va ko'p so'zli iboralar chiqmaydi", async () => {
    items = (await a.get('/games/builder?limit=5')).body.items;
    assert.equal(items.length, 5);
    for (const it of items) {
      const word = turkishOf(open(it.token, 'builder').w);
      assert.deepEqual([...it.tiles].sort(), [...word].sort(), "harflar to'plami mos bo'lsin");
      assert.notEqual(it.tiles.join(''), word, 'aralashtirilgan bo\'lsin');
      assert.equal(it.text, undefined, "so'zning o'zi yuborilmasin");
      assert.ok(!JSON.stringify(it).includes(word));
      assert.ok(word.length >= 3 && !word.includes(' '));
    }
  });
  it("to'g'ri javob (katta harflar bilan ham: ŞEHİR = şehir) XP beradi; qayta yuborilsa bermaydi", async () => {
    const it = items.find((x) => turkishOf(open(x.token, 'builder').w) === 'şehir');
    const r = await a.post('/games/builder/answer').send({ token: it.token, answer: 'ŞEHİR' });
    assert.equal(r.body.correct, true);
    assert.equal(r.body.xpGained, 10);
    const again = await a.post('/games/builder/answer').send({ token: it.token, answer: 'şehir' });
    assert.equal(again.body.xpGained, 0);
  });
  it("noto'g'ri javob to'g'ri so'zni ko'rsatadi; boshqa o'yin tokeni ishlamaydi", async () => {
    const it = items.find((x) => turkishOf(open(x.token, 'builder').w) === 'güzel');
    const r = await a.post('/games/builder/answer').send({ token: it.token, answer: 'zegül' });
    assert.deepEqual([r.body.correct, r.body.almost, r.body.answer, r.body.xpGained], [false, false, 'güzel', 0]);
    const listenItem = (await a.get('/games/listen?limit=1')).body.items[0];
    assert.equal((await a.post('/games/builder/answer').send({ token: listenItem.token, answer: 'x' })).status, 400);
  });
});

describe('Tinglab yozish', () => {
  let a, items;
  before(async () => { a = await reg('listen@example.com'); });

  it("so'z ovoz chiqarish uchun beriladi (harflar aralashtirilmaydi)", async () => {
    items = (await a.get('/games/listen?limit=5')).body.items;
    assert.equal(items.length, 5);
    assert.ok(items.every((i) => typeof i.text === 'string' && i.tiles === undefined));
  });
  it("diakritiksiz yozilsa 'deyarli' deyiladi (XP yo'q); to'g'ri yozilsa XP; butunlay xato: deyarli emas", async () => {
    const byWord = (w) => items.find((i) => i.text === w);
    const near = await a.post('/games/listen/answer').send({ token: byWord('güzel').token, answer: 'guzel' });
    assert.deepEqual([near.body.correct, near.body.almost, near.body.xpGained], [false, true, 0]);
    const ok = await a.post('/games/listen/answer').send({ token: byWord('öğrenci').token, answer: 'Öğrenci ' });
    assert.deepEqual([ok.body.correct, ok.body.xpGained], [true, 10]);
    const bad = await a.post('/games/listen/answer').send({ token: byWord('çay').token, answer: 'tea' });
    assert.deepEqual([bad.body.correct, bad.body.almost], [false, false]);
    const dotless = await a.post('/games/listen/answer').send({ token: byWord('ağaç').token, answer: 'agac' });
    assert.equal(dotless.body.almost, true);
  });
  it("ruxsat: kirmagan foydalanuvchi va uzun javob rad etiladi", async () => {
    assert.equal((await request(ctx.server).get('/games/listen')).status, 401);
    assert.equal((await a.post('/games/listen/answer').send({ token: items[0].token, answer: 'x'.repeat(41) })).status, 400);
  });
});

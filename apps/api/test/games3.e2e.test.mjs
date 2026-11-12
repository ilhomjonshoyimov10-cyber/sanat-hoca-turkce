// Yangi o'yinlar (bo'shliq, fe'l, suhbat, zid ma'no, ortiqcha so'z) va
// TAKRORLANMASLIK.
//
// Eng muhim ikki narsa:
//   1. To'g'ri javob SAVOL BILAN BIRGA kelmasin. Variantli o'yinlarda
//      to'g'ri indeks shifrlangan tokenda yuradi — agar u javobda
//      ko'rinsa, o'quvchi sahifa kodidan javobni o'qib oladi.
//   2. MATERIAL TAKRORLANMASIN. Foydalanuvchi shikoyati aynan shu edi:
//      "so'z mashqida qayta-qayta ishlaganda o'sha so'zlar takrorlanadi".
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

const CSRF = { 'X-Requested-With': 'XMLHttpRequest', Origin: 'http://localhost:3000' };
const PW = 'olma-daraxti-sakkiz-kuz';

let ctx, A, B;

async function addStudent(email, first) {
  const agent = request.agent(ctx.server).set(CSRF);
  const r = await agent.post('/auth/register').send({
    firstName: first, lastName: 'Karimova', email, password: PW, birthDate: '1995-01-01', acceptTerms: true,
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return { agent, id: r.body.user.id };
}

before(async () => {
  const prisma = createFakePrisma();

  // ── Bo'shliq to'ldirish: 12 ta, hammasi A1 ──
  for (let i = 0; i < 12; i++) {
    prisma.db.clozeItems.push({
      id: `c${i}`,
      full: `Ben okul${i}a gidiyorum`,
      masked: `Ben okul${i}__ gidiyorum`,
      answer: `a${i}`,
      options: [`e${i}`, `i${i}`, `u${i}`],
      uzbek: `Men maktabga ${i}`,
      explanation: 'yo‘nalish kelishigi',
      topic: 'kelishik',
      level: 'A1', verified: true, position: i, createdAt: new Date(),
    });
  }

  // ── Fe'l shakllari ──
  prisma.db.verbForms.push(
    { id: 'v1', infinitive: 'gitmek', person: 'ben', tense: 'şimdiki zaman', negative: false, answer: 'gidiyorum', uzbek: 'men ketyapman', explanation: 't -> d', level: 'A1', verified: true, position: 0, createdAt: new Date() },
    { id: 'v2', infinitive: 'gelmek', person: 'sen', tense: 'şimdiki zaman', negative: false, answer: 'geliyorsun', uzbek: 'sen kelyapsan', explanation: null, level: 'A1', verified: true, position: 1, createdAt: new Date() },
  );

  // ── Suhbat ──
  prisma.db.dialogueItems.push(
    { id: 'dg1', prompt: 'Nasılsın?', answer: 'İyiyim, teşekkürler', options: ['Saat üç', 'Ekmek', 'Mavi'], situation: 'tanishuv', uzbek: 'Qalaysan?', level: 'A1', verified: true, position: 0, createdAt: new Date() },
    { id: 'dg2', prompt: 'Adın ne?', answer: 'Benim adım Ali', options: ['Yarın', 'Çok pahalı', 'Hayır'], situation: 'tanishuv', uzbek: 'Isming nima?', level: 'A1', verified: true, position: 1, createdAt: new Date() },
  );

  // ── Zid ma'noli so'zlar ──
  const pairs = [['büyük', 'küçük'], ['uzun', 'kısa'], ['sıcak', 'soğuk'], ['yeni', 'eski'], ['hızlı', 'yavaş']];
  pairs.forEach(([first, second], i) => {
    prisma.db.wordPairs.push({
      id: `p${i}`, kind: 'ANTONYM', first, second, uzbek: null,
      level: 'A1', verified: true, position: i, createdAt: new Date(),
    });
  });

  // ── Lug'at: "ortiqcha so'zni top" uchun mavzular kerak ──
  const vocab = [
    ['elma', 'olma', 'meva'], ['armut', 'nok', 'meva'], ['üzüm', 'uzum', 'meva'], ['kiraz', 'gilos', 'meva'],
    ['kedi', 'mushuk', 'hayvon'], ['köpek', 'it', 'hayvon'], ['kuş', 'qush', 'hayvon'], ['balık', 'baliq', 'hayvon'],
    ['masa', 'stol', 'uy'], ['sandalye', 'stul', 'uy'], ['kapı', 'eshik', 'uy'], ['pencere', 'deraza', 'uy'],
  ];
  vocab.forEach(([turkish, uzbek, category], i) => {
    prisma.db.words.push({
      id: `w${i}`, turkish, uzbek, russian: null, exampleTr: null, exampleUz: null, exampleRu: null,
      audioUrl: null, level: 'A1', category, position: i, partOfSpeech: null, pronunciation: null,
      tags: [], frequency: null, verified: true, notes: null, createdAt: new Date(), updatedAt: new Date(),
    });
  });

  const mod = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService).useValue(prisma).compile();
  const app = mod.createNestApplication();
  configureApp(app);
  await app.init();
  ctx = { app, prisma, server: app.getHttpServer() };

  A = await addStudent('a@talaba.uz', 'Aziza');
  B = await addStudent('b@talaba.uz', 'Bobur');
});
after(() => ctx.app.close());

// ═══════════════════════ Javob sizib chiqmasligi ═══════════════════════

describe("javob savol bilan kelmaydi", () => {
  it("bo'shliq o'yinida to'g'ri indeks yo'q", async () => {
    const r = await A.agent.get('/games/cloze?level=A1&limit=3');
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.ok(r.body.items.length > 0);
    for (const it of r.body.items) {
      assert.equal(it.correctIndex, undefined);
      assert.equal(it.answer, undefined);
      assert.equal(it.full, undefined, "to'liq jumla javob bilan kelib qoldi");
      assert.equal(it.explanation, undefined);
      assert.ok(Array.isArray(it.options) && it.options.length >= 2);
    }
  });

  it("suhbat o'yinida to'g'ri javob yo'q", async () => {
    const r = await A.agent.get('/games/dialogue?level=A1&limit=2');
    assert.equal(r.status, 200);
    for (const it of r.body.items) {
      assert.equal(it.answer, undefined);
      assert.equal(it.correctIndex, undefined);
    }
  });

  it("fe'l o'yinida javob yo'q", async () => {
    const r = await A.agent.get('/games/verb?level=A1&limit=2');
    assert.equal(r.status, 200);
    for (const it of r.body.items) {
      assert.equal(it.answer, undefined);
      assert.equal(it.explanation, undefined);
      assert.ok(it.infinitive && it.person && it.tense);
    }
  });

  it("zid ma'no o'yinida javob yo'q", async () => {
    const r = await A.agent.get('/games/antonym?level=A1&limit=3');
    assert.equal(r.status, 200);
    for (const it of r.body.items) {
      assert.equal(it.answer, undefined);
      assert.equal(it.correctIndex, undefined);
      assert.ok(it.word);
    }
  });

  it("ortiqcha so'z o'yinida javob yo'q", async () => {
    const r = await A.agent.get('/games/odd?level=A1&limit=2');
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.ok(r.body.items.length > 0, 'savollar yaratilmadi');
    for (const it of r.body.items) {
      assert.equal(it.correctIndex, undefined);
      assert.equal(it.options.length, 4);
    }
  });
});

// ═══════════════════════ Javob berish ═══════════════════════

describe('javob berish', () => {
  it("bo'shliq: to'g'ri javob XP beradi, izoh shundan keyin ko'rinadi", async () => {
    const set = await A.agent.get('/games/cloze?level=A1&limit=1');
    const item = set.body.items[0];
    // To'g'ri variant — "a" bilan boshlanadigan (test ma'lumotida shunday tuzilgan)
    const idx = item.options.findIndex((o) => o.startsWith('a'));
    const r = await A.agent.post('/games/cloze/answer').send({ token: item.token, choice: idx });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.body.correct, true);
    assert.ok(r.body.xpGained > 0);
    assert.ok(r.body.explanation, 'javobdan keyin izoh berilishi kerak');
  });

  it("fe'l: turkcha harflarsiz yozilsa 'deyarli to'g'ri'", async () => {
    const set = await A.agent.get('/games/verb?level=A1&limit=2');
    const item = set.body.items.find((i) => i.infinitive === 'gelmek');
    const r = await A.agent.post('/games/verb/answer').send({ token: item.token, answer: 'geliyorsun' });
    assert.equal(r.body.correct, true);
  });

  it("BOSHQA odamning tokeni ishlamaydi", async () => {
    const set = await A.agent.get('/games/cloze?level=A1&limit=1');
    const r = await B.agent.post('/games/cloze/answer').send({ token: set.body.items[0].token, choice: 0 });
    assert.equal(r.status, 400);
  });

  it("buzilgan token ishlamaydi", async () => {
    const r = await A.agent.post('/games/dialogue/answer').send({ token: 'aaaa.bbbb.cccc', choice: 0 });
    assert.equal(r.status, 400);
  });
});

// ═══════════════════════ TAKRORLANMASLIK ═══════════════════════

describe('material takrorlanmaydi', () => {
  it("ketma-ket 4 ta to'plamda bo'shliq mashqlari takrorlanmaydi", async () => {
    // 12 ta mashq bor, har safar 3 tadan olamiz -> to'rtta to'plam
    // hammasini QAMRAB OLISHI va hech biri ikki marta chiqmasligi kerak.
    const fresh = await addStudent('rot1@talaba.uz', 'Rotatsiya');
    const seen = [];
    for (let round = 0; round < 4; round++) {
      const r = await fresh.agent.get('/games/cloze?level=A1&limit=3');
      assert.equal(r.status, 200);
      assert.equal(r.body.items.length, 3, `${round}-to'plamda 3 ta mashq kelmadi`);
      for (const it of r.body.items) seen.push(it.masked);
    }
    const unique = new Set(seen);
    assert.equal(
      unique.size,
      12,
      `12 ta mashqdan ${unique.size} tasi chiqdi — demak ba'zilari takrorlandi`,
    );
  });

  it('zaxira tugagach mashq qaytadan berilaveradi (to‘xtab qolmaydi)', async () => {
    const fresh = await addStudent('rot2@talaba.uz', 'Aylanma');
    // 12 tani tugatamiz
    for (let i = 0; i < 4; i++) await fresh.agent.get('/games/cloze?level=A1&limit=3');
    // Beshinchi marta ham bo'sh qaytmasligi kerak
    const r = await fresh.agent.get('/games/cloze?level=A1&limit=3');
    assert.equal(r.body.items.length, 3, 'zaxira tugagach mashq berilmay qoldi');
  });

  it("har bir foydalanuvchining tarixi alohida", async () => {
    const u1 = await addStudent('rot3@talaba.uz', 'Birinchi');
    const u2 = await addStudent('rot4@talaba.uz', 'Ikkinchi');
    // u1 hammasini ko'rib chiqadi
    for (let i = 0; i < 4; i++) await u1.agent.get('/games/cloze?level=A1&limit=3');
    // u2 uchun hammasi hali YANGI bo'lishi kerak
    const r = await u2.agent.get('/games/cloze?level=A1&limit=3');
    assert.equal(r.body.items.length, 3);
    const times = ctx.prisma.db.seenItems.filter((s) => s.userId === u2.id && s.kind === 'cloze');
    assert.equal(times.length, 3, "boshqa odamning tarixi aralashib ketdi");
    assert.ok(times.every((t) => t.times === 1));
  });

  it("so'z mashqida javobsiz qolgan so'zlar darhol qaytmaydi", async () => {
    const fresh = await addStudent('rot5@talaba.uz', 'Sozlar');
    const first = await fresh.agent.get('/games/quiz?level=A1&limit=4');
    assert.equal(first.status, 200, JSON.stringify(first.body));
    const firstWords = first.body.questions.map((q) => q.turkish ?? q.prompt ?? q.word);

    // Javob bermasdan yangi to'plam so'raymiz
    const second = await fresh.agent.get('/games/quiz?level=A1&limit=4');
    const secondWords = second.body.questions.map((q) => q.turkish ?? q.prompt ?? q.word);

    const overlap = firstWords.filter((w) => secondWords.includes(w));
    assert.equal(
      overlap.length,
      0,
      `javobsiz qolgan so'zlar yana chiqdi: ${overlap.join(', ')}`,
    );
  });
});

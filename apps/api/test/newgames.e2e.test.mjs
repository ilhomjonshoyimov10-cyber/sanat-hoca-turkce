// Yangi o'yinlar: gap tuzish, qo'shimchalar mashqi, so'z zanjiri.
//
// Diqqat markazi:
//   1. JAVOB SIZIB CHIQMASLIGI — savol olinganda to'g'ri javob kelmasin.
//   2. XP "ISHLAB OLISH" mumkin emasligi — bu o'yinlarda so'z takrorlash
//      jadvali yo'q, shuning uchun kunlik chegara qo'yilgan. Chegara
//      ishlamasa, bitta mashqni qayta-qayta yuborib reytingni buzish mumkin.
//   3. Boshqa odamning tokenini ishlatib bo'lmasligi.
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

let ctx, S1, S2;

async function addStudent(email, first = 'Talaba') {
  const agent = request.agent(ctx.server).set(CSRF);
  const r = await agent.post('/auth/register').send({
    firstName: first, lastName: 'Karimova', email, password: PW, birthDate: '1995-01-01', acceptTerms: true,
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return { agent, id: r.body.user.id, email };
}

before(async () => {
  const prisma = createFakePrisma();

  // ── Lug'at: so'z zanjiri uchun zanjir tuzilishi mumkin bo'lsin ──
  // Zanjir "oxirgi harf -> keyingi so'zning birinchi harfi" bo'yicha ketadi.
  // DIQQAT — bu lug'at ataylab shunday tanlangan: HAR BIR so'z «a» bilan
  // boshlanadi va «a» bilan tugaydi. Shuning uchun zanjirda keyingi harf
  // har doim «a» bo'ladi va test server qaysi so'zdan boshlashidan
  // qat'i nazar bir xil ishlaydi.
  //
  // Nega muhim: avvalgi lug'at bilan takrorlanish testi 5 ta ishga tushirishda
  // faqat 1 marta xatoni tutdi — ya'ni himoya o'chirilsa ham sezmay qolardi.
  const words = [
    ['ada', 'orol'], ['ara', 'oraliq'], ['araba', 'mashina'], ['ayva', 'behi'],
    ['akraba', 'qarindosh'], ['amca', 'amaki'], ['aşama', 'bosqich'], ['aroma', 'hid'],
    ['antika', 'antikvar'], ['arpa', 'arpa'], ['asma', 'uzum tokzori'], ['ata', 'ajdod'],
  ];
  words.forEach(([turkish, uzbek], i) => {
    prisma.db.words.push({
      id: `w${i}`, turkish, uzbek, russian: null, exampleTr: null, exampleUz: null, exampleRu: null,
      audioUrl: null, level: 'A1', category: null, position: i, partOfSpeech: null, pronunciation: null,
      tags: [], frequency: null, verified: true, notes: null, createdAt: new Date(), updatedAt: new Date(),
    });
  });

  // ── Gaplar ──
  prisma.db.sentences.push(
    { id: 's1', turkish: 'Ben her gün süt içiyorum', uzbek: 'Men har kuni sut ichaman', level: 'A1', topic: null, note: null, verified: true, position: 0, createdAt: new Date() },
    { id: 's2', turkish: 'Bu benim kitabım', uzbek: 'Bu mening kitobim', level: 'A1', topic: null, note: 'egalik', verified: true, position: 1, createdAt: new Date() },
  );

  // ── Qo'shimcha mashqlari ──
  prisma.db.suffixDrills.push(
    { id: 'd1', level: 'A1', base: 'ev', prompt: 'uyDA', answer: 'evde', alternates: [], explanation: 'oldingi unli -> -de', rule: 'locative', verified: true, position: 0, createdAt: new Date() },
    { id: 'd2', level: 'A1', base: 'kitap', prompt: 'kitobDA', answer: 'kitapta', alternates: [], explanation: 'jarangsiz p -> -ta', rule: 'locative', verified: true, position: 1, createdAt: new Date() },
  );

  const mod = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService).useValue(prisma).compile();
  const app = mod.createNestApplication();
  configureApp(app);
  await app.init();
  ctx = { app, prisma, server: app.getHttpServer() };

  S1 = await addStudent('g1@talaba.uz', 'Dilnoza');
  S2 = await addStudent('g2@talaba.uz', 'Jasur');
});
after(() => ctx.app.close());

// ═══════════════════════ Gap tuzish ═══════════════════════

describe('gap tuzish', () => {
  it("to'g'ri TARTIB yuborilmaydi, faqat aralashtirilgan so'zlar", async () => {
    const r = await S1.agent.get('/games/sentence?level=A1&limit=2');
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.ok(r.body.items.length > 0);
    for (const item of r.body.items) {
      assert.equal(item.turkish, undefined, "to'g'ri gap javob bilan kelib qoldi");
      assert.ok(Array.isArray(item.words));
      assert.ok(item.uzbek);
      assert.ok(item.token);
    }
  });

  it("to'g'ri javob qabul qilinadi va XP beradi", async () => {
    const set = await S1.agent.get('/games/sentence?level=A1&limit=1');
    const item = set.body.items[0];
    // So'zlardan to'g'ri gapni biz bilamiz, chunki testda ikkita gap bor
    const candidates = ['Ben her gün süt içiyorum', 'Bu benim kitabım'];
    const answer = candidates.find((c) => c.split(' ').length === item.words.length);

    const r = await S1.agent.post('/games/sentence/answer').send({ token: item.token, answer });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.body.correct, true);
    assert.ok(r.body.xpGained > 0, 'XP berilmadi');
  });

  it("noto'g'ri tartib xato deb baholanadi va javob ko'rsatiladi", async () => {
    const set = await S1.agent.get('/games/sentence?level=A1&limit=1');
    const item = set.body.items[0];
    const r = await S1.agent.post('/games/sentence/answer').send({ token: item.token, answer: 'süt Ben içiyorum gün her' });
    assert.equal(r.body.correct, false);
    assert.ok(r.body.answer, "to'g'ri javob ko'rsatilmadi");
    assert.equal(r.body.xpGained, 0);
  });

  it("BOSHQA foydalanuvchining tokeni ishlamaydi", async () => {
    const set = await S1.agent.get('/games/sentence?level=A1&limit=1');
    const r = await S2.agent.post('/games/sentence/answer').send({ token: set.body.items[0].token, answer: 'Bu benim kitabım' });
    assert.equal(r.status, 400, 'begona token qabul qilindi');
  });
});

// ═══════════════════════ Qo'shimchalar mashqi ═══════════════════════

describe("qo'shimchalar mashqi", () => {
  it('javob va izoh savol bilan kelmaydi', async () => {
    const r = await S1.agent.get('/games/suffix?level=A1&limit=2');
    assert.equal(r.status, 200);
    const raw = JSON.stringify(r.body);
    assert.ok(!raw.includes('evde'), 'javob sizib chiqdi');
    assert.ok(!raw.includes('kitapta'), 'javob sizib chiqdi');
    for (const it of r.body.items) {
      assert.equal(it.answer, undefined);
      assert.equal(it.explanation, undefined);
      assert.ok(it.base && it.prompt);
    }
  });

  it("to'g'ri javobdan keyin izoh beriladi", async () => {
    const set = await S1.agent.get('/games/suffix?level=A1&limit=2');
    const item = set.body.items.find((i) => i.base === 'ev');
    const r = await S1.agent.post('/games/suffix/answer').send({ token: item.token, answer: 'evde' });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.body.correct, true);
    assert.ok(r.body.explanation, 'izoh berilmadi');
  });

  it("katta harf bilan yozilgani ham qabul qilinadi", async () => {
    // "kitapta" da maxsus harf yo'q, shuning uchun boshqa mashqni tekshiramiz:
    // ev -> evde; "EVDE" katta harfda ham to'g'ri bo'lishi kerak
    const set = await S1.agent.get('/games/suffix?level=A1&limit=2');
    const item = set.body.items.find((i) => i.base === 'ev');
    const r = await S1.agent.post('/games/suffix/answer').send({ token: item.token, answer: 'EVDE' });
    assert.equal(r.body.correct, true, 'katta harf bilan yozilgani xato deb baholandi');
  });
});

// ═══════════════════════ XP chegarasi ═══════════════════════

describe('XP kunlik chegarasi', () => {
  it("chegara tugagach to'g'ri javob ham XP bermaydi", async () => {
    const student = await addStudent('cap@talaba.uz', 'Chegara');

    let total = 0;
    let capped = false;
    // Chegara 120 XP, har to'g'ri javob 10 XP -> 12 marta. 20 marta urinamiz.
    for (let i = 0; i < 20; i++) {
      const set = await student.agent.get('/games/suffix?level=A1&limit=2');
      const item = set.body.items.find((x) => x.base === 'ev');
      const r = await student.agent.post('/games/suffix/answer').send({ token: item.token, answer: 'evde' });
      assert.equal(r.body.correct, true);
      total += r.body.xpGained;
      if (r.body.capped) capped = true;
    }

    assert.ok(capped, "chegara hech qachon ishga tushmadi — XP cheksiz yigiladi");
    assert.ok(total <= 120, `chegaradan oshdi: ${total} XP`);
  });
});

// ═══════════════════════ So'z zanjiri ═══════════════════════

describe("so'z zanjiri", () => {
  it('boshlanish so\'zi va kerakli harf beriladi', async () => {
    const r = await S1.agent.get('/games/chain?level=A1');
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.ok(r.body.current);
    assert.ok(r.body.nextLetter);
    assert.equal(r.body.nextLetter, r.body.current.toLocaleLowerCase('tr').slice(-1));
    assert.ok(r.body.token);
  });

  it("boshqa harfdan boshlangan so'z qabul qilinmaydi", async () => {
    const start = await S1.agent.get('/games/chain?level=A1');
    // Kerakli harfdan boshlanmaydigan so'z tanlaymiz
    const wrong = 'kitap'; // "a" bilan boshlanmaydi
    const r = await S1.agent.post('/games/chain/answer').send({ token: start.body.token, answer: wrong });
    assert.equal(r.body.correct, false);
    assert.ok(r.body.reason.includes('harfidan'), JSON.stringify(r.body));
  });

  it("lug'atda yo'q so'z qabul qilinmaydi", async () => {
    const start = await S1.agent.get('/games/chain?level=A1');
    const fake = start.body.nextLetter + 'zzzqqq';
    const r = await S1.agent.post('/games/chain/answer').send({ token: start.body.token, answer: fake });
    assert.equal(r.body.correct, false);
    assert.ok(r.body.reason.includes("lug'atda"), JSON.stringify(r.body));
  });

  it("bir so'zni ikki marta ishlatib bo'lmaydi", async () => {
    const DICT = ['ada', 'ara', 'araba', 'ayva', 'akraba', 'amca', 'aşama', 'aroma', 'antika', 'arpa', 'asma', 'ata'];

    const start = await S1.agent.get('/games/chain?level=A1');
    assert.equal(start.status, 200, JSON.stringify(start.body));
    // Lug'atdagi hamma so'z "a" bilan tugaydi, shuning uchun keyingi harf doim "a"
    assert.equal(start.body.nextLetter, 'a');

    const startWord = start.body.current.toLocaleLowerCase('tr');
    const next = DICT.find((w) => w !== startWord);
    assert.ok(next);

    const first = await S1.agent.post('/games/chain/answer').send({ token: start.body.token, answer: next });
    assert.equal(first.status, 201, JSON.stringify(first.body));
    assert.equal(first.body.correct, true, JSON.stringify(first.body));
    assert.equal(first.body.nextLetter, 'a');

    // AYNAN shu so'zni qayta yuboramiz — ishlatilganlar ro'yxatida bor
    const again = await S1.agent.post('/games/chain/answer').send({ token: first.body.token, answer: next });
    assert.equal(again.body.correct, false, "takrorlangan so'z qabul qilindi");
    assert.ok(String(again.body.reason).includes('ishlatilgan'), JSON.stringify(again.body));

    // Boshlanish so'zini ham qayta yuborib bo'lmasin
    const again2 = await S1.agent.post('/games/chain/answer').send({ token: first.body.token, answer: startWord });
    assert.equal(again2.body.correct, false, "boshlanish so'zi qayta qabul qilindi");
  });
});

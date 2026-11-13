// Kitoblar, o'qish matnlari va AI yordamchi.
//
// Diqqat markazi:
//   1. JAVOB SIZIB CHIQMASLIGI — o'quvchi savolni olganda to'g'ri javob
//      bilan kelmasin (brauzerning tarmoq oynasidan ko'rinib qolardi).
//   2. KO'RINISH QOIDALARI — kim qaysi kitobni ko'radi va ko'rmaydi.
//   3. AI LIMITLARI va rol cheklovlari.
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
// AI ni YOQAMIZ, lekin tashqi so'rov yubormaymiz: fetch soxtalashtiriladi.
// Shunda limitlar, rollar va saqlash yo'li ham tekshiriladi.
process.env.AI_PROVIDER = 'gemini';
process.env.AI_API_KEY = 'test-kalit';
process.env.AI_MODEL = 'test-model';

const { AppModule } = await import('../dist/app.module.js');
const { configureApp } = await import('../dist/app.setup.js');
const { PrismaService } = await import('../dist/prisma/prisma.service.js');
const { hashPassword } = await import('../dist/auth/argon.js');
const { encrypt } = await import('../dist/auth/crypto.js');
const { totpAt } = await import('../dist/auth/totp.js');

const CSRF = { 'X-Requested-With': 'XMLHttpRequest', Origin: 'http://localhost:3000' };
const PW = 'olma-daraxti-sakkiz-kuz';
const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

let ctx, TEACHER, OTHER_TEACHER, ADMIN, S1, OUTSIDER, group, otherGroup;

// ───────── Soxta AI: tashqi tarmoqqa chiqmaydi ─────────
const aiCalls = [];
// Har model uchun javob rejimi: 'ok' | 'down' (500) | 'thinking-only' (bo'sh javob)
const aiMode = { default: 'ok' };
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  const u = String(url);
  if (u.includes('generativelanguage.googleapis.com')) {
    aiCalls.push({ url: u, body: JSON.parse(String(init?.body ?? '{}')) });
    const model = /models\/([^:]+):/.exec(u)?.[1] ?? '';
    const mode = aiMode[model] ?? aiMode.default;
    const json = (o, status = 200) =>
      new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });
    if (mode === 'down') return json({ error: { code: 500, message: 'Internal error' } }, 500);
    if (mode === 'thinking-only') {
      return json({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ thought: true, text: 'O‘ylayapman...' }] } }] });
    }
    return json({ candidates: [{ content: { parts: [{ thought: true, text: 'ichki fikr' }, { text: 'Merhaba! (Salom!)' }] } }] });
  }
  return realFetch(url, init);
};

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
  return { agent, id: row.id, email };
}

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
  const mod = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService).useValue(prisma).compile();
  const app = mod.createNestApplication();
  configureApp(app);
  await app.init();
  ctx = { app, prisma, server: app.getHttpServer() };

  TEACHER = await addStaff('ustoz@maktab.uz', 'TEACHER', 'Aziz');
  OTHER_TEACHER = await addStaff('ustoz2@maktab.uz', 'TEACHER', 'Bobur');
  ADMIN = await addStaff('admin@maktab.uz', 'ADMIN', 'Admin');
  S1 = await addStudent('s1@talaba.uz', 'Dilnoza');
  OUTSIDER = await addStudent('chet@talaba.uz', 'Chetdagi');

  group = (await TEACHER.agent.post('/groups').send({ name: 'B1 kechki', level: 'B1' })).body;
  otherGroup = (await OTHER_TEACHER.agent.post('/groups').send({ name: 'A2 ertalabki', level: 'A2' })).body;
  await TEACHER.agent.post(`/groups/${group.id}/members`).send({ identifier: S1.email });
});
after(async () => {
  globalThis.fetch = realFetch;
  await ctx.app.close();
});

// ═══════════════════════ O'qish matnlari ═══════════════════════

describe("o'qish matnlari", () => {
  let text;

  it('ustoz matn yaratadi, u qoralama bo\'lib turadi', async () => {
    const r = await TEACHER.agent.post('/reading/texts').send({
      title: 'Bir Kahve Molası',
      level: 'B1',
      body: 'Ahmet her sabah aynı kafeye gider. Orada bir fincan kahve içer ve gazete okur. '.repeat(3),
      bodyUz: 'Ahmad har kuni ertalab bir xil kafega boradi.',
      topic: 'kundalik hayot',
    });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.body.slug, 'bir-kahve-molasi'); // turkcha harflar lotinga o'girildi
    text = r.body;
  });

  it("o'quvchi qoralamani KO'RMAYDI", async () => {
    const list = await S1.agent.get('/reading');
    assert.equal(list.status, 200);
    assert.equal(list.body.find((t) => t.slug === text.slug), undefined);
    const direct = await S1.agent.get(`/reading/${text.slug}`);
    assert.equal(direct.status, 404);
  });

  it('ustoz savol qo\'shadi; to\'g\'ri javobsiz savol qabul qilinmaydi', async () => {
    const bad = await TEACHER.agent.post(`/reading/texts/${text.id}/questions`).send({
      kind: 'MULTIPLE_CHOICE', prompt: 'Ahmet nereye gider?', options: ['Kafeye', 'Okula'],
    });
    assert.equal(bad.status, 400, 'to\'g\'ri variant belgilanmagan savol o\'tib ketdi');

    const q1 = await TEACHER.agent.post(`/reading/texts/${text.id}/questions`).send({
      kind: 'MULTIPLE_CHOICE', prompt: 'Ahmet nereye gider?', options: ['Kafeye', 'Okula', 'Pazara'],
      correctIndex: 0, explanation: 'Matnda "aynı kafeye gider" deyilgan', position: 0,
    });
    assert.equal(q1.status, 201, JSON.stringify(q1.body));

    const q2 = await TEACHER.agent.post(`/reading/texts/${text.id}/questions`).send({
      kind: 'SHORT_ANSWER', prompt: 'Ahmet orada ne okur?', correctText: ['gazete'], position: 1,
    });
    assert.equal(q2.status, 201);
  });

  it('nashr qilinadi va o\'quvchiga ko\'rinadi', async () => {
    const pub = await TEACHER.agent.patch(`/reading/texts/${text.id}`).send({ published: true });
    assert.equal(pub.status, 200);
    const list = await S1.agent.get('/reading');
    const found = list.body.find((t) => t.slug === text.slug);
    assert.ok(found, 'nashr qilingan matn ro\'yxatda yo\'q');
    assert.equal(found.questionCount, 2);
    assert.equal(found.isDraft, false);
  });

  it("SAVOLLAR TO'G'RI JAVOBSIZ keladi", async () => {
    const r = await S1.agent.get(`/reading/${text.slug}`);
    assert.equal(r.status, 200);
    assert.equal(r.body.questions.length, 2);
    for (const q of r.body.questions) {
      assert.equal(q.correctIndex, undefined, 'correctIndex javob bilan kelib qoldi');
      assert.equal(q.correctText, undefined, 'correctText javob bilan kelib qoldi');
      assert.equal(q.explanation, undefined, 'explanation javob bilan kelib qoldi');
    }
    // Qisqa javob ("gazete") SAVOLLAR ichida bo'lmasin.
    //
    // DIQQAT: butun javobni tekshirib bo'lmaydi — "gazete" so'zi matnning
    // o'zida ham bor (o'quvchi uni o'qib javob topadi). Avval shu tasdiq
    // butun javobga qo'yilgan edi va soxta Prisma matn tanasini buzib
    // qo'ygani uchun yolg'ondan o'tib ketgan. Endi faqat savollar
    // tekshiriladi — aynan shu joy sizib chiqmasligi kerak.
    const questionsRaw = JSON.stringify(r.body.questions);
    assert.ok(!questionsRaw.includes('gazete'), 'qisqa javob matni savollar ichida sizib chiqdi');
    // Izoh matni ham savollarda bo'lmasin
    assert.ok(!questionsRaw.includes('Matnda'), 'izoh savollar ichida sizib chiqdi');
  });

  it('javoblar SERVERDA tekshiriladi va natija yoziladi', async () => {
    const page = await S1.agent.get(`/reading/${text.slug}`);
    const [mc, sa] = page.body.questions;

    const r = await S1.agent.post(`/reading/${text.slug}/submit`).send({
      answers: [
        { questionId: mc.id, choice: 0 },
        { questionId: sa.id, text: 'Gazete.' }, // nuqta va katta harf — baribir to'g'ri
      ],
    });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.body.score, 2);
    assert.equal(r.body.total, 2);
    // Javob yuborilgandan KEYIN to'g'ri javob va izoh beriladi
    assert.equal(r.body.results[0].correctIndex, 0);
    assert.ok(r.body.results[0].explanation);

    const list = await S1.agent.get('/reading');
    assert.deepEqual(list.body.find((t) => t.slug === text.slug).best, { score: 2, total: 2 });
  });

  it("noto'g'ri javob noto'g'ri deb baholanadi", async () => {
    const page = await S1.agent.get(`/reading/${text.slug}`);
    const [mc, sa] = page.body.questions;
    const r = await S1.agent.post(`/reading/${text.slug}/submit`).send({
      answers: [
        { questionId: mc.id, choice: 2 },
        { questionId: sa.id, text: 'kitap' },
      ],
    });
    assert.equal(r.body.score, 0);
    assert.equal(r.body.results[0].correct, false);
  });

  it("o'quvchi matn yaratolmaydi", async () => {
    const r = await S1.agent.post('/reading/texts').send({
      title: 'Men yozdim', level: 'A1', body: 'x'.repeat(60),
    });
    assert.equal(r.status, 403);
  });

  it("ustozning sinovi natija sifatida yozilmaydi", async () => {
    const before = ctx.prisma.db.readingAttempts.length;
    const page = await TEACHER.agent.get(`/reading/${text.slug}`);
    await TEACHER.agent.post(`/reading/${text.slug}/submit`).send({
      answers: [{ questionId: page.body.questions[0].id, choice: 0 }],
    });
    assert.equal(ctx.prisma.db.readingAttempts.length, before, 'ustoz urinishi statistikaga tushdi');
  });
});

// ═══════════════════════ Kitoblar ═══════════════════════

describe('kitoblar', () => {
  let privateBook, groupBook;

  it("o'quvchi kitob qo'sholmaydi", async () => {
    const r = await S1.agent.post('/books').send({ title: 'Mening kitobim', level: 'A1' });
    assert.equal(r.status, 403);
  });

  it('ustoz shaxsiy kitob qo\'shadi; o\'quvchi uni ko\'rmaydi', async () => {
    const r = await TEACHER.agent.post('/books').send({
      title: 'Shaxsiy qo\'llanma', level: 'B1', kind: 'GRAMMAR',
    });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.body.visibility, 'PRIVATE');
    privateBook = r.body;

    const list = await S1.agent.get('/books');
    assert.equal(list.body.find((b) => b.id === privateBook.id), undefined);
    const direct = await S1.agent.get(`/books/${privateBook.id}`);
    assert.equal(direct.status, 404, 'shaxsiy kitob o\'quvchiga ko\'rindi');
  });

  it('guruhga biriktirilgan kitobni a\'zo ko\'radi, chetdagi ko\'rmaydi', async () => {
    const r = await TEACHER.agent.post('/books').send({
      title: 'B1 o\'qish daftari', level: 'B1', kind: 'WORKBOOK',
      visibility: 'GROUP', groupId: group.id,
    });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    groupBook = r.body;

    const member = await S1.agent.get(`/books/${groupBook.id}`);
    assert.equal(member.status, 200);

    const outsider = await OUTSIDER.agent.get(`/books/${groupBook.id}`);
    assert.equal(outsider.status, 404, 'chetdagi o\'quvchi guruh kitobini ko\'rdi');
  });

  it('ustoz BOSHQA ustozning guruhiga kitob biriktirolmaydi', async () => {
    const r = await TEACHER.agent.post('/books').send({
      title: 'Chet guruhga', level: 'A2', visibility: 'GROUP', groupId: otherGroup.id,
    });
    assert.equal(r.status, 403, JSON.stringify(r.body));
  });

  it("ustoz kitobni hammaga ochiq qilolmaydi, admin qiladi", async () => {
    const teacherTry = await TEACHER.agent.post('/books').send({
      title: 'Ochiq kitob', level: 'A1', visibility: 'PUBLIC',
    });
    assert.equal(teacherTry.status, 403);

    const adminTry = await ADMIN.agent.post('/books').send({
      title: 'Ochiq kitob', level: 'A1', visibility: 'PUBLIC',
    });
    assert.equal(adminTry.status, 201);
    // PUBLIC bo'lsa chetdagi o'quvchi ham ko'radi
    const seen = await OUTSIDER.agent.get(`/books/${adminTry.body.id}`);
    assert.equal(seen.status, 200);
  });

  it("boshqa ustoz birovning kitobini o'chirolmaydi", async () => {
    const r = await OTHER_TEACHER.agent.delete(`/books/${privateBook.id}`);
    assert.equal(r.status, 404, 'begona ustoz kitobni o\'chirdi');
    assert.ok(ctx.prisma.db.books.some((b) => b.id === privateBook.id));
  });

  it('fayl yuklash tokeni faqat ustoz uchun', async () => {
    const student = await S1.agent.post('/books/upload-token').send({
      fileName: 'kitob.pdf', contentType: 'application/pdf', size: 1000,
    });
    assert.equal(student.status, 403);

    // Saqlagich sozlanmagan — ustozga tushunarli xato kelsin, 500 emas
    const teacher = await TEACHER.agent.post('/books/upload-token').send({
      fileName: 'kitob.pdf', contentType: 'application/pdf', size: 1000,
    });
    assert.equal(teacher.status, 503);
    assert.equal(teacher.body.code, 'BLOB_DISABLED');
  });

  it("ko'rinmaydigan kitobga o'qish belgisi qo'yilmaydi", async () => {
    const r = await OUTSIDER.agent.put(`/books/${groupBook.id}/progress`).send({ lastPage: 5 });
    assert.equal(r.status, 404);
  });

  it("a'zo sahifani saqlaydi va javonida ko'radi", async () => {
    const save = await S1.agent.put(`/books/${groupBook.id}/progress`).send({ lastPage: 12 });
    assert.equal(save.status, 200);
    assert.equal(save.body.lastPage, 12);

    const shelf = await S1.agent.get('/books/shelf');
    assert.equal(shelf.status, 200);
    assert.equal(shelf.body[0].id, groupBook.id);
    assert.equal(shelf.body[0].lastPage, 12);
  });
});

// ═══════════════════════ AI yordamchi ═══════════════════════

describe('AI yordamchi', () => {
  it('holat: yoqilgan, limit ko\'rinadi', async () => {
    const r = await S1.agent.get('/ai/status');
    assert.equal(r.status, 200);
    assert.equal(r.body.enabled, true);
    assert.equal(r.body.canUseExercise, false);
    assert.ok(r.body.dailyLimit > 0);
  });

  it("o'quvchi mashq yaratish funksiyasidan foydalanolmaydi", async () => {
    const r = await S1.agent.post('/ai/ask').send({ task: 'EXERCISE', message: 'A1 uchun 5 mashq' });
    assert.equal(r.status, 400);
  });

  it('ustoz mashq yaratadi', async () => {
    const r = await TEACHER.agent.post('/ai/ask').send({ task: 'EXERCISE', message: 'A1 uchun 5 mashq' });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.ok(r.body.answer);
  });

  it('suhbat saqlanadi va savol-javob ikkisi ham yoziladi', async () => {
    const r = await S1.agent.post('/ai/ask').send({ task: 'CHAT', message: 'Merhaba, nasılsın?' });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    const convo = await S1.agent.get(`/ai/conversations/${r.body.conversationId}`);
    assert.equal(convo.status, 200);
    assert.equal(convo.body.messages.length, 2);
    assert.equal(convo.body.messages[0].role, 'USER');
    assert.equal(convo.body.messages[1].role, 'ASSISTANT');
  });

  it("SHAXSIY MA'LUMOT AI ga yuborilmaydi", async () => {
    aiCalls.length = 0;
    await S1.agent.post('/ai/ask').send({
      task: 'GRAMMAR',
      message: 'Benim adım Dilnoza, telefonum +998 90 123 45 67 ve e-postam dilnoza@mail.uz',
    });
    assert.equal(aiCalls.length, 1);
    const sent = JSON.stringify(aiCalls[0].body);
    assert.ok(!sent.includes('dilnoza@mail.uz'), 'email AI ga yuborildi');
    assert.ok(!sent.includes('998 90 123 45 67'), 'telefon AI ga yuborildi');
    assert.ok(sent.includes('olib tashlandi'), 'tozalash belgisi yo\'q');
  });

  it("boshqa odamning suhbati ko'rinmaydi (404, 403 emas)", async () => {
    const mine = await S1.agent.post('/ai/ask').send({ task: 'CHAT', message: 'Günaydın' });
    const r = await OUTSIDER.agent.get(`/ai/conversations/${mine.body.conversationId}`);
    assert.equal(r.status, 404);
    const del = await OUTSIDER.agent.delete(`/ai/conversations/${mine.body.conversationId}`);
    assert.equal(del.status, 404);
  });

  it('kunlik limit tugaganda rad etadi', async () => {
    const day = new Date();
    const today = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
    const row = ctx.prisma.db.aiUsage.find((u) => u.userId === OUTSIDER.id);
    if (row) row.requests = 999;
    else ctx.prisma.db.aiUsage.push({ userId: OUTSIDER.id, day: today, requests: 999, chars: 0 });

    const r = await OUTSIDER.agent.post('/ai/ask').send({ task: 'CHAT', message: 'Merhaba' });
    assert.equal(r.status, 400, JSON.stringify(r.body));
    assert.equal(r.body.code, 'AI_LIMIT');
  });

  it("juda uzun matn rad etiladi", async () => {
    const r = await S1.agent.post('/ai/ask').send({ task: 'EXPLAIN', message: 'a'.repeat(400) });
    assert.equal(r.status, 400);
  });

  it("'thinking' qismi javobga aralashmaydi va o'chirib so'raladi", async () => {
    aiCalls.length = 0;
    const r = await S1.agent.post('/ai/ask').send({ task: 'CHAT', message: 'Teşekkürler' });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.body.answer, 'Merhaba! (Salom!)');
    assert.equal(aiCalls[0].body.generationConfig.thinkingConfig.thinkingBudget, 0);
    assert.ok(aiCalls[0].body.generationConfig.maxOutputTokens >= 2048);
  });

  it('asosiy model ishlamasa zaxira model javob beradi', async () => {
    aiMode['test-model'] = 'thinking-only';
    aiCalls.length = 0;
    try {
      const r = await S1.agent.post('/ai/ask').send({ task: 'CHAT', message: 'Nasılsın?' });
      assert.equal(r.status, 201, JSON.stringify(r.body));
      assert.equal(aiCalls.length, 2);
      assert.match(aiCalls[1].url, /gemini-2\.5-flash/);
      assert.equal(r.body.model, 'gemini-2.5-flash');
    } finally {
      delete aiMode['test-model'];
    }
  });

  it("AI butunlay ishlamasa ham SAVOL saqlanadi, limit yeyilmaydi", async () => {
    aiMode.default = 'down';
    try {
      const before = (await TEACHER.agent.get('/ai/status')).body.usedToday;
      const r = await TEACHER.agent.post('/ai/ask').send({ task: 'CHAT', message: 'Bu savol yo‘qolmasin' });
      assert.equal(r.status, 503, JSON.stringify(r.body));
      assert.equal(r.body.code, 'AI_FAILED');
      assert.ok(r.body.conversationId);
      const convo = await TEACHER.agent.get(`/ai/conversations/${r.body.conversationId}`);
      assert.equal(convo.body.messages[0].content, 'Bu savol yo‘qolmasin');
      assert.equal(convo.body.messages[1].role, 'ASSISTANT');
      assert.ok(convo.body.messages[1].error, 'xato qatori yozilmadi');
      assert.ok(!JSON.stringify(convo.body).includes('test-kalit'), 'kalit sizib chiqdi');
      const after = (await TEACHER.agent.get('/ai/status')).body.usedToday;
      assert.equal(after, before);
    } finally {
      aiMode.default = 'ok';
    }
  });

  it('xatodan keyin o‘sha suhbatda davom etsa, tarix to‘g‘ri navbatlanadi', async () => {
    const convos = (await TEACHER.agent.get('/ai/conversations')).body;
    const failed = convos.find((c) => c.title.startsWith('Bu savol'));
    aiCalls.length = 0;
    const r = await TEACHER.agent.post('/ai/ask').send({ task: 'CHAT', message: 'Yana urinaman', conversationId: failed.id });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    const roles = aiCalls[0].body.contents.map((c) => c.role);
    for (let i = 1; i < roles.length; i++) assert.notEqual(roles[i], roles[i - 1], `ketma-ket ${roles[i]}: ${roles}`);
    assert.equal(roles.at(-1), 'user');
  });

  it("o'quvchi admin bo'limiga kira olmaydi", async () => {
    for (const path of ['/ai/admin/stats', '/ai/admin/conversations']) {
      const r = await S1.agent.get(path);
      assert.equal(r.status, 403, path);
    }
    const t = await TEACHER.agent.get('/ai/admin/conversations');
    assert.equal(t.status, 403);
  });

  it('admin hamma suhbatlarni ko‘radi, qidiradi, o‘chiradi', async () => {
    const stats = await ADMIN.agent.get('/ai/admin/stats');
    assert.equal(stats.status, 200, JSON.stringify(stats.body));
    assert.ok(stats.body.conversations >= 3);
    assert.ok(stats.body.today.failed >= 1);
    assert.ok(stats.body.health.lastError);
    assert.ok(!JSON.stringify(stats.body).includes('test-kalit'));

    const list = await ADMIN.agent.get('/ai/admin/conversations');
    assert.equal(list.status, 200);
    assert.ok(list.body.items.some((c) => c.user.id === S1.id));
    assert.ok(list.body.items.some((c) => c.user.id === TEACHER.id));

    const found = await ADMIN.agent.get('/ai/admin/conversations?q=yo‘qolmasin');
    assert.equal(found.body.items.length, 1, JSON.stringify(found.body));
    const failedOnly = await ADMIN.agent.get('/ai/admin/conversations?failed=1');
    assert.ok(failedOnly.body.items.length >= 1);

    const id = found.body.items[0].id;
    const one = await ADMIN.agent.get(`/ai/admin/conversations/${id}`);
    assert.equal(one.status, 200);
    assert.ok(one.body.messages.length >= 2);
    assert.equal(one.body.user.id, TEACHER.id);

    const del = await ADMIN.agent.delete(`/ai/admin/conversations/${id}`);
    assert.equal(del.status, 200);
    const gone = await TEACHER.agent.get(`/ai/conversations/${id}`);
    assert.equal(gone.status, 404);
  });
});

// E'lonlar, adminga murojaat, profil rasmi, bepul dars va jonli efir.
//
// Diqqat markazi — aynan shu yerda xato qimmatga tushadi:
//   1. E'lon BUTUN saytda ko'rinadi -> uni faqat admin yoza olsin va
//      havolasi xavfsiz bo'lsin ("javascript:" o'tib ketmasin).
//   2. Murojaat shaxsiy -> birovnikini o'qib bo'lmasin.
//   3. Profil rasmi manzili faqat o'z omborimizdan bo'lsin, aks holda
//      profilni ochgan har bir odamning IP si begona saytga ketadi.
//   4. Jonli efir xona nomi ro'yxatda CHIQMASIN — nomni bilgan odam
//      Jitsi xonasiga kirib oladi.
//   5. Bepul dars yozishmasi — faqat o'z arizang.
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

let ctx, admin, teacher, s1, s2;

async function addUser({ email, role = 'STUDENT', first = 'Ism', phone }) {
  const agent = request.agent(ctx.server).set(CSRF);
  const body = { firstName: first, lastName: 'Familiya', password: PW, birthDate: '1995-01-01', acceptTerms: true };
  if (email) body.email = email;
  if (phone) body.phone = phone;
  const r = await agent.post('/auth/register').send(body);
  assert.equal(r.status, 201, JSON.stringify(r.body));
  if (role !== 'STUDENT') {
    // Rolni to'g'ridan-to'g'ri bazada o'zgartiramiz: ro'yxatdan o'tishda
    // rolni tanlash MUMKIN EMAS (shuning uchun ham test shunday yozilgan).
    const row = ctx.prisma.db.users.find((u) => u.id === r.body.user.id);
    row.role = role;
    // Ustoz va admin uchun 2FA majburiy — testda uni yoqilgan deb belgilaymiz
    row.twoFactorEnabled = true;
  }
  return { agent, id: r.body.user.id };
}

before(async () => {
  const prisma = createFakePrisma();
  const mod = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService).useValue(prisma).compile();
  const app = mod.createNestApplication();
  configureApp(app);
  await app.init();
  ctx = { app, prisma, server: app.getHttpServer() };

  admin = await addUser({ email: 'admin@sanat.uz', role: 'ADMIN', first: 'Admin' });
  teacher = await addUser({ email: 'ustoz@sanat.uz', role: 'TEACHER', first: 'Ustoz' });
  s1 = await addUser({ email: 's1@talaba.uz', first: 'Dilnoza', phone: '+998901112233' });
  s2 = await addUser({ email: 's2@talaba.uz', first: 'Jasur' });
});
after(() => ctx.app.close());

// ═══════════════════════ E'lonlar ═══════════════════════

describe("e'lonlar", () => {
  it("o'quvchi e'lon yoza olmaydi", async () => {
    const r = await s1.agent.post('/announcements').send({ title: 'Reklama', body: 'Chegirma' });
    assert.equal(r.status, 403);
  });

  it('ustoz ham yoza olmaydi — e’lon butun saytda ko’rinadi', async () => {
    const r = await teacher.agent.post('/announcements').send({ title: 'Reklama', body: 'Chegirma' });
    assert.equal(r.status, 403);
  });

  it('admin yozadi va hamma ko’radi', async () => {
    const c = await admin.agent.post('/announcements').send({
      kind: 'PROMO', title: 'Yangi guruh ochildi', body: 'A1 darajasi uchun yangi guruh',
    });
    assert.equal(c.status, 201, JSON.stringify(c.body));

    const r = await s1.agent.get('/announcements');
    assert.equal(r.status, 200);
    assert.equal(r.body.length, 1);
    assert.equal(r.body[0].title, 'Yangi guruh ochildi');
  });

  it('"javascript:" havolasi rad etiladi', async () => {
    const r = await admin.agent.post('/announcements').send({
      title: 'Test havola', body: 'Matn', linkUrl: 'javascript:alert(1)',
    });
    assert.equal(r.status, 400, JSON.stringify(r.body));
  });

  it('http:// (shifrlanmagan) havola ham rad etiladi', async () => {
    const r = await admin.agent.post('/announcements').send({
      title: 'Test havola 2', body: 'Matn', linkUrl: 'http://example.com',
    });
    assert.equal(r.status, 400);
  });

  it('begona saytdagi rasm rad etiladi', async () => {
    const r = await admin.agent.post('/announcements').send({
      title: 'Test rasm', body: 'Matn', imageUrl: 'https://evil.example.com/pixel.png',
    });
    assert.equal(r.status, 400);
  });

  it('sayt ichidagi yo‘l va https havola qabul qilinadi', async () => {
    const a = await admin.agent.post('/announcements').send({
      title: 'Ichki havola', body: 'Matn', linkUrl: '/kurslar', linkLabel: 'Kurslar',
    });
    assert.equal(a.status, 201, JSON.stringify(a.body));
    const b = await admin.agent.post('/announcements').send({
      title: 'Telegram', body: 'Matn', linkUrl: 'https://t.me/turkcem_tr',
    });
    assert.equal(b.status, 201, JSON.stringify(b.body));
  });

  it('auditoriya bo‘yicha filtrlanadi: ustozlarga atalgani o‘quvchiga ko‘rinmaydi', async () => {
    const c = await admin.agent.post('/announcements').send({
      audience: 'TEACHERS', title: 'Ustozlar yig‘ilishi', body: 'Dushanba kuni',
    });
    assert.equal(c.status, 201);

    const forStudent = await s2.agent.get('/announcements');
    const titles = forStudent.body.map((a) => a.title);
    assert.ok(!titles.includes('Ustozlar yig‘ilishi'), 'ustozlarga atalgan e’lon o‘quvchiga ko‘rindi');

    const forTeacher = await teacher.agent.get('/announcements');
    assert.ok(forTeacher.body.map((a) => a.title).includes('Ustozlar yig‘ilishi'));
  });

  it('yopilgan e’lon qayta chiqmaydi — va faqat o‘sha odam uchun', async () => {
    const list = await s1.agent.get('/announcements');
    const target = list.body[0];
    const d = await s1.agent.post(`/announcements/${target.id}/dismiss`);
    assert.equal(d.status, 200, JSON.stringify(d.body));

    const after1 = await s1.agent.get('/announcements');
    assert.ok(!after1.body.map((a) => a.id).includes(target.id), 'yopilgan e’lon yana chiqdi');

    // Boshqa o'quvchida o'sha e'lon joyida turishi kerak
    const other = await s2.agent.get('/announcements');
    assert.ok(other.body.map((a) => a.id).includes(target.id), 'bir odam yopsa hammaga yo‘qoldi');
  });

  it('yopib bo‘lmaydigan e’lonni yopishga urinish rad etiladi', async () => {
    const c = await admin.agent.post('/announcements').send({
      kind: 'WARNING', title: 'Texnik ishlar', body: 'Shanba kuni', dismissible: false,
    });
    const r = await s2.agent.post(`/announcements/${c.body.id}/dismiss`);
    assert.equal(r.status, 400);
  });

  it('muddati o‘tgan e’lon ko‘rinmaydi', async () => {
    const past = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const almostPast = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const c = await admin.agent.post('/announcements').send({
      title: 'Eski aksiya', body: 'Tugadi', startsAt: past, endsAt: almostPast,
    });
    assert.equal(c.status, 201, JSON.stringify(c.body));
    const r = await s2.agent.get('/announcements');
    assert.ok(!r.body.map((a) => a.title).includes('Eski aksiya'));
  });
});

// ═══════════════════════ Murojaat ═══════════════════════

describe('adminga murojaat', () => {
  let reqId;

  it('o‘quvchi murojaat qoldiradi', async () => {
    const r = await s1.agent.post('/support').send({
      topic: 'PROFILE', subject: 'Ismimni o‘zgartiring', body: 'Familiyam xato yozilgan',
    });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    reqId = r.body.id;
  });

  it('BOSHQA o‘quvchi uni o‘qiy olmaydi (404, 403 emas)', async () => {
    const r = await s2.agent.get(`/support/${reqId}`);
    // 403 "bunday murojaat bor" degan ma'lumotni beradi, 404 esa hech narsa aytmaydi
    assert.equal(r.status, 404);
  });

  it('egasi o‘qiy oladi', async () => {
    const r = await s1.agent.get(`/support/${reqId}`);
    assert.equal(r.status, 200);
    assert.equal(r.body.subject, 'Ismimni o‘zgartiring');
  });

  it('admin o‘qiydi va javob beradi, holat ANSWERED bo‘ladi', async () => {
    const r = await admin.agent.post(`/support/${reqId}/replies`).send({ body: 'Tuzatildi' });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    const one = await s1.agent.get(`/support/${reqId}`);
    assert.equal(one.body.status, 'ANSWERED');
    assert.equal(one.body.replies.length, 1);
  });

  it('begona odam javob yoza olmaydi', async () => {
    const r = await s2.agent.post(`/support/${reqId}/replies`).send({ body: 'Men ham' });
    assert.equal(r.status, 404);
  });

  it('yopilgan murojaatga javob yozib bo‘lmaydi', async () => {
    const c = await admin.agent.patch(`/support/${reqId}/status`).send({ status: 'CLOSED' });
    assert.equal(c.status, 200, JSON.stringify(c.body));
    const r = await s1.agent.post(`/support/${reqId}/replies`).send({ body: 'Yana' });
    assert.equal(r.status, 400);
  });

  it('o‘quvchi holatni o‘zi o‘zgartira olmaydi', async () => {
    const r = await s1.agent.patch(`/support/${reqId}/status`).send({ status: 'RESOLVED' });
    assert.equal(r.status, 403);
  });
});

// ═══════════════════════ Profil rasmi ═══════════════════════

describe('profil rasmi', () => {
  it('begona manzil rad etiladi', async () => {
    const r = await s1.agent.post('/users/me/avatar').send({ url: 'https://evil.example.com/me.png' });
    assert.equal(r.status, 400);
  });

  it('o‘z omborimizdagi manzil qabul qilinadi va o‘chiriladi', async () => {
    const url = 'https://abc123.public.blob.vercel-storage.com/avatar/x/rasm-9f.png';
    const r = await s1.agent.post('/users/me/avatar').send({ url });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.avatarUrl, url);

    const d = await s1.agent.delete('/users/me/avatar');
    assert.equal(d.status, 200);
    assert.equal(d.body.avatarUrl, null);
  });

  it('parol xeshi hech qachon profilda chiqmaydi', async () => {
    const r = await s1.agent.get('/users/me/profile');
    assert.equal(r.status, 200);
    assert.equal(r.body.passwordHash, undefined);
    assert.equal(r.body.twoFactorSecret, undefined);
  });
});

// ═══════════════════════ Sessiyalar ═══════════════════════

describe('sessiyalar', () => {
  it('foydalanuvchi o‘z kirishlarini ko‘radi (qurilma va IP bilan)', async () => {
    const r = await s1.agent.get('/users/me/sessions');
    assert.equal(r.status, 200);
    assert.ok(r.body.length >= 1);
    // Token xeshi HECH QACHON chiqmasligi kerak
    assert.equal(r.body[0].tokenHash, undefined);
    assert.ok(r.body[0].createdAt, 'kirish vaqti yo‘q');
    assert.ok(r.body[0].expiresAt, 'tugash vaqti yo‘q');
  });
});

// ═══════════════════════ Jonli efir ═══════════════════════

describe('jonli efir', () => {
  let liveId;

  it('o‘quvchi efir yarata olmaydi', async () => {
    const r = await s1.agent.post('/live').send({
      title: 'Soxta dars', startsAt: new Date(Date.now() + 3600_000).toISOString(),
    });
    assert.equal(r.status, 403);
  });

  it('ustoz efir yaratadi', async () => {
    const r = await teacher.agent.post('/live').send({
      title: 'Ochiq dars: fe’l zamonlari',
      description: 'Hammaga ochiq',
      startsAt: new Date(Date.now() + 3 * 3600_000).toISOString(),
    });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    liveId = r.body.id;
  });

  it('XONA NOMI ro‘yxatda chiqmaydi', async () => {
    const r = await s1.agent.get('/live');
    assert.equal(r.status, 200);
    const found = r.body.find((s) => s.id === liveId);
    assert.ok(found, 'efir ro‘yxatda yo‘q');
    assert.equal(found.roomName, undefined, 'xona nomi ro‘yxatda sizib chiqdi');
    assert.equal(found.joinable, false);
  });

  it('vaqti kelmaganda kirish rad etiladi', async () => {
    const r = await s1.agent.post(`/live/${liveId}/join`);
    assert.equal(r.status, 403);
    assert.equal(r.body.code, 'NOT_JOINABLE');
  });

  it('uy egasi vaqtidan oldin ham kira oladi (sozlashni tekshirish uchun)', async () => {
    const r = await teacher.agent.post(`/live/${liveId}/join`);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.ok(r.body.url.startsWith('https://meet.jit.si/sanat-live-'), r.body.url);
    assert.match(r.body.url, /startWithAudioMuted=false/);
    assert.equal(r.body.provider, 'JITSI');
    assert.equal(r.body.isHost, true);
  });

  it('boshqa ustoz begona efirni o‘chira olmaydi', async () => {
    const other = await addUser({ email: 'ustoz2@sanat.uz', role: 'TEACHER', first: 'Ustozjon' });
    const r = await other.agent.delete(`/live/${liveId}`);
    assert.equal(r.status, 404);
  });
});

// ═══════════════════════ Bepul dars ═══════════════════════

describe('bepul dars', () => {
  let leadId, videoId;

  it('ariza ro‘yxatdan o‘tgan raqamga avtomatik bog‘lanadi', async () => {
    // Avval ariza qoldiramiz (ommaviy forma, hisobsiz)
    const guest = request.agent(ctx.server).set(CSRF);
    const ok = await guest.post('/leads').send({
      name: 'Yangi', phone: '+998909998877', level: 'A1', message: 'Bepul darsga yozilaman', consent: true,
    });
    assert.equal(ok.status, 201, JSON.stringify(ok.body));

    // Endi o'sha raqam bilan ro'yxatdan o'tamiz
    const u = await addUser({ email: 'yangi@talaba.uz', first: 'Yangi', phone: '+998909998877' });
    const mine = await u.agent.get('/free-lesson/me');
    assert.equal(mine.status, 200, JSON.stringify(mine.body));
    assert.ok(mine.body.lead, 'ariza hisobga bog‘lanmadi');
    leadId = mine.body.lead.id;
    ctx.newUser = u;
  });

  it('admin video qo‘shadi, ustoz arizachiga biriktiradi', async () => {
    const v = await admin.agent.post('/free-lesson/videos').send({
      title: '1-dars: Tanishuv', url: 'https://youtu.be/example1', position: 1,
    });
    assert.equal(v.status, 201, JSON.stringify(v.body));
    videoId = v.body.id;

    const a = await teacher.agent.post(`/free-lesson/leads/${leadId}/videos`).send({ videoId });
    assert.equal(a.status, 201, JSON.stringify(a.body));

    const mine = await ctx.newUser.agent.get('/free-lesson/me');
    assert.equal(mine.body.videos.length, 1);
    assert.equal(mine.body.videos[0].title, '1-dars: Tanishuv');
  });

  it('bitta video ikki marta biriktirilmaydi', async () => {
    const a = await teacher.agent.post(`/free-lesson/leads/${leadId}/videos`).send({ videoId });
    assert.equal(a.status, 400);
  });

  it('"http://" li video havolasi rad etiladi', async () => {
    const v = await admin.agent.post('/free-lesson/videos').send({
      title: 'Xavfsiz emas', url: 'http://example.com/video.mp4',
    });
    assert.equal(v.status, 400);
  });

  it('arizachi ustoz bilan yozishadi', async () => {
    const m = await ctx.newUser.agent.post(`/free-lesson/leads/${leadId}/messages`).send({
      body: 'Assalomu alaykum, darsni qachon boshlaymiz?',
    });
    assert.equal(m.status, 201, JSON.stringify(m.body));

    const reply = await teacher.agent.post(`/free-lesson/leads/${leadId}/messages`).send({
      body: 'Ertaga soat 18:00 da',
    });
    assert.equal(reply.status, 201);

    const mine = await ctx.newUser.agent.get('/free-lesson/me');
    assert.equal(mine.body.messages.length, 2);
  });

  it('BEGONA o‘quvchi bu yozishmaga yoza olmaydi', async () => {
    const r = await s2.agent.post(`/free-lesson/leads/${leadId}/messages`).send({ body: 'Salom' });
    assert.equal(r.status, 404);
  });

  it('o‘quvchi arizalar ro‘yxatini ko‘ra olmaydi', async () => {
    const r = await s1.agent.get('/free-lesson/leads');
    assert.equal(r.status, 403);
  });
});

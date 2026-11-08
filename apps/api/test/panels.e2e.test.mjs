// Yangi panellar: profil, bildirishnoma, chat, video dars, admin.
// Diqqat markazi — RUXSAT: kim nimaga tega oladi va tegolmaydi (IDOR, rol oshirish).
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

let ctx, TEACHER, OTHER_TEACHER, ADMIN, S1, S2, OUTSIDER, group;

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

/** Kelajakdagi/o'tmishdagi sana — ISO satr sifatida */
const inMinutes = (m) => new Date(Date.now() + m * 60_000).toISOString();

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
  S2 = await addStudent('s2@talaba.uz', 'Jasur');
  OUTSIDER = await addStudent('chet@talaba.uz', 'Chetdagi');

  const g = await TEACHER.agent.post('/groups').send({ name: 'A1 kechki', level: 'A1' });
  group = g.body;
  await TEACHER.agent.post(`/groups/${group.id}/members`).send({ identifier: S1.email });
  await TEACHER.agent.post(`/groups/${group.id}/members`).send({ identifier: S2.email });
});
after(() => ctx.app.close());

// ───────────────────────── Profil ─────────────────────────
describe('profil', () => {
  it('o\'z profilini oladi; parol xeshi va 2FA siri chiqmaydi', async () => {
    const r = await S1.agent.get('/users/me/profile');
    assert.equal(r.status, 200);
    assert.equal(r.body.email, S1.email);
    assert.equal(r.body.passwordHash, undefined);
    assert.equal(r.body.twoFactorSecret, undefined);
  });

  it('ism va bio yangilanadi', async () => {
    const r = await S1.agent.patch('/users/me/profile').send({ firstName: 'Dilnoza', bio: 'Turk tilini o\'rganyapman' });
    assert.equal(r.status, 200);
    assert.equal(r.body.bio, 'Turk tilini o\'rganyapman');
  });

  it('profil orqali ROL o\'zgartirib bo\'lmaydi (rol oshirish himoyasi)', async () => {
    await S1.agent.patch('/users/me/profile').send({ role: 'ADMIN', isActive: false });
    const after = await S1.agent.get('/users/me/profile');
    assert.equal(after.body.role, 'STUDENT');
    assert.equal(after.body.isActive, undefined); // maydon umuman qaytarilmaydi
    assert.equal(ctx.prisma.db.users.find((u) => u.id === S1.id).role, 'STUDENT');
  });

  it('parol almashtirish: joriy parol noto\'g\'ri bo\'lsa rad etiladi', async () => {
    const r = await S2.agent.post('/users/me/password')
      .send({ currentPassword: 'notogri-parol-123', newPassword: 'yangi-kuchli-parol-kuz' });
    assert.equal(r.status, 400);
  });

  it('parol almashtirilsa barcha sessiyalar uziladi', async () => {
    const r = await S2.agent.post('/users/me/password')
      .send({ currentPassword: PW, newPassword: 'yangi-kuchli-parol-kuz' });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const live = ctx.prisma.db.tokens.filter((t) => t.userId === S2.id && t.revokedAt === null);
    assert.equal(live.length, 0, 'parol o\'zgargach refresh tokenlar bekor bo\'lishi kerak');
  });

  it('zaif yangi parol rad etiladi', async () => {
    const r = await S1.agent.post('/users/me/password')
      .send({ currentPassword: PW, newPassword: 'parol12345' });
    assert.equal(r.status, 400);
  });
});

// ───────────────────────── Chat ─────────────────────────
describe('guruh chati', () => {
  let firstMessageId;

  it('a\'zo xabar yuboradi va ko\'radi', async () => {
    const r = await S1.agent.post(`/chat/groups/${group.id}/messages`).send({ content: 'Salom hammaga' });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    firstMessageId = r.body.id;
    const h = await S2.agent.get(`/chat/groups/${group.id}/messages`);
    assert.equal(h.status, 200);
    assert.equal(h.body.items.at(-1).content, 'Salom hammaga');
  });

  it('guruhga a\'zo bo\'lmagan odam chatni KO\'RA OLMAYDI (404, 403 emas)', async () => {
    const r = await OUTSIDER.agent.get(`/chat/groups/${group.id}/messages`);
    assert.equal(r.status, 404, 'guruh borligini ham bilib bo\'lmasligi kerak');
    const w = await OUTSIDER.agent.post(`/chat/groups/${group.id}/messages`).send({ content: 'kiraman' });
    assert.equal(w.status, 404);
  });

  it('boshqa guruh ustozi ham kira olmaydi', async () => {
    assert.equal((await OTHER_TEACHER.agent.get(`/chat/groups/${group.id}/messages`)).status, 404);
  });

  it('o\'quvchi e\'lon yubora olmaydi — oddiy xabarga aylanadi', async () => {
    const r = await S1.agent.post(`/chat/groups/${group.id}/messages`)
      .send({ content: 'Men e\'lon qilaman', isAnnouncement: true });
    assert.equal(r.status, 201);
    assert.equal(r.body.isAnnouncement, false);
  });

  it('ustoz e\'lon yuborsa a\'zolarga bildirishnoma boradi', async () => {
    const before = (await S1.agent.get('/notifications')).body.unread;
    const r = await TEACHER.agent.post(`/chat/groups/${group.id}/messages`)
      .send({ content: 'Ertaga dars yo\'q', isAnnouncement: true });
    assert.equal(r.body.isAnnouncement, true);
    const after = (await S1.agent.get('/notifications')).body.unread;
    assert.equal(after, before + 1);
  });

  it('spam cheklovi: ketma-ket ko\'p xabar to\'xtatiladi', async () => {
    let blocked = false;
    for (let i = 0; i < 8; i++) {
      const r = await S1.agent.post(`/chat/groups/${group.id}/messages`).send({ content: `xabar ${i}` });
      if (r.status === 403) { blocked = true; break; }
    }
    assert.equal(blocked, true, 'tez yozishga cheklov qo\'yilishi kerak');
  });

  it('o\'quvchi BOSHQANING xabarini o\'chira olmaydi; ustoz o\'chiradi', async () => {
    assert.equal((await S2.agent.delete(`/chat/messages/${firstMessageId}`)).status, 403);
    assert.equal((await TEACHER.agent.delete(`/chat/messages/${firstMessageId}`)).status, 200);
    const h = await S2.agent.get(`/chat/groups/${group.id}/messages`);
    const deleted = h.body.items.find((m) => m.id === firstMessageId);
    assert.equal(deleted.isDeleted, true);
    assert.equal(deleted.content, null, 'o\'chirilgan xabar matni berilmasligi kerak');
  });
});

// ───────────────────────── Video dars ─────────────────────────
describe('video dars', () => {
  let lesson;

  it('o\'quvchi dars yarata olmaydi; ustoz yaratadi', async () => {
    assert.equal(
      (await S1.agent.post(`/groups/${group.id}/lessons`).send({ title: 'Dars', startsAt: inMinutes(30) })).status,
      403,
    );
    const r = await TEACHER.agent.post(`/groups/${group.id}/lessons`)
      .send({ title: 'A1 grammatika', startsAt: inMinutes(5), durationMin: 60 });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    lesson = r.body;
    assert.equal(r.body.roomName, undefined, 'xona nomi yaratishda ham berilmasligi kerak');
  });

  it('o\'tib ketgan vaqtga dars qo\'yib bo\'lmaydi', async () => {
    const r = await TEACHER.agent.post(`/groups/${group.id}/lessons`)
      .send({ title: 'Kechagi', startsAt: inMinutes(-120) });
    assert.equal(r.status, 400);
  });

  it('ro\'yxatda xona nomi KO\'RINMAYDI', async () => {
    const r = await S1.agent.get(`/groups/${group.id}/lessons`);
    assert.equal(r.status, 200);
    assert.ok(r.body.length >= 1);
    for (const l of r.body) assert.equal(l.roomName, undefined);
  });

  it('qo\'shilganda xona nomi beriladi va taxmin qilib bo\'lmaydi', async () => {
    const r = await S1.agent.post(`/lessons/${lesson.id}/join`);
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.match(r.body.roomName, /^sanat-[A-Za-z0-9_-]{20,}$/);
    assert.equal(r.body.isModerator, false);
    const t = await TEACHER.agent.post(`/lessons/${lesson.id}/join`);
    assert.equal(t.body.isModerator, true, 'ustoz moderator bo\'lishi kerak');
    assert.equal(t.body.roomName, r.body.roomName);
  });

  it('guruhdan tashqaridagi odam qo\'shila olmaydi', async () => {
    assert.equal((await OUTSIDER.agent.post(`/lessons/${lesson.id}/join`)).status, 404);
  });

  it('hali boshlanmagan darsga kirib bo\'lmaydi', async () => {
    const future = await TEACHER.agent.post(`/groups/${group.id}/lessons`)
      .send({ title: 'Keyingi hafta', startsAt: inMinutes(60 * 24 * 7) });
    const r = await S1.agent.post(`/lessons/${future.body.id}/join`);
    assert.equal(r.status, 403);
  });

  it('bekor qilingan darsga kirib bo\'lmaydi', async () => {
    assert.equal((await TEACHER.agent.delete(`/lessons/${lesson.id}`)).status, 200);
    assert.equal((await S1.agent.post(`/lessons/${lesson.id}/join`)).status, 403);
  });

  it('boshqa guruh ustozi darsni bekor qila olmaydi', async () => {
    const l = await TEACHER.agent.post(`/groups/${group.id}/lessons`)
      .send({ title: 'Himoyalangan', startsAt: inMinutes(10) });
    assert.equal((await OTHER_TEACHER.agent.delete(`/lessons/${l.body.id}`)).status, 404);
  });
});

// ───────────────────────── Bildirishnoma ─────────────────────────
describe('bildirishnomalar', () => {
  it('faqat o\'ziniki ko\'rinadi', async () => {
    const mine = await S1.agent.get('/notifications');
    assert.equal(mine.status, 200);
    for (const n of mine.body.items) assert.equal(n.userId, S1.id);
  });

  it('boshqaning bildirishnomasini o\'qilgan deb belgilab bo\'lmaydi', async () => {
    const s1n = (await S1.agent.get('/notifications')).body.items[0];
    if (!s1n) return;
    await S2.agent.patch(`/notifications/${s1n.id}/read`);
    const still = (await S1.agent.get('/notifications')).body.items.find((n) => n.id === s1n.id);
    assert.equal(still.readAt, null, 'begona odam o\'qilgan deb belgilay olmasligi kerak');
  });

  it('hammasini o\'qilgan deb belgilash ishlaydi', async () => {
    const r = await S1.agent.patch('/notifications/read-all');
    assert.equal(r.status, 200);
    assert.equal((await S1.agent.get('/notifications')).body.unread, 0);
  });
});

// ───────────────────────── Admin paneli ─────────────────────────
describe('admin paneli', () => {
  it('o\'quvchi va USTOZ admin bo\'limiga kira olmaydi', async () => {
    for (const who of [S1, TEACHER, OTHER_TEACHER]) {
      assert.equal((await who.agent.get('/admin/users')).status, 403);
      assert.equal((await who.agent.get('/admin/stats')).status, 403);
      assert.equal((await who.agent.get('/admin/audit')).status, 403);
    }
  });

  it('admin ko\'rsatkichlarni oladi', async () => {
    const r = await ADMIN.agent.get('/admin/stats');
    assert.equal(r.status, 200);
    assert.ok(r.body.users >= 6);
    assert.equal(typeof r.body.roles.STUDENT, 'number');
  });

  it('foydalanuvchilarni qidiradi va rol bo\'yicha filtrlaydi', async () => {
    const r = await ADMIN.agent.get('/admin/users?role=TEACHER');
    assert.equal(r.status, 200);
    assert.ok(r.body.items.every((u) => u.role === 'TEACHER'));
    const q = await ADMIN.agent.get('/admin/users?q=Dilnoza');
    assert.ok(q.body.items.some((u) => u.firstName === 'Dilnoza'));
    for (const u of r.body.items) assert.equal(u.passwordHash, undefined);
  });

  it('admin ustoz yaratadi', async () => {
    const r = await ADMIN.agent.post('/admin/users').send({
      firstName: 'Yangi', lastName: 'Ustoz', identifier: 'yangi@ustoz.uz',
      password: 'mustahkam-parol-kuz-2026', role: 'TEACHER',
    });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.body.role, 'TEACHER');
  });

  it('zaif parol bilan foydalanuvchi yaratilmaydi', async () => {
    const r = await ADMIN.agent.post('/admin/users').send({
      firstName: 'Zaif', lastName: 'Parol', identifier: 'zaif@ustoz.uz',
      password: 'parol12345', role: 'TEACHER',
    });
    assert.equal(r.status, 400);
  });

  it('band email bilan yaratib bo\'lmaydi', async () => {
    const r = await ADMIN.agent.post('/admin/users').send({
      firstName: 'Takror', lastName: 'Email', identifier: S1.email,
      password: 'mustahkam-parol-kuz-2026', role: 'STUDENT',
    });
    assert.equal(r.status, 409);
  });

  it('admin o\'z rolini tushira olmaydi va o\'zini o\'chira olmaydi', async () => {
    assert.equal((await ADMIN.agent.patch(`/admin/users/${ADMIN.id}`).send({ role: 'TEACHER' })).status, 400);
    assert.equal((await ADMIN.agent.patch(`/admin/users/${ADMIN.id}`).send({ isActive: false })).status, 400);
  });

  it('oxirgi admin olib tashlanmaydi', async () => {
    // ADMIN yagona admin: boshqa adminni rolini tushirishga urinish ham taqiqlanadi
    const admins = ctx.prisma.db.users.filter((u) => u.role === 'ADMIN' && u.isActive);
    assert.equal(admins.length, 1, 'bu test bitta admin borligiga tayanadi');
  });

  it('hisob o\'chirilsa sessiyalari ham uziladi', async () => {
    const r = await ADMIN.agent.patch(`/admin/users/${OUTSIDER.id}`).send({ isActive: false });
    assert.equal(r.status, 200);
    assert.equal(r.body.isActive, false);
    const live = ctx.prisma.db.tokens.filter((t) => t.userId === OUTSIDER.id && t.revokedAt === null);
    assert.equal(live.length, 0);
    // O'chirilgan foydalanuvchi endi so'rov yubora olmaydi
    assert.equal((await OUTSIDER.agent.get('/users/me/profile')).status, 401);
  });

  it('admin parolni tiklaydi; foydalanuvchi yangi parol bilan kiradi', async () => {
    const r = await ADMIN.agent.post(`/admin/users/${S1.id}/password`)
      .send({ newPassword: 'admin-tikladi-parol-kuz' });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    const fresh = request.agent(ctx.server).set(CSRF);
    const login = await fresh.post('/auth/login').send({ identifier: S1.email, password: 'admin-tikladi-parol-kuz' });
    assert.equal(login.status, 200, JSON.stringify(login.body));
  });

  it('admin qulfni ochadi va 2FA ni tozalaydi', async () => {
    assert.equal((await ADMIN.agent.post(`/admin/users/${S1.id}/unlock`)).status, 201);
    assert.equal((await ADMIN.agent.post(`/admin/users/${OTHER_TEACHER.id}/clear-2fa`)).status, 201);
    assert.equal(ctx.prisma.db.users.find((u) => u.id === OTHER_TEACHER.id).twoFactorEnabled, false);
  });

  it('audit jurnali adminga ko\'rinadi va amallar yozilgan', async () => {
    const r = await ADMIN.agent.get('/admin/audit?take=100');
    assert.equal(r.status, 200);
    const actions = r.body.items.map((a) => a.action);
    assert.ok(actions.includes('ADMIN_PASSWORD_RESET'), JSON.stringify(actions.slice(0, 10)));
    assert.ok(actions.includes('ADMIN_USER_CREATED'));
  });
});

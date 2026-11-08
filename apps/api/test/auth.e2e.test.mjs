// To'liq oqim testi: haqiqiy Nest ilovasi (guardlar, CSRF, validatsiya, cookie), soxta baza.
// Ishga tushirish: pnpm test:e2e
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
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
const TEACHER_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

const CSRF = { 'X-Requested-With': 'XMLHttpRequest', Origin: 'http://localhost:3000' };
const GOOD_PW = 'olma-daraxti-sakkiz-kuz';

async function makeApp() {
  const prisma = createFakePrisma();
  const mod = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService).useValue(prisma).compile();
  const app = mod.createNestApplication();
  configureApp(app);
  await app.init();
  return { app, prisma, server: app.getHttpServer() };
}

const reg = (over = {}) => ({
  firstName: 'Aziza', lastName: 'Karimova', email: 'aziza@example.com',
  password: GOOD_PW, birthDate: '2010-06-15', acceptTerms: true, ...over,
});
const cookieValue = (res, name) =>
  (res.headers['set-cookie'] ?? []).find((c) => c.startsWith(`${name}=`))?.split(';')[0].split('=')[1];
const setCookie = (res, name) => (res.headers['set-cookie'] ?? []).find((c) => c.startsWith(`${name}=`));

describe('ruxsat va CSRF', () => {
  let ctx;
  before(async () => (ctx = await makeApp()));
  after(() => ctx.app.close());

  it('kirmagan foydalanuvchi himoyalangan yo\'llarga kira olmaydi (standart: yopiq)', async () => {
    assert.equal((await request(ctx.server).get('/auth/me')).status, 401);
    assert.equal((await request(ctx.server).get('/leads')).status, 401);
  });
  it('CSRF sarlavhasisiz POST rad etiladi', async () => {
    const r = await request(ctx.server).post('/auth/login').send({ identifier: 'a@b.uz', password: 'x' });
    assert.equal(r.status, 403);
  });
  it('boshqa Origin\'dan POST rad etiladi', async () => {
    const r = await request(ctx.server).post('/auth/login').set({ ...CSRF, Origin: 'http://evil.example' })
      .send({ identifier: 'a@b.uz', password: 'x' });
    assert.equal(r.status, 403);
  });
  it('soxta tokenlar rad etiladi (buzilgan, alg=none, boshqa kalit)', async () => {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const exp = Math.floor(Date.now() / 1000) + 600;
    const none = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: 'id1', exp })}.`;
    const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ sub: 'id1', exp });
    const foreign = `${h}.${p}.${createHmac('sha256', 'boshqa-kalit').update(`${h}.${p}`).digest('base64url')}`;
    for (const t of ['garbage', none, foreign]) {
      const r = await request(ctx.server).get('/auth/me').set('Cookie', `sh_at=${t}`);
      assert.equal(r.status, 401, `token: ${t.slice(0, 20)}`);
    }
  });
});

describe("ro'yxatdan o'tish", () => {
  let ctx;
  before(async () => (ctx = await makeApp()));
  after(() => ctx.app.close());
  const post = (body) => request(ctx.server).post('/auth/register').set(CSRF).send(body);

  it("muvaffaqiyatli: cookie'lar xavfsiz, javobda maxfiy maydon yo'q, 18 yoshgacha belgilanadi", async () => {
    const r = await post(reg());
    assert.equal(r.status, 201);
    assert.equal(r.body.user.role, 'STUDENT');
    assert.equal(r.body.needsParentConsent, true);
    assert.equal(r.body.user.passwordHash, undefined);
    assert.ok(!JSON.stringify(r.body).includes('argon2'));
    const at = setCookie(r, 'sh_at'), rt = setCookie(r, 'sh_rt');
    assert.match(at, /HttpOnly/i); assert.match(at, /SameSite=Lax/i);
    assert.match(rt, /HttpOnly/i); assert.match(rt, /SameSite=Strict/i); assert.match(rt, /Path=\/auth/i);
    // baza: parol oddiy matnda emas, refresh token xeshlangan holda
    const row = ctx.prisma.db.users[0];
    assert.ok(row.passwordHash.startsWith('$argon2id$'));
    assert.notEqual(ctx.prisma.db.tokens[0].tokenHash, cookieValue(r, 'sh_rt'));
  });
  it('"role": "ADMIN" yuborilsa rad etiladi (mass assignment)', async () => {
    assert.equal((await post(reg({ email: 'x@example.com', role: 'ADMIN' }))).status, 400);
  });
  it('takroriy email 409', async () => assert.equal((await post(reg())).status, 409));
  it('zaif parol, noto\'g\'ri telefon, kontaktsiz, rozilik yo\'q: 400', async () => {
    assert.equal((await post(reg({ email: 'a1@example.com', password: 'password123456' }))).status, 400);
    assert.equal((await post(reg({ email: undefined, phone: '12345' }))).status, 400);
    assert.equal((await post(reg({ email: undefined }))).status, 400);
    assert.equal((await post(reg({ email: 'a2@example.com', acceptTerms: false }))).status, 400);
    assert.equal((await post(reg({ email: 'a3@example.com', firstName: '<script>' }))).status, 400);
  });
  it('telefon bilan ro\'yxatdan o\'tish normallashadi', async () => {
    const r = await post(reg({ email: undefined, phone: '90 123-45-67' }));
    assert.equal(r.status, 201);
    assert.equal(r.body.user.phone, '+998901234567');
  });
});

describe('kirish, bloklash, chiqish', () => {
  let ctx;
  before(async () => {
    ctx = await makeApp();
    await request(ctx.server).post('/auth/register').set(CSRF).send(reg());
  });
  after(() => ctx.app.close());
  const login = (identifier, password) => request(ctx.server).post('/auth/login').set(CSRF).send({ identifier, password });

  it('noto\'g\'ri parol va mavjud bo\'lmagan foydalanuvchi bir xil xabar beradi', async () => {
    const a = await login('aziza@example.com', 'xato-parol-1234');
    const b = await login('yoq@example.com', 'xato-parol-1234');
    assert.equal(a.status, 401); assert.equal(b.status, 401);
    assert.equal(a.body.message, b.body.message);
  });
  it('5 ta xato urinishdan keyin hisob bloklanadi, hatto to\'g\'ri parol bilan ham', async () => {
    for (let i = 0; i < 3; i++) await login('aziza@example.com', 'xato-parol-1234'); // 1 ta oldingisi bilan 4
    assert.equal((await login('aziza@example.com', 'xato-parol-1234')).status, 401); // 5-urinish: bloklanadi
    const r = await login('aziza@example.com', GOOD_PW);
    assert.equal(r.status, 429);
    assert.ok(ctx.prisma.db.audits.some((a) => a.action === 'ACCOUNT_LOCKED'));
    ctx.prisma.db.users[0].lockedUntil = null; // blok muddati o'tdi deb hisoblaymiz
  });
  it('to\'g\'ri parol bilan kirish, /auth/me ishlaydi, chiqishdan keyin yopiladi', async () => {
    const agent = request.agent(ctx.server).set(CSRF);
    const r = await agent.post('/auth/login').send({ identifier: 'AZIZA@example.com ', password: GOOD_PW });
    assert.equal(r.status, 200);
    assert.equal(r.body.mustSetup2fa, false);
    assert.equal((await agent.get('/auth/me')).body.firstName, 'Aziza');
    assert.equal((await agent.post('/auth/logout')).status, 200);
    assert.equal((await agent.get('/auth/me')).status, 401);
  });
  it('o\'chirilgan (isActive=false) foydalanuvchi darhol kira olmaydi', async () => {
    const agent = request.agent(ctx.server).set(CSRF);
    await agent.post('/auth/login').send({ identifier: 'aziza@example.com', password: GOOD_PW });
    assert.equal((await agent.get('/auth/me')).status, 200);
    ctx.prisma.db.users[0].isActive = false;
    assert.equal((await agent.get('/auth/me')).status, 401);
    ctx.prisma.db.users[0].isActive = true;
  });
});

describe('refresh token: almashtirish va qayta ishlatishni aniqlash', () => {
  let ctx;
  before(async () => {
    ctx = await makeApp();
    await request(ctx.server).post('/auth/register').set(CSRF).send(reg());
  });
  after(() => ctx.app.close());

  it('har yangilashda yangi token beriladi; eski token qayta ishlatilsa, barcha seanslar yopiladi', async () => {
    const login = await request(ctx.server).post('/auth/login').set(CSRF).send({ identifier: 'aziza@example.com', password: GOOD_PW });
    const rt1 = cookieValue(login, 'sh_rt');

    const r2 = await request(ctx.server).post('/auth/refresh').set(CSRF).set('Cookie', `sh_rt=${rt1}`);
    assert.equal(r2.status, 200);
    const rt2 = cookieValue(r2, 'sh_rt');
    assert.ok(rt2 && rt2 !== rt1);

    // Darhol qayta ishlatish (ikki tab poygasi): 401, lekin yangi token hali ishlaydi
    const race = await request(ctx.server).post('/auth/refresh').set(CSRF).set('Cookie', `sh_rt=${rt1}`);
    assert.equal(race.status, 401);
    const stillOk = await request(ctx.server).post('/auth/refresh').set(CSRF).set('Cookie', `sh_rt=${rt2}`);
    assert.equal(stillOk.status, 200);
    const rt3 = cookieValue(stillOk, 'sh_rt');

    // Eski token bir necha soniyadan keyin ishlatilsa: o'g'irlangan deb hisoblanadi
    ctx.prisma.db.tokens.find((t) => t.revokedAt).revokedAt = new Date(Date.now() - 60_000);
    const theft = await request(ctx.server).post('/auth/refresh').set(CSRF).set('Cookie', `sh_rt=${rt1}`);
    assert.equal(theft.status, 401);
    const killed = await request(ctx.server).post('/auth/refresh').set(CSRF).set('Cookie', `sh_rt=${rt3}`);
    assert.equal(killed.status, 401, "o'g'irlik aniqlangach, barcha tokenlar bekor qilinishi kerak");
    assert.ok(ctx.prisma.db.audits.some((a) => a.action === 'REFRESH_REUSE_DETECTED'));
  });
  it('tokensiz va noma\'lum token bilan refresh: 401', async () => {
    assert.equal((await request(ctx.server).post('/auth/refresh').set(CSRF)).status, 401);
    assert.equal((await request(ctx.server).post('/auth/refresh').set(CSRF).set('Cookie', 'sh_rt=nomalum')).status, 401);
  });
});

describe('rollar va arizalar (leads)', () => {
  let ctx;
  before(async () => {
    ctx = await makeApp();
    await request(ctx.server).post('/auth/register').set(CSRF).send(reg());
    ctx.prisma.db.users.push({
      id: 'teacher1', email: 'ustoz@example.com', phone: null, firstName: 'Ustoz', lastName: 'Sanat',
      role: 'TEACHER', locale: 'UZ', avatarUrl: null, isActive: true, twoFactorEnabled: true,
      twoFactorSecret: encrypt(TEACHER_SECRET, process.env.TOTP_ENCRYPTION_KEY, 'totp-secret'), twoFactorLastStep: null, leaderboardOptIn: false,
      parentConsent: false, failedLoginCount: 0, lockedUntil: null, passwordHash: await hashPassword(GOOD_PW),
    });
  });
  after(() => ctx.app.close());
  const lead = (over = {}) =>
    request(ctx.server).post('/leads').set(CSRF).send({ name: 'Dilnoza', phone: '+998 91 111-22-33', level: 'A1', consent: true, ...over });

  it('ommaviy ariza qabul qilinadi (kirishsiz)', async () => {
    const r = await lead();
    assert.equal(r.status, 201);
    assert.deepEqual(r.body, { ok: true });
    assert.equal(ctx.prisma.db.leads.length, 1);
    assert.equal(ctx.prisma.db.leads[0].phone, '+998911112233');
  });
  it('takroriy ariza (24 soat) saqlanmaydi, lekin javob bir xil', async () => {
    const r = await lead();
    assert.deepEqual(r.body, { ok: true });
    assert.equal(ctx.prisma.db.leads.length, 1);
  });
  it('bot tuzog\'i to\'ldirilsa: muvaffaqiyat ko\'rinadi, lekin saqlanmaydi', async () => {
    const r = await lead({ phone: '+998 92 222-33-44', website: 'http://spam.example' });
    assert.deepEqual(r.body, { ok: true });
    assert.equal(ctx.prisma.db.leads.length, 1);
  });
  it('noto\'g\'ri telefon yoki rozilik yo\'q: 400', async () => {
    assert.equal((await lead({ phone: '123' })).status, 400);
    assert.equal((await lead({ consent: false })).status, 400);
  });
  it('arizalar ro\'yxatini o\'quvchi ko\'ra olmaydi (403), ustoz ko\'radi (200)', async () => {
    const student = request.agent(ctx.server).set(CSRF);
    await student.post('/auth/login').send({ identifier: 'aziza@example.com', password: GOOD_PW });
    assert.equal((await student.get('/leads')).status, 403);

    const teacher = request.agent(ctx.server).set(CSRF);
    const step1 = await teacher.post('/auth/login').send({ identifier: 'ustoz@example.com', password: GOOD_PW });
    assert.equal(step1.body.twoFactorRequired, true); // ustozda 2FA yoqilgan: parol yetarli emas
    await teacher.post('/auth/2fa/login').send({ challenge: step1.body.challenge, code: totpAt(TEACHER_SECRET, Date.now()) });
    const r = await teacher.get('/leads');
    assert.equal(r.status, 200);
    assert.equal(r.body.length, 1);
  });
});

// Ikki bosqichli tasdiqlash (2FA): to'liq oqim.
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
const { totpAt } = await import('../dist/auth/totp.js');

const CSRF = { 'X-Requested-With': 'XMLHttpRequest', Origin: 'http://localhost:3000' };
const PW = 'olma-daraxti-sakkiz-kuz';
const STEP = 30_000;

async function makeApp() {
  const prisma = createFakePrisma();
  const mod = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService).useValue(prisma).compile();
  const app = mod.createNestApplication();
  configureApp(app);
  await app.init();
  const addUser = async (over) => {
    const row = {
      id: `u${prisma.db.users.length + 1}`, email: null, phone: null, firstName: 'Ism', lastName: 'Familiya',
      role: 'STUDENT', locale: 'UZ', avatarUrl: null, isActive: true, twoFactorEnabled: false,
      twoFactorSecret: null, twoFactorLastStep: null, leaderboardOptIn: false, parentConsent: false,
      failedLoginCount: 0, lockedUntil: null, passwordHash: await hashPassword(PW), ...over,
    };
    prisma.db.users.push(row);
    return row;
  };
  return { app, prisma, server: app.getHttpServer(), addUser };
}
const cookie = (res, name) => (res.headers['set-cookie'] ?? []).find((c) => c.startsWith(`${name}=`));

describe('ustoz/admin: 2FA majburiy', () => {
  let ctx, agent, secret, recovery;
  before(async () => {
    ctx = await makeApp();
    await ctx.addUser({ email: 'admin@example.com', role: 'ADMIN', firstName: 'Admin', lastName: 'Sanat' });
  });
  after(() => ctx.app.close());

  it('2FA yoqilmaguncha server boshqa yo\'llarni yopadi, lekin 2FA sozlash yo\'llari ochiq', async () => {
    agent = request.agent(ctx.server).set(CSRF);
    const login = await agent.post('/auth/login').send({ identifier: 'admin@example.com', password: PW });
    assert.equal(login.status, 200);
    assert.equal(login.body.mustSetup2fa, true);

    const blocked = await agent.get('/leads');
    assert.equal(blocked.status, 403);
    assert.equal(blocked.body.code, '2FA_SETUP_REQUIRED');
    assert.equal((await agent.get('/auth/me')).status, 200);
  });

  it('sozlash: sir shifrlangan saqlanadi, noto\'g\'ri kod rad, to\'g\'ri kod bilan yoqiladi', async () => {
    const setup = await agent.post('/auth/2fa/setup');
    assert.equal(setup.status, 200);
    secret = setup.body.secret;
    assert.match(setup.body.otpauthUrl, /^otpauth:\/\/totp\/.+secret=[A-Z2-7]+/);
    const row = ctx.prisma.db.users[0];
    assert.ok(row.twoFactorSecret && !row.twoFactorSecret.includes(secret), 'sir bazada ochiq ko\'rinishda bo\'lmasligi kerak');

    assert.equal((await agent.post('/auth/2fa/enable').send({ code: '000000' })).status, 400);
    const enable = await agent.post('/auth/2fa/enable').send({ code: totpAt(secret, Date.now()) });
    assert.equal(enable.status, 200);
    recovery = enable.body.recoveryCodes;
    assert.equal(recovery.length, 8);
    assert.ok(ctx.prisma.db.recovery.every((r) => !recovery.some((c) => r.codeHash.includes(c))), 'tiklash kodlari xeshlangan');

    assert.equal((await agent.get('/leads')).status, 200); // endi ruxsat bor
    assert.equal((await agent.post('/auth/2fa/setup')).status, 409); // qayta sozlab bo'lmaydi
  });

  it('kirish ikki bosqichli: parol seans bermaydi; challenge access token sifatida ishlamaydi', async () => {
    await agent.post('/auth/logout');
    const fresh = request.agent(ctx.server).set(CSRF);
    const r = await fresh.post('/auth/login').send({ identifier: 'admin@example.com', password: PW });
    assert.equal(r.body.twoFactorRequired, true);
    assert.equal(cookie(r, 'sh_at'), undefined);
    assert.equal((await fresh.get('/auth/me')).status, 401);
    const asCookie = await request(ctx.server).get('/auth/me').set('Cookie', `sh_at=${r.body.challenge}`);
    assert.equal(asCookie.status, 401);
    // oddiy access token esa challenge o'rnida ishlamasligi kerak
    const real = request.agent(ctx.server).set(CSRF);
    ctx.prisma.db.users[0].twoFactorLastStep = null;
    const ok = await real.post('/auth/2fa/login').send({ challenge: r.body.challenge, code: totpAt(secret, Date.now() + STEP) });
    assert.equal(ok.status, 200);
    const accessToken = cookie(ok, 'sh_at').split(';')[0].split('=')[1];
    const misuse = await request(ctx.server).post('/auth/2fa/login').set(CSRF).send({ challenge: accessToken, code: '123456' });
    assert.equal(misuse.status, 401);
  });

  it('noto\'g\'ri kod rad; to\'g\'ri kod bir marta ishlaydi, takror ishlatilsa rad etiladi (replay)', async () => {
    ctx.prisma.db.users[0].twoFactorLastStep = null; // oldingi testlarda ishlatilgan qadamni tozalaymiz
    const a = request.agent(ctx.server).set(CSRF);
    const ch = (await a.post('/auth/login').send({ identifier: 'admin@example.com', password: PW })).body.challenge;
    assert.equal((await a.post('/auth/2fa/login').send({ challenge: ch, code: '000000' })).status, 401);

    const code = totpAt(secret, Date.now());
    assert.equal((await a.post('/auth/2fa/login').send({ challenge: ch, code })).status, 200);
    const b = request.agent(ctx.server).set(CSRF);
    const ch2 = (await b.post('/auth/login').send({ identifier: 'admin@example.com', password: PW })).body.challenge;
    assert.equal((await b.post('/auth/2fa/login').send({ challenge: ch2, code })).status, 401, 'bir kod ikki marta ishlamasligi kerak');
  });

  it('tiklash kodi bir marta ishlaydi', async () => {
    const a = request.agent(ctx.server).set(CSRF);
    const ch1 = (await a.post('/auth/login').send({ identifier: 'admin@example.com', password: PW })).body.challenge;
    const used = await a.post('/auth/2fa/login').send({ challenge: ch1, code: recovery[0].toLowerCase() });
    assert.equal(used.status, 200);
    const b = request.agent(ctx.server).set(CSRF);
    const ch2 = (await b.post('/auth/login').send({ identifier: 'admin@example.com', password: PW })).body.challenge;
    assert.equal((await b.post('/auth/2fa/login').send({ challenge: ch2, code: recovery[0] })).status, 401);
    assert.equal((await b.post('/auth/2fa/login').send({ challenge: ch2, code: recovery[1] })).status, 200);
  });

  it('admin 2FA ni o\'chira olmaydi', async () => {
    const a = request.agent(ctx.server).set(CSRF);
    const ch = (await a.post('/auth/login').send({ identifier: 'admin@example.com', password: PW })).body.challenge;
    await a.post('/auth/2fa/login').send({ challenge: ch, code: recovery[2] });
    const r = await a.post('/auth/2fa/disable').send({ password: PW, code: recovery[3] });
    assert.equal(r.status, 403);
  });
});

describe('2FA kodini topishga urinish bloklanadi', () => {
  let ctx;
  const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
  before(async () => {
    ctx = await makeApp();
    const { encrypt } = await import('../dist/auth/crypto.js');
    await ctx.addUser({
      email: 'ustoz@example.com', role: 'TEACHER', twoFactorEnabled: true,
      twoFactorSecret: encrypt(SECRET, process.env.TOTP_ENCRYPTION_KEY, 'totp-secret'),
    });
  });
  after(() => ctx.app.close());

  it('5 ta noto\'g\'ri kod: hisob bloklanadi, keyin to\'g\'ri kod ham, parol ham o\'tmaydi', async () => {
    const a = request.agent(ctx.server).set(CSRF);
    const ch = (await a.post('/auth/login').send({ identifier: 'ustoz@example.com', password: PW })).body.challenge;
    for (let i = 0; i < 5; i++) {
      assert.equal((await a.post('/auth/2fa/login').send({ challenge: ch, code: String(100000 + i) })).status, 401);
    }
    const good = await a.post('/auth/2fa/login').send({ challenge: ch, code: totpAt(SECRET, Date.now()) });
    assert.equal(good.status, 429);
    const pw = await a.post('/auth/login').send({ identifier: 'ustoz@example.com', password: PW });
    assert.equal(pw.status, 429);
    assert.ok(ctx.prisma.db.audits.some((x) => x.action === 'ACCOUNT_LOCKED'));
  });
});

describe('o\'quvchi uchun ixtiyoriy 2FA', () => {
  let ctx;
  before(async () => {
    ctx = await makeApp();
    await ctx.addUser({ email: 'aziza@example.com' });
  });
  after(() => ctx.app.close());

  it('yoqadi va parol+kod bilan o\'chiradi', async () => {
    const a = request.agent(ctx.server).set(CSRF);
    await a.post('/auth/login').send({ identifier: 'aziza@example.com', password: PW });
    const { secret } = (await a.post('/auth/2fa/setup')).body;
    const en = await a.post('/auth/2fa/enable').send({ code: totpAt(secret, Date.now()) });
    assert.equal(en.status, 200);

    assert.equal((await a.post('/auth/2fa/disable').send({ password: 'xato-parol-1234', code: en.body.recoveryCodes[0] })).status, 401);
    const off = await a.post('/auth/2fa/disable').send({ password: PW, code: en.body.recoveryCodes[1] });
    assert.equal(off.status, 200);
    assert.equal(ctx.prisma.db.users[0].twoFactorEnabled, false);
    assert.equal(ctx.prisma.db.users[0].twoFactorSecret, null);
    assert.equal(ctx.prisma.db.recovery.length, 0);
  });
});

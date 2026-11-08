// Guruhlar, uy vazifalari, baholash, davomat: ishlash va RUXSATSIZ KIRISHDAN himoya (IDOR).
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
const { tashkentDay } = await import('../dist/games/srs.js');

const CSRF = { 'X-Requested-With': 'XMLHttpRequest', Origin: 'http://localhost:3000' };
const PW = 'olma-daraxti-sakkiz-kuz';
const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

let ctx, A, B, ADMIN, S1, S2, MINOR, group;

async function addStaff(email, role, first) {
  const prisma = ctx.prisma;
  const row = {
    id: `${role.toLowerCase()}-${first}`, email, phone: null, firstName: first, lastName: 'Ustoz', role, locale: 'UZ', avatarUrl: null,
    isActive: true, twoFactorEnabled: true, twoFactorSecret: encrypt(SECRET, process.env.TOTP_ENCRYPTION_KEY, 'totp-secret'),
    twoFactorLastStep: null, leaderboardOptIn: false, parentConsent: false, failedLoginCount: 0, lockedUntil: null,
    passwordHash: await hashPassword(PW), birthDate: null,
  };
  prisma.db.users.push(row);
  const agent = request.agent(ctx.server).set(CSRF);
  const step1 = await agent.post('/auth/login').send({ identifier: email, password: PW });
  assert.equal(step1.body.twoFactorRequired, true);
  const r = await agent.post('/auth/2fa/login').send({ challenge: step1.body.challenge, code: totpAt(SECRET, Date.now()) });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return { agent, id: row.id };
}
async function addStudent(email, over = {}) {
  const agent = request.agent(ctx.server).set(CSRF);
  const r = await agent.post('/auth/register').send({
    firstName: 'Talaba', lastName: 'Karimova', email, password: PW, birthDate: '1995-01-01', acceptTerms: true, ...over,
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return { agent, id: r.body.user.id, email };
}

before(async () => {
  const prisma = createFakePrisma();
  const mod = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(PrismaService).useValue(prisma).compile();
  const app = mod.createNestApplication();
  configureApp(app);
  await app.init();
  ctx = { app, prisma, server: app.getHttpServer() };
  A = await addStaff('a@ustoz.uz', 'TEACHER', 'Aziz');
  B = await addStaff('b@ustoz.uz', 'TEACHER', 'Bobur');
  ADMIN = await addStaff('admin@ustoz.uz', 'ADMIN', 'Admin');
  S1 = await addStudent('s1@talaba.uz');
  S2 = await addStudent('s2@talaba.uz');
  MINOR = await addStudent('minor@talaba.uz', { birthDate: '2012-03-04' });
});
after(() => ctx.app.close());

describe('guruh yaratish va ko\'rish', () => {
  it('o\'quvchi guruh yarata olmaydi (403); ustoz yaratadi (201)', async () => {
    assert.equal((await S1.agent.post('/groups').send({ name: 'Yangi', level: 'A1' })).status, 403);
    const r = await A.agent.post('/groups').send({ name: 'A1 kechki guruh', level: 'A1', schedule: 'Du-Chor-Ju 19:00', meetingUrl: 'https://meet.example.com/abc' });
    assert.equal(r.status, 201);
    group = r.body;
    assert.equal(group.teacherId, A.id);
  });
  it('xavfli meetingUrl (javascript:, http:) rad etiladi', async () => {
    for (const url of ['javascript:alert(1)', 'http://insecure.example.com', 'ftp://x.uz']) {
      assert.equal((await A.agent.post('/groups').send({ name: 'Xavfli', level: 'A1', meetingUrl: url })).status, 400, url);
    }
  });
  it('ustoz guruhni boshqa ustozga biriktira olmaydi, admin esa oladi', async () => {
    assert.equal((await A.agent.post('/groups').send({ name: 'Xx', level: 'A2', teacherId: B.id })).status, 403);
    const r = await ADMIN.agent.post('/groups').send({ name: 'B guruhi', level: 'B1', teacherId: B.id });
    assert.equal(r.status, 201);
    assert.equal(r.body.teacherId, B.id);
  });
  it('har ustoz faqat o\'z guruhlarini ko\'radi', async () => {
    const a = (await A.agent.get('/groups')).body, b = (await B.agent.get('/groups')).body;
    assert.deepEqual(a.map((g) => g.name), ['A1 kechki guruh']);
    assert.deepEqual(b.map((g) => g.name), ['B guruhi']);
  });
});

describe("a'zolar qo'shish", () => {
  it("topilmagan, ustoz akkaunti, o'quvchi emas: 404; takroriy: 409", async () => {
    assert.equal((await A.agent.post(`/groups/${group.id}/members`).send({ identifier: 'yoq@talaba.uz' })).status, 404);
    assert.equal((await A.agent.post(`/groups/${group.id}/members`).send({ identifier: 'b@ustoz.uz' })).status, 404);
    assert.equal((await A.agent.post(`/groups/${group.id}/members`).send({ identifier: 's1@talaba.uz' })).status, 201);
    assert.equal((await A.agent.post(`/groups/${group.id}/members`).send({ identifier: 'S1@talaba.uz ' })).status, 409);
  });
  it("18 yoshgacha: ota-ona roziligi tasdiqlanmaguncha qo'shilmaydi; tasdiqlansa yoziladi", async () => {
    const no = await A.agent.post(`/groups/${group.id}/members`).send({ identifier: 'minor@talaba.uz' });
    assert.equal(no.status, 409);
    assert.equal(no.body.code, 'PARENT_CONSENT_REQUIRED');
    const yes = await A.agent.post(`/groups/${group.id}/members`).send({ identifier: 'minor@talaba.uz', confirmParentConsent: true });
    assert.equal(yes.status, 201);
    assert.equal(ctx.prisma.db.users.find((u) => u.id === MINOR.id).parentConsent, true);
    assert.ok(ctx.prisma.db.audits.some((x) => x.action === 'PARENT_CONSENT_RECORDED' && x.userId === A.id));
  });
  it("o'quvchi (a'zo) ro'yxatni ko'radi, lekin boshqalarning email/telefonini ko'rmaydi; ustoz ko'radi", async () => {
    const asStudent = (await S1.agent.get(`/groups/${group.id}`)).body;
    assert.equal(asStudent.canManage, false);
    assert.ok(asStudent.members.length === 2);
    assert.ok(asStudent.members.every((m) => m.email === undefined && m.phone === undefined && m.parentConsent === undefined));
    const asTeacher = (await A.agent.get(`/groups/${group.id}`)).body;
    assert.equal(asTeacher.canManage, true);
    assert.ok(asTeacher.members.some((m) => m.email === 's1@talaba.uz'));
  });
});

describe("RUXSATSIZ KIRISH (IDOR) himoyasi", () => {
  it("boshqa ustoz va a'zo bo'lmagan o'quvchi guruhni ko'ra olmaydi: 404 (mavjudligi ham sezilmaydi)", async () => {
    assert.equal((await B.agent.get(`/groups/${group.id}`)).status, 404);
    assert.equal((await S2.agent.get(`/groups/${group.id}`)).status, 404);
    assert.equal((await S2.agent.get(`/groups/${group.id}/homework`)).status, 404);
    assert.equal((await S2.agent.get(`/groups/${group.id}/attendance`)).status, 404);
    assert.equal((await S2.agent.get('/groups/mavjud-emas')).status, 404);
  });
  it("boshqa ustoz guruhni o'zgartira, a'zo qo'sha, vazifa bera olmaydi", async () => {
    assert.equal((await B.agent.patch(`/groups/${group.id}`).send({ name: 'Buzildi' })).status, 404);
    assert.equal((await B.agent.post(`/groups/${group.id}/members`).send({ identifier: 's2@talaba.uz' })).status, 404);
    assert.equal((await B.agent.post(`/groups/${group.id}/homework`).send({ title: 'Xx', description: 'Yy' })).status, 404);
    assert.equal((await B.agent.delete(`/groups/${group.id}/members/${S1.id}`)).status, 404);
    assert.equal(ctx.prisma.db.groups.find((g) => g.id === group.id).name, 'A1 kechki guruh');
  });
  it("o'quvchi guruh ustozlik amallarini bajara olmaydi (403)", async () => {
    assert.equal((await S1.agent.patch(`/groups/${group.id}`).send({ name: 'Buzildi' })).status, 403);
    assert.equal((await S1.agent.post(`/groups/${group.id}/members`).send({ identifier: 's2@talaba.uz' })).status, 403);
    assert.equal((await S1.agent.post(`/groups/${group.id}/homework`).send({ title: 'Xx', description: 'Yy' })).status, 403);
    assert.equal((await S1.agent.put(`/groups/${group.id}/attendance`).send({ date: '2020-01-01', records: [] })).status, 403);
    assert.equal((await S1.agent.get('/leads')).status, 403);
  });
});

describe('uy vazifasi: berish, topshirish, baholash', () => {
  let hw, sub1, sub2;
  it("ustoz vazifa beradi; o'quvchi ro'yxatda ko'radi (hali topshirmagan)", async () => {
    const r = await A.agent.post(`/groups/${group.id}/homework`).send({ title: 'Oila haqida', description: '5 ta jumla yozing', maxScore: 50, dueAt: '2030-01-01T00:00:00Z' });
    assert.equal(r.status, 201);
    hw = r.body;
    const list = (await S1.agent.get(`/groups/${group.id}/homework`)).body;
    assert.equal(list.length, 1);
    assert.equal(list[0].mySubmission, null);
    assert.equal(list[0].submittedCount, undefined); // o'quvchi umumiy statistikani ko'rmaydi
  });
  it("faqat guruh a'zosi topshira oladi; ikkinchi urinish yangilaydi", async () => {
    assert.equal((await S2.agent.post(`/homework/${hw.id}/submission`).send({ text: 'Men a\'zo emasman' })).status, 404);
    assert.equal((await B.agent.post(`/homework/${hw.id}/submission`).send({ text: 'Ustoz' })).status, 403);
    const a = await S1.agent.post(`/homework/${hw.id}/submission`).send({ text: 'Birinchi javob' });
    assert.equal(a.status, 201);
    sub1 = a.body;
    const b = await S1.agent.post(`/homework/${hw.id}/submission`).send({ text: 'Tuzatilgan javob' });
    assert.equal(b.body.id, sub1.id, 'yangi yozuv emas, mavjudi yangilanishi kerak');
    assert.equal(ctx.prisma.db.submissions.length, 1);
    const m = await S1.agent.post(`/groups/${group.id}/members`).send({ identifier: 'x' }); // o'quvchi qo'sha olmaydi
    assert.equal(m.status, 403);
    sub2 = (await MINOR.agent.post(`/homework/${hw.id}/submission`).send({ text: 'Bolaning javobi' })).body;
  });
  it("o'quvchi boshqa o'quvchining javobini ko'ra olmaydi; ustoz hammasini ko'radi", async () => {
    const s = (await S1.agent.get(`/homework/${hw.id}`)).body;
    assert.deepEqual(s.submissions, []);
    const list = (await S1.agent.get(`/groups/${group.id}/homework`)).body;
    assert.equal(list[0].mySubmission.text, 'Tuzatilgan javob');
    assert.equal((await S2.agent.get(`/homework/${hw.id}`)).status, 404);
    assert.equal((await B.agent.get(`/homework/${hw.id}`)).status, 404);
    const t = (await A.agent.get(`/homework/${hw.id}`)).body;
    assert.equal(t.submissions.length, 2);
  });
  it("baholash: o'quvchi va boshqa ustoz qila olmaydi; ball maksimaldan oshmaydi; to'g'ri baho yoziladi", async () => {
    assert.equal((await S1.agent.patch(`/submissions/${sub1.id}`).send({ score: 50 })).status, 403);
    assert.equal((await B.agent.patch(`/submissions/${sub1.id}`).send({ score: 50 })).status, 404);
    assert.equal((await A.agent.patch(`/submissions/${sub1.id}`).send({ score: 51 })).status, 400);
    assert.equal((await A.agent.patch(`/submissions/${sub1.id}`).send({})).status, 400);
    const r = await A.agent.patch(`/submissions/${sub1.id}`).send({ score: 45, feedback: 'Yaxshi!' });
    assert.equal(r.status, 200);
    assert.equal(r.body.status, 'GRADED');
    const mine = (await S1.agent.get(`/groups/${group.id}/homework`)).body[0].mySubmission;
    assert.deepEqual([mine.score, mine.feedback], [45, 'Yaxshi!']);
  });
  it("baholangan vazifani qayta topshirib bo'lmaydi; 'qaytarilgan' vazifani qayta topshirsa bo'ladi", async () => {
    assert.equal((await S1.agent.post(`/homework/${hw.id}/submission`).send({ text: 'Baho oshirish uchun' })).status, 409);
    const ret = await A.agent.patch(`/submissions/${sub2.id}`).send({ returnForRevision: true, feedback: 'Ko\'proq yozing' });
    assert.equal(ret.body.status, 'RETURNED');
    const again = await MINOR.agent.post(`/homework/${hw.id}/submission`).send({ text: 'Ko\'proq yozdim' });
    assert.equal(again.status, 201);
    assert.equal(again.body.status, 'SUBMITTED');
  });
  it('talabalar kirishsiz va validatsiyasiz ma\'lumot yubora olmaydi', async () => {
    assert.equal((await request(ctx.server).get(`/groups/${group.id}`)).status, 401);
    assert.equal((await S1.agent.post(`/homework/${hw.id}/submission`).send({ text: '' })).status, 400);
    assert.equal((await A.agent.post(`/groups/${group.id}/homework`).send({ title: 'X', description: 'Y', role: 'ADMIN' })).status, 400);
  });
});

describe('davomat', () => {
  const today = tashkentDay(new Date());
  it("ustoz belgilaydi; kelajak sanasi va guruhga tegishli bo'lmagan o'quvchi rad etiladi", async () => {
    const ok = await A.agent.put(`/groups/${group.id}/attendance`).send({ date: today, records: [{ userId: S1.id, present: true }, { userId: MINOR.id, present: false }] });
    assert.equal(ok.status, 200);
    assert.equal((await A.agent.put(`/groups/${group.id}/attendance`).send({ date: '2999-01-01', records: [] })).status, 400);
    assert.equal((await A.agent.put(`/groups/${group.id}/attendance`).send({ date: today, records: [{ userId: S2.id, present: true }] })).status, 400);
    assert.equal((await A.agent.put(`/groups/${group.id}/attendance`).send({ date: 'kecha', records: [] })).status, 400);
  });
  it("qayta saqlash yangilaydi (takrorlanmaydi)", async () => {
    await A.agent.put(`/groups/${group.id}/attendance`).send({ date: today, records: [{ userId: MINOR.id, present: true }] });
    const rows = ctx.prisma.db.attendance.filter((a) => a.userId === MINOR.id);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].present, true);
  });
  it("o'quvchi faqat o'z davomatini ko'radi; ustoz hammasini; boshqa ustoz hech narsani", async () => {
    const mine = (await S1.agent.get(`/groups/${group.id}/attendance`)).body.records;
    assert.ok(mine.length === 1 && mine.every((r) => r.userId === S1.id));
    assert.equal((await A.agent.get(`/groups/${group.id}/attendance`)).body.records.length, 2);
    assert.equal((await B.agent.get(`/groups/${group.id}/attendance`)).status, 404);
  });
});

describe("a'zoni chiqarish", () => {
  it("chiqarilgan o'quvchi endi guruhni ko'ra olmaydi", async () => {
    assert.equal((await S1.agent.get(`/groups/${group.id}`)).status, 200);
    assert.equal((await A.agent.delete(`/groups/${group.id}/members/${S1.id}`)).status, 200);
    assert.equal((await S1.agent.get(`/groups/${group.id}`)).status, 404);
    assert.equal((await S1.agent.get(`/groups/${group.id}/homework`)).status, 404);
  });
});

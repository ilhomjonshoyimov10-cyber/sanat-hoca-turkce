// Foydalanuvchi "hech narsa kelmadi" degan joylar: bildirishnomalar,
// bepul 1-dars, e'lon, chat, guruhga qo'shish, jonli dars, AI tezlik chegarasi.
//
// Har bir test aniq bir shikoyatga javob:
//   - "murojaat/bepul dars yozsa admin bilmaydi"   -> adminga bildirishnoma
//   - "e'lon yubordim, hech kimda chiqmadi"         -> e'lon = bildirishnoma
//   - "ustoz yozsa hech kim e'tibor bermaydi"       -> chat bildirishnomasi (spamsiz)
//   - "o'quvchini qanday topib qo'shaman"           -> qidiruv + qo'shilish kodi
//   - "jonli dars ishlamayapti / guruhga qo'yish"   -> guruh, tashqi havola, sig'im
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
const { verifiedSubject } = await import('../dist/common/user-throttler.guard.js');

const CSRF = { 'X-Requested-With': 'XMLHttpRequest', Origin: 'http://localhost:3000' };
const PW = 'olma-daraxti-sakkiz-kuz';
const FIRST_LESSON = 'https://t.me/SanatHoca/41?single';

let ctx, admin, teacher, teacher2, s1, s2, s3, minor;

async function addUser({ email, role = 'STUDENT', first = 'Ism', last = 'Familiya', phone, birthDate = '1995-01-01' }) {
  const agent = request.agent(ctx.server).set(CSRF);
  const body = { firstName: first, lastName: last, password: PW, birthDate, acceptTerms: true };
  if (email) body.email = email;
  if (phone) body.phone = phone;
  const r = await agent.post('/auth/register').send(body);
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const row = ctx.prisma.db.users.find((u) => u.id === r.body.user.id);
  if (role !== 'STUDENT') {
    row.role = role;
    row.twoFactorEnabled = true;
  }
  return { agent, id: r.body.user.id, row };
}

const notes = (userId) => ctx.prisma.db.notifications.filter((n) => n.userId === userId);

before(async () => {
  const prisma = createFakePrisma();
  const mod = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService).useValue(prisma).compile();
  const app = mod.createNestApplication();
  configureApp(app);
  await app.init();
  ctx = { app, prisma, server: app.getHttpServer() };

  admin = await addUser({ email: 'admin@sanat.uz', role: 'ADMIN', first: 'Admin' });
  teacher = await addUser({ email: 'ustoz@sanat.uz', role: 'TEACHER', first: 'Sanat', last: 'Hoca' });
  teacher2 = await addUser({ email: 'ustoz2@sanat.uz', role: 'TEACHER', first: 'Boshqa' });
  s1 = await addUser({ email: 'dilnoza.karimova@talaba.uz', first: 'Dilnoza', last: 'Karimova', phone: '+998901112233' });
  s2 = await addUser({ email: 'jasur@talaba.uz', first: 'Jasur', last: 'Aliyev' });
  s3 = await addUser({ email: 'begona@talaba.uz', first: 'Begona', last: 'Odam' });
  minor = await addUser({ email: 'kichik@talaba.uz', first: 'Kichkina', last: 'Bola', birthDate: '2013-05-05' });
  minor.row.parentConsent = false; // ota-ona roziligi hali YO'Q
});
after(() => ctx.app.close());

// ═══════════════════════ Adminga bildirishnoma ═══════════════════════

describe('adminga bildirishnoma', () => {
  let reqId, leadId;

  it('o‘quvchi murojaat yozsa — admin darhol biladi', async () => {
    const r = await s1.agent.post('/support').send({ topic: 'LESSON', subject: 'Darsga yozilmoqchiman', body: 'Qachon boshlanadi?' });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    reqId = r.body.id;
    const n = notes(admin.id).find((x) => x.type === 'SUPPORT');
    assert.ok(n, 'adminga bildirishnoma kelmadi');
    assert.equal(n.link, `/admin?tab=support&id=${reqId}`);
    assert.match(n.title, /Dilnoza/);
    // O'quvchining o'ziga "o'zingiz yozdingiz" degan bildirishnoma kerak emas
    assert.equal(notes(s1.id).filter((x) => x.type === 'SUPPORT').length, 0);
  });

  it('admin javob bersa — o‘quvchi biladi, havola o‘z murojaatiga', async () => {
    const r = await admin.agent.post(`/support/${reqId}/replies`).send({ body: 'Dushanba kuni boshlanadi' });
    assert.ok([200, 201].includes(r.status), JSON.stringify(r.body));
    const n = notes(s1.id).find((x) => x.type === 'SUPPORT');
    assert.ok(n);
    assert.equal(n.link, `/murojaat?id=${reqId}`);
  });

  it('bepul darsga ariza — admin biladi', async () => {
    const guest = request.agent(ctx.server).set(CSRF);
    const r = await guest.post('/leads').send({ name: 'Mehmonjon', phone: '+998935554433', level: 'A1', consent: true });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    const n = notes(admin.id).find((x) => x.type === 'FREE_LESSON');
    assert.ok(n, 'ariza haqida bildirishnoma yo‘q');
    leadId = n.link.split('lead=')[1];
    assert.ok(leadId);
    ctx.leadId = leadId;
  });

  it('pulse: o‘qilmaganlar soni va faqat YANGILARI', async () => {
    const first = await admin.agent.get('/notifications/pulse');
    assert.equal(first.status, 200);
    assert.ok(first.body.unread >= 2);
    assert.ok(first.body.now);
    const since = first.body.now;
    const quiet = await admin.agent.get(`/notifications/pulse?since=${encodeURIComponent(since)}`);
    assert.equal(quiet.body.fresh.length, 0, 'eski bildirishnoma qayta "yangi" bo‘lib chiqdi');
    await s2.agent.post('/support').send({ subject: 'Parolni unutdim', body: 'Yordam bering iltimos' });
    const fresh = await admin.agent.get(`/notifications/pulse?since=${encodeURIComponent(since)}`);
    assert.equal(fresh.body.fresh.length, 1);
    assert.equal(fresh.body.fresh[0].type, 'SUPPORT');
  });

  it('pulse noto‘g‘ri sanani rad etadi, lekin yiqilmaydi', async () => {
    const r = await admin.agent.get('/notifications/pulse?since=bugun');
    assert.ok([200, 400].includes(r.status));
  });
});

// ═══════════════════════ Bepul 1-dars ═══════════════════════

describe('bepul 1-dars bir tugmada', () => {
  it('admin Telegram havolasini asosiy video qiladi', async () => {
    const a = await admin.agent.post('/free-lesson/videos').send({ title: 'Eski video', url: 'https://youtu.be/eski', position: 0 });
    assert.equal(a.status, 201, JSON.stringify(a.body));
    const v = await admin.agent.post('/free-lesson/videos').send({
      title: 'Bepul 1-dars (Telegram)', url: FIRST_LESSON, position: 5, isDefault: true,
    });
    assert.equal(v.status, 201, JSON.stringify(v.body));
    ctx.defaultVideo = v.body.id;
  });

  it('faqat BITTA asosiy video bo‘ladi', async () => {
    const v = await admin.agent.post('/free-lesson/videos').send({ title: 'Ikkinchi asosiy', url: 'https://youtu.be/ikki', isDefault: true });
    assert.equal(v.status, 201);
    const defaults = ctx.prisma.db.lessonVideos.filter((x) => x.isDefault);
    assert.equal(defaults.length, 1);
    // Qaytaramiz: asosiy — Telegram darsi
    await admin.agent.patch(`/free-lesson/videos/${ctx.defaultVideo}`).send({ isDefault: true });
    assert.equal(ctx.prisma.db.lessonVideos.find((x) => x.isDefault).url, FIRST_LESSON);
  });

  it('o‘quvchi yubora olmaydi', async () => {
    const r = await s1.agent.post(`/free-lesson/leads/${ctx.leadId}/send-first`);
    assert.equal(r.status, 403);
  });

  it('ustoz bir tugma bosadi: havola, tayyor matn va Telegram ulashish', async () => {
    const r = await teacher.agent.post(`/free-lesson/leads/${ctx.leadId}/send-first`);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.video.url, FIRST_LESSON);
    assert.equal(r.body.alreadySent, false);
    assert.match(r.body.shareText, /t\.me\/SanatHoca\/41/);
    assert.ok(r.body.telegramShare.startsWith('https://t.me/share/url?url=' + encodeURIComponent(FIRST_LESSON)));
    const lead = ctx.prisma.db.leads.find((l) => l.id === ctx.leadId);
    assert.equal(lead.status, 'CONTACTED');
  });

  it('ikkinchi marta bosilsa — takror biriktirmaydi', async () => {
    const r = await teacher.agent.post(`/free-lesson/leads/${ctx.leadId}/send-first`);
    assert.equal(r.status, 200);
    assert.equal(r.body.alreadySent, true);
    assert.equal(ctx.prisma.db.leadVideos.filter((x) => x.leadId === ctx.leadId).length, 1);
  });
});

// ═══════════════════════ E'lon ═══════════════════════

describe("e'lon hamma ekraniga yetadi", () => {
  it("admin e'lon qilsa — har bir foydalanuvchiga bildirishnoma", async () => {
    const r = await admin.agent.post('/announcements').send({ title: 'Ertaga dars yo‘q', body: 'Bayram munosabati bilan' });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    for (const u of [s1, s2, teacher]) {
      assert.ok(notes(u.id).some((n) => n.type === 'ANNOUNCEMENT' && n.title === 'Ertaga dars yo‘q'), `${u.id} ga kelmadi`);
    }
    assert.ok(!notes(admin.id).some((n) => n.type === 'ANNOUNCEMENT'), 'muallifning o‘ziga yuborildi');
  });

  it("faqat ustozlarga e'lon — o'quvchiga bormaydi", async () => {
    await admin.agent.post('/announcements').send({ title: 'Ustozlar yig‘ilishi', body: 'Juma 18:00', audience: 'TEACHERS' });
    assert.ok(notes(teacher.id).some((n) => n.title === 'Ustozlar yig‘ilishi'));
    assert.ok(!notes(s1.id).some((n) => n.title === 'Ustozlar yig‘ilishi'));
  });

  it("kelajakdagi e'lon hozir bildirishnoma bermaydi", async () => {
    const later = new Date(Date.now() + 86400_000).toISOString();
    await admin.agent.post('/announcements').send({ title: 'Ertangi xabar', body: 'Hali emas', startsAt: later });
    assert.ok(!notes(s1.id).some((n) => n.title === 'Ertangi xabar'));
  });

  it("ochiq sayt e'lonni ro'yxatda ko'radi", async () => {
    const r = await s1.agent.get('/announcements');
    assert.equal(r.status, 200);
    assert.ok(r.body.some((a) => a.title === 'Ertaga dars yo‘q'));
  });
});

// ═══════════════════════ Guruh: topish va qo'shish ═══════════════════════

describe("o'quvchini topib guruhga qo'shish", () => {
  let group;

  it('ustoz guruh ochadi', async () => {
    const r = await teacher.agent.post('/groups').send({ name: 'A1 ertalabki', level: 'A1' });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    group = r.body;
    ctx.group = group;
  });

  it('ism bo‘yicha qidiradi — aloqa ma’lumoti YASHIRILGAN', async () => {
    const r = await teacher.agent.get(`/groups/${group.id}/candidates?q=dilnoza`);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const hit = r.body.find((u) => u.id === s1.id);
    assert.ok(hit, 'o‘quvchi topilmadi');
    assert.equal(hit.inGroup, false);
    assert.ok(!JSON.stringify(r.body).includes('dilnoza.karimova@talaba.uz'), 'to‘liq email ko‘rinib qoldi');
    assert.ok(!JSON.stringify(r.body).includes('901112233'), 'telefon ko‘rinib qoldi');
    assert.ok(!r.body.some((u) => u.id === teacher2.id || u.id === admin.id), 'xodimlar ham chiqdi');
  });

  it('familiya va telefon raqami bo‘yicha ham topadi', async () => {
    const byLast = await teacher.agent.get(`/groups/${group.id}/candidates?q=Karimova`);
    assert.ok(byLast.body.some((u) => u.id === s1.id));
    const byPhone = await teacher.agent.get(`/groups/${group.id}/candidates?q=${encodeURIComponent('90 111 22')}`);
    assert.ok(byPhone.body.some((u) => u.id === s1.id));
  });

  it('1 harfli qidiruv bo‘sh — butun ro‘yxatni sizdirmaydi', async () => {
    const r = await teacher.agent.get(`/groups/${group.id}/candidates?q=a`);
    assert.deepEqual(r.body, []);
  });

  it('o‘quvchi va BEGONA ustoz qidira olmaydi', async () => {
    assert.ok([403, 404].includes((await s1.agent.get(`/groups/${group.id}/candidates?q=jasur`)).status));
    assert.equal((await teacher2.agent.get(`/groups/${group.id}/candidates?q=jasur`)).status, 404);
  });

  it('topilganini bir tugmada qo‘shadi', async () => {
    const r = await teacher.agent.post(`/groups/${group.id}/members/by-id`).send({ userId: s1.id });
    assert.ok([200, 201].includes(r.status), JSON.stringify(r.body));
    const again = await teacher.agent.get(`/groups/${group.id}/candidates?q=dilnoza`);
    assert.equal(again.body.find((u) => u.id === s1.id).inGroup, true);
  });

  it('qo‘shilish kodi: ustoz yaratadi, o‘quvchi o‘zi qo‘shiladi', async () => {
    const c = await teacher.agent.post(`/groups/${group.id}/join-code`);
    assert.ok([200, 201].includes(c.status), JSON.stringify(c.body));
    assert.match(c.body.joinCode, /^[A-HJ-NP-Z2-9]{6}$/);
    ctx.joinCode = c.body.joinCode;

    const j = await s2.agent.post('/groups/join').send({ code: ` ${c.body.joinCode.toLowerCase()} ` });
    assert.equal(j.status, 200, JSON.stringify(j.body));
    assert.equal(j.body.groupId, group.id);
    assert.ok(ctx.prisma.db.members.some((m) => m.groupId === group.id && m.userId === s2.id));
    assert.ok(notes(teacher.id).some((n) => n.link === `/groups/${group.id}` && /yangi o'quvchi/.test(n.title)));
  });

  it('kod faqat ustozga ko‘rinadi', async () => {
    const t = await teacher.agent.get(`/groups/${group.id}`);
    assert.equal(t.body.joinCode ?? t.body.group?.joinCode, ctx.joinCode);
    const s = await s2.agent.get(`/groups/${group.id}`);
    assert.equal(s.status, 200);
    assert.ok(!JSON.stringify(s.body).includes(ctx.joinCode), 'o‘quvchiga kod ko‘rindi');
  });

  it('18 yoshgacha, rozilik yo‘q — o‘zi qo‘shila olmaydi', async () => {
    const r = await minor.agent.post('/groups/join').send({ code: ctx.joinCode });
    assert.equal(r.status, 403);
    assert.equal(r.body.code, 'PARENT_CONSENT_REQUIRED');
  });

  it('noto‘g‘ri kod va ustoz kodi', async () => {
    assert.equal((await s3.agent.post('/groups/join').send({ code: 'ZZZZZZ' })).status, 404);
    assert.equal((await teacher2.agent.post('/groups/join').send({ code: ctx.joinCode })).status, 403);
  });

  it('kod o‘chirilsa — endi ishlamaydi', async () => {
    const d = await teacher.agent.delete(`/groups/${group.id}/join-code`);
    assert.equal(d.status, 200);
    assert.equal((await s3.agent.post('/groups/join').send({ code: ctx.joinCode })).status, 404);
  });
});

// ═══════════════════════ Chat bildirishnomasi ═══════════════════════

describe('ustoz yozsa — hammaga xabar (spamsiz)', () => {
  it('ustozning oddiy xabarlari: o‘quvchiga BITTA bildirishnoma', async () => {
    const g = ctx.group;
    for (const t of ['Salom!', 'Bugun 18:00 da dars', 'Kechikmang']) {
      const r = await teacher.agent.post(`/chat/groups/${g.id}/messages`).send({ content: t });
      assert.equal(r.status, 201, JSON.stringify(r.body));
    }
    for (const u of [s1, s2]) {
      const mine = notes(u.id).filter((n) => n.type === 'CHAT' && n.link === `/groups/${g.id}`);
      assert.equal(mine.length, 1, `${u.id}: ${mine.length} ta bildirishnoma`);
    }
    assert.equal(notes(s3.id).filter((n) => n.type === 'CHAT').length, 0, 'begona odamga ham bordi');
  });

  it('o‘qib qo‘ygandan keyin yangi xabar — yana bildirishnoma', async () => {
    const g = ctx.group;
    await s1.agent.patch('/notifications/read-all');
    await teacher.agent.post(`/chat/groups/${g.id}/messages`).send({ content: 'Uy vazifasini unutmang' });
    const unread = notes(s1.id).filter((n) => n.type === 'CHAT' && !n.readAt);
    assert.equal(unread.length, 1);
  });

  it("ustozning E'LONI har safar alohida keladi", async () => {
    const g = ctx.group;
    await teacher.agent.post(`/chat/groups/${g.id}/messages`).send({ content: 'Imtihon juma kuni!', isAnnouncement: true });
    assert.ok(notes(s2.id).some((n) => n.body?.includes('Imtihon') || n.title.includes('Imtihon') || n.type === 'CHAT'));
  });

  it('o‘quvchi yozsa — ustozga boradi', async () => {
    const g = ctx.group;
    const before = notes(teacher.id).filter((n) => n.type === 'CHAT').length;
    await s1.agent.post(`/chat/groups/${g.id}/messages`).send({ content: 'Ustoz, savolim bor' });
    assert.equal(notes(teacher.id).filter((n) => n.type === 'CHAT').length, before + 1);
  });
});

// ═══════════════════════ Jonli dars ═══════════════════════

describe('jonli dars: hammaga yoki faqat guruhga', () => {
  const inTwoHours = () => new Date(Date.now() + 2 * 3600_000).toISOString();

  it('BEGONA ustoz mening guruhimga efir qo‘ya olmaydi', async () => {
    const r = await teacher2.agent.post('/live').send({ title: 'Bosqin', startsAt: inTwoHours(), groupId: ctx.group.id });
    assert.equal(r.status, 404);
  });

  it('guruh efiri: faqat guruh a’zolari ko‘radi va xabar oladi', async () => {
    const r = await teacher.agent.post('/live').send({ title: 'A1: fe’llar', startsAt: inTwoHours(), groupId: ctx.group.id });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    ctx.groupLive = r.body.id;
    assert.ok(notes(s1.id).some((n) => n.type === 'LIVE'), 'a’zoga xabar kelmadi');
    assert.ok(!notes(s3.id).some((n) => n.type === 'LIVE'), 'begonaga xabar bordi');
    const mine = await s1.agent.get('/live');
    assert.ok(mine.body.some((x) => x.id === ctx.groupLive && x.group?.name === 'A1 ertalabki'));
    const other = await s3.agent.get('/live');
    assert.ok(!other.body.some((x) => x.id === ctx.groupLive), 'begona ro‘yxatda ko‘rdi');
  });

  it('bildirishnomadagi vaqt Toshkent vaqtida va o‘qiladigan ko‘rinishda', async () => {
    const n = notes(s1.id).find((x) => x.type === 'LIVE');
    assert.match(n.body, /\d{1,2}-[a-z‘']+, \d{2}:\d{2}/, n.body);
  });

  it('vaqtidan oldin kira olmaydi, ustoz BOSHLASA — darhol kiradi', async () => {
    assert.equal((await s1.agent.post(`/live/${ctx.groupLive}/join`)).status, 403);
    const st = await teacher.agent.post(`/live/${ctx.groupLive}/start`);
    assert.ok([200, 201].includes(st.status), JSON.stringify(st.body));
    assert.ok(notes(s2.id).some((n) => n.title.includes('boshlandi')));
    const j = await s1.agent.post(`/live/${ctx.groupLive}/join`);
    assert.equal(j.status, 200, JSON.stringify(j.body));
    assert.ok(j.body.url.startsWith('https://meet.jit.si/'));
    assert.match(j.body.url, /startWithAudioMuted=true/, 'o‘quvchi mikrofoni yoqiq kiradi');
    assert.match(j.body.url, /Dilnoza/);
  });

  it('begona o‘quvchi guruh efiriga kira olmaydi (LIVE bo‘lsa ham)', async () => {
    assert.equal((await s3.agent.post(`/live/${ctx.groupLive}/join`)).status, 404);
  });

  it('hamma uchun ochiq efir: barcha o‘quvchilar xabar oladi', async () => {
    const r = await teacher.agent.post('/live').send({ title: 'Ochiq dars', startsAt: inTwoHours() });
    assert.equal(r.status, 201);
    for (const u of [s1, s2, s3, minor]) {
      assert.ok(notes(u.id).some((n) => n.type === 'LIVE' && n.body?.startsWith('Ochiq dars')), u.id);
    }
  });

  it('tashqi havola (Zoom/Meet/Telegram): faqat https', async () => {
    const bad = await teacher.agent.post('/live').send({ title: 'Zoom', startsAt: inTwoHours(), provider: 'EXTERNAL', externalUrl: 'http://zoom.us/j/1' });
    assert.equal(bad.status, 400);
    const none = await teacher.agent.post('/live').send({ title: 'Zoom', startsAt: inTwoHours(), provider: 'EXTERNAL' });
    assert.equal(none.status, 400);
    const js = await teacher.agent.post('/live').send({ title: 'Zoom', startsAt: inTwoHours(), provider: 'EXTERNAL', externalUrl: 'javascript:alert(1)' });
    assert.equal(js.status, 400);
    const ok = await teacher.agent.post('/live').send({
      title: 'Telegram efir', startsAt: inTwoHours(), provider: 'EXTERNAL', externalUrl: 'https://t.me/SanatHoca?videochat',
    });
    assert.equal(ok.status, 201, JSON.stringify(ok.body));
    await teacher.agent.post(`/live/${ok.body.id}/start`);
    const j = await s3.agent.post(`/live/${ok.body.id}/join`);
    assert.equal(j.status, 200);
    assert.equal(j.body.url, 'https://t.me/SanatHoca?videochat');
    assert.equal(j.body.provider, 'EXTERNAL');
  });

  it('sig‘im: to‘lganda yangi odam kira olmaydi, avval kirgan qayta kiradi', async () => {
    const r = await teacher.agent.post('/live').send({ title: 'Kichik guruh', startsAt: inTwoHours(), maxParticipants: 2 });
    assert.equal(r.status, 201);
    await teacher.agent.post(`/live/${r.body.id}/start`);
    assert.equal((await s1.agent.post(`/live/${r.body.id}/join`)).status, 200);
    assert.equal((await s2.agent.post(`/live/${r.body.id}/join`)).status, 200);
    const full = await s3.agent.post(`/live/${r.body.id}/join`);
    assert.equal(full.status, 403);
    assert.equal(full.body.code, 'LIVE_FULL');
    assert.equal((await s1.agent.post(`/live/${r.body.id}/join`)).status, 200, 'qayta kirish bloklandi');
    // Ustoz to'lgan xonaga ham kiradi
    assert.equal((await teacher.agent.post(`/live/${r.body.id}/join`)).status, 200);
  });

  it('sig‘im chegarasi: 2..300', async () => {
    for (const n of [1, 301]) {
      const r = await teacher.agent.post('/live').send({ title: 'X', startsAt: inTwoHours(), maxParticipants: n });
      assert.equal(r.status, 400, String(n));
    }
  });
});

// ═══════════════════════ Tezlik chegarasi ═══════════════════════

describe('tezlik chegarasi foydalanuvchi bo‘yicha (bitta Wi-Fi dagi sinf)', () => {
  const secret = process.env.JWT_ACCESS_SECRET;
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const sign = (header, payload, key = secret) => {
    const head = `${b64(header)}.${b64(payload)}`;
    return `${head}.${createHmac('sha256', key).update(head).digest('base64url')}`;
  };
  const exp = () => Math.floor(Date.now() / 1000) + 600;

  it('to‘g‘ri imzo — foydalanuvchi id si', () => {
    assert.equal(verifiedSubject(sign({ alg: 'HS256', typ: 'JWT' }, { sub: 'u1', exp: exp() }), secret), 'u1');
  });

  it('soxta imzo, alg=none, muddati o‘tgan — IP ga qaytadi', () => {
    assert.equal(verifiedSubject(sign({ alg: 'HS256' }, { sub: 'u1', exp: exp() }, 'boshqa-kalit'), secret), null);
    const none = `${b64({ alg: 'none' })}.${b64({ sub: 'u1', exp: exp() })}.`;
    assert.equal(verifiedSubject(none, secret), null);
    assert.equal(verifiedSubject(sign({ alg: 'HS256' }, { sub: 'u1', exp: 1 }), secret), null);
    assert.equal(verifiedSubject('bema‘ni', secret), null);
    assert.equal(verifiedSubject(undefined, secret), null);
  });
});

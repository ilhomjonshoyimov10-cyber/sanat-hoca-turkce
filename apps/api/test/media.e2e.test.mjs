// Kino va musiqa (YouTube havolalari).
//
// Asosiy xavflar:
//   1. Bo'lim butun saytda ko'rinadi -> faqat admin qo'sha olsin.
//   2. Admin kiritgan matn iframe manziliga tushmasin -> server faqat
//      YouTube ID ni ajratib saqlaydi; begona sayt havolasi rad etiladi.
//   3. Egasi embed'ni taqiqlagan yoki o'chirilgan video saytda chiqmasin.
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

// YouTube oEmbed javoblarini soxtalashtiramiz (testda internet yo'q)
const OEMBED = {
  okVideo0001: { status: 200, body: { title: 'Rasmiy qism 1', author_name: 'TRT 1', thumbnail_url: 'https://i.ytimg.com/vi/okVideo0001/hqdefault.jpg' } },
  noEmbed0001: { status: 401 },
  goneVideo01: { status: 404 },
};
let flip = null; // recheck testi uchun: keyingi javobni almashtirish
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  const s = String(url);
  if (!s.startsWith('https://www.youtube.com/oembed')) return realFetch(url, init);
  const target = decodeURIComponent(s.split('url=')[1] ?? '');
  const id = target.match(/[?&]v=([\w-]{11})/)?.[1];
  const r = (flip && id === flip.id ? flip.res : OEMBED[id]) ?? { status: 404 };
  return new Response(r.body ? JSON.stringify(r.body) : 'x', { status: r.status, headers: { 'content-type': 'application/json' } });
};

const { AppModule } = await import('../dist/app.module.js');
const { configureApp } = await import('../dist/app.setup.js');
const { PrismaService } = await import('../dist/prisma/prisma.service.js');
const { parseYoutube, uploadsPlaylist } = await import('../dist/media/youtube.js');

const CSRF = { 'X-Requested-With': 'XMLHttpRequest', Origin: 'http://localhost:3000' };
const PW = 'olma-daraxti-sakkiz-kuz';
let ctx, admin, teacher, student;

async function addUser(email, role = 'STUDENT') {
  const agent = request.agent(ctx.server).set(CSRF);
  const r = await agent.post('/auth/register').send({
    firstName: 'Ism', lastName: 'Familiya', email, password: PW, birthDate: '1995-01-01', acceptTerms: true,
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  if (role !== 'STUDENT') {
    const row = ctx.prisma.db.users.find((u) => u.id === r.body.user.id);
    row.role = role;
    row.twoFactorEnabled = true;
  }
  return agent;
}

before(async () => {
  const prisma = createFakePrisma();
  const mod = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService).useValue(prisma).compile();
  const app = mod.createNestApplication();
  configureApp(app);
  await app.init();
  ctx = { app, prisma, server: app.getHttpServer() };
  admin = await addUser('admin@m.uz', 'ADMIN');
  teacher = await addUser('ustoz@m.uz', 'TEACHER');
  student = await addUser('s@m.uz');
});
after(() => ctx.app.close());

describe('YouTube havolasini tanish', () => {
  it('har xil shakldagi havolalar', () => {
    assert.deepEqual(parseYoutube('https://www.youtube.com/watch?v=okVideo0001'), { videoId: 'okVideo0001', playlistId: null });
    assert.deepEqual(parseYoutube('https://youtu.be/okVideo0001?t=30'), { videoId: 'okVideo0001', playlistId: null });
    assert.deepEqual(parseYoutube('https://m.youtube.com/shorts/okVideo0001'), { videoId: 'okVideo0001', playlistId: null });
    assert.deepEqual(parseYoutube('https://www.youtube.com/embed/okVideo0001'), { videoId: 'okVideo0001', playlistId: null });
    assert.deepEqual(
      parseYoutube('https://www.youtube.com/playlist?list=PLa6oxKxA7YkgCd4jX5fHARVwE6lz0Zwh9'),
      { videoId: null, playlistId: 'PLa6oxKxA7YkgCd4jX5fHARVwE6lz0Zwh9' },
    );
    assert.deepEqual(
      parseYoutube('https://www.youtube.com/watch?v=okVideo0001&list=PLa6oxKxA7YkgCd4jX5fHARVwE6lz0Zwh9'),
      { videoId: 'okVideo0001', playlistId: 'PLa6oxKxA7YkgCd4jX5fHARVwE6lz0Zwh9' },
    );
  });

  it('begona sayt, javascript: va buzuq ID rad etiladi', () => {
    assert.equal(parseYoutube('https://evil.example/watch?v=okVideo0001'), null);
    assert.equal(parseYoutube('https://youtube.com.evil.example/watch?v=okVideo0001'), null);
    assert.equal(parseYoutube('javascript:alert(1)'), null);
    assert.equal(parseYoutube('https://www.youtube.com/watch?v=short'), null);
    assert.equal(parseYoutube('https://www.youtube.com/watch?v="><script>'), null);
    assert.equal(parseYoutube('not a url'), null);
  });

  it('kanal ID -> "barcha videolar" pleylisti', () => {
    assert.equal(uploadsPlaylist('UCrFf5dtMe6M1XJHqbKJ4X6Q'), 'UUrFf5dtMe6M1XJHqbKJ4X6Q');
    assert.equal(uploadsPlaylist('UCbad'), null);
  });
});

describe('kino va musiqa: ruxsatlar va tekshiruv', () => {
  it("ro'yxat ochiq — kirmagan mehmon ham ko'radi", async () => {
    const r = await request(ctx.server).get('/media');
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.body));
  });

  it("o'quvchi va ustoz qo'sha olmaydi", async () => {
    const body = { url: 'https://youtu.be/okVideo0001', kind: 'SERIES' };
    assert.equal((await student.post('/media').send(body)).status, 403);
    assert.equal((await teacher.post('/media').send(body)).status, 403);
    assert.equal((await request(ctx.server).post('/media').set(CSRF).send(body)).status, 401);
  });

  it("admin qo'shadi — kanal nomi va muqova YouTube'dan olinadi", async () => {
    const r = await admin.post('/media').send({ url: 'https://www.youtube.com/watch?v=okVideo0001', kind: 'SERIES', level: 'B1', description: 'Oilaviy komediya' });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.body.channel, 'TRT 1');
    assert.equal(r.body.title, 'Rasmiy qism 1'); // nom berilmasa — YouTube'dagi nom
    assert.equal(r.body.videoId, 'okVideo0001');

    const pub = await request(ctx.server).get('/media');
    const item = pub.body.find((x) => x.videoId === 'okVideo0001');
    assert.ok(item);
    assert.equal(item.level, 'B1');
    // Ichki maydonlar tashqariga chiqmaydi
    assert.equal(item.createdById, undefined);
    assert.equal(item.seedKey, undefined);
  });

  it('begona sayt havolasi rad etiladi', async () => {
    const r = await admin.post('/media').send({ url: 'https://evil.example/video.mp4', kind: 'FILM' });
    assert.equal(r.status, 400);
    assert.equal(r.body.code, 'BAD_YOUTUBE_URL');
  });

  it('embed taqiqlangan va topilmaydigan video qo‘shilmaydi', async () => {
    const a = await admin.post('/media').send({ url: 'https://youtu.be/noEmbed0001', kind: 'MUSIC' });
    assert.equal(a.status, 400);
    assert.equal(a.body.code, 'YT_NOT_EMBEDDABLE');
    const b = await admin.post('/media').send({ url: 'https://youtu.be/goneVideo01', kind: 'MUSIC' });
    assert.equal(b.status, 400);
    assert.equal(b.body.code, 'YT_NOT_FOUND');
  });

  it("yashirilgan yozuv saytda ko'rinmaydi, adminda ko'rinadi", async () => {
    const list = await admin.get('/media/manage');
    const row = list.body.find((x) => x.videoId === 'okVideo0001');
    const p = await admin.patch(`/media/${row.id}`).send({ published: false });
    assert.equal(p.status, 200);
    const pub = await request(ctx.server).get('/media');
    assert.equal(pub.body.some((x) => x.id === row.id), false);
    await admin.patch(`/media/${row.id}`).send({ published: true });
  });

  it("keyin o'chirilgan video qayta tekshiruvda avtomatik yashiriladi", async () => {
    const list = await admin.get('/media/manage');
    const row = list.body.find((x) => x.videoId === 'okVideo0001');
    flip = { id: 'okVideo0001', res: { status: 404 } };
    const r = await admin.post(`/media/${row.id}/recheck`);
    flip = null;
    assert.equal(r.status, 201);
    assert.equal(r.body.find((x) => x.id === row.id).checkNote, 'not_found');
    const pub = await request(ctx.server).get('/media');
    assert.equal(pub.body.some((x) => x.id === row.id), false);
  });

  it("o'quvchi o'chira olmaydi, admin o'chiradi", async () => {
    const list = await admin.get('/media/manage');
    const row = list.body[0];
    assert.equal((await student.delete(`/media/${row.id}`)).status, 403);
    assert.equal((await admin.delete(`/media/${row.id}`)).status, 200);
  });
});

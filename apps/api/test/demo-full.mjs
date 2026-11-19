// TO'LIQ DEMO SERVER: barcha o'quv kontenti bilan, PostgreSQL'siz.
//
// dev-server.mjs dan farqi: bu yerda o'qish matnlari, gaplar, qo'shimchalar,
// bo'shliq, fe'l, suhbat, zid ma'no va mavzu teglari ham yuklanadi — ya'ni
// 12 ta o'yinning HAMMASI ishlaydi. Vizual tekshiruv uchun.
//
// Ishga tushirish:  pnpm build && node test/demo-full.mjs
// Ma'lumotlar xotirada — server o'chsa yo'qoladi.

import { Test } from '@nestjs/testing';
import { createFakePrisma } from './fake-prisma.mjs';
import { loadWordFiles } from '../dist/seed/word-data.js';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Kontent TS fayllarda — uni alohida jarayonda JSON ga aylantiramiz
// (sababi test/dump-content.ts da yozilgan).
const here = fileURLToPath(new URL('.', import.meta.url));
const C = JSON.parse(
  execFileSync('npx', ['tsx', 'test/dump-content.ts'], { cwd: here + '..', maxBuffer: 64 * 1024 * 1024 }).toString(),
);
const { READING_TEXTS, DRILLS, SENTENCES, clozeItems, dialogues, antonyms, topics, verbForms, mediaSeeds } = C;

process.env.NODE_ENV ??= 'development';
process.env.JWT_ACCESS_SECRET ??= 'demo-secret-demo-secret-demo-secret-1234';
process.env.TOTP_ENCRYPTION_KEY ??= 'demo-totp-key-demo-totp-key-demo-1234';
process.env.WEB_URL ??= 'http://localhost:3000';
process.env.DATABASE_URL ??= 'postgresql://demo:demo@localhost:5432/demo';

const { AppModule } = await import('../dist/app.module.js');
const { configureApp } = await import('../dist/app.setup.js');
const { PrismaService } = await import('../dist/prisma/prisma.service.js');

const prisma = createFakePrisma();
const db = prisma.db;
const now = new Date();

// ── Lug'at ──
const pos = {};
loadWordFiles().words.forEach((w, i) => {
  pos[w.level] = (pos[w.level] ?? 0) + 1;
  db.words.push({
    id: `w${i + 1}`, audioUrl: null, exampleTr: null, exampleUz: null, exampleRu: null,
    partOfSpeech: null, pronunciation: null, tags: [], frequency: null, notes: null,
    createdAt: now, updatedAt: now, ...w, verified: true, position: pos[w.level],
  });
});

// ── Mavzu teglari (seed-content.ts dagi mantiq bilan bir xil) ──
const byTurkish = new Map(db.words.map((w) => [String(w.turkish).toLocaleLowerCase('tr'), w]));
let n = db.words.length;
for (const t of topics) {
  const tag = `mavzu:${t.slug}`;
  for (const w of t.words) {
    const existing = byTurkish.get(w.turkish.toLocaleLowerCase('tr'));
    if (existing) {
      if (!existing.tags.includes(tag)) existing.tags = [...existing.tags, tag];
      existing.verified = true;
    } else {
      const row = {
        id: `w${++n}`, turkish: w.turkish, uzbek: w.uzbek, russian: null, level: w.level,
        category: t.title, tags: [tag], verified: true, position: 0, audioUrl: null,
        exampleTr: null, exampleUz: null, exampleRu: null, partOfSpeech: null, pronunciation: null,
        frequency: null, notes: null, createdAt: now, updatedAt: now,
      };
      db.words.push(row);
      byTurkish.set(w.turkish.toLocaleLowerCase('tr'), row);
    }
  }
}

// ── O'qish matnlari (seed-content.ts dagi shakl bilan bir xil) ──
READING_TEXTS.forEach((t, i) => {
  const id = `rt${i + 1}`;
  db.readingTexts.push({
    id, slug: t.slug, title: t.title, level: t.level, topic: t.topic ?? null,
    body: t.body, bodyUz: t.bodyUz ?? null,
    wordCount: t.body.split(/\s+/).filter(Boolean).length,
    audioUrl: null, position: i, publishedAt: now, createdById: null, createdAt: now, updatedAt: now,
  });
  t.questions.forEach((q, j) => {
    db.readingQuestions.push({
      id: `${id}q${j + 1}`, textId: id, kind: q.kind, prompt: q.prompt,
      options: q.kind === 'MULTIPLE_CHOICE' ? (q.options ?? []) : [],
      correctIndex: q.kind === 'SHORT_ANSWER' ? null : (q.correctIndex ?? null),
      correctText: q.kind === 'SHORT_ANSWER' ? (q.correctText ?? []) : [],
      explanation: q.explanation ?? null, position: j,
    });
  });
  t.glossary.forEach(([turkish, uzbek], j) => {
    db.readingGlossary.push({ id: `${id}g${j + 1}`, textId: id, turkish, uzbek, position: j });
  });
});

// ── O'yin materiallari ──
SENTENCES.forEach((s, i) => db.sentences.push({
  id: `s${i + 1}`, verified: true, position: i, createdAt: now, uzbek: null, hint: null, ...s,
}));
DRILLS.forEach((d, i) => db.suffixDrills.push({
  id: `d${i + 1}`, verified: true, position: i, createdAt: now, alternates: [],
  explanation: null, rule: null, ...d,
}));
clozeItems.forEach((c, i) => db.clozeItems.push({ id: `c${i + 1}`, verified: true, position: i, createdAt: now, ...c }));
verbForms.forEach((v, i) => db.verbForms.push({ id: `v${i + 1}`, verified: true, position: i, createdAt: now, ...v }));
dialogues.forEach((d, i) => db.dialogueItems.push({ id: `dg${i + 1}`, verified: true, position: i, createdAt: now, ...d }));
antonyms.forEach((p, i) => db.wordPairs.push({
  id: `p${i + 1}`, kind: 'ANTONYM', verified: true, position: i, createdAt: now, ...p,
}));

// Kino va musiqa: demoda internet yo'q — kanal nomi va muqova
// "tekshirilgan" deb belgilanadi (sahifa ko'rinishini ko'rish uchun)
mediaSeeds.forEach((m, i) => db.mediaItems.push({
  id: `m${i + 1}`, seedKey: m.key, kind: m.kind, level: m.level, title: m.title,
  description: m.uz, descI18n: { ru: m.ru, en: m.en, tr: m.tr },
  videoId: m.videoId ?? null, playlistId: m.playlistId ?? null,
  channel: 'Demo kanal', ytTitle: m.title, thumbnail: m.videoId ? `https://i.ytimg.com/vi/${m.videoId}/hqdefault.jpg` : null,
  checkedAt: now, checkNote: null, position: i, published: true, createdById: null, createdAt: now, updatedAt: now,
}));

// ── Demo xodimlar: admin va ustoz (faqat mahalliy demo, ishlab chiqarishda YO'Q) ──
// 2FA kodi shu sirdan hisoblanadi (QA skripti dist/auth/totp.js bilan).
const { hashPassword } = await import('../dist/auth/argon.js');
const { encrypt } = await import('../dist/auth/crypto.js');
export const DEMO_TOTP = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
const staffHash = await hashPassword('demo-ustoz-parol-2026-kuz');
for (const [role, email, first, last] of [['ADMIN', 'admin@demo.uz', 'Admin', 'Demo'], ['TEACHER', 'ustoz@demo.uz', 'Sanat', 'Hoca']]) {
  db.users.push({
    id: `demo-${role.toLowerCase()}`, email, phone: null, firstName: first, lastName: last, role, locale: 'UZ',
    avatarUrl: null, isActive: true, twoFactorEnabled: true,
    twoFactorSecret: encrypt(DEMO_TOTP, process.env.TOTP_ENCRYPTION_KEY, 'totp-secret'),
    twoFactorLastStep: null, leaderboardOptIn: false, parentConsent: false, failedLoginCount: 0, lockedUntil: null,
    passwordHash: staffHash, birthDate: null, bio: null, timezone: 'Asia/Tashkent', createdAt: now,
    emailVerifiedAt: now, telegramVerifiedAt: null, telegramChatId: null, lastLoginAt: null,
  });
}

// ── Demo faollik: panellar (admin grafiklari, ustoz 3D xaritasi) bo'sh ko'rinmasin ──
const studentHash = await hashPassword('demo-oquvchi-parol-2026');
const NAMES = [['Aziza', 'Karimova'], ['Bekzod', 'Tursunov'], ['Dilnoza', 'Rahimova'], ['Jasur', 'Aliyev'], ['Madina', 'Yusupova'], ['Otabek', 'Qodirov'], ['Sevara', 'Nazarova'], ['Ulug\'bek', 'Ergashev'], ['Zarina', 'Saidova'], ['Sardor', 'Ismoilov'], ['Nilufar', 'Hakimova'], ['Timur', 'Rashidov']];
const DAY = 86400000;
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
NAMES.forEach(([first, last], i) => {
  db.users.push({
    id: `demo-s${i}`, email: `s${i}@demo.uz`, phone: null, firstName: first, lastName: last, role: 'STUDENT', locale: 'UZ',
    avatarUrl: null, isActive: true, twoFactorEnabled: false, twoFactorSecret: null, twoFactorLastStep: null,
    leaderboardOptIn: i % 2 === 0, parentConsent: true, failedLoginCount: 0, lockedUntil: null, passwordHash: studentHash,
    birthDate: null, bio: null, timezone: 'Asia/Tashkent', createdAt: new Date(now - Math.floor(rnd() * 60) * DAY),
    emailVerifiedAt: now, telegramVerifiedAt: null, telegramChatId: null, lastLoginAt: i > 9 ? new Date(now - 9 * DAY) : new Date(now - (i % 3) * DAY),
  });
});
const GROUPS = [['A1 · Ertalabki', 'A1', [0, 1, 2, 3]], ['A2 · Kechki', 'A2', [4, 5, 6, 7]], ['B1 · Dam olish', 'B1', [8, 9, 10, 11]]];
GROUPS.forEach(([name, level, idx], gi) => {
  db.groups.push({ id: `demo-g${gi}`, name, level, schedule: 'Du-Chor-Ju 19:00', meetingUrl: null, isActive: true, joinCode: null, teacherId: 'demo-teacher', courseId: null, createdAt: new Date(now - (40 - gi) * DAY) });
  for (const i of idx) db.members.push({ groupId: `demo-g${gi}`, userId: `demo-s${i}`, joinedAt: new Date(now - 30 * DAY) });
});
const GAMES = ['FLASHCARDS', 'MATCH_PAIRS', 'LISTEN_AND_WRITE', 'FILL_GAP', 'SUFFIX_TRAINER', 'VERB_FORM', 'DIALOGUE', 'ANTONYM'];
for (let d = 0; d < 45; d++) {
  NAMES.forEach((_, i) => {
    if (i > 9 && d < 9) return; // ikki o'quvchi 9 kundan beri kirmagan — "sustlashganlar"
    const plays = Math.floor(rnd() * (i < 4 ? 9 : i < 8 ? 6 : 4) * (d % 7 === 6 ? 0.3 : 1));
    for (let k = 0; k < plays; k++) {
      const hour = [8, 9, 13, 17, 19, 20, 21, 22][Math.floor(rnd() * 8)];
      const at = new Date(Date.parse(new Date(now - d * DAY).toISOString().slice(0, 10) + `T${String(hour).padStart(2, '0')}:00:00+05:00`) + Math.floor(rnd() * 3600_000));
      if (at > now) continue;
      db.results.push({ id: `demo-r${d}-${i}-${k}`, userId: `demo-s${i}`, game: GAMES[Math.floor(rnd() * GAMES.length)], score: 10, durationSec: null, createdAt: at });
    }
  });
}
NAMES.forEach((_, i) => db.stats.push({ userId: `demo-s${i}`, xp: 300 + i * 70, level: 2 + (i % 4), streak: i > 9 ? 0 : 1 + (i % 6), longestStreak: 8, lastActiveDay: i > 9 ? new Date(now - 9 * DAY) : new Date(now.toISOString().slice(0, 10)), weeklyXp: 0 }));
for (let k = 0; k < 18; k++) {
  db.leads.push({ id: `demo-l${k}`, name: `Ariza ${k + 1}`, phone: `+99890${String(1000000 + k)}`, status: k < 5 ? 'ENROLLED' : k < 11 ? 'CONTACTED' : 'NEW', level: null, message: null, userId: null, createdAt: new Date(now - Math.floor(rnd() * 28) * DAY) });
}
db.homework.push({ id: 'demo-hw1', groupId: 'demo-g0', title: 'Oila haqida 5 ta gap', description: 'Har bir gapda egalik qo\'shimchasi bo\'lsin', maxScore: 100, dueAt: new Date(now.getTime() + 2 * DAY), attachmentUrl: null, createdAt: new Date(now - DAY) });
db.submissions.push({ id: 'demo-sub1', homeworkId: 'demo-hw1', studentId: 'demo-s0', text: 'Benim annem öğretmen.', fileUrl: null, score: null, feedback: null, status: 'SUBMITTED', submittedAt: now });
db.submissions.push({ id: 'demo-sub2', homeworkId: 'demo-hw1', studentId: 'demo-s1', text: 'Babam doktor.', fileUrl: null, score: null, feedback: null, status: 'SUBMITTED', submittedAt: now });

// ── Soxta Gemini (DEMO_FAKE_AI=1): AI chat va ovoz tarmoqsiz tekshiriladi ──
if (process.env.DEMO_FAKE_AI === '1') {
  process.env.AI_PROVIDER = 'gemini';
  process.env.AI_API_KEY = 'demo-kalit';
  process.env.AI_MODEL ??= 'gemini-2.0-flash'; // eskirgan nom — 404, keyingisiga o'tishi tekshiriladi
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (!u.includes('generativelanguage.googleapis.com')) return realFetch(url, init);
    const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });
    const model = /models\/([^:?]+)/.exec(u)?.[1] ?? '';
    if (/2\.0-flash/.test(model)) return json({ error: { code: 404, message: `models/${model} is no longer available to new users`, status: 'NOT_FOUND' } }, 404);
    await new Promise((r) => setTimeout(r, 400));
    if (model.includes('tts')) {
      // 0.6 soniyalik yumshoq ovoz (sinus) — o'ynatish ishlashini tekshirish uchun
      const n = 24000 * 0.6;
      const pcm = Buffer.alloc(n * 2);
      for (let i = 0; i < n; i++) pcm.writeInt16LE(Math.round(Math.sin((i / 24000) * 2 * Math.PI * 440) * 6000 * Math.min(1, (n - i) / 2400)), i * 2);
      return json({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;codec=pcm;rate=24000', data: pcm.toString('base64') } }] } }] });
    }
    return json({ candidates: [{ content: { parts: [{ text: 'Merhaba! "Merhaba" — salom degani. (demo javob)' }] } }] });
  };
}

const mod = await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(PrismaService).useValue(prisma).compile();
const app = mod.createNestApplication();
configureApp(app);
const port = Number(process.env.API_PORT ?? 4000);
await app.listen(port, '127.0.0.1');
console.log(
  `DEMO API: http://localhost:${port} — ${db.words.length} so'z, ${db.readingTexts.length} matn, ` +
    `${db.clozeItems.length} bo'shliq, ${db.verbForms.length} fe'l, ${db.dialogueItems.length} suhbat, ` +
    `${db.wordPairs.length} juftlik`,
);

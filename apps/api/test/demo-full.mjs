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

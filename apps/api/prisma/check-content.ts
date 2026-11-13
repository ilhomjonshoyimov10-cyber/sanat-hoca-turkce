// KONTENTNI BAZAGA YOZISHDAN OLDIN TEKSHIRADI.
//
// Nega kerak: seeder faqat serverda ishlaydi (ishlab chiqish muhitida
// Prisma dvigateli yo'q). Ya'ni kontentdagi xato faqat deploy paytida
// ko'rinardi — yoki undan ham yomoni, jim o'tib ketardi.
//
// Nimani tutadi:
//   • yagona kalit takrorlanishi — upsert ikkinchisini birinchisi
//     ustiga yozadi va bitta mashq JIM YO'QOLADI
//   • to'g'ri javob variantlar ichida bo'lishi (o'yin uni variantlarga
//     qo'shadi; agar u allaqachon bo'lsa, ikki marta chiqadi)
//   • bo'shliq belgisi "___" yo'qligi
//   • bir darajada mashq juda kam bo'lishi (o'yin bo'sh chiqadi)
//
// Ishlatish: pnpm content:check

import { clozeItems } from './content/cloze.js';
import { dialogues } from './content/dialogues.js';
import { DRILLS, SENTENCES } from './content/drills.js';
import { antonyms } from './content/pairs.js';
import { READING_TEXTS } from './content/reading-texts.js';
import { topics } from './content/topics.js';
import { verbForms } from './content/verbs.js';
import { mediaSeeds } from './content/media.js';

const problems: string[] = [];
const notes: string[] = [];

const fail = (m: string) => problems.push(m);
const note = (m: string) => notes.push(m);

/** Yagona kalit takrorlanganini tekshiradi. */
function uniqueKeys<T>(name: string, rows: T[], key: (r: T) => string) {
  const seen = new Map<string, number>();
  rows.forEach((r, i) => {
    const k = key(r);
    const first = seen.get(k);
    if (first !== undefined) {
      fail(`${name}: ${first + 1}- va ${i + 1}-yozuvda bir xil yagona kalit → biri jim yo'qoladi\n   kalit: ${k}`);
    } else {
      seen.set(k, i);
    }
  });
}

/** Har darajada kamida `min` ta yozuv bo'lsin, aks holda o'yin bo'sh chiqadi. */
function perLevel<T extends { level: string }>(name: string, rows: T[], min: number) {
  const counts = rows.reduce<Record<string, number>>((a, r) => ((a[r.level] = (a[r.level] ?? 0) + 1), a), {});
  const summary = Object.entries(counts)
    .sort()
    .map(([l, n]) => `${l}:${n}`)
    .join(' ');
  note(`${name}: ${rows.length} ta (${summary})`);
  for (const [level, n] of Object.entries(counts)) {
    if (n < min) fail(`${name}: ${level} darajasida atigi ${n} ta — o'yin uchun kamida ${min} ta kerak`);
  }
}

// ───────────── Bo'shliq to'ldirish ─────────────

uniqueKeys('Bo‘shliq', clozeItems, (c) => `${c.masked} | ${c.answer}`);
perLevel('Bo‘shliq', clozeItems, 4);
for (const [i, c] of clozeItems.entries()) {
  const n = i + 1;
  if (!c.masked.includes('___')) fail(`Bo‘shliq ${n}: "___" belgisi yo‘q — savol bo‘shliqsiz chiqadi`);
  // Mavzu yorlig'i savol bilan birga ko'rinadi. "O'rin kelishigi (-ta/-te)"
  // deb yozilsa, -da/-de variantlari darhol chiqib ketadi — ya'ni yorliq
  // javobning yarmini aytib qo'yadi. Jonli o'yinda shunday bo'lgan edi.
  if (/\(-/.test(c.topic)) {
    fail(`Bo‘shliq ${n}: mavzu yorlig‘ida qo‘shimcha shakli bor ("${c.topic}") — javobni oshkor qiladi`);
  }
  if (c.topic.toLocaleLowerCase('tr').includes(c.answer.toLocaleLowerCase('tr')) && c.answer.length > 2) {
    fail(`Bo‘shliq ${n}: mavzu yorlig‘ida javobning o‘zi bor ("${c.topic}" / "${c.answer}")`);
  }
  if (c.options.includes(c.answer)) {
    fail(`Bo‘shliq ${n}: to‘g‘ri javob "${c.answer}" chalg‘ituvchilar ichida ham bor — ikki marta chiqadi`);
  }
  if (new Set(c.options).size !== c.options.length) fail(`Bo‘shliq ${n}: chalg‘ituvchilar takrorlangan`);
  if (c.options.length < 2) fail(`Bo‘shliq ${n}: kamida 2 ta chalg‘ituvchi kerak`);
  // To'g'ri javobni bo'shliqqa qo'yganda to'liq jumla chiqishi kerak
  const rebuilt = c.masked.replace('___', c.answer);
  if (rebuilt !== c.full) {
    fail(
      `Bo‘shliq ${n}: javobni bo‘shliqqa qo‘yganda to‘liq jumla mos kelmadi\n` +
        `   kutilgan: ${c.full}\n   chiqdi:   ${rebuilt}`,
    );
  }
}

// ───────────── Fe'l shakllari ─────────────

uniqueKeys('Fe‘l', verbForms, (v) => `${v.infinitive}|${v.person}|${v.tense}|${v.negative}`);
perLevel('Fe‘l', verbForms, 3);
for (const [i, v] of verbForms.entries()) {
  if (!v.answer.trim()) fail(`Fe‘l ${i + 1}: javob bo‘sh`);
  if (v.answer.includes(' ')) note(`Fe‘l ${i + 1}: javobda bo‘shliq bor ("${v.answer}") — yozishda chalkashlik bo‘lishi mumkin`);
}

// ───────────── Suhbat ─────────────

uniqueKeys('Suhbat', dialogues, (d) => `${d.prompt} | ${d.answer}`);
perLevel('Suhbat', dialogues, 4);
for (const [i, d] of dialogues.entries()) {
  const n = i + 1;
  if (d.options.includes(d.answer)) fail(`Suhbat ${n}: to‘g‘ri javob chalg‘ituvchilar ichida ham bor`);
  if (new Set(d.options).size !== d.options.length) fail(`Suhbat ${n}: chalg‘ituvchilar takrorlangan`);
  if (d.options.length < 2) fail(`Suhbat ${n}: kamida 2 ta chalg‘ituvchi kerak`);
}

// ───────────── Zid ma'noli so'zlar ─────────────

uniqueKeys('Juftlik', antonyms, (p) => `${p.first} | ${p.second}`);
for (const [i, p] of antonyms.entries()) {
  // Server tarjimaning faqat birinchi yarmini ko'rsatadi ("toza — kir" -> "toza").
  // Ajratuvchi bo'lmasa, IKKALA so'z ekranga chiqib, javobni aytib qo'yadi.
  if (p.uzbek && !/\s[—–-]\s/.test(p.uzbek)) {
    fail(`Juftlik ${i + 1}: tarjima "birinchi — ikkinchi" shaklida emas ("${p.uzbek}") — javob oshkor bo‘ladi`);
  }
}
perLevel('Juftlik', antonyms, 4);
{
  // Chalg'ituvchilar bir darajadagi boshqa juftliklarning "ikkinchi"
  // so'zidan olinadi — ular takrorlanmasligi kerak.
  const byLevel = new Map<string, Set<string>>();
  for (const p of antonyms) {
    const set = byLevel.get(p.level) ?? new Set<string>();
    if (set.has(p.second)) {
      fail(`Juftlik: "${p.second}" ${p.level} darajasida ikki marta javob bo‘lib kelyapti — variantlar takrorlanadi`);
    }
    set.add(p.second);
    byLevel.set(p.level, set);
  }
}

// ───────────── Mavzular (ortiqcha so'zni top) ─────────────

{
  const slugs = new Set<string>();
  for (const t of topics) {
    if (slugs.has(t.slug)) fail(`Mavzu: "${t.slug}" takrorlangan`);
    slugs.add(t.slug);
    if (t.words.length < 4) {
      fail(`Mavzu "${t.slug}": ${t.words.length} ta so‘z — o‘yin uchun kamida 4 ta kerak (3 ta + chalg‘ituvchi)`);
    }
    const tr = t.words.map((w) => w.turkish);
    if (new Set(tr).size !== tr.length) fail(`Mavzu "${t.slug}": so‘z takrorlangan`);
  }

  // Bitta so'z ikki mavzuda bo'lsa, "ortiqcha so'z" savolida u ikkala
  // tomonda ham to'g'ri bo'lib qoladi — savolning javobi noaniq bo'ladi.
  const where = new Map<string, string[]>();
  for (const t of topics) {
    for (const w of t.words) {
      const key = w.turkish.toLocaleLowerCase('tr');
      where.set(key, [...(where.get(key) ?? []), t.slug]);
    }
  }
  for (const [word, list] of where) {
    if (list.length > 1) {
      fail(`Mavzu: "${word}" bir nechta mavzuda (${list.join(', ')}) — savolning javobi noaniq bo‘ladi`);
    }
  }

  // Har daraja uchun kamida 2 ta mavzu kerak: biridan 3 ta so'z,
  // ikkinchisidan "ortiqcha" so'z olinadi.
  const levels = new Map<string, Set<string>>();
  for (const t of topics) {
    for (const w of t.words) {
      const set = levels.get(w.level) ?? new Set<string>();
      set.add(t.slug);
      levels.set(w.level, set);
    }
  }
  for (const [level, set] of levels) {
    if (set.size < 2) {
      fail(`Mavzu: ${level} darajasida atigi ${set.size} ta mavzu — "ortiqcha so‘z" o‘yini ishlamaydi`);
    }
  }
  note(`Mavzular: ${topics.length} ta, jami ${topics.reduce((n, t) => n + t.words.length, 0)} so‘z`);
}

// ───────────── Eski kontent ham tekshirilsin ─────────────

uniqueKeys('Gap', SENTENCES, (s) => s.turkish);
uniqueKeys('Qo‘shimcha', DRILLS, (d) => `${d.base} | ${d.answer}`);
uniqueKeys('O‘qish matni', READING_TEXTS, (t) => t.slug);
perLevel('Gap', SENTENCES, 3);
perLevel('O‘qish matni', READING_TEXTS, 1);

for (const t of READING_TEXTS) {
  if (t.questions.length === 0) fail(`O‘qish matni "${t.slug}": savol yo‘q`);
  for (const [i, q] of t.questions.entries()) {
    if (q.kind === 'MULTIPLE_CHOICE') {
      if (!q.options || q.options.length < 2) fail(`"${t.slug}" ${i + 1}-savol: variantlar yetarli emas`);
      if (q.correctIndex === undefined || q.correctIndex === null) {
        fail(`"${t.slug}" ${i + 1}-savol: to‘g‘ri variant belgilanmagan`);
      } else if (q.options && (q.correctIndex < 0 || q.correctIndex >= q.options.length)) {
        fail(`"${t.slug}" ${i + 1}-savol: to‘g‘ri variant raqami chegaradan tashqarida`);
      }
    }
    if (q.kind === 'SHORT_ANSWER' && (!q.correctText || q.correctText.length === 0)) {
      fail(`"${t.slug}" ${i + 1}-savol: qabul qilinadigan javob ko‘rsatilmagan`);
    }
  }
}

// ───────────── Kino va musiqa ─────────────

uniqueKeys('Media', mediaSeeds, (m) => m.key);
uniqueKeys('Media (havola)', mediaSeeds, (m) => `${m.videoId ?? ''}|${m.playlistId ?? ''}`);
for (const m of mediaSeeds) {
  if (!m.videoId && !m.playlistId) fail(`Media "${m.key}": video ham, pleylist ham yo'q`);
  if (m.videoId && !/^[A-Za-z0-9_-]{11}$/.test(m.videoId)) fail(`Media "${m.key}": video ID noto'g'ri (11 belgi bo'lishi kerak)`);
  if (m.playlistId && !/^(PL|UU|OL)[A-Za-z0-9_-]{10,60}$/.test(m.playlistId)) fail(`Media "${m.key}": pleylist ID noto'g'ri`);
  for (const lang of ['uz', 'ru', 'en', 'tr'] as const) {
    if (!m[lang].trim()) fail(`Media "${m.key}": ${lang} tavsif bo'sh`);
  }
}
note(`Kino va musiqa: ${mediaSeeds.length} ta`);

// ───────────── Natija ─────────────

console.log('\nKontent hisoboti');
console.log('─'.repeat(60));
for (const n of notes) console.log('  ' + n);

if (problems.length === 0) {
  console.log('\n✓ Kontentda muammo topilmadi\n');
  process.exit(0);
}

console.log(`\n✗ ${problems.length} ta muammo:\n`);
for (const p of problems) console.log('  • ' + p);
console.log('');
process.exit(1);

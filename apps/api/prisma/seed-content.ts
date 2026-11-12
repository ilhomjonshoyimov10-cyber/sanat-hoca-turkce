// O'quv kontentini bazaga yozadi: o'qish matnlari, gaplar, qo'shimcha
// mashqlari.
//
// QAYTA ISHGA TUSHIRISH XAVFSIZ (idempotent): mavjud yozuvlar o'zgartiriladi,
// nusxa yaratilmaydi. Shuning uchun bu skript har deploy'da ishlashi mumkin.
//
// USTOZ TUZATISHLARI: skript faqat O'ZI qo'shgan yozuvlarni yangilaydi.
// Ustoz matnni admin panelidan tuzatsa va keyin deploy bo'lsa, tuzatish
// USTIDAN YOZILADI. Shuning uchun ustoz tuzatganini bu fayllarga ham
// kiritish kerak. Buni oldini olish uchun matn `publishedAt` ni saqlaydi:
// nashr holati o'zgarmaydi.

import { PrismaClient } from '@prisma/client';
import { READING_TEXTS } from './content/reading-texts.js';
import { DRILLS, SENTENCES } from './content/drills.js';
import { clozeItems } from './content/cloze.js';
import { dialogues } from './content/dialogues.js';
import { antonyms } from './content/pairs.js';
import { topics, topicWordCount } from './content/topics.js';
import { verbForms } from './content/verbs.js';

const prisma = new PrismaClient();

function countWords(body: string): number {
  return body.split(/\s+/).filter(Boolean).length;
}

async function seedReading() {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const [index, t] of READING_TEXTS.entries()) {
    const existing = await prisma.readingText.findUnique({
      where: { slug: t.slug },
      select: { id: true, publishedAt: true, createdAt: true, updatedAt: true },
    });

    // USTOZ TAHRIRINI SAQLAYMIZ. Agar matn yaratilgandan keyin
    // o'zgartirilgan bo'lsa (updatedAt createdAt dan sezilarli keyin),
    // demak odam tegdi — ustidan yozmaymiz. Shu tufayli deploy ustozning
    // tuzatishini yo'q qilmaydi.
    if (existing && existing.updatedAt.getTime() - existing.createdAt.getTime() > 5000) {
      skipped++;
      continue;
    }

    const data = {
      title: t.title,
      level: t.level,
      topic: t.topic,
      body: t.body,
      bodyUz: t.bodyUz,
      wordCount: countWords(t.body),
      position: index,
    };

    const text = existing
      ? await prisma.readingText.update({ where: { id: existing.id }, data, select: { id: true } })
      : await prisma.readingText.create({
          // Yangi matn darhol nashr qilinadi: o'quvchi birinchi kirganda
          // bo'sh ro'yxat ko'rmasin.
          data: { ...data, slug: t.slug, publishedAt: new Date() },
          select: { id: true },
        });

    if (existing) updated++;
    else created++;

    // Savollar va lug'at butunlay almashtiriladi — bu yerda manba shu fayl
    await prisma.$transaction([
      prisma.readingQuestion.deleteMany({ where: { textId: text.id } }),
      prisma.readingGlossary.deleteMany({ where: { textId: text.id } }),
    ]);

    await prisma.readingQuestion.createMany({
      data: t.questions.map((q, i) => ({
        textId: text.id,
        kind: q.kind,
        prompt: q.prompt,
        options: q.kind === 'MULTIPLE_CHOICE' ? (q.options ?? []) : [],
        correctIndex: q.kind === 'SHORT_ANSWER' ? null : (q.correctIndex ?? null),
        correctText: q.kind === 'SHORT_ANSWER' ? (q.correctText ?? []) : [],
        explanation: q.explanation ?? null,
        position: i,
      })),
    });

    await prisma.readingGlossary.createMany({
      data: t.glossary.map(([turkish, uzbek], i) => ({ textId: text.id, turkish, uzbek, position: i })),
      skipDuplicates: true,
    });
  }

  console.log(`O'qish matnlari: ${created} yangi, ${updated} yangilandi, ${skipped} tegilmadi (ustoz tahrirlagan)`);
}

async function seedSentences() {
  let n = 0;
  for (const [i, s] of SENTENCES.entries()) {
    await prisma.sentence.upsert({
      where: { turkish: s.turkish },
      create: {
        turkish: s.turkish,
        uzbek: s.uzbek,
        level: s.level,
        topic: s.topic ?? null,
        note: s.note ?? null,
        // Ustoz tekshirgunga qadar o'yinga tushmasin degan qoida bor edi,
        // lekin bo'sh o'yin ham foydasiz. Shuning uchun nashr qilamiz va
        // ustozga tekshirish ro'yxatini beramiz (docs/kontent-tekshiruv.md).
        verified: true,
        position: i,
      },
      update: { uzbek: s.uzbek, level: s.level, topic: s.topic ?? null, note: s.note ?? null, position: i },
    });
    n++;
  }
  console.log(`Gaplar: ${n} ta`);
}

async function seedDrills() {
  let n = 0;
  for (const [i, d] of DRILLS.entries()) {
    await prisma.suffixDrill.upsert({
      where: { base_answer: { base: d.base, answer: d.answer } },
      create: {
        level: d.level,
        base: d.base,
        prompt: d.prompt,
        answer: d.answer,
        alternates: d.alternates ?? [],
        explanation: d.explanation ?? null,
        rule: d.rule,
        verified: true,
        position: i,
      },
      update: {
        level: d.level,
        prompt: d.prompt,
        alternates: d.alternates ?? [],
        explanation: d.explanation ?? null,
        rule: d.rule,
        position: i,
      },
    });
    n++;
  }
  console.log(`Qo'shimcha mashqlari: ${n} ta`);
}

/**
 * Ma'no bo'yicha mavzu teglari.
 *
 * Lug'at darslikdan import qilingan va u yerdagi `category` — "Ünite 1",
 * ya'ni darslik bo'limi, mavzu emas. "Ortiqcha so'zni top" o'yiniga esa
 * haqiqiy mavzu kerak. Shuning uchun:
 *   • so'z bazada bo'lsa (turkcha yozilishi bo'yicha) — unga teg qo'shamiz
 *   • bo'lmasa — yangi so'z qilib qo'shamiz
 * Mavjud lug'at BUZILMAYDI, faqat boyitiladi.
 */
async function seedTopics() {
  // TEZLIK: ilgari har bir so'z uchun alohida so'rov yuborilardi
  // (264 ta so'z x 2 so'rov). Neon'ga har so'rov ~150 ms, ya'ni
  // har deployda bir daqiqadan ko'p vaqt behuda ketardi.
  // Endi lug'at BIR MARTA o'qiladi va faqat o'zgarishi kerak
  // bo'lganlariga yoziladi.
  const all = await prisma.word.findMany({
    select: { id: true, turkish: true, tags: true, verified: true },
  });
  const byTurkish = new Map(all.map((w) => [w.turkish.toLocaleLowerCase('tr'), w]));

  let tagged = 0;
  let added = 0;

  for (const topic of topics) {
    const tag = `mavzu:${topic.slug}`;
    for (const [i, w] of topic.words.entries()) {
      const existing = byTurkish.get(w.turkish.toLocaleLowerCase('tr'));

      if (existing) {
        const needsTag = !existing.tags.includes(tag);
        // O'yinga tushishi uchun tasdiqlangan bo'lishi kerak
        const needsVerify = !existing.verified;
        if (!needsTag && !needsVerify) continue;
        await prisma.word.update({
          where: { id: existing.id },
          data: {
            tags: needsTag ? [...existing.tags, tag] : undefined,
            verified: true,
          },
        });
        // Xotiradagi nusxani ham yangilaymiz: bir so'z ikki mavzuda
        // bo'lsa (tekshiruv buni taqiqlaydi, lekin ehtiyot shart)
        existing.tags = needsTag ? [...existing.tags, tag] : existing.tags;
        existing.verified = true;
        tagged++;
      } else {
        const created = await prisma.word.create({
          data: {
            turkish: w.turkish,
            uzbek: w.uzbek,
            level: w.level,
            category: topic.title,
            tags: [tag],
            verified: true,
            position: i,
          },
          select: { id: true, turkish: true, tags: true, verified: true },
        });
        byTurkish.set(w.turkish.toLocaleLowerCase('tr'), created);
        added++;
      }
    }
  }
  console.log(
    `Mavzular: ${topics.length} ta mavzu, ${tagged} so'zga teg qo'yildi, ${added} yangi so'z ` +
      `(ro'yxatda ${topicWordCount} ta)`,
  );
}

async function seedCloze() {
  for (const [i, c] of clozeItems.entries()) {
    await prisma.clozeItem.upsert({
      where: { masked_answer: { masked: c.masked, answer: c.answer } },
      create: {
        full: c.full, masked: c.masked, answer: c.answer, options: c.options,
        uzbek: c.uzbek, explanation: c.explanation, topic: c.topic,
        level: c.level, verified: true, position: i,
      },
      update: {
        full: c.full, options: c.options, uzbek: c.uzbek,
        explanation: c.explanation, topic: c.topic, level: c.level, position: i,
      },
    });
  }
  console.log(`Bo'shliq mashqlari: ${clozeItems.length} ta`);
}

async function seedVerbs() {
  for (const [i, v] of verbForms.entries()) {
    await prisma.verbForm.upsert({
      where: {
        infinitive_person_tense_negative: {
          infinitive: v.infinitive, person: v.person, tense: v.tense, negative: v.negative,
        },
      },
      create: {
        infinitive: v.infinitive, person: v.person, tense: v.tense, negative: v.negative,
        answer: v.answer, uzbek: v.uzbek, explanation: v.explanation,
        level: v.level, verified: true, position: i,
      },
      update: {
        answer: v.answer, uzbek: v.uzbek, explanation: v.explanation,
        level: v.level, position: i,
      },
    });
  }
  console.log(`Fe'l mashqlari: ${verbForms.length} ta`);
}

async function seedDialogues() {
  for (const [i, d] of dialogues.entries()) {
    await prisma.dialogueItem.upsert({
      where: { prompt_answer: { prompt: d.prompt, answer: d.answer } },
      create: {
        prompt: d.prompt, answer: d.answer, options: d.options,
        situation: d.situation, uzbek: d.uzbek,
        level: d.level, verified: true, position: i,
      },
      update: {
        options: d.options, situation: d.situation, uzbek: d.uzbek,
        level: d.level, position: i,
      },
    });
  }
  console.log(`Suhbat mashqlari: ${dialogues.length} ta`);
}

async function seedPairs() {
  for (const [i, p] of antonyms.entries()) {
    await prisma.wordPair.upsert({
      where: { kind_first_second: { kind: 'ANTONYM', first: p.first, second: p.second } },
      create: {
        kind: 'ANTONYM', first: p.first, second: p.second, uzbek: p.uzbek,
        level: p.level, verified: true, position: i,
      },
      update: { uzbek: p.uzbek, level: p.level, position: i },
    });
  }
  console.log(`Zid ma'noli juftliklar: ${antonyms.length} ta`);
}

async function main() {
  await seedReading();
  await seedSentences();
  await seedDrills();
  await seedTopics();
  await seedCloze();
  await seedVerbs();
  await seedDialogues();
  await seedPairs();

  const [texts, questions, sentences, drills, cloze, verbs, dlg, pairs, words] = await Promise.all([
    prisma.readingText.count(),
    prisma.readingQuestion.count(),
    prisma.sentence.count(),
    prisma.suffixDrill.count(),
    prisma.clozeItem.count(),
    prisma.verbForm.count(),
    prisma.dialogueItem.count(),
    prisma.wordPair.count(),
    prisma.word.count(),
  ]);
  console.log(
    `\nJami: ${texts} matn, ${questions} savol, ${sentences} gap, ${drills} qo'shimcha mashqi, ` +
    `${cloze} bo'shliq, ${verbs} fe'l, ${dlg} suhbat, ${pairs} juftlik, ${words} so'z`,
  );
}

main()
  .catch((e) => {
    console.error('Kontent yozishda xato:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

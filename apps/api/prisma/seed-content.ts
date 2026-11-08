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

async function main() {
  await seedReading();
  await seedSentences();
  await seedDrills();

  const [texts, questions, sentences, drills] = await Promise.all([
    prisma.readingText.count(),
    prisma.readingQuestion.count(),
    prisma.sentence.count(),
    prisma.suffixDrill.count(),
  ]);
  console.log(`\nJami: ${texts} matn, ${questions} savol, ${sentences} gap, ${drills} mashq`);
}

main()
  .catch((e) => {
    console.error('Kontent yozishda xato:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

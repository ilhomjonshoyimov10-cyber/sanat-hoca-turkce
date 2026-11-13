// Kontentni JSON ga chiqaradi — demo-full.mjs uni o'qiydi.
//
// Nega alohida: NestJS'ni tsx orqali ishga tushirsak, @nestjs/core ikki
// nusxada yuklanadi (Reflector klassi ikki xil bo'lib qoladi) va DI
// buziladi. Shuning uchun tsx FAQAT kontentni o'qiydi, server esa oddiy
// node bilan ishlaydi.
import { READING_TEXTS } from '../prisma/content/reading-texts.js';
import { DRILLS, SENTENCES } from '../prisma/content/drills.js';
import { clozeItems } from '../prisma/content/cloze.js';
import { dialogues } from '../prisma/content/dialogues.js';
import { antonyms } from '../prisma/content/pairs.js';
import { topics } from '../prisma/content/topics.js';
import { verbForms } from '../prisma/content/verbs.js';
import { mediaSeeds } from '../prisma/content/media.js';

process.stdout.write(
  JSON.stringify({ READING_TEXTS, DRILLS, SENTENCES, clozeItems, dialogues, antonyms, topics, verbForms, mediaSeeds }),
);

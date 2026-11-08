-- Kitoblar, o'qish matnlari, boyitilgan lug'at, yangi o'yinlar va AI yordamchi.
--
-- Bu fayl QO'LDA yozilgan: `prisma migrate dev` ishlatilmagan, chunki ishlab
-- chiqish muhitida Prisma dvigatelini yuklab bo'lmaydi. Shuning uchun fayl
-- haqiqiy PostgreSQL 16 ga qo'llanib, so'ngra `prisma/check-schema.mjs`
-- skripti bilan schema.prisma ga ustun-ustun solishtirilgan.

-- ───────────── Yangi enumlar ─────────────

CREATE TYPE "PartOfSpeech" AS ENUM ('NOUN', 'VERB', 'ADJECTIVE', 'ADVERB', 'PRONOUN', 'NUMBER', 'CONJUNCTION', 'POSTPOSITION', 'INTERJECTION', 'PHRASE');

CREATE TYPE "BookKind" AS ENUM ('TEXTBOOK', 'READER', 'WORKBOOK', 'GRAMMAR', 'EXAM_PREP', 'OTHER');

CREATE TYPE "BookVisibility" AS ENUM ('PRIVATE', 'GROUP', 'LEVEL', 'PUBLIC');

CREATE TYPE "ReadingQuestionKind" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER');

CREATE TYPE "AiRole" AS ENUM ('USER', 'ASSISTANT');

CREATE TYPE "AiTask" AS ENUM ('CHAT', 'GRAMMAR', 'EXPLAIN', 'EXERCISE');

-- ───────────── Mavjud enumga yangi qiymatlar ─────────────
-- DIQQAT: bu qiymatlar SHU migratsiyada ishlatilmaydi. PostgreSQL yangi
-- enum qiymatini qo'shgan tranzaksiya ichida ishlatishga ruxsat bermaydi.

ALTER TYPE "GameType" ADD VALUE 'WORD_CHAIN';
ALTER TYPE "GameType" ADD VALUE 'SPEED_REVIEW';
ALTER TYPE "GameType" ADD VALUE 'READING_QUIZ';

-- ───────────── Word: lug'atni boyitish ─────────────
-- updatedAt mavjud qatorlarga ham qiymat kerak, shuning uchun DEFAULT bilan.

ALTER TABLE "Word" ADD COLUMN     "exampleRu" TEXT,
                   ADD COLUMN     "partOfSpeech" "PartOfSpeech",
                   ADD COLUMN     "pronunciation" TEXT,
                   ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
                   ADD COLUMN     "frequency" INTEGER,
                   ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
                   ADD COLUMN     "notes" TEXT,
                   ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Word_level_verified_frequency_idx" ON "Word"("level", "verified", "frequency");

CREATE INDEX "Word_category_idx" ON "Word"("category");

-- Mavjud so'zlar ustoz tekshiruvidan o'tgan deb hisoblanadi: ular avvalgi
-- import paytida qo'lda ko'rilgan. Aks holda hamma o'yin bo'sh qolardi.
UPDATE "Word" SET "verified" = true;

-- ───────────── Kitoblar ─────────────

CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "description" TEXT,
    "level" "Level" NOT NULL,
    "kind" "BookKind" NOT NULL DEFAULT 'OTHER',
    "coverUrl" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "pageCount" INTEGER,
    "visibility" "BookVisibility" NOT NULL DEFAULT 'PRIVATE',
    "uploadedById" TEXT NOT NULL,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Book_level_visibility_idx" ON "Book"("level", "visibility");

CREATE INDEX "Book_uploadedById_idx" ON "Book"("uploadedById");

CREATE INDEX "Book_groupId_idx" ON "Book"("groupId");

CREATE TABLE "BookChapter" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "startPage" INTEGER,

    CONSTRAINT "BookChapter_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookChapter_bookId_position_idx" ON "BookChapter"("bookId", "position");

CREATE TABLE "BookProgress" (
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "lastPage" INTEGER NOT NULL DEFAULT 1,
    "finishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookProgress_pkey" PRIMARY KEY ("userId", "bookId")
);

CREATE INDEX "BookProgress_userId_updatedAt_idx" ON "BookProgress"("userId", "updatedAt");

-- ───────────── O'qish matnlari ─────────────

CREATE TABLE "ReadingText" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" "Level" NOT NULL,
    "topic" TEXT,
    "body" TEXT NOT NULL,
    "bodyUz" TEXT,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "audioUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingText_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReadingText_slug_key" ON "ReadingText"("slug");

CREATE INDEX "ReadingText_level_position_idx" ON "ReadingText"("level", "position");

CREATE INDEX "ReadingText_publishedAt_idx" ON "ReadingText"("publishedAt");

CREATE TABLE "ReadingQuestion" (
    "id" TEXT NOT NULL,
    "textId" TEXT NOT NULL,
    "kind" "ReadingQuestionKind" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "prompt" TEXT NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "correctIndex" INTEGER,
    "correctText" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "explanation" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReadingQuestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReadingQuestion_textId_position_idx" ON "ReadingQuestion"("textId", "position");

CREATE TABLE "ReadingGlossary" (
    "id" TEXT NOT NULL,
    "textId" TEXT NOT NULL,
    "turkish" TEXT NOT NULL,
    "uzbek" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReadingGlossary_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReadingGlossary_textId_position_idx" ON "ReadingGlossary"("textId", "position");

CREATE UNIQUE INDEX "ReadingGlossary_textId_turkish_key" ON "ReadingGlossary"("textId", "turkish");

CREATE TABLE "ReadingAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "textId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReadingAttempt_userId_createdAt_idx" ON "ReadingAttempt"("userId", "createdAt");

CREATE INDEX "ReadingAttempt_textId_idx" ON "ReadingAttempt"("textId");

-- ───────────── Lug'at to'plamlari ─────────────

CREATE TABLE "WordSet" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" "Level",
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordSet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WordSet_slug_key" ON "WordSet"("slug");

CREATE INDEX "WordSet_level_position_idx" ON "WordSet"("level", "position");

CREATE TABLE "WordSetItem" (
    "setId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WordSetItem_pkey" PRIMARY KEY ("setId", "wordId")
);

CREATE INDEX "WordSetItem_setId_position_idx" ON "WordSetItem"("setId", "position");

-- ───────────── Yangi o'yinlar uchun ma'lumot ─────────────

CREATE TABLE "Sentence" (
    "id" TEXT NOT NULL,
    "turkish" TEXT NOT NULL,
    "uzbek" TEXT NOT NULL,
    "level" "Level" NOT NULL,
    "topic" TEXT,
    "note" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sentence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Sentence_turkish_key" ON "Sentence"("turkish");

CREATE INDEX "Sentence_level_verified_position_idx" ON "Sentence"("level", "verified", "position");

CREATE TABLE "SuffixDrill" (
    "id" TEXT NOT NULL,
    "level" "Level" NOT NULL,
    "base" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "alternates" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "explanation" TEXT,
    "rule" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuffixDrill_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SuffixDrill_level_verified_position_idx" ON "SuffixDrill"("level", "verified", "position");

CREATE INDEX "SuffixDrill_rule_idx" ON "SuffixDrill"("rule");

-- ───────────── AI yordamchi ─────────────

CREATE TABLE "AiConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "task" "AiTask" NOT NULL DEFAULT 'CHAT',
    "title" TEXT NOT NULL DEFAULT 'Yangi suhbat',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiConversation_userId_updatedAt_idx" ON "AiConversation"("userId", "updatedAt");

CREATE TABLE "AiMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "AiRole" NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiMessage_conversationId_createdAt_idx" ON "AiMessage"("conversationId", "createdAt");

CREATE TABLE "AiUsage" (
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "chars" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("userId", "day")
);

CREATE INDEX "AiUsage_day_idx" ON "AiUsage"("day");

-- ───────────── Tashqi kalitlar ─────────────
-- Book.uploadedBy = RESTRICT: materialga javobgar odam o'chib ketmasin.
-- Qolganlari CASCADE yoki SET NULL — Prisma sxemasidagi bilan bir xil.

ALTER TABLE "Book" ADD CONSTRAINT "Book_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Book" ADD CONSTRAINT "Book_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BookChapter" ADD CONSTRAINT "BookChapter_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookProgress" ADD CONSTRAINT "BookProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookProgress" ADD CONSTRAINT "BookProgress_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReadingQuestion" ADD CONSTRAINT "ReadingQuestion_textId_fkey" FOREIGN KEY ("textId") REFERENCES "ReadingText"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReadingGlossary" ADD CONSTRAINT "ReadingGlossary_textId_fkey" FOREIGN KEY ("textId") REFERENCES "ReadingText"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReadingAttempt" ADD CONSTRAINT "ReadingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReadingAttempt" ADD CONSTRAINT "ReadingAttempt_textId_fkey" FOREIGN KEY ("textId") REFERENCES "ReadingText"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WordSetItem" ADD CONSTRAINT "WordSetItem_setId_fkey" FOREIGN KEY ("setId") REFERENCES "WordSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WordSetItem" ADD CONSTRAINT "WordSetItem_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

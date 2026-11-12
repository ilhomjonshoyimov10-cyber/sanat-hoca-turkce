-- E'lonlar, adminga murojaat, bepul dars videolari, jonli efir va
-- yangi o'yinlar uchun material.
--
-- Qo'lda yozilgan (ishlab chiqish muhitida Prisma dvigateli yo'q),
-- `pnpm db:check` bilan schema.prisma ga solishtirilgan.

-- ───────────── Yangi turlar ─────────────

ALTER TYPE "GameType" ADD VALUE 'FILL_GAP';
ALTER TYPE "GameType" ADD VALUE 'VERB_FORM';
ALTER TYPE "GameType" ADD VALUE 'DIALOGUE';
ALTER TYPE "GameType" ADD VALUE 'ANTONYM';
ALTER TYPE "GameType" ADD VALUE 'ODD_ONE_OUT';

CREATE TYPE "AnnouncementKind" AS ENUM ('INFO', 'PROMO', 'EVENT', 'WARNING');
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL', 'STUDENTS', 'PARENTS', 'TEACHERS');
CREATE TYPE "SupportTopic" AS ENUM ('PROFILE', 'LESSON', 'PAYMENT', 'TECHNICAL', 'OTHER');
CREATE TYPE "SupportStatus" AS ENUM ('OPEN', 'ANSWERED', 'RESOLVED', 'CLOSED');
CREATE TYPE "WordPairKind" AS ENUM ('ANTONYM', 'SYNONYM');

-- ───────────── Lead: hisobga bog'lash ─────────────

ALTER TABLE "Lead" ADD COLUMN "userId" TEXT;
CREATE INDEX "Lead_userId_idx" ON "Lead"("userId");
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ───────────── E'lonlar ─────────────

CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "kind" "AnnouncementKind" NOT NULL DEFAULT 'INFO',
    "audience" "AnnouncementAudience" NOT NULL DEFAULT 'ALL',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "linkLabel" TEXT,
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Announcement_isActive_startsAt_idx" ON "Announcement"("isActive", "startsAt");
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "AnnouncementDismissal" (
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementDismissal_pkey" PRIMARY KEY ("announcementId", "userId")
);

CREATE INDEX "AnnouncementDismissal_userId_idx" ON "AnnouncementDismissal"("userId");
ALTER TABLE "AnnouncementDismissal" ADD CONSTRAINT "AnnouncementDismissal_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnouncementDismissal" ADD CONSTRAINT "AnnouncementDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ───────────── Murojaat ─────────────

CREATE TABLE "SupportRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" "SupportTopic" NOT NULL DEFAULT 'OTHER',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "SupportStatus" NOT NULL DEFAULT 'OPEN',
    "handledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportRequest_status_createdAt_idx" ON "SupportRequest"("status", "createdAt");
CREATE INDEX "SupportRequest_userId_createdAt_idx" ON "SupportRequest"("userId", "createdAt");
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SupportReply" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportReply_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportReply_requestId_createdAt_idx" ON "SupportReply"("requestId", "createdAt");
ALTER TABLE "SupportReply" ADD CONSTRAINT "SupportReply_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "SupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportReply" ADD CONSTRAINT "SupportReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ───────────── Bepul dars ─────────────

CREATE TABLE "LessonVideo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "coverUrl" TEXT,
    "level" "Level",
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonVideo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LessonVideo_isActive_position_idx" ON "LessonVideo"("isActive", "position");
ALTER TABLE "LessonVideo" ADD CONSTRAINT "LessonVideo_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "LeadVideo" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "watchedAt" TIMESTAMP(3),

    CONSTRAINT "LeadVideo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeadVideo_leadId_videoId_key" ON "LeadVideo"("leadId", "videoId");
CREATE INDEX "LeadVideo_leadId_idx" ON "LeadVideo"("leadId");
ALTER TABLE "LeadVideo" ADD CONSTRAINT "LeadVideo_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadVideo" ADD CONSTRAINT "LeadVideo_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "LessonVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadVideo" ADD CONSTRAINT "LeadVideo_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "LeadMessage" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LeadMessage_leadId_createdAt_idx" ON "LeadMessage"("leadId", "createdAt");
ALTER TABLE "LeadMessage" ADD CONSTRAINT "LeadMessage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadMessage" ADD CONSTRAINT "LeadMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ───────────── Jonli efir ─────────────

CREATE TABLE "LiveSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "roomName" TEXT NOT NULL,
    "status" "LessonStatus" NOT NULL DEFAULT 'SCHEDULED',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "level" "Level",
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "hostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LiveSession_roomName_key" ON "LiveSession"("roomName");
CREATE INDEX "LiveSession_status_startsAt_idx" ON "LiveSession"("status", "startsAt");
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "LiveAttendee" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveAttendee_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LiveAttendee_sessionId_userId_key" ON "LiveAttendee"("sessionId", "userId");
ALTER TABLE "LiveAttendee" ADD CONSTRAINT "LiveAttendee_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LiveAttendee" ADD CONSTRAINT "LiveAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ───────────── Yangi o'yin materiallari ─────────────

CREATE TABLE "ClozeItem" (
    "id" TEXT NOT NULL,
    "full" TEXT NOT NULL,
    "masked" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "uzbek" TEXT,
    "explanation" TEXT,
    "topic" TEXT,
    "level" "Level" NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClozeItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClozeItem_masked_answer_key" ON "ClozeItem"("masked", "answer");
CREATE INDEX "ClozeItem_level_verified_position_idx" ON "ClozeItem"("level", "verified", "position");

CREATE TABLE "VerbForm" (
    "id" TEXT NOT NULL,
    "infinitive" TEXT NOT NULL,
    "person" TEXT NOT NULL,
    "tense" TEXT NOT NULL,
    "negative" BOOLEAN NOT NULL DEFAULT false,
    "answer" TEXT NOT NULL,
    "uzbek" TEXT,
    "explanation" TEXT,
    "level" "Level" NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerbForm_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VerbForm_infinitive_person_tense_negative_key" ON "VerbForm"("infinitive", "person", "tense", "negative");
CREATE INDEX "VerbForm_level_verified_position_idx" ON "VerbForm"("level", "verified", "position");

CREATE TABLE "DialogueItem" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "situation" TEXT,
    "uzbek" TEXT,
    "level" "Level" NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DialogueItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DialogueItem_prompt_answer_key" ON "DialogueItem"("prompt", "answer");
CREATE INDEX "DialogueItem_level_verified_position_idx" ON "DialogueItem"("level", "verified", "position");

CREATE TABLE "WordPair" (
    "id" TEXT NOT NULL,
    "kind" "WordPairKind" NOT NULL,
    "first" TEXT NOT NULL,
    "second" TEXT NOT NULL,
    "uzbek" TEXT,
    "level" "Level" NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordPair_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WordPair_kind_first_second_key" ON "WordPair"("kind", "first", "second");
CREATE INDEX "WordPair_kind_level_verified_idx" ON "WordPair"("kind", "level", "verified");

-- ───────────── Takrorlanishni oldini olish ─────────────

CREATE TABLE "SeenItem" (
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "times" INTEGER NOT NULL DEFAULT 1,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeenItem_pkey" PRIMARY KEY ("userId", "kind", "itemId")
);

CREATE INDEX "SeenItem_userId_kind_seenAt_idx" ON "SeenItem"("userId", "kind", "seenAt");
ALTER TABLE "SeenItem" ADD CONSTRAINT "SeenItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

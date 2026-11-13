-- Bildirishnoma turlari
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUPPORT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FREE_LESSON';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CHAT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LIVE';

-- Jonli dars: guruh, provayder, tashqi havola, sig'im
CREATE TYPE "LiveProvider" AS ENUM ('JITSI', 'EXTERNAL');
ALTER TABLE "LiveSession" ADD COLUMN "groupId" TEXT;
ALTER TABLE "LiveSession" ADD COLUMN "provider" "LiveProvider" NOT NULL DEFAULT 'JITSI';
ALTER TABLE "LiveSession" ADD COLUMN "externalUrl" TEXT;
ALTER TABLE "LiveSession" ADD COLUMN "maxParticipants" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "LiveSession_groupId_idx" ON "LiveSession"("groupId");

-- Guruhga qo'shilish kodi
ALTER TABLE "Group" ADD COLUMN "joinCode" TEXT;
CREATE UNIQUE INDEX "Group_joinCode_key" ON "Group"("joinCode");

-- AI: javob bo'lmasa ham savol saqlanadi, sababi bilan
ALTER TABLE "AiMessage" ADD COLUMN "error" TEXT;

-- Bepul 1-dars videosi
ALTER TABLE "LessonVideo" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

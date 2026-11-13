-- Kino, serial, musiqa (YouTube havolalari)
CREATE TYPE "MediaKind" AS ENUM ('SERIES', 'FILM', 'MUSIC', 'KIDS', 'LESSON');

CREATE TABLE "MediaItem" (
    "id" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "descI18n" JSONB,
    "level" "Level",
    "videoId" TEXT,
    "playlistId" TEXT,
    "channel" TEXT,
    "ytTitle" TEXT,
    "thumbnail" TEXT,
    "checkedAt" TIMESTAMP(3),
    "checkNote" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "seedKey" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MediaItem_seedKey_key" ON "MediaItem"("seedKey");
CREATE INDEX "MediaItem_published_kind_position_idx" ON "MediaItem"("published", "kind", "position");

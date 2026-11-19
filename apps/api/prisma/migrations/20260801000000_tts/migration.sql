-- Turkcha ovoz fayllari (Gemini TTS -> Vercel Blob) keshi
CREATE TABLE "TtsClip" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TtsClip_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TtsClip_createdById_createdAt_idx" ON "TtsClip"("createdById", "createdAt");

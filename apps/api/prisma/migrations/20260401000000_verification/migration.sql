-- Tasdiqlash kodlari: email tasdiqlash va Telegram hisobini bog'lash.
--
-- Qo'lda yozilgan (ishlab chiqish muhitida Prisma dvigateli yo'q),
-- `pnpm db:check` bilan schema.prisma ga solishtirilgan.

CREATE TYPE "VerifyChannel" AS ENUM ('EMAIL', 'TELEGRAM');

-- ───────────── User ─────────────

-- "telegramId" boshidan qo'shilgan, lekin hech qayerda yozilmagan ham,
-- o'qilmagan ham edi (har doim NULL). Ikkita o'xshash ustun qolsa, biri
-- yozilib ikkinchisi o'qiladigan xato chiqishi mumkin — shuning uchun
-- ishlatilmaganini olib tashlaymiz.
DROP INDEX "User_telegramId_key";
ALTER TABLE "User" DROP COLUMN "telegramId";

ALTER TABLE "User" ADD COLUMN     "telegramVerifiedAt" TIMESTAMP(3),
                   ADD COLUMN     "telegramChatId" TEXT;

CREATE UNIQUE INDEX "User_telegramChatId_key" ON "User"("telegramChatId");

-- ───────────── Kodlar ─────────────

CREATE TABLE "VerificationCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "VerifyChannel" NOT NULL,
    "target" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VerificationCode_userId_channel_createdAt_idx" ON "VerificationCode"("userId", "channel", "createdAt");

CREATE INDEX "VerificationCode_expiresAt_idx" ON "VerificationCode"("expiresAt");

ALTER TABLE "VerificationCode" ADD CONSTRAINT "VerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

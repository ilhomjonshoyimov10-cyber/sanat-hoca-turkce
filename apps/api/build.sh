#!/usr/bin/env bash
# Vercel'da backend'ni qurish.
#
# Alohida skript, chunki vercel.json dagi buildCommand 256 belgidan
# oshmasligi kerak — va bu yerda izoh yozish mumkin.
set -euo pipefail

echo "1/5 Prisma mijozini yaratish"
pnpm exec prisma generate

echo "2/5 Migratsiyalarni qo'llash"
pnpm exec prisma migrate deploy

if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "3/5 So'zlar va birinchi admin"
  pnpm exec tsx prisma/seed.ts
  echo "4/5 O'quv kontenti (matnlar, gaplar, mashqlar)"
  pnpm exec tsx prisma/seed-content.ts
else
  echo "3-4/5 seed o'tkazib yuborildi (faqat production uchun)"
fi

echo "5/5 TypeScript -> dist, so'ngra bitta ESM faylga yig'ish"
pnpm exec nest build
node bundle.mjs

echo "Tayyor"

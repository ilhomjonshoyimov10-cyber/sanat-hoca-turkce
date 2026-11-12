#!/usr/bin/env bash
# Vercel'da backend'ni qurish.
#
# Alohida skript, chunki vercel.json dagi buildCommand 256 belgidan
# oshmasligi kerak — va bu yerda izoh yozish mumkin.
set -euo pipefail

# Kontent xatosi deploy'ga CHIQMASIN. Bu tekshiruv bazani talab
# qilmaydi, shuning uchun eng boshida ishlaydi va xato bo'lsa
# qurilish shu yerda to'xtaydi.
echo "1/6 Kontentni tekshirish"
pnpm exec tsx prisma/check-content.ts

echo "2/6 Prisma mijozini yaratish"
pnpm exec prisma generate

echo "3/6 Migratsiyalarni qo'llash"
pnpm exec prisma migrate deploy

if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "4/6 So'zlar va birinchi admin"
  pnpm exec tsx prisma/seed.ts
  echo "5/6 O'quv kontenti (matnlar, gaplar, mashqlar)"
  pnpm exec tsx prisma/seed-content.ts
else
  echo "4-5/6 seed o'tkazib yuborildi (faqat production uchun)"
fi

echo "6/6 TypeScript -> dist, so'ngra bitta ESM faylga yig'ish"
pnpm exec nest build
node bundle.mjs

echo "Tayyor"

# Lug'at (so'zlar bazasi)

O'yinlardagi barcha so'zlar `apps/api/prisma/data/*.csv` fayllaridan olinadi (A1, A2, B1, B2). Ular ustozning
Word fayllaridan avtomatik o'tkazilgan. Ustun tartibi: `turkish, uzbek, level, category` (category = "Ünite N").

## Ustoz uchun: nimalarni tekshirish kerak
- `tuzatishlar.csv`: o'zbekcha tomonda **turkcha klaviaturada yozilgan harflar** avtomatik tuzatilgan joylar
  (ö→o', ğ→g', ı→i, ş→sh, ç→ch, ü→u). Masalan "tölov" → "to'lov", "qöl" → "qo'l". Qavs ichidagi matnga tegilmagan.
  Har bir o'zgarish "avval" va "keyin" ustunlarida ko'rinadi. Noto'g'ri tuzatish bo'lsa ayting yoki CSV'ni to'g'rilang.
- `tekshirish-kerak.csv`: avtomatik hal qilib bo'lmagan qatorlar (tarjimasi keyingi qatorga o'tib ketgan, sarlavhalar va h.k.).
- Takroriy so'zlar (turkcha va o'zbekcha bir xil) bir marta olinadi, past darajadagisi qoladi.

## Yangi so'z qo'shish
1. Faylni CSV (UTF-8) qilib saqlang. Excel: "Saqlash turi: CSV UTF-8". Sarlavha: `turkish,uzbek` (ixtiyoriy: `level,category,exampleTr,exampleUz`).
   Namuna: `apps/api/prisma/words-template.csv`.
2. Avval tekshiring (bazaga yozmaydi):  `pnpm --filter @sanat/api db:import-words ./yangi.csv --dry-run`
3. Keyin qo'shing:  `pnpm --filter @sanat/api db:import-words ./yangi.csv`
   Bazada bor so'zlarga tegilmaydi. Yangi so'zlar o'z darajasining oxiriga, fayl tartibida qo'shiladi.

Doimiy lug'atga qo'shish uchun fayllarni `prisma/data/` papkasiga qo'ying (`pnpm db:seed` hammasini o'qiydi).

## Cheklovlar
- Hozir o'yin har so'rovda butun lug'atni xotiraga o'qiydi: ~5000 so'zgacha yaxshi, undan keyin so'rovni optimallashtirish kerak.
- Ba'zi ta'riflar uzun (200 belgigacha); telefonda variantlar ko'p qatorga o'tishi mumkin.

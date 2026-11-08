# Auth, 2FA, ariza va o'yin modullari

## Endpointlar
| Yo'l | Kim | Vazifa |
|---|---|---|
| POST /auth/register | hamma | Ro'yxatdan o'tish (faqat STUDENT roli) |
| POST /auth/login | hamma | 1-bosqich: parol. 2FA yoqilgan bo'lsa `twoFactorRequired` + `challenge` qaytadi, seans yo'q |
| POST /auth/2fa/login | hamma | 2-bosqich: `challenge` + 6 xonali kod yoki tiklash kodi |
| POST /auth/2fa/setup | kirgan | Sir va QR uchun `otpauthUrl` |
| POST /auth/2fa/enable | kirgan | Kodni tasdiqlab yoqadi, 8 ta tiklash kodi (bir marta ko'rsatiladi) |
| POST /auth/2fa/disable | o'quvchi | Parol + kod bilan o'chirish (ustoz/adminda mumkin emas) |
| POST /auth/refresh, /auth/logout | cookie | Tokenni yangilash, chiqish |
| GET /auth/me | kirgan | Profil |
| GET /health | hamma | Ilova va baza tirikmi (Docker shu orqali tekshiradi) |
| POST /leads | hamma | Bepul sinov darsiga ariza |
| GET /leads | TEACHER, ADMIN | Arizalar ro'yxati |
| GET /games/quiz | kirgan | Savollar (to'g'ri javob yuborilmaydi) |
| POST /games/answer | kirgan | Javobni serverda tekshiradi, XP/seriya/takrorlashni yangilaydi |
| GET /games/match, POST /games/match/answer | kirgan | Juftlikni top: 6 juftlik (moslik shifrlangan tokenda) / javobni serverda tekshirish |
| GET /games/builder, POST /games/builder/answer | kirgan | Harflardan so'z yig'ish (aralash harflar beriladi, so'zning o'zi emas) |
| GET /games/listen, POST /games/listen/answer | kirgan | Tinglab yozish (diakritiksiz yozilsa "deyarli", XP yo'q) |
| GET /games/me, /games/leaderboard | kirgan | Statistika, haftalik reyting |
| PATCH /games/leaderboard-optin | kirgan | Reytingda ko'rinishga rozilik |

Qiymat o'zgartiruvchi so'rovlarda `X-Requested-With: XMLHttpRequest` va to'g'ri `Origin` shart (CSRF himoyasi). `apps/web/lib/api.ts` buni avtomatik qiladi.

| GET/POST /groups | kirgan / TEACHER, ADMIN | Guruhlar ro'yxati (rolga qarab) / yaratish |
| GET/PATCH /groups/:id | a'zo yoki ustoz / ustoz | Guruh ma'lumoti / o'zgartirish |
| POST/DELETE /groups/:id/members | ustoz | O'quvchi qo'shish (18 yoshgacha: `confirmParentConsent`) / chiqarish |
| GET/POST /groups/:id/homework, GET /homework/:id | a'zo / ustoz | Vazifalar |
| POST /homework/:id/submission | o'quvchi (a'zo) | Topshirish (baholangandan keyin qayta topshirib bo'lmaydi) |
| PATCH /submissions/:id | ustoz | Baholash yoki qayta ishlashga qaytarish |
| GET/PUT /groups/:id/attendance | a'zo (faqat o'zi) / ustoz | Davomat |

## Xavfsizlik qarorlari
- **Guruhlarda IDOR himoyasi:** har so'rovda guruhning ustozi/a'zosi tekshiriladi. Ruxsati yo'q foydalanuvchiga 404 qaytadi (guruh mavjudligi ham sezilmaydi). O'quvchi boshqa o'quvchining javobi, davomati va email/telefonini ko'rmaydi.
- Onlayn dars havolasi faqat `https://` bo'lishi mumkin (`javascript:` kabilar rad etiladi).
- Standart holatda **hamma yo'l yopiq**; ochiq qilish uchun `@Public()`, rol uchun `@Roles(...)`.
- **2FA majburiyligi serverda**: ustoz/admin 2FA yoqmaguncha `MfaGuard` ularni faqat `@AllowWithout2fa()` yo'llariga kiritadi (API'ni to'g'ridan-to'g'ri chaqirib chetlab o'tib bo'lmaydi).
- TOTP o'zimiz yozilgan (RFC 6238 rasmiy test vektorlari bilan tekshirilgan). Sir AES-256-GCM bilan shifrlanadi (`TOTP_ENCRYPTION_KEY`). Ishlatilgan kod qayta ishlamaydi. Noto'g'ri kodlar ham parol kabi hisobni bloklaydi.
- 2FA `challenge` tokeni alohida kalit bilan imzolanadi, 5 daqiqa yashaydi va access token o'rnida ishlamaydi.
- O'yin savollari shifrlangan tokenda keladi (to'g'ri javob klientga ko'rinmaydi, boshqa foydalanuvchining tokeni ishlamaydi). XP faqat so'z "takrorlash vaqti kelganda" beriladi, shuning uchun bir savolni qayta yuborib XP "ishlab" bo'lmaydi.
- Reyting faqat roziligi bor foydalanuvchilarni ko'rsatadi ("Ism F."); 18 yoshgacha bo'lganlar uchun ota-ona roziligi (`parentConsent`) kerak.
- Access token 15 daqiqa; refresh token tasodifiy, bazada faqat xeshi, har yangilashda almashadi, qayta ishlatilsa barcha seanslar yopiladi.
- Chiqishda sahifa to'liq qayta yuklanadi (umumiy kompyuterlarda oldingi foydalanuvchi ma'lumotlari qolmasligi uchun).

## Testlar
- `pnpm --filter @sanat/api test:db`: 16 ta tekshiruv **haqiqiy PostgreSQL** bilan (indekslar, tashqi kalitlar, parallel tranzaksiyalar, SQL agregatsiyasi)
- `pnpm --filter @sanat/api test`: 62 ta birlik testi (parol siyosati, TOTP RFC vektorlari, shifrlash, SRS, seriya)
- `pnpm --filter @sanat/api test:e2e`: 70 ta to'liq oqim testi (haqiqiy Nest ilovasi, xotiradagi soxta baza)
- Himoyalar mutatsion tekshiruvdan o'tgan: har birini buzganda aynan kerakli test qulaydi.

## Ma'lum cheklovlar
- "Tinglab yozish": so'z brauzer ovoz chiqarishi uchun klientga yuboriladi, shuning uchun uni avtomatlashtirish mumkin. XP baribir faqat takrorlash vaqti kelgan so'zga beriladi (kuniga chegaralangan). Turkcha ovoz hamma qurilmada bo'lmaydi: o'shanda so'z matn bilan ko'rsatiladi.
- Email/telefon **tasdiqlanmaydi** (birov boshqaning emailini ro'yxatdan o'tkazishi mumkin)
- Testlar soxta bazada o'tgan. **Haqiqiy PostgreSQL bilan hali ishga tushirilmagan** (shuning uchun birinchi `migrate` + `seed` ishga tushirishda ehtiyot bo'ling)
- Chiqishda access token 15 daqiqagacha amal qilishi mumkin (o'g'irlangan bo'lsa)
- Refresh token "sirpanuvchi" (30 kun, mutlaq chegara yo'q); eskirgan tokenlarni tozalovchi vazifa yo'q
- Savollar uchun so'zlar xotirada tanlanadi (yuzlab so'zgacha yaxshi; minglab bo'lsa so'rovni optimallashtirish kerak)
- CSP to'liq emas (nonce statik sahifalarni dinamik qiladi)
- Hisob bloklash orqali begona odam boshqaning hisobini 15 daqiqaga qulflashi mumkin
- Safari/iPhone'da sinalmagan (faqat Chromium)

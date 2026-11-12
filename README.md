# Sanat Hoca Türkçe

Turk tili o'quv markazi uchun web platforma: kurslar, o'yinlar, guruhlar, ustoz paneli.

**Jonli:** https://sanat-hoca-turkce.vercel.app

**Texnologiyalar:** Next.js 16 + Tailwind 4 (frontend) · NestJS 12 (backend) · PostgreSQL + Prisma 6 · Redis · Docker

## Holat
- [x] 1. Skelet, Docker, ma'lumotlar bazasi sxemasi
- [x] 2. Auth: Argon2id, HttpOnly cookie, refresh rotation, rollar, CSRF, bloklash
- [x] 3. Frontend: dizayn tizimi, bosh sahifa, kirish, ro'yxatdan o'tish, kabinet
- [x] 4. Ariza formasi (saytdan ustozgacha) va ustoz uchun arizalar ro'yxati
- [x] 5. **2FA (TOTP)**: ustoz va admin uchun majburiy, tiklash kodlari, replay himoyasi
- [x] 6. **O'yinlar**: so'z mashqi (oraliqli takrorlash), XP, daraja, seriya, haftalik reyting
- [x] 6b. **Dizayn**: "Gece Çini" tizimi (İznik palitrasi, Fraunces tipografikasi, mehrob ravog'i), 3D masjid (three.js), 0 ta accessibility xatosi
- [x] 7. **Email va Telegram orqali tasdiqlash**: kod xeshlanadi (HMAC + server kaliti), 10 daqiqa,
      5 urinish. SMS YO'Q — provayder pullik va operator shartnomasi kerak, shuning uchun telefon
      raqami "tasdiqlangan" deb BELGILANMAYDI. Ishlashi uchun `RESEND_API_KEY` yoki
      `TELEGRAM_BOT_TOKEN` kerak
- [x] 13. **Panellar**: admin, ustoz va o'quvchi uchun alohida kirish va panel, profil, bildirishnomalar
- [x] 14. **Chat va video darslar**: guruh chati, e'lonlar, Jitsi video dars (xona nomi serverda yaratiladi)
- [x] 15. **Kitoblar/materiallar**: ustoz yuklaydi (fayl brauzerdan to'g'ridan-to'g'ri saqlagichga), ko'rinish darajalari, o'qilgan sahifa
- [x] 16. **O'qish matnlari**: 20 original turkcha matn (A1-C1, qiyinlik darajama-daraja oshadi) + savollar + bosiladigan lug'at; ustoz uchun muharrir
- [x] 17. **Lug'at boshqaruvi**: so'z turkumi, talaffuz, teglar, chastota, tasdiqlash, mavzuli to'plamlar
- [x] 18. **O'yinlar — jami 12 ta**, ko'nikma bo'yicha uch guruhda: so'z boyligi, grammatika, jonli til.
      Yangilari: bo'shliqni to'ldirish, fe'l shakli, suhbat, zid ma'no, ortiqcha so'zni top.
      Material TAKRORLANMAYDI: avval ko'rilmagani, keyin eng uzoq vaqt oldin ko'rilgani beriladi
- [x] 19. **AI yordamchi**: suhbat, grammatika tuzatish, so'z tushuntirish, ustoz uchun mashq yaratish.
      Provayder almashtiriladigan (Gemini/Groq/OpenAI/Anthropic), kalit serverda qoladi,
      shaxsiy ma'lumot yuborilmaydi, kunlik limit rollar bo'yicha
- [x] 20. **Vercel deploy**: jonli havola, Neon Postgres, migratsiya va kontent seedi build paytida
- [x] 8. **Guruhlar**: guruh yaratish, o'quvchi qo'shish (18 yoshgacha: ota-ona roziligi), uy vazifalari, baholash, davomat
- [x] 9a. **Ustoz lug'ati** (A1, A2, B1, B2: ~2750 so'z) o'yinlarga qo'shildi, daraja tanlash, import vositasi (`docs/lugat/README.md`)
- [x] 9. **Yangi o'yinlar**: juftlikni top, harflardan so'z yig'ish, tinglab yozish (brauzer ovozi). Keyingi: qo'shimchalar mashqi, jumla tuzish
- [x] 21. **E'lonlar va reklama**: faqat admin, auditoriya tanlanadi, muddatli, yopiladigan
- [x] 22. **Adminga murojaat**: mavzu bo'yicha, yozishma bilan
- [x] 23. **Profil**: rasm yuklash, kirgan qurilmalar (vaqt/IP/brauzer), chiqish tugmasi
- [x] 24. **Sessiya 1 kun, suriladigan**: har kirishda yangilanadi; bir kun kirmasa login+parol
- [x] 25. **Bepul dars**: admin video kutubxonasi -> ustoz arizachiga biriktiradi -> chat.
      Ariza telefon raqami bo'yicha hisobga avtomatik bog'lanadi
- [x] 26. **Jonli efir**: guruhga bog'liq bo'lmagan ochiq dars, darajaga qarab
- [x] 27. **Biz haqimizda**: ustoz, telefon, Telegram kanal, Buxoro Savdo majmuasi xaritada
- [ ] 10. To'lov (Payme/Click) — merchant shartnomasi va sandbox kalitlari kerak, ularsiz
      bitta qator ham sinab ko'rib bo'lmaydi
- [ ] 28. Ustoz turkcha kontentni tekshirishi (`docs/KONTENT.md`)
- [x] 11. **Deploy**: Docker + Caddy (HTTPS avtomatik), migratsiyalar, zaxira skripti, `docs/DEPLOY.md`
- [ ] 12. Nazorat (monitoring), xatolarni yig'ish, xavfsizlik auditi

## Talablar
**Node.js 22 yoki undan yangi** va **pnpm**. Docker faqat haqiqiy PostgreSQL uchun kerak
(1-usulda kerak emas).

Tekshirish — `node -v` 22 dan katta bo'lsin. pnpm o'rnatilmagan bo'lsa:
```
npm install -g pnpm
```

> ### Manzil haqida
> `http://localhost:3000` ham, `http://127.0.0.1:3000` ham ishlaydi.
>
> Avval bu muammo edi (brauzer ikkisini boshqa sayt deb bilib, cookie'ni
> saqlamasdi). Endi frontend `/api/*` so'rovlarini o'zi backend'ga uzatadi
> (Next.js rewrite), shuning uchun brauzer faqat bitta domen ko'radi:
> CORS kerak emas, cookie ishonchli. Sozlama: `apps/web/.env.local` dagi
> `API_ORIGIN`.

---

## 0) Eng oson: bitta faylni bosing

Zip ni to'liq oching, so'ng papkadagi **`ISHGA-TUSHIR.bat`** faylini ikki marta bosing.

U o'zi hammasini qiladi: Node.js va pnpm ni tekshiradi, portlar bo'shligiga
ishonch hosil qiladi, paketlarni o'rnatadi, Prisma tiplarini yaratadi, backend
va saytni ikkita alohida oynada ishga tushiradi va brauzerni ochadi.
Birinchi safar 2-5 daqiqa oladi, keyingilari ~30 soniya.

- **To'xtatish:** ochilgan ikkita qora oynani yoping.
- Windows "bu faylni ishlatmang" desa: **Qo'shimcha ma'lumot → Baribir ishga tushirish**.
- Xato chiqsa, oyna yopilmaydi — xabarni o'qing, pastdagi "Ishlamasa" jadvaliga qarang.

Quyidagi 1- va 2-bo'limlar xuddi shu ishni qo'lda bajarish uchun.

---

## 1) Qo'lda: PostgreSQL'siz (eng oson)

Ma'lumotlar faqat xotirada turadi — serverni o'chirsangiz yo'qoladi. Sinash uchun yetarli.

**Windows (PowerShell).** Loyiha papkasida ikkita PowerShell oynasi oching.

1-oyna — backend:
```powershell
pnpm install
pnpm --filter @sanat/api exec prisma generate
pnpm demo
```
Kutilgan natija: `DEMO API: http://localhost:4000`. Bu oynani yopmang.

2-oyna — sayt:
```powershell
Copy-Item apps\web\.env.example apps\web\.env.local
pnpm dev:web
```
Kutilgan natija: `Ready in ...`. Endi brauzerda **http://localhost:3000** ni oching.

**macOS / Linux** — xuddi shunday, faqat nusxalash buyrug'i:
```bash
cp apps/web/.env.example apps/web/.env.local
```

**Kirish uchun:** `admin@demo.uz` / `demo-parol-sakkiz-kuz`
Birinchi kirishda 2FA sozlash majburiy — telefoningizga Google Authenticator
(yoki Microsoft Authenticator) o'rnatib, ekrandagi QR kodni skanerlang.
Yoki shunchaki **Ro'yxatdan o'tish** tugmasi orqali yangi o'quvchi hisobi oching:
o'quvchiga 2FA majburiy emas, darhol o'yinlarni ochasiz.

---

## 2) Haqiqiy ishga tushirish (PostgreSQL bilan)

Docker Desktop o'rnatilgan bo'lsin.

**1-qadam — sozlamalar fayli.** Maxfiy kalitlarni yarating:
```powershell
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"   # parollar uchun
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))" # kalitlar uchun
```
```powershell
Copy-Item .env.example .env
notepad .env          # yuqoridagi qiymatlarni joylashtiring
Copy-Item apps\web\.env.example apps\web\.env.local
```
> Baza paroli **hex** bo'lsin (`randomBytes(...).toString('hex')`). base64 dagi
> `/` va `=` belgilari `DATABASE_URL` ni buzadi.

**2-qadam — baza va jadvallar:**
```powershell
pnpm install
pnpm db:up                       # PostgreSQL + Redis (Docker)
Copy-Item .env apps\api\.env     # API .env ni o'z papkasidan o'qiydi
cd apps\api
npx prisma migrate deploy        # jadvallarni yaratadi
pnpm db:seed                     # lug'at (2755 so'z) + birinchi admin
cd ..\..
```
`db:seed` tugagach `.env` va `apps\api\.env` dan `ADMIN_PASSWORD` qatorini **o'chiring**.

**3-qadam — ishga tushirish.** Ikkita oyna:
```powershell
pnpm dev:api     # 1-oyna → http://localhost:4000
pnpm dev:web     # 2-oyna → http://localhost:3000
```

---

## Ishlamasa

| Belgi | Sabab va yechim |
|---|---|
| Kirish ishlamaydi, qayta `/login` ga otadi | Saytni `127.0.0.1` da ochgansiz. `http://localhost:3000` da oching |
| Konsolda `CORS policy` yozuvi | O'sha sabab. Yoki `apps/web/.env.local` dagi manzil `localhost:4000` emas |
| `EADDRINUSE` | 3000 yoki 4000 port band. Eski oynani yoping yoki `PORT=3001 pnpm dev:web` |
| `ERR_PNPM_IGNORED_BUILDS` | Paketni `pnpm-workspace.yaml` dagi `allowBuilds` ro'yxatiga qo'shing |
| Prisma `Cannot find module '.prisma/client'` | `pnpm --filter @sanat/api exec prisma generate` |
| `getaddrinfo ENOTFOUND db` | Docker ishlamayapti. Docker Desktop'ni oching, `pnpm db:up` |
| Sayt ochiladi, lekin tugmalar bosilmaydi | Sahifa hali yuklanmoqda. Tugmalar JavaScript ulangandan keyin yonadi (parol manzilga tushib ketmasligi uchun ataylab shunday) |

**Ishlab chiqarish yig'masini lokal sinash** uchun `next start` **ishlamaydi**
(`output: "standalone"` tufayli). To'g'ri usul:
```powershell
pnpm --filter web build
Copy-Item -Recurse apps\web\.next\static apps\web\.next\standalone\apps\web\.next\
node apps\web\.next\standalone\apps\web\server.js
```

---


## Rollar va panellar

Uchta alohida kirish, uchta alohida panel. Parol tekshiruvi **bitta** xavfsiz
kod yo'lidan o'tadi (ikkita alohida auth tizimi ikki barobar xato degani),
lekin kirish sahifalari va panellar ajratilgan.

| Kim | Kirish sahifasi | Paneli | Nima qila oladi |
|---|---|---|---|
| O'quvchi | `/login` | `/dashboard` | O'yinlar, guruh chati, vazifa topshirish, baho ko'rish, video darsga kirish |
| Ustoz | `/kirish/ustoz` | `/ustoz` | Guruh yaratish, o'quvchi qo'shish, vazifa berish va **baholash**, davomat, e'lon, **video dars**, chat moderatsiyasi |
| Administrator | `/kirish/admin` | `/admin` | Foydalanuvchi yaratish/o'chirish, rol berish, parol tiklash, 2FA tiklash, qulf ochish, ko'rsatkichlar, **audit jurnali** |

Rolga qarab yo'naltirish avtomatik: ustoz `/admin` ga kirsa, o'z paneliga qaytariladi.
Bu faqat qulaylik uchun — **haqiqiy ruxsat har doim serverda** tekshiriladi
(`@Roles` qo'riqchisi + har so'rovda foydalanuvchi qayta o'qiladi).

### Himoya qoidalari
- Admin **o'z rolini tushira olmaydi** va o'zini o'chira olmaydi (tizim adminsiz qolmasin).
- Tizimda **kamida bitta faol admin** qolishi majburiy.
- Hisob o'chirilsa yoki paroli tiklansa — **barcha seanslari darhol uziladi**.
- Guruhga a'zo bo'lmagan odamga chat va darslar **404** qaytaradi (403 emas):
  guruh borligini ham bilib bo'lmaydi.
- Ustoz va admin hisoblarida **2FA majburiy**.

## Chat

Guruh ichida matnli chat. Har 5 soniyada faqat **yangi** xabarlar so'raladi
(kursor bilan), shuning uchun yuk kam.

- Ustoz **e'lon** yubora oladi — u yuqorida ajralib turadi va barcha a'zolarga
  bildirishnoma boradi. O'quvchi e'lon yubora olmaydi.
- Spamga cheklov: 10 soniyada 5 tadan ko'p xabar yozib bo'lmaydi.
- O'chirilgan xabar bazada qoladi (moderatsiya tarixi uchun), lekin matni
  mijozga **umuman berilmaydi**.

> Hozir chat so'rov yuborish (polling) orqali ishlaydi — oddiy, ishonchli va
> har qanday proksi ortida ishlaydi. Keyinchalik WebSocket ga o'tkazish mumkin.

## Video darslar

Jitsi orqali. Ustoz dars rejalashtiradi, o'quvchilar vaqti kelganda kiradi.

- Xona nomi **serverda** 160 bit tasodif bilan yaratiladi — taxmin qilib bo'lmaydi.
- Xona nomi ro'yxatda **ko'rinmaydi**: faqat darsga kirish paytida beriladi,
  shuning uchun havola oldindan tarqalmaydi.
- Kirish oynasi: boshlanishidan 15 daqiqa oldin ochiladi, tugagach yopiladi.
- Ustoz xonada moderator bo'ladi; kim kirgani yozib boriladi.

Jitsi serverini almashtirish: `apps/web/components/groups/LessonsSection.tsx`
dagi `JITSI_HOST` qatori. O'z serveringizni qo'ysangiz tezlik va maxfiylik
nazoratda bo'ladi.

## Profil va bildirishnomalar

- Har foydalanuvchi ism, familiya va qisqa tanishtiruvini o'zgartira oladi.
  Email, telefon va **rol** bu yerdan o'zgarmaydi — faqat admin o'zgartiradi.
- Parol almashtirilsa barcha qurilmalardagi seanslar uziladi.
- Bildirishnomalar: yangi vazifa, baho, e'lon, video dars, hisob o'zgarishi.

## Dizayn va harakat
- **Yo'nalish: "Gece Çini"** — İznik keramikasi. To'liq izoh: `docs/DESIGN.md`.
- Shriftlar: Fraunces (sarlavha, `opsz` o'qi bilan) + Instrument Sans (matn). Ikkalasi Turkcha (ğ, ş, ı, İ) va O'zbekcha harflarni qo'llaydi.
- Rang ma'no bo'yicha taqsimlangan: kobalt = tuzilma, feruza = jarayon, jez = yutuq (XP, daraja), bole qizili = faqat bitta asosiy tugma.
- Shakl ierarxiyasi: **kvadrat koshin = narsa, dumaloq = harakat**.
- **3D Sulton Ahmad (Ko'k) masjidi** (`components/fx/MosqueScene.tsx`) formula bilan yasalgan, tashqi model yo'q. Alohida fayl sifatida (~550 KB, siqilmagan) faqat kuchli qurilmada yuklanadi. Trafik tejash rejimida, kam xotirali (<= 2 GB) qurilmada yoki "kamroq harakat" yoqilganda o'rniga yengil SVG masjid ko'rsatiladi. Agar 3D sekin ishlasa (< ~10 kadr/s), o'zi o'chadi.
- Dasturchi kaliti: brauzer konsolida `localStorage.sh3d = "force"` tezlik tekshiruvini o'chiradi (sinash uchun).
- Harakat qoidalari: faqat `transform`/`opacity`, kuchli ease-out egri chiziqlari (`--ease-out`), bosilganda `scale(0.97)`, hover effektlari faqat sichqonchali qurilmalarda, `prefers-reduced-motion` hurmat qilinadi. Bularning hammasi `app/globals.css` boshida.
- Yangi harakat qo'shayotganda: ichki sahifalarda (o'yin, forma) harakat qisqa va maqsadli bo'lsin (<= 300 ms), 3D/ko'rgazma faqat bosh sahifada.

## Sinash
`pnpm test` (birlik + to'liq oqim testlari), `pnpm build`, `pnpm lint`.

**Haqiqiy baza bilan sinash** (PostgreSQL ishlab turgan bo'lsin):
```bash
cd apps/api && DATABASE_URL="postgresql://sanat:PAROL@127.0.0.1:5432/sanat_hoca" pnpm test:db
```
16 ta tekshiruv: lug'atni yozish, noyob indekslar, tashqi kalit kaskadi, parallel so'rovlar,
SQL agregatsiyasi, sana turlari va salomatlik tekshiruvi. **Diqqat:** bu testlar bazadagi
hamma ma'lumotni o'chiradi, shuning uchun faqat alohida sinov bazasida ishlating.

## Internetga chiqarish (deploy)
To'liq qo'llanma: **`docs/DEPLOY.md`** (Docker + Caddy, HTTPS avtomatik, zaxira nusxa).
```bash
cp deploy/.env.production.example .env   # to'ldiring
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm api pnpm db:deploy
docker compose -f docker-compose.prod.yml up -d
```

## Muhim eslatmalar
- **pnpm build skriptlari:** yangi pnpm o'rnatish skriptlarini bloklaydi. Ruxsat berilganlar `pnpm-workspace.yaml` dagi `allowBuilds` da. Yangi paket `ERR_PNPM_IGNORED_BUILDS` desa, shu yerga qo'shing.
- **Next.js 16 sizning bilimingizdan farq qilishi mumkin.** `apps/web/AGENTS.md`: kod yozishdan oldin `node_modules/next/dist/docs/` ni o'qing (masalan `middleware` endi `proxy`, statik sahifada `new Date()` taqiqlangan, ochilgan sahifalar yashirin holatda xotirada qoladi).
- `.env` fayllarini hech qachon git'ga yuklamang.
- Matnlar `apps/web/lib/content.ts` da. `TODO` belgilarini ustoz bilan tasdiqlang.
- **Lug'at `apps/api/prisma/data/*.csv` da.** Avtomatik tuzatishlar `docs/lugat/tuzatishlar.csv` da: ustoz ko'rib chiqsin.
- `apps/web/app/(site)/maxfiylik` hujjati **loyiha**: e'lon qilishdan oldin yurist ko'rib chiqishi shart.

Batafsil: `docs/AUTH.md` · `docs/DEPLOY.md` · `docs/lugat/README.md`

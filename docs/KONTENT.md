# Kontent: nima bor, qayerda turadi, qanday tekshiriladi

Bu hujjat **ustoz uchun**. Dasturchi bo'lmasangiz ham o'qib tushunarli
bo'lishi kerak.

---

## 1. Eng muhimi: turkchani tekshirish kerak

Saytdagi turkcha matnlar, mashqlar va tarjimalar **sun'iy intellekt
yordamida yozilgan**. Grammatik jihatdan to'g'ri bo'lishga harakat
qilingan, lekin:

- ba'zi jumlalar **kitobiy** chiqishi mumkin — jonli nutqda unday
  gapirilmaydi;
- o'zbekcha tarjimada mahalliy so'z boshqacharoq bo'lishi mumkin;
- ayrim so'zlarning darajasi (A1 / A2 / B1 ...) bahsli bo'lishi mumkin.

**Shuning uchun har bir matnni ustoz o'qib chiqishi kerak.** Bu
kamchilik emas — rejaning bir qismi. Matnlarni to'g'rilash uchun
saytni bilish shart emas: `/oqish` sahifasida ustoz uchun tahrirlash
oynasi bor.

---

## 2. Hozir nima bor

| Nima | Nechta | Darajalar |
|---|---|---|
| Lug'at so'zlari | 2755 + 264 (mavzuli) | A1–B2 |
| O'qish matnlari | 20 | A1:6 A2:6 B1:4 B2:3 C1:1 |
| Gap tuzish | 32 | A1:10 A2:10 B1:8 B2:4 |
| Qo'shimchalar mashqi | 46 | A1–B2 |
| Bo'shliq to'ldirish | 43 | A1:15 A2:10 B1:8 B2:4 C1:6 |
| Fe'l shakli | 42 | A1:10 A2:13 B1:9 B2:7 C1:3 |
| Suhbat | 38 | A1:10 A2:10 B1:8 B2:6 C1:4 |
| Zid ma'noli so'zlar | 59 | A1:15 A2:16 B1:12 B2:10 C1:6 |
| Mavzular (ortiqcha so'z o'yini) | 24 mavzu | A1–B1 |

---

## 3. Fayllar qayerda

Hammasi `apps/api/prisma/content/` papkasida:

| Fayl | Nima |
|---|---|
| `reading-texts.ts` | Birinchi 6 ta o'qish matni |
| `reading-texts-2.ts` | Qolgan 14 ta o'qish matni |
| `drills.ts` | Gaplar va qo'shimchalar mashqi |
| `cloze.ts` | Bo'shliq to'ldirish |
| `verbs.ts` | Fe'l shakllari |
| `dialogues.ts` | Suhbat mashqlari |
| `pairs.ts` | Zid ma'noli so'zlar |
| `topics.ts` | Mavzular bo'yicha so'zlar |

Lug'at CSV fayllari esa `apps/api/prisma/data/` da.

---

## 4. Nega lug'atning `category` maydoni ishlatilmaydi

Lug'at darslikdan import qilingan va u yerda `category` ustuni
**"Ünite 1", "Ünite 2"** degan qiymatlarni saqlaydi. Bu **darslik
bo'limi**, mavzu emas: bitta bo'limda "salom", "qalam" va "dushanba"
birga turishi mumkin.

"Ortiqcha so'zni top" o'yiniga esa haqiqiy mavzu kerak —
olma / nok / uzum / **stol**. Shuning uchun o'yin faqat
`mavzu:` bilan boshlanadigan teg qo'yilgan so'zlarni oladi
(`topics.ts` dagi 264 ta so'z).

Yangi mavzu qo'shish uchun `topics.ts` ga yozish kifoya — seeder
mavjud lug'atni buzmaydi, faqat tegni qo'shadi.

---

## 5. Avtomatik tekshiruv

```
cd apps/api
pnpm content:check
```

Bu buyruq bazani talab qilmaydi va quyidagilarni tutadi:

- **yagona kalit takrorlanishi** — ikkita bir xil mashq bo'lsa, biri
  bazaga yozilganda ikkinchisi uning ustiga yoziladi va **jim
  yo'qoladi**;
- to'g'ri javob chalg'ituvchi variantlar ichida ham bo'lishi (javob
  ikki marta chiqadi);
- bo'shliq belgisi `___` yo'qligi;
- javobni bo'shliqqa qo'yganda to'liq jumla mos kelmasligi;
- bitta so'z ikki mavzuda bo'lishi (savolning javobi noaniq bo'ladi);
- bir darajada mashq juda kam bo'lishi (o'yin bo'sh chiqadi).

Bu tekshiruv **deploy'ning birinchi qadami**: kontentda xato bo'lsa,
sayt yangilanmaydi.

> Birinchi ishga tushirishda u 4 ta haqiqiy xatoni topdi:
> `İstanbul’a` dagi apostrof tushib qolgani, C1 darajasida yetarsiz
> bo'shliq mashqi va B2/C1 da yetarsiz suhbat.

---

## 6. Ustoz tahririni seeder buzmaydi

`/oqish` sahifasida matnni tahrirlasangiz, keyingi deploy uni
**ustidan yozmaydi**. Qoida oddiy: matn yaratilganidan keyin
o'zgartirilgan bo'lsa, demak unga odam tegdi — tegilmaydi.

Shuning uchun deploy jurnalida shunday yozuv ko'rinadi:

```
O'qish matnlari: 14 yangi, 0 yangilandi, 6 tegilmadi (ustoz tahrirlagan)
```

Agar tahriringiz **doimiy** bo'lishini xohlasangiz, uni fayldagi
matnga ham ko'chiring — aks holda u faqat bazada qoladi.

---

## 7. Mualliflik huquqi

Barcha matnlar, mashqlar va suhbatlar **shu loyiha uchun yozilgan**.
Hech bir nashriyot darsligidan yoki boshqa saytdan ko'chirilmagan.

Bu muhim: ko'chirilgan matn bilan sayt bir shikoyat bilan yopilishi
mumkin. Shuning uchun boshqa saytdagi dars yoqib qolsa ham, uni
nusxalamaymiz — o'sha g'oyani **o'z so'zlarimiz bilan** qayta yozamiz.

---

## 8. Kutubxona (bob-bob hikoyalar)

Fayllar: `apps/web/lib/library/books-a.ts` (A1–A2) va `books-b.ts` (B1–B2).
6 ta original kitob, har biri 3 bob, har bobda lug'at va 2 ta savol.

- Matnda lug'at so'zi shunday belgilanadi: `[[şehir]]` yoki shakl boshqa
  bo'lsa `[[yurtta|yurt]]` (ko'rinadigan shakl | lug'atdagi kalit).
- Har bir kalit o'sha bobning `glossary` ro'yxatida bo'lishi shart.
- Tekshirish: `cd apps/web && pnpm check:library`
- Ustoz tekshiruvi kerak: turkcha matn, o'zbek/rus/ingliz tarjimalari.

Ustoz yuklagan PDF kitoblar (Materiallar) endi **sayt ichida** o'qiladi
(pdf.js), qolgan sahifa avtomatik saqlanadi.

## 9. Kino va musiqa (YouTube)

Boshlang'ich ro'yxat: `apps/api/prisma/content/media.ts`. Qo'shishning
eng qulay yo'li — admin panel → "Kino va musiqa": havolani qo'yasiz,
server YouTube'dan tekshiradi va kanal nomini o'zi oladi.

**Qoida — faqat rasmiy kanal** (serial kanali, kinostudiya, ijrochining
o'z kanali). Boshqa odam qayta yuklagan film — qaroqchilik, uni saytga
qo'yish markazga muammo keltiradi. Kanal nomi admin ro'yxatida ko'rinadi.

- Video bizda saqlanmaydi — faqat ID. Pleyer: `youtube-nocookie.com`.
- Egasi embed'ni o'chirsa yoki video o'chirilsa — sayt haftada bir
  qayta tekshiradi va uni avtomatik yashiradi.
- "Turkcha subtitr" tugmasi: videoda turkcha subtitr bo'lsa yoqiladi.

# Dizayn yo'nalishi — "Gece Çini" (tungi çini)

Avvalgi dizayn eng standart klişe edi: qop-qora fon + bitta qizil aksent + bir xil
dumaloq kartalar + har sarlavha ustida BOSH HARFLI yorliq. Bu har qanday AI sayt
chiqaradigan "default". Shuning uchun uni tashladik.

Yangi yo'nalish mavzuning o'zidan olingan: **İznik çinisi** — Usmonli keramikasi.
Sayt tungi masjid ichkarisidek: siyoh-ko'k devorlar, ularda kobalt va feruza
koshinlar, jez chiroq yorug'i. Turkiya bayrog'i qizili emas — çinining mashhur
"bole" qizili.

## Rang

| Token | Hex | Vazifasi |
|---|---|---|
| `--ink` | `#070D1F` | sahifa foni — siyoh-ko'k (qora emas, haqiqiy ko'k) |
| `--well` | `#03060F` | eng chuqur joylar, input ichi |
| `--tile` | `#0D1733` | ko'tarilgan panel — koshin |
| `--tile-2` | `#152248` | tanlangan / ustiga borilgan koshin |
| `--cobalt` | `#3B6CE1` | **tuzilma**: chegaralar, chiziqlar, to'r |
| `--turquoise` | `#2FBFBC` | **jarayon**: progress, to'g'ri javob, jonli holat |
| `--brass` | `#E3AE5B` | **yutuq**: XP, daraja, streak, chiroq yorug'i |
| `--bole` | `#E0453A` | **yagona asosiy amal**: CTA |
| `--porcelain` | `#EEF2FD` | matn |
| `--muted` | `#8E9CC4` | ikkinchi darajali matn |

To'rtta aksent **ma'no bo'yicha** taqsimlangan, bezak uchun emas. Bitta rangli
"brand accent" o'rniga to'rtta vazifali rang — bu farqni darhol ko'rsatadi.

## Shrift

- **Sarlavha: Fraunces Variable** (`opsz` o'qi bilan). Katta o'lchamda `opsz`
  144 gacha ko'tariladi — harflar ingichka-qalin kontrasti kuchayadi, uchlari
  cho'ziladi. Bu çini naqshining mo'yqalam chizig'iga ohangdosh.
- **Matn/UI: Instrument Sans Variable** — toza, biroz tor, zamonaviy.
- **Turkcha so'z namunalari** Fraunces bilan katta teriladi: so'zning o'zi
  sahifaning asosiy vizual elementi. Mahsulot — so'z.

## Tuzilma

- **Kvadrat koshin** (radius 3px) — tuzilma bloklari uchun. Çini koshini kvadrat.
- **Dumaloq tugma** (radius 999px) — amal uchun.
  Ya'ni: *kvadrat = narsa, dumaloq = harakat*. Ierarxiya shakl orqali o'qiladi.
- **Ogee arch** (Usmonli o'tkir ravog'i) — yagona takrorlanuvchi jasur element:
  hero vizualini, o'yindagi so'z kartasini va kirish sahifasi panelini ramkalaydi.
- Chegaralar `white/8` emas, **kobalt ingichka chiziq**.
- Fon teksturasi: oddiy nuqtali to'r emas, **sakkiz burchakli yulduz** (rub el
  hizb) naqshi juda past shaffoflikda.

## Harakat

- **Bitta** uyushtirilgan moment: sahifa ochilganda hero ravog'i ketma-ket
  "yonadi" (3 qadam, 900ms). Shundan keyin tinch.
- Har bo'limga "pastdan suzib chiqish" animatsiyasi **olib tashlandi** — bu ham
  generatsiya belgisi. Faqat darajalar yo'li to'ladi, chunki u haqiqatan
  ketma-ketlikni bildiradi.
- Hover faqat bosiladigan narsalarda.

## Matn

- Sarlavhalar ustidagi BOSH HARFLI yorliqlar olib tashlandi.
- Tugmalar nima bo'lishini aytadi ("Bepul darsga yozilish"), "Yuborish" emas.
- Bitta so'zni boshqa rangga bo'yash yo'q.

## Sifat chegarasi

Telefon (360px) dan ish stoliga qadar; klaviatura fokusi ko'rinadi;
`prefers-reduced-motion` hurmat qilinadi; matn kontrasti WCAG AA.

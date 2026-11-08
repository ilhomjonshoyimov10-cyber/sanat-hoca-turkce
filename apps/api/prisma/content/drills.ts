// SENTENCE_BUILDER va SUFFIX_TRAINER o'yinlari uchun ma'lumot.
//
// Bu ham loyihaning o'z kontenti. USTOZ TEKSHIRISHI SHART: har bir javob
// turkcha qoidaga mos bo'lishi kerak, ayniqsa unlilar moslashuvi
// (ünlü uyumu) va undoshlarning yumshashi (ünsüz yumuşaması).

export type SeedSentence = {
  turkish: string;
  uzbek: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  topic?: string;
  note?: string;
};

export type SeedDrill = {
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  base: string;
  prompt: string;
  answer: string;
  alternates?: string[];
  explanation?: string;
  rule: string;
};

// ───────────────────────── Gap tuzish ─────────────────────────
// O'quvchi aralashtirilgan so'zlardan to'g'ri gap tuzadi, shuning uchun
// gaplar qisqa va tartibi aniq bo'lishi kerak.

export const SENTENCES: SeedSentence[] = [
  // A1
  { turkish: 'Ben her gün süt içiyorum', uzbek: 'Men har kuni sut ichaman', level: 'A1', topic: 'kundalik' },
  { turkish: 'Bu benim kitabım', uzbek: 'Bu mening kitobim', level: 'A1', topic: 'narsalar' },
  { turkish: 'Annem mutfakta yemek yapıyor', uzbek: 'Onam oshxonada ovqat qilyapti', level: 'A1', topic: 'oila' },
  { turkish: 'Okul evimize çok yakın', uzbek: 'Maktab uyimizga juda yaqin', level: 'A1', topic: 'maktab' },
  { turkish: 'Bugün hava çok güzel', uzbek: 'Bugun ob-havo juda chiroyli', level: 'A1', topic: 'ob-havo' },
  { turkish: 'Kardeşim futbol oynuyor', uzbek: "Ukam futbol o'ynayapti", level: 'A1', topic: 'oila' },
  { turkish: 'Ben Türkçe öğreniyorum', uzbek: "Men turk tilini o'rganyapman", level: 'A1', topic: 'til' },
  { turkish: 'Masanın üstünde bir bardak var', uzbek: 'Stol ustida bir piyola bor', level: 'A1', topic: 'narsalar', note: 'üstünde — o\'rin ko\'rsatadi' },
  { turkish: 'Babam her sabah gazete okuyor', uzbek: 'Dadam har kuni ertalab gazeta o\'qiydi', level: 'A1', topic: 'oila' },
  { turkish: 'Bizim evimiz büyük değil', uzbek: 'Bizning uyimiz katta emas', level: 'A1', topic: 'uy', note: 'değil — inkor' },

  // A2
  { turkish: 'Dün akşam arkadaşımla sinemaya gittik', uzbek: "Kecha kechqurun do'stim bilan kinoga bordik", level: 'A2', topic: 'bo\'sh vaqt' },
  { turkish: 'Hava soğuk olduğu için dışarı çıkmadım', uzbek: "Havo sovuq bo'lgani uchun tashqariga chiqmadim", level: 'A2', topic: 'ob-havo', note: 'olduğu için — sabab' },
  { turkish: 'Bu akşam seninle konuşmak istiyorum', uzbek: 'Bugun kechqurun sen bilan gaplashmoqchiman', level: 'A2', topic: 'muloqot' },
  { turkish: 'Otobüs on dakika sonra geliyor', uzbek: 'Avtobus o\'n daqiqadan keyin keladi', level: 'A2', topic: 'transport' },
  { turkish: 'Doktor bana çok su içmemi söyledi', uzbek: "Shifokor menga ko'p suv ichishimni aytdi", level: 'A2', topic: 'salomatlik' },
  { turkish: 'Pazardan taze sebze aldım', uzbek: 'Bozordan yangi sabzavot oldim', level: 'A2', topic: 'xarid' },
  { turkish: 'Sınavdan önce çok çalıştım', uzbek: "Imtihondan oldin ko'p ishladim", level: 'A2', topic: 'maktab' },
  { turkish: 'Telefonumu evde unuttum', uzbek: 'Telefonimni uyda unutdim', level: 'A2', topic: 'kundalik' },
  { turkish: 'Kahvaltıda genellikle çay içerim', uzbek: 'Nonushtada odatda choy ichaman', level: 'A2', topic: 'ovqat', note: 'içerim — doimiy harakat' },
  { turkish: 'Yarın erken kalkmam gerekiyor', uzbek: "Ertaga erta turishim kerak", level: 'A2', topic: 'kundalik' },

  // B1
  { turkish: 'İş değiştirmeye karar verdiğimde herkes şaşırdı', uzbek: "Ish o'zgartirishga qaror qilganimda hamma hayron bo'ldi", level: 'B1', topic: 'ish' },
  { turkish: 'Eğer yağmur yağarsa pikniği iptal edeceğiz', uzbek: "Agar yomg'ir yog'sa, piknikni bekor qilamiz", level: 'B1', topic: 'rejalar', note: 'yağarsa — shart' },
  { turkish: 'Bu kitabı okuduktan sonra fikrim değişti', uzbek: "Bu kitobni o'qiganimdan keyin fikrim o'zgardi", level: 'B1', topic: 'o\'qish' },
  { turkish: 'Söylediklerini tam olarak anlamadım', uzbek: "Aytganlaringni to'liq tushunmadim", level: 'B1', topic: 'muloqot' },
  { turkish: 'Bu şehirde yaşamaya alışmak zaman aldı', uzbek: "Bu shaharda yashashga ko'nikish vaqt oldi", level: 'B1', topic: 'hayot' },
  { turkish: 'Keşke daha önce başlamış olsaydım', uzbek: 'Qaniydi avval boshlagan bo\'lsam edi', level: 'B1', topic: 'afsus', note: 'keşke — orzu/afsus' },
  { turkish: 'Toplantı ertelendiği için planımı değiştirdim', uzbek: "Yig'ilish kechiktirilgani uchun rejamni o'zgartirdim", level: 'B1', topic: 'ish', note: 'ertelendiği — majhul nisbat' },
  { turkish: 'Onun bu kadar çalışkan olduğunu bilmiyordum', uzbek: 'Uning bunchalik mehnatkash ekanini bilmasdim', level: 'B1', topic: 'odamlar' },

  // B2
  { turkish: 'Sorunun kaynağını bulmadan çözüm üretmek zordur', uzbek: 'Muammoning manbasini topmasdan yechim ishlab chiqish qiyin', level: 'B2', topic: 'fikr' },
  { turkish: 'Her ne kadar yorgun olsam da işi bitirmek istiyorum', uzbek: 'Qanchalik charchagan bo\'lsam ham ishni tugatmoqchiman', level: 'B2', topic: 'ish', note: 'her ne kadar ... -sa da' },
  { turkish: 'Bu konuda acele karar verilmemesi gerektiğini düşünüyorum', uzbek: 'Bu masalada shoshib qaror qilinmasligi kerak deb o\'ylayman', level: 'B2', topic: 'fikr' },
  { turkish: 'Yapılan araştırmalar iddiayı desteklemiyor', uzbek: 'O\'tkazilgan tadqiqotlar da\'voni qo\'llab-quvvatlamaydi', level: 'B2', topic: 'ilm' },
];

// ───────────────────────── Qo'shimchalar mashqi ─────────────────────────

export const DRILLS: SeedDrill[] = [
  // ── O'rin kelishigi: -de / -da / -te / -ta ──
  {
    level: 'A1', base: 'ev', prompt: "«uyDA» — o'rin kelishigini qo'ying", answer: 'evde',
    explanation: "«ev» dagi oxirgi unli «e» — oldingi unli, shuning uchun -de. Oxirgi undosh «v» jarangli, -te emas.",
    rule: 'locative',
  },
  {
    level: 'A1', base: 'okul', prompt: '«maktabDA»', answer: 'okulda',
    explanation: "Oxirgi unli «u» — orqa unli, shuning uchun -da.",
    rule: 'locative',
  },
  {
    level: 'A1', base: 'kitap', prompt: '«kitobDA»', answer: 'kitapta',
    explanation: "DIQQAT: «p» jarangsiz undosh (p, ç, t, k, s, ş, h, f). Shundan keyin -da emas, -ta keladi.",
    rule: 'locative',
  },
  {
    level: 'A1', base: 'ağaç', prompt: '«daraxtDA»', answer: 'ağaçta',
    explanation: "«ç» jarangsiz -> -ta. Unli «a» orqa -> -ta (-te emas).",
    rule: 'locative',
  },
  {
    level: 'A1', base: 'süt', prompt: '«sutDA»', answer: 'sütte',
    explanation: "«t» jarangsiz -> -te. «ü» oldingi unli -> -te (-ta emas).",
    rule: 'locative',
  },
  {
    level: 'A2', base: 'Türkiye', prompt: "«TurkiyaDA» (atoqli nom)", answer: "Türkiye'de",
    alternates: ['Türkiyede'],
    explanation: "Atoqli nomlarda qo'shimcha oldidan APOSTROF qo'yiladi: Türkiye'de, Taşkent'te.",
    rule: 'locative',
  },

  // ── Jo'nalish kelishigi: -e / -a / -ye / -ya ──
  {
    level: 'A1', base: 'ev', prompt: '«uyGA»', answer: 'eve',
    explanation: "Jo'nalish: -e / -a. «e» oldingi unli -> -e.",
    rule: 'dative',
  },
  {
    level: 'A1', base: 'okul', prompt: '«maktabGA»', answer: 'okula',
    explanation: "«u» orqa unli -> -a.",
    rule: 'dative',
  },
  {
    level: 'A1', base: 'kapı', prompt: '«eshikGA»', answer: 'kapıya',
    explanation: "So'z UNLI bilan tugasa, orasiga «y» qo'shiladi: kapı + y + a.",
    rule: 'dative',
  },
  {
    level: 'A2', base: 'Ankara', prompt: '«AnqaraGA»', answer: "Ankara'ya",
    alternates: ['Ankaraya'],
    explanation: "Unli bilan tugaydi -> «y»; atoqli nom -> apostrof.",
    rule: 'dative',
  },

  // ── Chiqish kelishigi: -den / -dan / -ten / -tan ──
  {
    level: 'A1', base: 'göz', prompt: "«ko'zDAN»", answer: 'gözden',
    explanation: "«z» jarangli -> -den. «ö» oldingi unli -> -den.",
    rule: 'ablative',
  },
  {
    level: 'A1', base: 'iş', prompt: '«ishDAN»', answer: 'işten',
    explanation: "«ş» jarangsiz -> -ten.",
    rule: 'ablative',
  },
  {
    level: 'A1', base: 'bahçe', prompt: '«bogʻDAN»', answer: 'bahçeden',
    explanation: "Unli bilan tugasa ham chiqish kelishigida «y» KERAK EMAS: bahçe + den.",
    rule: 'ablative',
  },
  {
    level: 'A2', base: 'sokak', prompt: '«koʻchaDAN»', answer: 'sokaktan',
    explanation: "«k» jarangsiz -> -tan; «a» orqa unli -> -tan.",
    rule: 'ablative',
  },

  // ── Tushum kelishigi + undosh yumshashi ──
  {
    level: 'A2', base: 'araba', prompt: '«mashinaNI»', answer: 'arabayı',
    explanation: "Tushum: -ı/-i/-u/-ü. Unli bilan tugasa «y» qo'shiladi: araba + y + ı.",
    rule: 'accusative',
  },
  {
    level: 'A2', base: 'kitap', prompt: '«kitobNI»', answer: 'kitabı',
    explanation: "MUHIM: oxirgi «p» unli oldida «b» ga aylanadi (ünsüz yumuşaması): kitap -> kitabı.",
    rule: 'softening',
  },
  {
    level: 'A2', base: 'ağaç', prompt: '«daraxtNI»', answer: 'ağacı',
    explanation: "«ç» -> «c»: ağaç -> ağacı.",
    rule: 'softening',
  },
  {
    level: 'A2', base: 'çocuk', prompt: '«bolaNI»', answer: 'çocuğu',
    explanation: "«k» -> «ğ»: çocuk -> çocuğu.",
    rule: 'softening',
  },
  {
    level: 'A2', base: 'kitap', prompt: "«kitobNING» (qaratqich)", answer: 'kitabın',
    explanation: "Qaratqich -ın/-in/-un/-ün. Bu yerda ham «p» -> «b».",
    rule: 'genitive',
  },

  // ── Egalik qo'shimchalari ──
  {
    level: 'A1', base: 'ev', prompt: '«mening uyIM»', answer: 'evim',
    explanation: "1-shaxs egalik: -im/-ım/-um/-üm.",
    rule: 'possessive',
  },
  {
    level: 'A1', base: 'kitap', prompt: '«mening kitobIM»', answer: 'kitabım',
    explanation: "Egalik qo'shimchasi ham unli bilan boshlanadi -> «p» yumshadi.",
    rule: 'possessive',
  },
  {
    level: 'A1', base: 'anne', prompt: '«mening onaM»', answer: 'annem',
    explanation: "So'z unli bilan tugasa, faqat -m qo'shiladi: anne + m.",
    rule: 'possessive',
  },
  {
    level: 'A2', base: 'arkadaş', prompt: "«sening do'stING»", answer: 'arkadaşın',
    explanation: "2-shaxs egalik: -ın/-in/-un/-ün.",
    rule: 'possessive',
  },

  // ── Ko'plik ──
  {
    level: 'A1', base: 'ev', prompt: '«uyLAR»', answer: 'evler',
    explanation: "Ko'plik: -ler / -lar. Oldingi unli (e, i, ö, ü) -> -ler.",
    rule: 'plural',
  },
  {
    level: 'A1', base: 'kitap', prompt: '«kitobLAR»', answer: 'kitaplar',
    explanation: "Orqa unli (a, ı, o, u) -> -lar. Ko'plikda yumshash YO'Q: kitaplar (kitablar emas).",
    rule: 'plural',
  },
  {
    level: 'A1', base: 'göz', prompt: "«ko'zLAR»", answer: 'gözler',
    explanation: "«ö» oldingi unli -> -ler.",
    rule: 'plural',
  },

  // ── Hozirgi zaman: -iyor ──
  {
    level: 'A1', base: 'gelmek', prompt: '«u KELYAPTI»', answer: 'geliyor',
    explanation: "gel + iyor. Hozirgi davomli zaman.",
    rule: 'present-continuous',
  },
  {
    level: 'A1', base: 'gitmek', prompt: '«u KETYAPTI»', answer: 'gidiyor',
    explanation: "DIQQAT: «git-» unli oldida «gid-» bo'ladi: gidiyor (gitiyor emas).",
    rule: 'present-continuous',
  },
  {
    level: 'A1', base: 'okumak', prompt: "«u O'QIYAPTI»", answer: 'okuyor',
    explanation: "oku + yor. Negiz unli bilan tugasa, «i» tushib qoladi.",
    rule: 'present-continuous',
  },
  {
    level: 'A2', base: 'beklemek', prompt: '«u KUTYAPTI»', answer: 'bekliyor',
    explanation: "bekle + iyor -> bekliyor. Oxirgi «e» tushib, «i» ga aylanadi.",
    rule: 'present-continuous',
  },
  {
    level: 'A2', base: 'anlamak', prompt: '«u TUSHUNYAPTI»', answer: 'anlıyor',
    explanation: "anla + ıyor -> anlıyor. Oxirgi «a» -> «ı».",
    rule: 'present-continuous',
  },

  // ── O'tgan zaman: -di ──
  {
    level: 'A1', base: 'yazmak', prompt: '«u YOZDI»', answer: 'yazdı',
    explanation: "yaz + dı. «z» jarangli -> -dı; «a» orqa unli -> -dı.",
    rule: 'past',
  },
  {
    level: 'A1', base: 'gitmek', prompt: '«u KETDI»', answer: 'gitti',
    explanation: "git + ti. «t» jarangsiz -> -ti. Bu yerda yumshash YO'Q (qo'shimcha undosh bilan boshlanadi).",
    rule: 'past',
  },
  {
    level: 'A1', base: 'görmek', prompt: "«u KO'RDI»", answer: 'gördü',
    explanation: "gör + dü. «ö» -> -dü (unli moslashuvi to'rt shakl: -dı/-di/-du/-dü).",
    rule: 'past',
  },
  {
    level: 'A2', base: 'çalışmak', prompt: '«u ISHLADI»', answer: 'çalıştı',
    explanation: "çalış + tı. «ş» jarangsiz -> -tı.",
    rule: 'past',
  },

  // ── Kelasi zaman: -ecek / -acak ──
  {
    level: 'A2', base: 'gelmek', prompt: '«u KELADI (kelasi zaman)»', answer: 'gelecek',
    explanation: "gel + ecek. Oldingi unli -> -ecek.",
    rule: 'future',
  },
  {
    level: 'A2', base: 'yapmak', prompt: '«u QILADI (kelasi zaman)»', answer: 'yapacak',
    explanation: "yap + acak. Orqa unli -> -acak.",
    rule: 'future',
  },
  {
    level: 'A2', base: 'gitmek', prompt: '«u KETADI (kelasi zaman)»', answer: 'gidecek',
    explanation: "git -> gid (unli oldida yumshadi) + ecek = gidecek.",
    rule: 'future',
  },
  {
    level: 'A2', base: 'okumak', prompt: "«u O'QIYDI (kelasi zaman)»", answer: 'okuyacak',
    explanation: "oku + y + acak. Negiz unli bilan tugasa «y» qo'shiladi.",
    rule: 'future',
  },

  // ── Imkoniyat: -ebil / -abil ──
  {
    level: 'B1', base: 'gelmek', prompt: '«u KELA OLADI»', answer: 'gelebilir',
    explanation: "gel + ebil + ir. Imkoniyat shakli.",
    rule: 'ability',
  },
  {
    level: 'B1', base: 'yapmak', prompt: '«u QILA OLADI»', answer: 'yapabilir',
    explanation: "yap + abil + ir.",
    rule: 'ability',
  },
  {
    level: 'B1', base: 'gelmek', prompt: '«u KELA OLMAYDI»', answer: 'gelemez',
    explanation: "Imkoniyat inkori -eme/-ama: gel + eme + z = gelemez. «gelebilmez» EMAS.",
    rule: 'ability',
  },
  {
    level: 'B1', base: 'yapmak', prompt: '«u QILA OLMAYDI»', answer: 'yapamaz',
    explanation: "yap + ama + z = yapamaz.",
    rule: 'ability',
  },

  // ── Inkor ──
  {
    level: 'A1', base: 'gelmek', prompt: '«u KELMAYAPTI»', answer: 'gelmiyor',
    explanation: "gel + mi + yor. Inkor -me/-ma, «iyor» oldida «mi/mı» bo'ladi.",
    rule: 'negation',
  },
  {
    level: 'A1', base: 'anlamak', prompt: '«u TUSHUNMAYAPTI»', answer: 'anlamıyor',
    explanation: "anla + mı + yor = anlamıyor.",
    rule: 'negation',
  },
  {
    level: 'A2', base: 'gitmek', prompt: '«u KETMADI»', answer: 'gitmedi',
    explanation: "git + me + di. Inkordan keyin yumshash yo'q.",
    rule: 'negation',
  },
];

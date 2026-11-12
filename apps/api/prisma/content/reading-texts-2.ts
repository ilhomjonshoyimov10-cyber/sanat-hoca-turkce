// O'qish matnlari — ikkinchi to'plam.
//
// Birinchi to'plam (reading-texts.ts) 6 ta matndan iborat edi. Bu yerda
// yana 14 tasi. Ajratilgan sabab: bitta fayl 1500 qatordan oshsa,
// ustoz kerakli matnni topishi qiyinlashadi.
//
// QIYINLIK DARAJAMA-DARAJA OSHADI:
//   A1 — 60–90 so'z, hozirgi zamon, oddiy gaplar
//   A2 — 90–130 so'z, o'tgan va kelasi zamon, bog'lovchilar
//   B1 — 130–180 so'z, sifatdosh/ravishdosh, fikr bildirish
//   B2 — 180–240 so'z, mavhum mavzular, murakkab bog'lanishlar
//   C1 — 240+ so'z, ilmiy/rasmiy uslub, nozik ma'no farqlari
//
// MUALLIFLIK HUQUQI: hammasi shu loyiha uchun yozilgan, ko'chirma emas.
//
// USTOZ UCHUN: turkchasi TEKSHIRILISHI KERAK.

import type { SeedText } from './reading-texts.js';

export const READING_TEXTS_2: SeedText[] = [
  // ───────────────────────── A1 ─────────────────────────
  {
    slug: 'benim-odam',
    title: 'Benim Odam',
    level: 'A1',
    topic: 'uy',
    body: `Bu benim odam. Oda büyük değil ama çok seviyorum.

Pencerenin yanında bir masa var. Masanın üstünde bilgisayarım ve kitaplarım duruyor. Masanın altında çantam var.

Duvarda bir saat ve iki resim var. Resimlerde ailem görünüyor.

Yatağım pencerenin karşısında. Her sabah güneş odaya giriyor ve ben uyanıyorum. Odamda ders çalışıyorum, kitap okuyorum ve müzik dinliyorum.`,
    bodyUz: `Bu mening xonam. Xona katta emas, lekin juda yaxshi ko'raman.

Deraza yonida stol bor. Stol ustida kompyuterim va kitoblarim turibdi. Stol tagida sumkam bor.

Devorda soat va ikkita rasm bor. Rasmlarda oilam ko'rinadi.

Karavotim deraza ro'parasida. Har kuni ertalab quyosh xonaga kiradi va men uyg'onaman. Xonamda dars qilaman, kitob o'qiyman va musiqa tinglayman.`,
    glossary: [
      ['oda', 'xona'],
      ['pencere', 'deraza'],
      ['masanın üstünde', 'stol ustida'],
      ['altında', 'tagida'],
      ['duvar', 'devor'],
      ['karşısında', "ro'parasida"],
      ['uyanıyorum', "uyg'onaman"],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Masanın üstünde ne var?',
        options: ['Çanta', 'Bilgisayar ve kitaplar', 'Saat'],
        correctIndex: 1,
        explanation: '"Masanın üstünde bilgisayarım ve kitaplarım duruyor." Sumka esa stol TAGIDA.',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yatak nerede?',
        options: ['Pencerenin karşısında', 'Masanın altında', 'Duvarda'],
        correctIndex: 0,
        explanation: '"Yatağım pencerenin karşısında."',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Oda çok büyük.',
        correctIndex: 1,
        explanation: '"Oda büyük değil" — xona katta EMAS.',
      },
      {
        kind: 'SHORT_ANSWER',
        prompt: 'Duvarda kaç resim var?',
        correctText: ['iki', '2', 'iki resim'],
        explanation: '"Duvarda bir saat ve iki resim var."',
      },
    ],
  },
  {
    slug: 'kahvaltida',
    title: 'Kahvaltıda',
    level: 'A1',
    topic: 'ovqat',
    body: `Her sabah saat yedide kahvaltı yapıyoruz.

Annem çay hazırlıyor. Masada ekmek, peynir, zeytin, domates ve salatalık var. Babam yumurta seviyor, her gün bir yumurta yiyor.

Ben çay içmiyorum, süt içiyorum. Kardeşim bal çok seviyor.

Kahvaltıdan sonra babam işe gidiyor, biz okula gidiyoruz. Annem evde kalıyor ve biraz dinleniyor.`,
    bodyUz: `Har kuni ertalab soat yettida nonushta qilamiz.

Onam choy tayyorlaydi. Stolda non, pishloq, zaytun, pomidor va bodring bor. Dadam tuxumni yaxshi ko'radi, har kuni bitta tuxum yeydi.

Men choy ichmayman, sut ichaman. Ukam asalni juda yaxshi ko'radi.

Nonushtadan keyin dadam ishga ketadi, biz maktabga boramiz. Onam uyda qoladi va biroz dam oladi.`,
    glossary: [
      ['kahvaltı', 'nonushta'],
      ['hazırlıyor', 'tayyorlaydi'],
      ['zeytin', 'zaytun'],
      ['bal', 'asal'],
      ['-dan sonra', 'keyin'],
      ['dinleniyor', 'dam oladi'],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Kahvaltı saat kaçta?',
        options: ['Saat altıda', 'Saat yedide', 'Saat sekizde'],
        correctIndex: 1,
        explanation: '"Her sabah saat yedide kahvaltı yapıyoruz."',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yazar (ben) ne içiyor?',
        options: ['Çay', 'Süt', 'Kahve'],
        correctIndex: 1,
        explanation: '"Ben çay içmiyorum, süt içiyorum."',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Babası her gün yumurta yiyor.',
        correctIndex: 0,
        explanation: '"Babam yumurta seviyor, her gün bir yumurta yiyor." — to‘g‘ri.',
      },
      {
        kind: 'SHORT_ANSWER',
        prompt: 'Kardeşi neyi çok seviyor?',
        correctText: ['bal', 'balı'],
        explanation: '"Kardeşim bal çok seviyor."',
      },
    ],
  },
  {
    slug: 'hava-nasil',
    title: 'Hava Nasıl?',
    level: 'A1',
    topic: 'ob-havo',
    body: `Bugün hava çok güzel. Güneş var ve hava sıcak. İnsanlar parkta oturuyor.

Dün hava soğuktu. Yağmur yağıyordu ve rüzgâr vardı. Ben evde kaldım.

Yarın hava nasıl olacak? Bilmiyorum. Belki yine yağmur yağar.

Ben kışı sevmiyorum, çünkü çok soğuk. Baharı çok seviyorum. Baharda ağaçlar yeşil oluyor ve çiçekler açıyor.`,
    bodyUz: `Bugun havo juda yaxshi. Quyosh bor va havo issiq. Odamlar bog'da o'tiribdi.

Kecha havo sovuq edi. Yomg'ir yog'ardi va shamol bor edi. Men uyda qoldim.

Ertaga havo qanday bo'ladi? Bilmayman. Balki yana yomg'ir yog'ar.

Men qishni yoqtirmayman, chunki juda sovuq. Bahorni juda yaxshi ko'raman. Bahorda daraxtlar yashil bo'ladi va gullar ochiladi.`,
    glossary: [
      ['hava', 'havo'],
      ['soğuktu', 'sovuq edi'],
      ['yağmur yağıyordu', "yomg'ir yog'ardi"],
      ['rüzgâr', 'shamol'],
      ['belki', 'balki'],
      ['bahar', 'bahor'],
      ['çiçekler açıyor', 'gullar ochiladi'],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Dün hava nasıldı?',
        options: ['Sıcak ve güneşli', 'Soğuk ve yağmurlu', 'Çok güzel'],
        correctIndex: 1,
        explanation: '"Dün hava soğuktu. Yağmur yağıyordu ve rüzgâr vardı."',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yazar hangi mevsimi seviyor?',
        options: ['Kışı', 'Baharı', 'Yazı'],
        correctIndex: 1,
        explanation: '"Baharı çok seviyorum." Qishni esa sevmaydi.',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Yazar dün parkta oturdu.',
        correctIndex: 1,
        explanation: '"Ben evde kaldım" — uyda qoldi, bog‘da emas.',
      },
      {
        kind: 'SHORT_ANSWER',
        prompt: 'Yazar hangi mevsimi sevmiyor?',
        correctText: ['kış', 'kışı'],
        explanation: '"Ben kışı sevmiyorum, çünkü çok soğuk."',
      },
    ],
  },
  {
    slug: 'arkadasim-davron',
    title: 'Arkadaşım Davron',
    level: 'A1',
    topic: 'odamlar',
    body: `Benim bir arkadaşım var. Adı Davron.

Davron uzun boylu. Saçları siyah, gözleri kahverengi. O çok sakin bir insan.

Davron Buhara'da yaşıyor. Üniversitede okuyor. O mühendis olmak istiyor.

Biz her cumartesi buluşuyoruz. Birlikte futbol oynuyoruz veya kahve içiyoruz. Davron çok iyi bir arkadaş. O her zaman bana yardım ediyor.`,
    bodyUz: `Mening bitta do'stim bor. Ismi Davron.

Davron baland bo'yli. Sochlari qora, ko'zlari jigarrang. U juda bosiq odam.

Davron Buxoroda yashaydi. Universitetda o'qiydi. U muhandis bo'lmoqchi.

Biz har shanba uchrashamiz. Birga futbol o'ynaymiz yoki qahva ichamiz. Davron juda yaxshi do'st. U doim menga yordam beradi.`,
    glossary: [
      ['uzun boylu', "baland bo'yli"],
      ['sakin', 'bosiq, tinch'],
      ['üniversite', 'universitet'],
      ['olmak istiyor', "bo'lmoqchi"],
      ['buluşuyoruz', 'uchrashamiz'],
      ['yardım ediyor', 'yordam beradi'],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Davron ne olmak istiyor?',
        options: ['Doktor', 'Öğretmen', 'Mühendis'],
        correctIndex: 2,
        explanation: '"O mühendis olmak istiyor."',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Onlar ne zaman buluşuyor?',
        options: ['Her cumartesi', 'Her pazar', 'Her gün'],
        correctIndex: 0,
        explanation: '"Biz her cumartesi buluşuyoruz."',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Davron’un gözleri mavi.',
        correctIndex: 1,
        explanation: '"gözleri kahverengi" — jigarrang, ko‘k emas.',
      },
      {
        kind: 'SHORT_ANSWER',
        prompt: 'Davron nerede yaşıyor?',
        correctText: ['Buhara', "Buhara'da", 'Buxoro'],
        explanation: '"Davron Buhara\'da yaşıyor."',
      },
    ],
  },

  // ───────────────────────── A2 ─────────────────────────
  {
    slug: 'doktora-gittim',
    title: 'Doktora Gittim',
    level: 'A2',
    topic: "sog'liq",
    body: `Geçen hafta hastalandım. Boğazım ağrıyordu ve ateşim vardı.

Pazartesi sabahı hastaneye gittim. Önce kayıt yaptırdım, sonra sıramı bekledim. Yaklaşık yarım saat bekledim.

Doktor beni muayene etti ve "Soğuk algınlığı" dedi. Bana bir reçete yazdı. Eczaneden ilaçlarımı aldım.

Doktor çok su içmemi ve dinlenmemi söyledi. Üç gün evde kaldım. Şimdi kendimi çok daha iyi hissediyorum.

Bu olaydan sonra anladım: sağlık her şeyden önemli.`,
    bodyUz: `O'tgan hafta kasal bo'lib qoldim. Tomog'im og'rirdi va isitmam bor edi.

Dushanba kuni ertalab kasalxonaga bordim. Avval ro'yxatdan o'tdim, keyin navbatimni kutdim. Taxminan yarim soat kutdim.

Shifokor meni ko'rikdan o'tkazdi va "Shamollash" dedi. Menga retsept yozdi. Dorixonadan dorilarimni oldim.

Shifokor ko'p suv ichishimni va dam olishimni aytdi. Uch kun uyda qoldim. Hozir o'zimni ancha yaxshi his qilyapman.

Shu voqeadan keyin tushundim: sog'liq hamma narsadan muhim.`,
    glossary: [
      ['hastalandım', "kasal bo'lib qoldim"],
      ['boğazım ağrıyordu', "tomog'im og'rirdi"],
      ['ateş', 'isitma'],
      ['kayıt yaptırmak', "ro'yxatdan o'tmoq"],
      ['muayene etmek', "ko'rikdan o'tkazmoq"],
      ['soğuk algınlığı', 'shamollash'],
      ['reçete', 'retsept'],
      ['dinlenmek', 'dam olmoq'],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yazarın şikâyeti neydi?',
        options: ['Başı ağrıyordu', 'Boğazı ağrıyordu ve ateşi vardı', 'Ayağı kırıldı'],
        correctIndex: 1,
        explanation: '"Boğazım ağrıyordu ve ateşim vardı."',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Doktor ne tavsiye etti?',
        options: ['Spor yapmayı', 'Çok su içmeyi ve dinlenmeyi', 'Hemen işe dönmeyi'],
        correctIndex: 1,
        explanation: '"Doktor çok su içmemi ve dinlenmemi söyledi."',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Yazar hastanede hiç beklemedi.',
        correctIndex: 1,
        explanation: '"Yaklaşık yarım saat bekledim" — yarim soat kutdi.',
      },
      {
        kind: 'SHORT_ANSWER',
        prompt: 'Yazar kaç gün evde kaldı?',
        correctText: ['üç', '3', 'üç gün'],
        explanation: '"Üç gün evde kaldım."',
      },
    ],
  },
  {
    slug: 'otobus-yolculugu',
    title: 'Otobüs Yolculuğu',
    level: 'A2',
    topic: 'sayohat',
    body: `Geçen ay Semerkant'a gittim. Otobüsle gitmeye karar verdim, çünkü tren bileti pahalıydı.

Sabah altıda otogara geldim. Biletimi aldım ve otobüsü bekledim. Otobüs yarım saat geç kalktı.

Yolculuk yaklaşık dört saat sürdü. Pencereden dışarıyı seyrettim. Yolda küçük köyler, tarlalar ve dağlar gördüm.

Yanımda yaşlı bir amca oturuyordu. Benimle Türkçe konuştu. Önce zorlandım ama sonra alıştım. Bana Semerkant'ı anlattı.

Semerkant'a öğleden sonra vardım. Şehir çok güzeldi. Keşke daha uzun kalsaydım.`,
    bodyUz: `O'tgan oy Samarqandga bordim. Avtobusda borishga qaror qildim, chunki poyezd chiptasi qimmat edi.

Ertalab oltida avtovokzalga keldim. Chiptamni oldim va avtobusni kutdim. Avtobus yarim soat kech jo'nadi.

Yo'l taxminan to'rt soat davom etdi. Derazadan tashqariga qaradim. Yo'lda kichik qishloqlar, dalalar va tog'lar ko'rdim.

Yonimda keksa amaki o'tirgan edi. Men bilan turkcha gaplashdi. Avval qiynaldim, lekin keyin ko'nikdim. Menga Samarqand haqida gapirib berdi.

Samarqandga tushdan keyin yetib keldim. Shahar juda chiroyli edi. Qaniydi uzoqroq qolsam edi.`,
    glossary: [
      ['karar vermek', 'qaror qilmoq'],
      ['otogar', 'avtovokzal'],
      ['geç kalkmak', "kech jo'namoq"],
      ['sürdü', 'davom etdi'],
      ['seyretmek', 'tomosha qilmoq'],
      ['tarla', 'dala'],
      ['zorlandım', 'qiynaldim'],
      ['alıştım', "ko'nikdim"],
      ['keşke', 'qaniydi'],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yazar neden otobüsü seçti?',
        options: ['Otobüs daha hızlı', 'Tren bileti pahalıydı', 'Uçak yoktu'],
        correctIndex: 1,
        explanation: '"Otobüsle gitmeye karar verdim, çünkü tren bileti pahalıydı."',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yolculuk ne kadar sürdü?',
        options: ['Yarım saat', 'İki saat', 'Yaklaşık dört saat'],
        correctIndex: 2,
        explanation: '"Yolculuk yaklaşık dört saat sürdü." Yarim soat — avtobusning kechikishi.',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Yazar yolda kimseyle konuşmadı.',
        correctIndex: 1,
        explanation: '"Yanımda yaşlı bir amca oturuyordu. Benimle Türkçe konuştu."',
      },
      {
        kind: 'SHORT_ANSWER',
        prompt: 'Yazar hangi şehre gitti?',
        correctText: ['Semerkant', "Semerkant'a", 'Samarqand'],
        explanation: '"Geçen ay Semerkant\'a gittim."',
      },
    ],
  },
  {
    slug: 'alisveris-listesi',
    title: 'Alışveriş Listesi',
    level: 'A2',
    topic: 'kundalik',
    body: `Cumartesi günleri markete gidiyorum. Gitmeden önce mutlaka bir liste yazıyorum.

Bu hafta listemde şunlar vardı: ekmek, süt, peynir, iki kilo domates, bir kilo elma ve biraz pirinç.

Markette önce sebze bölümüne gittim. Domatesler taze görünüyordu. Elmalar da güzeldi ama biraz pahalıydı.

Sonra süt ürünleri bölümüne geçtim. Peynirin fiyatı geçen haftaya göre artmış.

Kasada hesabı ödedim. Toplam yüz elli bin so'm tuttu. Liste yazmak gerçekten işe yarıyor: gereksiz şeyler almıyorum.`,
    bodyUz: `Shanba kunlari do'konga boraman. Borishdan oldin albatta ro'yxat yozaman.

Bu hafta ro'yxatimda shular bor edi: non, sut, pishloq, ikki kilo pomidor, bir kilo olma va biroz guruch.

Do'konda avval sabzavot bo'limiga bordim. Pomidorlar yangi ko'rinardi. Olmalar ham yaxshi edi, lekin biroz qimmat edi.

Keyin sut mahsulotlari bo'limiga o'tdim. Pishloqning narxi o'tgan haftaga nisbatan oshibdi.

Kassada hisobni to'ladim. Jami bir yuz ellik ming so'm bo'ldi. Ro'yxat yozish haqiqatan foyda beradi: keraksiz narsa olmayman.`,
    glossary: [
      ['alışveriş', 'xarid'],
      ['mutlaka', 'albatta'],
      ['taze', 'yangi (mahsulot)'],
      ['fiyat', 'narx'],
      ['-e göre', 'nisbatan'],
      ['artmış', 'oshibdi'],
      ['kasa', 'kassa'],
      ['işe yaramak', 'foyda bermoq'],
      ['gereksiz', 'keraksiz'],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yazar markete ne zaman gidiyor?',
        options: ['Her gün', 'Cumartesi günleri', 'Pazar günleri'],
        correctIndex: 1,
        explanation: '"Cumartesi günleri markete gidiyorum."',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Peynirin fiyatı ne olmuş?',
        options: ['Düşmüş', 'Artmış', 'Aynı kalmış'],
        correctIndex: 1,
        explanation: '"Peynirin fiyatı geçen haftaya göre artmış."',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Yazar listesiz alışverişe gidiyor.',
        correctIndex: 1,
        explanation: '"Gitmeden önce mutlaka bir liste yazıyorum."',
      },
      {
        kind: 'SHORT_ANSWER',
        prompt: 'Yazara göre liste yazmanın faydası ne?',
        correctText: ['gereksiz şeyler almıyor', 'gereksiz almıyor', 'keraksiz narsa olmaydi'],
        explanation: '"Liste yazmak gerçekten işe yarıyor: gereksiz şeyler almıyorum."',
      },
    ],
  },
  {
    slug: 'yeni-komsular',
    title: 'Yeni Komşular',
    level: 'A2',
    topic: 'qo‘shnilar',
    body: `Geçen ay üst katımıza yeni bir aile taşındı. Anne, baba ve iki küçük çocuk.

İlk gün annem onlara bir tabak pilav götürdü. Bu bizim geleneğimiz: yeni komşuya yemek götürülür.

Komşumuzun adı Ayşe Hanım. O Türkiye'den gelmiş. Eşi burada çalışıyor.

Ayşe Hanım bazen bize geliyor, birlikte çay içiyoruz. Onunla Türkçe konuşuyorum. Benim için bu çok faydalı, çünkü pratik yapıyorum.

Çocukları da bizim bahçede oynuyor. Artık onlar sadece komşu değil, arkadaş.`,
    bodyUz: `O'tgan oy tepamizdagi qavatga yangi oila ko'chib keldi. Ona, ota va ikkita kichkina bola.

Birinchi kuni onam ularga bir tovoq osh olib bordi. Bu bizning an'anamiz: yangi qo'shniga ovqat olib boriladi.

Qo'shnimizning ismi Aysha xonim. U Turkiyadan kelgan ekan. Eri shu yerda ishlaydi.

Aysha xonim ba'zan bizникiga keladi, birga choy ichamiz. U bilan turkcha gaplashaman. Men uchun bu juda foydali, chunki amaliyot qilaman.

Bolalari ham bizning hovlida o'ynaydi. Endi ular shunchaki qo'shni emas, do'st.`,
    glossary: [
      ['taşınmak', "ko'chib kelmoq"],
      ['üst kat', 'tepadagi qavat'],
      ['gelenek', "an'ana"],
      ['eşi', 'turmush o‘rtog‘i'],
      ['faydalı', 'foydali'],
      ['pratik yapmak', 'amaliyot qilmoq'],
      ['bahçe', 'hovli, bog‘'],
      ['artık', 'endi'],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Annesi yeni komşulara ne götürdü?',
        options: ['Çay', 'Bir tabak pilav', 'Ekmek'],
        correctIndex: 1,
        explanation: '"Annem onlara bir tabak pilav götürdü."',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yazar için komşusuyla konuşmak neden faydalı?',
        options: ['Yemek öğreniyor', 'Türkçe pratik yapıyor', 'Para kazanıyor'],
        correctIndex: 1,
        explanation: '"Onunla Türkçe konuşuyorum... çünkü pratik yapıyorum."',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Yeni komşular Türkiye’den gelmiş.',
        correctIndex: 0,
        explanation: '"O Türkiye\'den gelmiş." — to‘g‘ri.',
      },
      {
        kind: 'SHORT_ANSWER',
        prompt: 'Komşunun adı ne?',
        correctText: ['Ayşe', 'Ayşe Hanım'],
        explanation: '"Komşumuzun adı Ayşe Hanım."',
      },
    ],
  },

  // ───────────────────────── B1 ─────────────────────────
  {
    slug: 'sosyal-medya-ve-zaman',
    title: 'Sosyal Medya ve Zaman',
    level: 'B1',
    topic: 'texnologiya',
    body: `Telefonumu elime aldığımda sadece bir mesaja bakmak istiyorum. Ama yarım saat sonra hâlâ ekrana bakıyorum. Bu durum sanırım çoğumuzun başına geliyor.

Geçen ay küçük bir deney yaptım: telefonumda günde ne kadar zaman geçirdiğimi ölçtüm. Sonuç beni şaşırttı — günde yaklaşık üç buçuk saat. Haftada yirmi dört saat, yani tam bir gün.

Bu süreyi tamamen boşa harcanmış saymıyorum; arkadaşlarımla iletişim kuruyorum, haberleri takip ediyorum. Ancak dürüst olmak gerekirse bu zamanın büyük bölümü amaçsız geçiyor.

Şimdi iki kural koydum. Birincisi, sabah kalkınca ilk yarım saat telefona bakmıyorum. İkincisi, ders çalışırken telefonu başka odaya bırakıyorum.

İki haftadır bu kurallara uyuyorum. Telefonu tamamen bıraktım diyemem ama en azından zamanı ben yönetiyorum, telefon beni değil.`,
    bodyUz: `Telefonimni qo'limga olganimda faqat bitta xabarga qaramoqchi bo'laman. Lekin yarim soatdan keyin hamon ekranga qarab turaman. Bu holat, menimcha, ko'pchiligimizning boshimizga tushadi.

O'tgan oy kichik tajriba o'tkazdim: telefonimda kuniga qancha vaqt o'tkazishimni o'lchadim. Natija meni hayratda qoldirdi — kuniga taxminan uch yarim soat. Haftasiga yigirma to'rt soat, ya'ni to'liq bir kun.

Bu vaqtni butunlay behuda sarflangan deb hisoblamayman; do'stlarim bilan muloqot qilaman, yangiliklarni kuzataman. Lekin rostini aytganda, bu vaqtning katta qismi maqsadsiz o'tadi.

Endi ikkita qoida qo'ydim. Birinchisi, ertalab turganimda birinchi yarim soat telefonga qaramayman. Ikkinchisi, dars qilayotganda telefonni boshqa xonaga qo'yaman.

Ikki haftadirki shu qoidalarga amal qilyapman. Telefonni butunlay tashladim deya olmayman, lekin hech bo'lmaganda vaqtni men boshqaryapman, telefon meni emas.`,
    glossary: [
      ['başına gelmek', 'boshiga tushmoq'],
      ['deney', 'tajriba'],
      ['ölçmek', "o'lchamoq"],
      ['şaşırtmak', 'hayratda qoldirmoq'],
      ['boşa harcamak', 'behuda sarflamoq'],
      ['iletişim kurmak', 'muloqot qilmoq'],
      ['dürüst olmak gerekirse', 'rostini aytganda'],
      ['amaçsız', 'maqsadsiz'],
      ['kurala uymak', 'qoidaga amal qilmoq'],
      ['en azından', "hech bo'lmaganda"],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yazar deneyinde ne ölçtü?',
        options: [
          'Kaç mesaj gönderdiğini',
          'Telefonda günde ne kadar zaman geçirdiğini',
          'Kaç arkadaşı olduğunu',
        ],
        correctIndex: 1,
        explanation: '"telefonumda günde ne kadar zaman geçirdiğimi ölçtüm."',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yazarın koyduğu kurallardan biri hangisi?',
        options: [
          'Telefonu tamamen satmak',
          'Ders çalışırken telefonu başka odaya bırakmak',
          'Sosyal medyayı silmek',
        ],
        correctIndex: 1,
        explanation: '"ders çalışırken telefonu başka odaya bırakıyorum."',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Yazar telefonda geçen zamanın tamamını boşa harcanmış sayıyor.',
        correctIndex: 1,
        explanation: '"Bu süreyi tamamen boşa harcanmış saymıyorum" — butunlay behuda deb hisoblamaydi.',
      },
      {
        kind: 'SHORT_ANSWER',
        prompt: 'Yazar günde telefonda yaklaşık kaç saat geçiriyormuş?',
        correctText: ['üç buçuk', '3,5', '3.5', 'üç buçuk saat'],
        explanation: '"günde yaklaşık üç buçuk saat."',
      },
    ],
  },
  {
    slug: 'is-gorusmesi',
    title: 'İş Görüşmesi',
    level: 'B1',
    topic: 'ish',
    body: `Üniversiteyi bitirdikten sonra ilk iş görüşmeme gittim. Çok heyecanlıydım.

Görüşmeden bir gün önce şirket hakkında bilgi topladım: ne iş yapıyorlar, kaç çalışanları var, hangi projeleri tamamlamışlar. Bu hazırlık bana çok yardımcı oldu.

Görüşmede müdür bana neden bu işi istediğimi sordu. "Para için" demedim; bunun yerine insanlarla çalışmayı sevdiğimi ve bu alanda gelişmek istediğimi anlattım.

Sonra zayıf yönümü sordu. Bu zor bir soruydu. Dürüst davrandım: "Bazen bir işi mükemmel yapmaya çalışırken geç kalıyorum. Şimdi önce bitirmeyi, sonra geliştirmeyi öğreniyorum."

İki gün sonra beni aradılar. İşe kabul edilmiştim. O gün şunu anladım: hazırlık yapmak ve dürüst olmak, güzel konuşmaktan daha önemli.`,
    bodyUz: `Universitetni tugatganimdan keyin birinchi ish suhbatimga bordim. Juda hayajonlangan edim.

Suhbatdan bir kun oldin kompaniya haqida ma'lumot to'pladim: nima ish qilishadi, nechta xodimi bor, qanday loyihalarni tugatishgan. Bu tayyorgarlik menga juda yordam berdi.

Suhbatda rahbar mendan nega bu ishni istashimni so'radi. "Pul uchun" demadim; buning o'rniga odamlar bilan ishlashni yoqtirishimni va bu sohada rivojlanmoqchi ekanimni aytdim.

Keyin zaif tomonimni so'radi. Bu qiyin savol edi. Rostini aytdim: "Ba'zan ishni mukammal qilishga urinib, kechikib qolaman. Hozir avval tugatishni, keyin yaxshilashni o'rganyapman."

Ikki kundan keyin menga qo'ng'iroq qilishdi. Ishga qabul qilingan ekanman. O'sha kuni shuni tushundim: tayyorgarlik ko'rish va halol bo'lish — chiroyli gapirishdan muhimroq.`,
    glossary: [
      ['iş görüşmesi', 'ish suhbati'],
      ['bilgi toplamak', "ma'lumot to'plamoq"],
      ['çalışan', 'xodim'],
      ['bunun yerine', "buning o'rniga"],
      ['gelişmek', 'rivojlanmoq'],
      ['zayıf yön', 'zaif tomon'],
      ['dürüst davranmak', 'halol bo‘lmoq'],
      ['mükemmel', 'mukammal'],
      ['kabul edilmek', 'qabul qilinmoq'],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yazar görüşmeden önce ne yaptı?',
        options: [
          'Yeni kıyafet aldı',
          'Şirket hakkında bilgi topladı',
          'Arkadaşlarıyla konuştu',
        ],
        correctIndex: 1,
        explanation: '"Görüşmeden bir gün önce şirket hakkında bilgi topladım."',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yazar “neden bu işi istiyorsun?” sorusuna ne cevap verdi?',
        options: [
          'Para kazanmak istediğini',
          'İnsanlarla çalışmayı sevdiğini ve gelişmek istediğini',
          'Başka iş bulamadığını',
        ],
        correctIndex: 1,
        explanation: '"insanlarla çalışmayı sevdiğimi ve bu alanda gelişmek istediğimi anlattım."',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Yazar zayıf yönünü gizledi.',
        correctIndex: 1,
        explanation: '"Dürüst davrandım" — zaif tomonini ochiq aytdi.',
      },
      {
        kind: 'SHORT_ANSWER',
        prompt: 'Yazara göre güzel konuşmaktan daha önemli olan nedir?',
        correctText: ['hazırlık yapmak ve dürüst olmak', 'hazırlık ve dürüstlük', 'tayyorgarlik va halollik'],
        explanation: '"hazırlık yapmak ve dürüst olmak, güzel konuşmaktan daha önemli."',
      },
    ],
  },
  {
    slug: 'kitap-mi-film-mi',
    title: 'Kitap mı, Film mi?',
    level: 'B1',
    topic: 'madaniyat',
    body: `Sevdiğim bir kitap filme çevrildiğinde hep aynı soruyu soruyorum: acaba izlemeli miyim?

Film iki saatte bitiyor, kitap ise bir haftamı alıyor. Bu yüzden film daha kolay görünüyor. Ancak kolay olan her zaman daha iyi değil.

Kitapta karakterin ne düşündüğünü okuyoruz. Filmde ise sadece yüzünü görüyoruz; gerisini biz tahmin ediyoruz. İyi bir oyuncu bunu başarabilir, ama her zaman değil.

Öte yandan filmin kendine göre güçlü yanları var. Müzik, renk ve mekân, kelimelerle anlatılması zor olan bir atmosfer kuruyor.

Bence ikisi farklı iki sanat. Aynı hikâyeyi anlatsalar bile aynı şeyi yapmıyorlar. Bu yüzden "kitap daha iyiydi" demek çoğu zaman haksızlık oluyor.`,
    bodyUz: `Yaxshi ko'rgan kitobim filmga aylantirilganda doim bir savolni beraman: ko'rsam bo'ladimikan?

Film ikki soatda tugaydi, kitob esa bir haftamni oladi. Shuning uchun film osonroq ko'rinadi. Lekin oson bo'lgan narsa doim ham yaxshiroq emas.

Kitobda qahramon nima o'ylayotganini o'qiymiz. Filmda esa faqat yuzini ko'ramiz; qolganini biz taxmin qilamiz. Yaxshi aktyor buni uddalashi mumkin, lekin doim emas.

Boshqa tomondan, filmning o'ziga xos kuchli tomonlari bor. Musiqa, rang va makon — so'z bilan tasvirlash qiyin bo'lgan muhit yaratadi.

Menimcha, ikkisi ikki xil san'at. Bir xil hikoyani aytsa ham, bir xil ishni qilmaydi. Shuning uchun "kitob yaxshiroq edi" deyish ko'pincha nohaqlik bo'ladi.`,
    glossary: [
      ['filme çevrilmek', 'filmga aylantirilmoq'],
      ['acaba', 'ajabo, -mikan'],
      ['bu yüzden', 'shuning uchun'],
      ['tahmin etmek', 'taxmin qilmoq'],
      ['başarmak', 'uddalamoq'],
      ['öte yandan', 'boshqa tomondan'],
      ['mekân', 'makon, joy'],
      ['atmosfer kurmak', 'muhit yaratmoq'],
      ['haksızlık', 'nohaqlik'],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yazara göre kitabın güçlü yanı nedir?',
        options: [
          'Daha kısa sürmesi',
          'Karakterin ne düşündüğünü gösterebilmesi',
          'Müzik kullanabilmesi',
        ],
        correctIndex: 1,
        explanation: '"Kitapta karakterin ne düşündüğünü okuyoruz."',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Filmin güçlü yanı olarak ne gösteriliyor?',
        options: [
          'Müzik, renk ve mekânla atmosfer kurması',
          'Daha ucuz olması',
          'Daha çok karakter içermesi',
        ],
        correctIndex: 0,
        explanation: '"Müzik, renk ve mekân ... bir atmosfer kuruyor."',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Yazar “kitap her zaman daha iyidir” diyor.',
        correctIndex: 1,
        explanation: '"‘kitap daha iyiydi’ demek çoğu zaman haksızlık oluyor." — aksincha.',
      },
      {
        kind: 'SHORT_ANSWER',
        prompt: 'Yazar kitap ve filmi nasıl tanımlıyor?',
        correctText: ['farklı iki sanat', 'iki farklı sanat', 'ikki xil san‘at'],
        explanation: '"Bence ikisi farklı iki sanat."',
      },
    ],
  },

  // ───────────────────────── B2 ─────────────────────────
  {
    slug: 'yapay-zeka-ve-ogrenme',
    title: 'Yapay Zekâ ve Öğrenme',
    level: 'B2',
    topic: 'texnologiya',
    body: `Yapay zekâ araçları dil öğrenenlerin hayatına hızla girdi. Bir cümleyi saniyeler içinde çeviren, hata düzelten, hatta sohbet eden programlar artık herkesin telefonunda.

Bu araçların faydası tartışılmaz. Önceden bir kelimenin anlamını bulmak için sözlük karıştırmak gerekiyordu; şimdi cevap anında geliyor. Utangaç bir öğrenci, insanların önünde konuşmaya cesaret edemese bile, makineyle rahatça pratik yapabiliyor.

Ancak kolaylığın bir bedeli var. Beyin, zorlandığı zaman öğrenir. Bir kelimeyi hatırlamaya çalışırken geçen o birkaç saniye, aslında öğrenmenin ta kendisidir. Cevabı hemen alırsak bu süreç hiç başlamaz.

Burada belirleyici olan araç değil, kullanım biçimidir. Çeviriyi önce kendin yap, sonra kontrol ettir. Metni önce kendin oku, anlamadığın yeri sonra sor. Yani makineyi cevap veren değil, kontrol eden bir arkadaş gibi kullan.

Sonuçta yapay zekâ öğretmenin yerini almıyor. Öğretmen sadece bilgi aktarmaz; ne zaman zorlaman, ne zaman dinlenmen gerektiğini de bilir. Bunu henüz hiçbir program yapamıyor.`,
    bodyUz: `Sun'iy intellekt vositalari til o'rganuvchilar hayotiga tez kirib keldi. Jumlani soniyalarda tarjima qiladigan, xatoni to'g'rilaydigan, hatto suhbatlashadigan dasturlar endi hammaning telefonida.

Bu vositalarning foydasi shubhasiz. Ilgari so'zning ma'nosini topish uchun lug'at titkilash kerak edi; hozir javob bir zumda keladi. Uyatchan o'quvchi odamlar oldida gapirishga jur'at eta olmasa ham, mashina bilan bemalol mashq qila oladi.

Lekin qulaylikning narxi bor. Miya qiynalganda o'rganadi. So'zni eslashga urinib o'tgan o'sha bir necha soniya — aslida o'rganishning o'zi. Javobni darhol olsak, bu jarayon umuman boshlanmaydi.

Bu yerda hal qiluvchi narsa vosita emas, uni ishlatish usuli. Tarjimani avval o'zing qil, keyin tekshirtir. Matnni avval o'zing o'qi, tushunmagan joyingni keyin so'ra. Ya'ni mashinani javob beradigan emas, tekshiradigan do'st sifatida ishlat.

Oxir-oqibat sun'iy intellekt o'qituvchining o'rnini bosmaydi. O'qituvchi faqat bilim uzatmaydi; qachon qiynalishing, qachon dam olishing kerakligini ham biladi. Buni hali hech bir dastur qila olmaydi.`,
    glossary: [
      ['yapay zekâ', "sun'iy intellekt"],
      ['tartışılmaz', 'shubhasiz'],
      ['sözlük karıştırmak', 'lug‘at titkilamoq'],
      ['utangaç', 'uyatchan'],
      ['cesaret etmek', "jur'at etmoq"],
      ['bedel', 'narx, evaz'],
      ['ta kendisi', "aynan o'zi"],
      ['belirleyici', 'hal qiluvchi'],
      ['kullanım biçimi', 'ishlatish usuli'],
      ['yerini almak', "o'rnini bosmoq"],
      ['bilgi aktarmak', 'bilim uzatmoq'],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yazara göre beyin ne zaman öğrenir?',
        options: ['Cevabı hemen aldığında', 'Zorlandığı zaman', 'Dinlendiği zaman'],
        correctIndex: 1,
        explanation: '"Beyin, zorlandığı zaman öğrenir."',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yazarın önerdiği kullanım biçimi hangisi?',
        options: [
          'Önce kendin yap, sonra kontrol ettir',
          'Her şeyi makineye yaptır',
          'Makineyi hiç kullanma',
        ],
        correctIndex: 0,
        explanation: '"Çeviriyi önce kendin yap, sonra kontrol ettir."',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Yazara göre yapay zekâ öğretmenin yerini alacak.',
        correctIndex: 1,
        explanation: '"yapay zekâ öğretmenin yerini almıyor."',
      },
      {
        kind: 'SHORT_ANSWER',
        prompt: 'Yazara göre öğretmen bilgi aktarmaktan başka ne biliyor?',
        correctText: [
          'ne zaman zorlaman ne zaman dinlenmen gerektiğini',
          'ne zaman zorlanman gerektiğini',
          'qachon qiynalish va dam olish kerakligini',
        ],
        explanation: '"ne zaman zorlaman, ne zaman dinlenmen gerektiğini de bilir."',
      },
    ],
  },
  {
    slug: 'sehirde-yesil-alan',
    title: 'Şehirde Yeşil Alan',
    level: 'B2',
    topic: 'shahar',
    body: `Son yıllarda şehirler hızla büyüyor. Yeni binalar yükseliyor, yollar genişliyor. Bu gelişme kaçınılmaz görünüyor; ancak büyüme planlanmadığında ilk kaybedilen şey genellikle yeşil alan oluyor.

Bir parkın değeri sadece güzel görünmesinden ibaret değildir. Ağaçlar yazın havayı serinletir, tozu tutar, gürültüyü azaltır. Üstelik yapılan gözlemler, yeşil alana yakın oturan insanların kendilerini daha az stresli hissettiğine işaret ediyor.

Buna rağmen park yapmak çoğu zaman öncelik listesinin sonunda kalır. Sebebi anlaşılır: bir park kısa vadede gelir getirmez, bir iş merkezi getirir. Kararı verenler genellikle bugünün bütçesine bakar, yirmi yıl sonrasına değil.

Çözüm, yeşil alanı lüks değil altyapı saymaktan geçiyor. Nasıl ki bir mahalleye su borusu çekmek zorunluysa, belli bir büyüklükte park ayırmak da zorunlu olmalı.

Bu, şehirleşmeyi durdurmak anlamına gelmez. Tam tersine, şehrin uzun süre yaşanabilir kalmasını sağlar.`,
    bodyUz: `So'nggi yillarda shaharlar tez o'sib boryapti. Yangi binolar qad rostlayapti, yo'llar kengaymoqda. Bu rivojlanish muqarrar ko'rinadi; lekin o'sish rejalashtirilmaganda birinchi yo'qotiladigan narsa odatda yashil maydon bo'ladi.

Bog'ning qiymati faqat chiroyli ko'rinishidan iborat emas. Daraxtlar yozda havoni salqinlatadi, changni ushlab qoladi, shovqinni kamaytiradi. Bundan tashqari, olib borilgan kuzatuvlar yashil maydonga yaqin yashaydigan odamlar o'zini kamroq zo'riqqan his qilishiga ishora qiladi.

Shunga qaramay, bog' qurish ko'pincha ustuvorliklar ro'yxatining oxirida qoladi. Sababi tushunarli: bog' qisqa muddatda daromad keltirmaydi, biznes markaz esa keltiradi. Qaror qabul qiluvchilar odatda bugungi byudjetga qaraydi, yigirma yildan keyingisiga emas.

Yechim — yashil maydonni hashamat emas, infratuzilma deb hisoblashdan o'tadi. Mahallaga suv quvuri tortish majburiy bo'lgani kabi, ma'lum hajmda bog' ajratish ham majburiy bo'lishi kerak.

Bu shaharlashuvni to'xtatish degani emas. Aksincha, shaharning uzoq vaqt yashashga yaroqli bo'lib qolishini ta'minlaydi.`,
    glossary: [
      ['yeşil alan', 'yashil maydon'],
      ['kaçınılmaz', 'muqarrar'],
      ['ibaret olmak', 'iborat bo‘lmoq'],
      ['serinletmek', 'salqinlatmoq'],
      ['gözlem', 'kuzatuv'],
      ['işaret etmek', 'ishora qilmoq'],
      ['buna rağmen', 'shunga qaramay'],
      ['öncelik', 'ustuvorlik'],
      ['kısa vadede', 'qisqa muddatda'],
      ['altyapı', 'infratuzilma'],
      ['tam tersine', 'aksincha'],
      ['yaşanabilir', 'yashashga yaroqli'],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Metne göre ağaçların faydalarından biri nedir?',
        options: ['Gelir getirmesi', 'Gürültüyü azaltması', 'Yol genişletmesi'],
        correctIndex: 1,
        explanation: '"Ağaçlar yazın havayı serinletir, tozu tutar, gürültüyü azaltır."',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Park yapmak neden öncelik listesinin sonunda kalıyor?',
        options: [
          'İnsanlar park istemiyor',
          'Kısa vadede gelir getirmiyor',
          'Ağaç bulmak zor',
        ],
        correctIndex: 1,
        explanation: '"bir park kısa vadede gelir getirmez, bir iş merkezi getirir."',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Yazar şehirleşmenin tamamen durdurulmasını savunuyor.',
        correctIndex: 1,
        explanation: '"Bu, şehirleşmeyi durdurmak anlamına gelmez."',
      },
      {
        kind: 'SHORT_ANSWER',
        prompt: 'Yazar yeşil alanı ne olarak görmeyi öneriyor?',
        correctText: ['altyapı', 'altyapı olarak', 'infratuzilma'],
        explanation: '"yeşil alanı lüks değil altyapı saymaktan geçiyor."',
      },
    ],
  },

  // ───────────────────────── C1 ─────────────────────────
  {
    slug: 'anadil-ve-dusunce',
    title: 'Ana Dil ve Düşünce',
    level: 'C1',
    topic: 'tilshunoslik',
    body: `Konuştuğumuz dil, düşünme biçimimizi ne ölçüde belirler? Bu soru dil bilimcileri uzun süredir meşgul ediyor ve verilen cevaplar zaman içinde epeyce değişti.

Yirminci yüzyılın ortalarında yaygın olan güçlü görüşe göre dil, düşünceyi âdeta kalıba döküyordu: bir kavramın karşılığı dilinizde yoksa o kavramı düşünmeniz de güçleşirdi. Bu yaklaşım sonraki araştırmalarda büyük ölçüde zayıfladı; çünkü insanlar, dillerinde adı bulunmayan ayrımları da rahatlıkla fark edebiliyordu.

Bugün daha ölçülü bir çerçeve kabul görüyor. Dil düşünceyi belirlemiyor, ancak dikkatimizi yönlendiriyor. Örneğin bazı dillerde fiil, olayın kaynağını belirtmeyi zorunlu kılar: bilgiyi kendiniz mi gördünüz, yoksa birinden mi duydunuz? Böyle bir dili konuşan kişi, farkında olmadan bu ayrımı sürekli takip etmek durumunda kalır.

Yabancı dil öğrenmenin değeri de tam burada ortaya çıkıyor. Yeni bir dil, yalnızca yeni kelimeler değil, dünyayı bölmenin yeni bir yolunu getirir. Ana dilinde doğal, hatta zorunlu görünen bir ayrımın başka bir dilde hiç bulunmadığını görmek, insana kendi düşünce alışkanlıklarını dışarıdan bakma imkânı verir.

Bu nedenle dil öğrenmeyi yalnızca iletişim aracı edinmek olarak tanımlamak eksik kalır. Öğrenen kişi, aynı zamanda kendi zihninin varsayımlarını gözden geçirme fırsatı bulur.`,
    bodyUz: `Gapiradigan tilimiz fikrlash tarzimizni qay darajada belgilaydi? Bu savol tilshunoslarni uzoq vaqtdan beri band qilib keladi va berilgan javoblar vaqt o'tishi bilan ancha o'zgardi.

Yigirmanchi asr o'rtalarida keng tarqalgan kuchli qarashga ko'ra, til fikrni go'yo qolipga solardi: tushunchaning muqobili tilingizda bo'lmasa, o'sha tushunchani o'ylash ham qiyinlashardi. Bu yondashuv keyingi tadqiqotlarda ancha zaiflashdi; chunki odamlar tilida nomi yo'q farqlarni ham bemalol sezа olardi.

Bugun o'lchovliroq qarash qabul qilinmoqda. Til fikrni belgilamaydi, lekin e'tiborimizni yo'naltiradi. Masalan, ba'zi tillarda fe'l voqeaning manbasini ko'rsatishni majburiy qiladi: ma'lumotni o'zingiz ko'rdingizmi yoki kimdandir eshitdingizmi? Bunday tilda gapiradigan odam, o'zi sezmagan holda bu farqni doim kuzatishga majbur bo'ladi.

Chet tili o'rganishning qiymati ham aynan shu yerda ko'rinadi. Yangi til faqat yangi so'zlarni emas, dunyoni bo'lishning yangi usulini olib keladi. Ona tilida tabiiy, hatto majburiy ko'ringan farq boshqa tilda umuman yo'qligini ko'rish — insonga o'z fikrlash odatlariga tashqaridan qarash imkonini beradi.

Shu sababli til o'rganishni faqat muloqot vositasini egallash deb ta'riflash kamchilikdir. O'rganuvchi ayni paytda o'z ongining dastlabki taxminlarini qayta ko'rib chiqish imkoniga ega bo'ladi.`,
    glossary: [
      ['ne ölçüde', 'qay darajada'],
      ['meşgul etmek', 'band qilmoq'],
      ['epeyce', 'ancha'],
      ['kalıba dökmek', 'qolipga solmoq'],
      ['karşılık', 'muqobil'],
      ['güçleşmek', 'qiyinlashmoq'],
      ['büyük ölçüde', 'ancha, katta darajada'],
      ['ölçülü', "o'lchovli, mo'tadil"],
      ['çerçeve', 'doira, qarash'],
      ['yönlendirmek', "yo'naltirmoq"],
      ['zorunlu kılmak', 'majburiy qilmoq'],
      ['farkında olmadan', "o'zi sezmagan holda"],
      ['varsayım', 'taxmin, farazy'],
      ['gözden geçirmek', 'qayta ko‘rib chiqmoq'],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yirminci yüzyıl ortasındaki “güçlü görüş” neyi savunuyordu?',
        options: [
          'Dilin düşünceyi âdeta kalıba döktüğünü',
          'Dilin düşünceyle hiç ilgisi olmadığını',
          'Herkesin aynı şekilde düşündüğünü',
        ],
        correctIndex: 0,
        explanation: '"dil, düşünceyi âdeta kalıba döküyordu" — kuchli qarash shunday edi.',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Bugün kabul gören “ölçülü çerçeve” ne diyor?',
        options: [
          'Dil düşünceyi tamamen belirler',
          'Dil düşünceyi belirlemez ama dikkati yönlendirir',
          'Dil sadece kelimelerden ibarettir',
        ],
        correctIndex: 1,
        explanation: '"Dil düşünceyi belirlemiyor, ancak dikkatimizi yönlendiriyor."',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Metne göre güçlü görüş sonraki araştırmalarla doğrulandı.',
        correctIndex: 1,
        explanation: '"Bu yaklaşım sonraki araştırmalarda büyük ölçüde zayıfladı."',
      },
      {
        kind: 'SHORT_ANSWER',
        prompt: 'Yazara göre yeni bir dil, kelimelerden başka ne getirir?',
        correctText: [
          'dünyayı bölmenin yeni bir yolunu',
          'dünyayı bölmenin yeni yolu',
          'dunyoni bo‘lishning yangi usulini',
        ],
        explanation: '"Yeni bir dil, yalnızca yeni kelimeler değil, dünyayı bölmenin yeni bir yolunu getirir."',
      },
    ],
  },
];

// KINO, SERIAL VA MUSIQA — boshlang'ich to'plam.
//
// QOIDA: faqat huquq egasining RASMIY kanali. Har bir yozuvning kanali
// tekshirilgan (kanal nomi, @handle va obunachilar soni bo'yicha):
//   • TRT 1, TRT Çocuk, TRT Arşiv, TRT Müzik — davlat telekanali kanallari
//   • @seksenlertrt, @kalkgidelimtrt — TRT seriallarining kanallari
//   • ARZU FİLM — Hababam Sınıfı va Kemal Sunal filmlarining prodyuseri
//   • Düşyeri — Pepee multfilmining ishlab chiqaruvchisi
//   • Tarkan, Sezen Aksu — ijrochilarning o'z kanallari
//
// Video ID lar o'ylab topilmagan: hammasi YouTube/vidIQ sahifalaridan.
// Sayt baribir har birini YouTube'ning o'zidan qayta tekshiradi (oEmbed):
// o'chirilgan yoki embed taqiqlangan bo'lsa — avtomatik yashiriladi.
//
// "UU..." — kanalning barcha videolari pleylisti (UC... kanal ID dan).
// Yangi qo'shish uchun admin panelidagi "Kino va musiqa" bo'limi qulayroq.

export interface MediaSeed {
  key: string;
  kind: 'SERIES' | 'FILM' | 'MUSIC' | 'KIDS' | 'LESSON';
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | null;
  title: string;
  videoId?: string;
  playlistId?: string;
  /** O'zbekcha tavsif */
  uz: string;
  ru: string;
  en: string;
  tr: string;
}

export const mediaSeeds: MediaSeed[] = [
  // ── Bolalar uchun: A1 uchun eng yaxshi boshlanish ──
  {
    key: 'pepee', kind: 'KIDS', level: 'A1', title: 'Pepee', playlistId: 'PLa6oxKxA7YkgCd4jX5fHARVwE6lz0Zwh9',
    uz: "Eng kichiklar uchun multfilm: oddiy so'zlar, sekin va aniq nutq, qo'shiqlar. A1 uchun ideal boshlanish.",
    ru: 'Мультфильм для самых маленьких: простые слова, медленная и чёткая речь, песенки. Идеальный старт для A1.',
    en: 'A cartoon for little ones: simple words, slow and clear speech, songs. A perfect start for A1.',
    tr: 'Küçükler için çizgi film: basit kelimeler, yavaş ve net konuşma, şarkılar. A1 için ideal başlangıç.',
  },
  {
    key: 'trt-cocuk', kind: 'KIDS', level: 'A2', title: 'TRT Çocuk', playlistId: 'UUrFf5dtMe6M1XJHqbKJ4X6Q',
    uz: "Rafadan Tayfa, Pırıl va boshqa turk multfilmlari — TRT Çocuk rasmiy kanali. Kundalik so'zlar va jonli bolalar tili.",
    ru: 'Rafadan Tayfa, Pırıl и другие турецкие мультфильмы — официальный канал TRT Çocuk. Бытовая лексика и живая детская речь.',
    en: 'Rafadan Tayfa, Pırıl and other Turkish cartoons — the official TRT Çocuk channel. Everyday words and lively speech.',
    tr: "Rafadan Tayfa, Pırıl ve diğer çizgi filmler — TRT Çocuk'un resmî kanalı. Günlük kelimeler, canlı çocuk dili.",
  },

  // ── Seriallar ──
  {
    key: 'seksenler', kind: 'SERIES', level: 'B1', title: 'Seksenler', playlistId: 'UUYRPB4TbD2RYHlIQdLgEeYA',
    uz: "1980-yillar Turkiyasidagi oilaviy komediya (TRT 1). Qisqa sahnalar, kundalik suhbat va hazil — tinglab tushunish uchun qulay.",
    ru: 'Семейная комедия о Турции 1980-х (TRT 1). Короткие сцены, бытовые диалоги и юмор — удобно для аудирования.',
    en: 'A family comedy set in 1980s Türkiye (TRT 1). Short scenes, everyday dialogue and humour — great for listening.',
    tr: "1980'lerin Türkiye'sinde geçen aile komedisi (TRT 1). Kısa sahneler, günlük konuşma ve mizah.",
  },
  {
    key: 'kalk-gidelim', kind: 'SERIES', level: 'B1', title: 'Kalk Gidelim', playlistId: 'UUPmSyW1AYTY4DJX-3_2diRQ',
    uz: "Qishloq hayoti haqidagi iliq komediya serial (TRT 1). Sodda dialoglar, Anado'lu so'zlashuvi.",
    ru: 'Тёплая комедия о деревенской жизни (TRT 1). Простые диалоги, разговорная речь Анатолии.',
    en: 'A warm comedy about village life (TRT 1). Simple dialogue and everyday Anatolian speech.',
    tr: 'Köy hayatını anlatan sıcak bir komedi dizisi (TRT 1). Sade diyaloglar, Anadolu konuşması.',
  },
  {
    key: 'trt1', kind: 'SERIES', level: 'B2', title: 'TRT 1', playlistId: 'UUvFudBDDILdDljN4VIZ4Msw',
    uz: "TRT 1 telekanalining rasmiy kanali: mashhur seriallardan qismlar va sahnalar. B2 dan yuqori uchun.",
    ru: 'Официальный канал TRT 1: серии и сцены из популярных сериалов. Для уровня B2 и выше.',
    en: "TRT 1's official channel: episodes and scenes from popular series. For B2 and above.",
    tr: "TRT 1'in resmî kanalı: sevilen dizilerden bölümler ve sahneler. B2 ve üstü için.",
  },

  // ── Kinolar ──
  {
    key: 'hababam-sinifta-kaldi', kind: 'FILM', level: 'B1', title: 'Hababam Sınıfı Sınıfta Kaldı', videoId: 'fMFJpipLV08',
    uz: "Turk kinosining eng sevimli komediyalaridan biri (Kemal Sunal). Prodyuserning rasmiy, qayta tiklangan 4K nusxasi.",
    ru: 'Одна из самых любимых турецких комедий (Кемаль Сунал). Официальная отреставрированная 4K-версия от продюсера.',
    en: 'One of the best-loved Turkish comedies (Kemal Sunal). The producer’s official restored 4K version.',
    tr: 'Türk sinemasının en sevilen komedilerinden (Kemal Sunal). Yapımcının resmî, restore edilmiş 4K kopyası.',
  },
  {
    key: 'arzu-film', kind: 'FILM', level: 'B1', title: 'ARZU FİLM — Yeşilçam', playlistId: 'UUUALYmnkEmx8vlxIbpr2gmw',
    uz: "Kemal Sunal, Şener Şen va boshqa klassik turk filmlari — huquq egasi Arzu Film'ning rasmiy kanali.",
    ru: 'Кемаль Сунал, Шенер Шен и другая турецкая классика — официальный канал правообладателя Arzu Film.',
    en: 'Kemal Sunal, Şener Şen and other Turkish classics — the official channel of rights holder Arzu Film.',
    tr: "Kemal Sunal, Şener Şen ve diğer Yeşilçam klasikleri — hak sahibi Arzu Film'in resmî kanalı.",
  },
  {
    key: 'trt-arsiv', kind: 'FILM', level: 'B2', title: 'TRT Arşiv', playlistId: 'UUQkPrgNhhdOJR3OzTdWd5lQ',
    uz: "Turk televideniyesining oltin arxivi: eski filmlar, konsertlar va ko'rsatuvlar.",
    ru: 'Золотой архив турецкого телевидения: старые фильмы, концерты и передачи.',
    en: 'The golden archive of Turkish television: classic films, concerts and shows.',
    tr: 'Türk televizyonunun altın arşivi: eski filmler, konserler ve programlar.',
  },

  // ── Musiqa ──
  {
    key: 'tarkan-simarik', kind: 'MUSIC', level: 'A2', title: 'Tarkan — Şımarık', videoId: 'cpp69ghR1IM',
    uz: "Dunyoga mashhur bo'lgan turk qo'shig'i. Ko'p takrorlanadigan oddiy so'zlar — eshitib yodlash oson.",
    ru: 'Турецкая песня, ставшая хитом во всём мире. Простые повторяющиеся слова — легко запомнить на слух.',
    en: 'The Turkish song that became a worldwide hit. Simple, repeated words — easy to learn by ear.',
    tr: 'Dünyaca ünlü Türkçe şarkı. Tekrarlanan basit kelimeler — dinleyerek öğrenmesi kolay.',
  },
  {
    key: 'sezen-aksu', kind: 'MUSIC', level: 'B1', title: 'Sezen Aksu', playlistId: 'UU6OI7Crv96jgra5pwJNDFRQ',
    uz: "Turk estradasining \"malikasi\". Toza talaffuz va she'riy til — so'z boyligi uchun.",
    ru: '«Королева» турецкой эстрады. Чистое произношение и поэтичный язык — для словарного запаса.',
    en: 'The "queen" of Turkish pop. Clear pronunciation and poetic language — great for vocabulary.',
    tr: 'Türk pop müziğinin "minik serçesi". Temiz telaffuz ve şiirsel dil.',
  },
  {
    key: 'trt-muzik', kind: 'MUSIC', level: 'A2', title: 'TRT Müzik', playlistId: 'UUA9hDdBlGptiL0eUftorgHg',
    uz: "Turk xalq va estrada qo'shiqlari — TRT'ning rasmiy musiqa kanali.",
    ru: 'Турецкие народные и эстрадные песни — официальный музыкальный канал TRT.',
    en: "Turkish folk and pop songs — TRT's official music channel.",
    tr: "Türk halk ve pop şarkıları — TRT'nin resmî müzik kanalı.",
  },

  // ── Video darslar ──
  {
    key: 'yunus-emre-enstitusu', kind: 'LESSON', level: 'A1', title: 'Yunus Emre Enstitüsü', playlistId: 'UU_c9BKdZSfMwavx2FH4cWsA',
    uz: "Turkiyaning rasmiy til instituti: turk tili va madaniyati bo'yicha videolar. \"Yedi İklim\" darsligining mualliflari.",
    ru: 'Официальный языковой институт Турции: видео о турецком языке и культуре. Авторы учебника «Yedi İklim».',
    en: "Türkiye's official language institute: videos on Turkish language and culture. Authors of the Yedi İklim textbook.",
    tr: 'Türkiye’nin resmî dil enstitüsü: Türkçe ve Türk kültürü videoları. Yedi İklim kitabının yayıncısı.',
  },
];

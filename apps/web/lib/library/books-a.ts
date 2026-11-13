// KUTUBXONA — A1 va A2 kitoblari.
//
// Hammasi Sanat Hoca Türkçe uchun yozilgan ORIGINAL hikoyalar: hech
// kimning kitobidan olinmagan, shuning uchun saytda to'liq ko'rsatish
// mumkin. Ustoz tekshiruvi tavsiya etiladi (docs/KONTENT.md).
//
// BELGI: matndagi [[so'z]] yoki [[shakl|kalit]] — lug'atdagi so'z.
// Bosilganda tarjimasi chiqadi. Kalit lug'atda bo'lishi SHART
// (scripts/check-library.ts tekshiradi).

import type { LibraryBook } from "./types";
import { g } from "./types";

export const BOOKS_A: LibraryBook[] = [
  // ════════════════════════════════════════════ A1
  {
    slug: "buharadan-istanbula",
    title: "Buhara'dan İstanbul'a",
    level: "A1",
    tone: "cobalt",
    blurb: {
      uz: "Buxorolik Aziz Istanbulga o'qishga boradi: yangi xona, yangi do'st, birinchi simit va Galata ko'prigi.",
      ru: "Азиз из Бухары едет учиться в Стамбул: новая комната, новый друг, первый симит и Галатский мост.",
      en: "Aziz from Bukhara goes to study in Istanbul: a new room, a new friend, his first simit and the Galata Bridge.",
      tr: "Buharalı Aziz, okumak için İstanbul'a gider: yeni oda, yeni arkadaş, ilk simit ve Galata Köprüsü.",
    },
    chapters: [
      {
        title: "Merhaba İstanbul",
        paragraphs: [
          "Benim adım Aziz. On dokuz yaşındayım. Özbekistanlıyım, Buharalıyım. Şimdi İstanbul'dayım. İstanbul çok büyük ve çok güzel bir [[şehir]]. Burada üniversitede Türkçe okuyorum.",
          "Benim küçük bir odam var. Oda [[yurtta|yurt]]. Yurt üniversiteye [[yakın]]. Odamda bir [[yatak]], bir masa ve bir sandalye var. [[Pencereden|pencere]] [[deniz]] görünüyor.",
          "[[Oda arkadaşımın|oda arkadaşı]] adı Emre. Emre Türk, İzmirli. Çok iyi bir çocuk. Her sabah bana \"Günaydın Aziz!\" diyor. Ben de \"Günaydın Emre!\" diyorum.",
          "Annem ve babam Buhara'da. Onları çok [[özlüyorum|özlemek]]. Her akşam annemi [[arıyorum|aramak]]. Annem soruyor: \"Oğlum, nasılsın? Yemek yiyor musun?\" Ben gülüyorum: \"İyiyim anne, [[merak etme]]!\"",
        ],
        glossary: [
          g("şehir", "shahar", "город", "city"),
          g("yurt", "yotoqxona", "общежитие", "dormitory"),
          g("yakın", "yaqin", "близко", "near"),
          g("yatak", "karavot", "кровать", "bed"),
          g("pencere", "deraza", "окно", "window"),
          g("deniz", "dengiz", "море", "sea"),
          g("oda arkadaşı", "xonadosh", "сосед по комнате", "roommate"),
          g("özlemek", "sog'inmoq", "скучать", "to miss"),
          g("aramak", "qo'ng'iroq qilmoq; qidirmoq", "звонить; искать", "to call; to look for"),
          g("merak etme", "xavotir olma", "не волнуйся", "don't worry"),
        ],
        questions: [
          { q: "Aziz nereli?", a: "Özbekistanlı, Buharalı." },
          { q: "Aziz'in oda arkadaşı kim?", a: "Emre. O, İzmirli." },
        ],
      },
      {
        title: "Simit ve Çay",
        paragraphs: [
          "Bugün cumartesi. Okul yok. Emre ve ben sabah erken [[kalkıyoruz|kalkmak]]. Emre diyor: \"Hadi, kahvaltıya gidelim!\"",
          "Yurdun [[yanında]] küçük bir kafe var. Biz bir masaya oturuyoruz. [[Garson]] geliyor: \"Hoş geldiniz! Ne alırsınız?\" Emre iki simit ve iki çay istiyor. Ben de peynir ve zeytin istiyorum.",
          "Simit sıcak ve çok [[lezzetli]]. Türk çayı küçük bir [[bardakta|bardak]] geliyor. Bardak [[ince]] ve çok güzel. Ben Emre'ye söylüyorum: \"Bizde de çay çok [[önemli]]. Ama biz çayı [[kâsede|kâse]] içiyoruz.\"",
          "Emre [[şaşırıyor|şaşırmak]]: \"Kâsede mi? Çok [[ilginç]]!\" [[Hesap]] gelince Emre [[ödemek]] istiyor. Ben \"Hayır, bugün ben ödüyorum,\" diyorum. Emre gülüyor: \"Tamam, ama yarın ben!\"",
        ],
        glossary: [
          g("kalkmak", "turmoq (o'rnidan)", "вставать", "to get up"),
          g("yanında", "yonida", "рядом с", "next to"),
          g("garson", "ofitsiant", "официант", "waiter"),
          g("lezzetli", "mazali", "вкусный", "delicious"),
          g("bardak", "stakan", "стакан", "glass"),
          g("ince", "ingichka, nozik", "тонкий", "thin, delicate"),
          g("önemli", "muhim", "важный", "important"),
          g("kâse", "piyola, kosa", "пиала", "bowl"),
          g("şaşırmak", "hayron bo'lmoq", "удивляться", "to be surprised"),
          g("ilginç", "qiziq", "интересный", "interesting"),
          g("hesap", "hisob (to'lov)", "счёт", "bill"),
          g("ödemek", "to'lamoq", "платить", "to pay"),
        ],
        questions: [
          { q: "Aziz ve Emre kahvaltıda ne yiyor?", a: "Simit, peynir ve zeytin." },
          { q: "Özbekistan'da çay neyle içilir?", a: "Kâseyle (kâsede)." },
        ],
      },
      {
        title: "Galata Köprüsü",
        paragraphs: [
          "Öğleden sonra Emre bana şehri [[gösteriyor|göstermek]]. Önce otobüse [[biniyoruz|binmek]], sonra [[yürüyoruz|yürümek]]. Hava güneşli ama biraz [[rüzgârlı]].",
          "Galata [[Köprüsü'ne|köprü]] geliyoruz. Köprüde çok insan var. Bazıları [[balık tutuyor|balık tutmak]]. [[Martılar|martı]] uçuyor ve bağırıyor. [[Uzakta]] camiler ve eski evler görünüyor.",
          "Bir amca bana soruyor: \"Nerelisin [[evlat]]?\" Ben \"Özbekistanlıyım, Buharalıyım,\" diyorum. Amca gülümsüyor: \"Buhara! Çok güzel bir şehir. Biz [[kardeşiz|kardeş]]!\" Sonra bana bir balık ekmek veriyor ve \"Afiyet olsun!\" diyor.",
          "Akşam yurda dönüyoruz. Ayaklarım [[yorgun]] ama kalbim mutlu. Annemi arıyorum ve her şeyi [[anlatıyorum|anlatmak]]. Annem çok seviniyor.",
        ],
        glossary: [
          g("göstermek", "ko'rsatmoq", "показывать", "to show"),
          g("binmek", "minmoq (transportga)", "садиться (в транспорт)", "to get on"),
          g("yürümek", "yurmoq, piyoda yurmoq", "идти пешком", "to walk"),
          g("rüzgârlı", "shamolli", "ветреный", "windy"),
          g("köprü", "ko'prik", "мост", "bridge"),
          g("balık tutmak", "baliq ovlamoq", "ловить рыбу", "to fish"),
          g("martı", "chag'alay", "чайка", "seagull"),
          g("uzakta", "uzoqda", "вдалеке", "in the distance"),
          g("evlat", "bolam (murojaat)", "сынок", "son, child"),
          g("kardeş", "aka-uka, opa-singil; qardosh", "брат, сестра", "sibling, brother"),
          g("yorgun", "charchagan", "усталый", "tired"),
          g("anlatmak", "gapirib bermoq, tushuntirmoq", "рассказывать", "to tell"),
        ],
        questions: [
          { q: "Köprüde insanlar ne yapıyor?", a: "Bazıları balık tutuyor." },
          { q: "Amca Aziz'e ne veriyor?", a: "Bir balık ekmek." },
        ],
      },
    ],
  },

  {
    slug: "ailemle-pazarda",
    title: "Ailemle Pazarda",
    level: "A1",
    tone: "turquoise",
    blurb: {
      uz: "Elif oilasi bilan yakshanba bozoriga boradi: ro'yxat, meva va sabzavotlar, narxlar va kechki ovqat.",
      ru: "Элиф с семьёй идёт на воскресный рынок: список покупок, фрукты и овощи, цены и ужин.",
      en: "Elif goes to the Sunday market with her family: a shopping list, fruit and vegetables, prices and dinner.",
      tr: "Elif, ailesiyle pazar gününe gider: alışveriş listesi, meyve ve sebze, fiyatlar ve akşam yemeği.",
    },
    chapters: [
      {
        title: "Alışveriş Listesi",
        paragraphs: [
          "Merhaba, ben Elif. On iki yaşındayım. Ailemle Ankara'da yaşıyorum. Ailemde dört kişi var: annem, babam, küçük [[kardeşim|kardeş]] Can ve ben.",
          "Bugün pazar. Pazar günü biz her hafta [[pazara|pazar]] gidiyoruz. Sabah annem mutfakta bir liste yazıyor. Ben listeyi okuyorum: domates, salatalık, [[soğan]], patates, elma ve [[çilek]].",
          "Babam soruyor: \"Ekmek de lazım mı?\" Annem \"Evet, iki ekmek,\" diyor. Can bağırıyor: \"Ben [[karpuz]] istiyorum!\" Annem gülüyor: \"Tamam, ama karpuz çok [[ağır]]. Onu baban taşısın.\"",
          "Saat dokuzda evden çıkıyoruz. Babam iki büyük [[çanta]] alıyor. Pazar evimize yakın, biz [[yürüyerek|yürümek]] gidiyoruz.",
        ],
        glossary: [
          g("kardeş", "uka, singil (kichik)", "младший брат/сестра", "younger sibling"),
          g("pazar", "bozor; yakshanba", "рынок; воскресенье", "market; Sunday"),
          g("soğan", "piyoz", "лук", "onion"),
          g("çilek", "qulupnay", "клубника", "strawberry"),
          g("karpuz", "tarvuz", "арбуз", "watermelon"),
          g("ağır", "og'ir", "тяжёлый", "heavy"),
          g("çanta", "sumka", "сумка", "bag"),
          g("yürümek", "piyoda yurmoq", "идти пешком", "to walk"),
        ],
        questions: [
          { q: "Elif'in ailesinde kaç kişi var?", a: "Dört kişi." },
          { q: "Can ne istiyor?", a: "Karpuz." },
        ],
      },
      {
        title: "Kaç Lira?",
        paragraphs: [
          "Pazar çok [[kalabalık]]. Her yerde renkli meyveler ve sebzeler var. Satıcılar bağırıyor: \"Taze domates! Tatlı elma!\"",
          "Annem bir satıcıya soruyor: \"Domatesin kilosu kaç lira?\" Satıcı \"Otuz lira, abla,\" diyor. Annem \"Biraz [[pahalı]],\" diyor. Satıcı gülüyor: \"Senin için yirmi beş olsun!\"",
          "Biz iki kilo domates, bir kilo soğan ve üç kilo patates alıyoruz. Ben çilekleri seçiyorum. Çilekler kırmızı ve çok güzel [[kokuyor|kokmak]].",
          "Sonra karpuzcuya gidiyoruz. Babam bir karpuza [[vuruyor|vurmak]]: tak tak! \"Bu iyi, [[olgun]],\" diyor. Can çok mutlu. Babamın çantaları artık çok ağır.",
        ],
        glossary: [
          g("kalabalık", "gavjum, odam ko'p", "многолюдный", "crowded"),
          g("pahalı", "qimmat", "дорогой", "expensive"),
          g("kokmak", "hid taratmoq", "пахнуть", "to smell"),
          g("vurmak", "urmoq", "стучать, ударять", "to tap, to hit"),
          g("olgun", "pishgan", "спелый", "ripe"),
        ],
        questions: [
          { q: "Satıcı domatesi sonunda kaç liraya veriyor?", a: "Yirmi beş liraya." },
          { q: "Babam karpuzun iyi olduğunu nasıl anlıyor?", a: "Karpuza vuruyor." },
        ],
      },
      {
        title: "Akşam Yemeği",
        paragraphs: [
          "Akşam hepimiz mutfaktayız. Annem yemek [[pişiriyor|pişirmek]]. Ben salata yapıyorum: domatesleri ve salatalıkları [[kesiyorum|kesmek]]. Can masayı [[hazırlıyor|hazırlamak]].",
          "Babam [[balkonda|balkon]] karpuzu [[soğutuyor|soğutmak]]. Annem patatesli bir yemek yapıyor. Mutfak çok güzel kokuyor.",
          "Saat yedide yemek hazır. Hepimiz masaya oturuyoruz. Babam \"Afiyet olsun!\" diyor. Yemek çok lezzetli. Sonra karpuzu yiyoruz. Karpuz soğuk ve çok tatlı.",
          "Can diyor: \"Bu en güzel karpuz!\" Ben de [[düşünüyorum|düşünmek]]: Pazar günleri en güzel günler. Çünkü bütün aile [[birlikte]].",
        ],
        glossary: [
          g("pişirmek", "pishirmoq", "готовить, варить", "to cook"),
          g("kesmek", "kesmoq, to'g'ramoq", "резать", "to cut"),
          g("hazırlamak", "tayyorlamoq", "готовить, накрывать", "to prepare"),
          g("balkon", "balkon", "балкон", "balcony"),
          g("soğutmak", "sovutmoq", "охлаждать", "to cool"),
          g("düşünmek", "o'ylamoq", "думать", "to think"),
          g("birlikte", "birga", "вместе", "together"),
        ],
        questions: [
          { q: "Elif akşam ne yapıyor?", a: "Salata yapıyor." },
          { q: "Elif'e göre pazar günleri neden güzel?", a: "Çünkü bütün aile birlikte." },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════ A2
  {
    slug: "kayip-kedi",
    title: "Kayıp Kedi",
    level: "A2",
    tone: "brass",
    blurb: {
      uz: "Zeynepning oppoq mushugi Pamuk g'oyib bo'ldi. Butun mahalla qidiradi — va oxirida kutilmagan syurpriz.",
      ru: "Пропала белая кошка Зейнеп по имени Памук. Её ищет весь квартал — а в конце ждёт сюрприз.",
      en: "Zeynep's white cat Pamuk has disappeared. The whole neighbourhood searches — and there's a surprise at the end.",
      tr: "Zeynep'in beyaz kedisi Pamuk kayboldu. Bütün mahalle arıyor — ve sonunda bir sürpriz var.",
    },
    chapters: [
      {
        title: "Pamuk Nerede?",
        paragraphs: [
          "Dün sabah her şey normaldi. Zeynep kahvaltı yaptı, [[kedisi|kedi]] Pamuk'a mama verdi ve okula gitti. Pamuk beyaz, küçük ve çok [[tembel]] bir kediydi. Bütün gün koltukta uyurdu.",
          "Zeynep akşam eve döndü. \"Pamuk! Pamuk!\" diye [[seslendi|seslenmek]]. Ama Pamuk gelmedi. Zeynep bütün evi aradı: yatağın altına, dolaba, mutfağa baktı. Pamuk hiçbir yerde yoktu.",
          "Sonra [[pencerenin|pencere]] açık olduğunu gördü. Kalbi hızlı hızlı attı. \"Pamuk dışarı çıktı!\" Zeynep ağlamaya başladı.",
          "Annesi onu [[sakinleştirdi|sakinleştirmek]]: \"Ağlama kızım. Kediler [[akıllıdır|akıllı]]. Yarın sabah hep birlikte ararız. Mutlaka buluruz.\"",
        ],
        glossary: [
          g("kedi", "mushuk", "кошка", "cat"),
          g("tembel", "dangasa", "ленивый", "lazy"),
          g("seslenmek", "chaqirmoq (ovoz berib)", "звать", "to call out"),
          g("pencere", "deraza", "окно", "window"),
          g("sakinleştirmek", "tinchlantirmoq", "успокаивать", "to calm down"),
          g("akıllı", "aqlli", "умный", "clever"),
        ],
        questions: [
          { q: "Pamuk nasıl bir kediydi?", a: "Beyaz, küçük ve çok tembel." },
          { q: "Zeynep neden ağladı?", a: "Pencere açıktı; Pamuk dışarı çıkmıştı." },
        ],
      },
      {
        title: "Mahallede",
        paragraphs: [
          "Ertesi sabah Zeynep ve annesi bir [[ilan]] yazdılar: \"KAYIP KEDİ! Adı Pamuk. Beyaz ve küçük. Gören lütfen bu numarayı arasın.\" Altına Pamuk'un bir fotoğrafını koydular.",
          "İlanları [[mahallenin|mahalle]] her yerine astılar: bakkalın kapısına, otobüs [[durağına|durak]], parkın girişine. Bakkal Hasan amca \"Ben de [[gözümü açık tutarım|göz açık tutmak]],\" dedi.",
          "Öğleden sonra telefon çaldı. Bir kadın \"Parkta beyaz bir kedi gördüm,\" dedi. Zeynep koşarak parka gitti. Ama o kedi Pamuk değildi. Onun [[kuyruğu|kuyruk]] siyahtı.",
          "Akşam olmuştu. Zeynep çok [[üzgündü|üzgün]]. Komşuları da onu teselli etti. Yaşlı Fatma teyze \"Bazen kediler kendi kendine eve döner,\" dedi. Zeynep [[umutla|umut]] pencereye baktı.",
        ],
        glossary: [
          g("ilan", "e'lon", "объявление", "notice, ad"),
          g("mahalle", "mahalla", "квартал, район", "neighbourhood"),
          g("durak", "bekat", "остановка", "stop (bus)"),
          g("göz açık tutmak", "ko'z-quloq bo'lmoq", "смотреть в оба", "to keep an eye out"),
          g("kuyruk", "dum", "хвост", "tail"),
          g("üzgün", "xafa, g'amgin", "грустный", "sad"),
          g("umut", "umid", "надежда", "hope"),
        ],
        questions: [
          { q: "Zeynep ve annesi ilanları nereye astılar?", a: "Bakkalın kapısına, otobüs durağına, parkın girişine." },
          { q: "Parktaki kedi neden Pamuk değildi?", a: "Kuyruğu siyahtı." },
        ],
      },
      {
        title: "Sürpriz",
        paragraphs: [
          "Üçüncü gün sabah Hasan amca aradı: \"Zeynep, hemen dükkâna gel!\" Zeynep annesiyle beraber [[koştu|koşmak]].",
          "Bakkalın arkasında eski bir [[kutu]] vardı. Hasan amca kutuyu yavaşça açtı. İçinde Pamuk vardı! Ama yalnız değildi: Pamuk'un yanında üç küçük [[yavru]] vardı.",
          "Zeynep çok şaşırdı: \"Pamuk... sen [[anne]] oldun!\" Annesi güldü: \"Demek bu yüzden son günlerde çok tembeldi!\" Yavrular minicikti ve [[miyavlıyorlardı|miyavlamak]].",
          "O akşam evde dört kedi vardı. Zeynep onlara isim verdi: Kar, Bulut ve Şeker. Hasan amcaya da bir [[teşekkür]] kartı yazdı. Bütün mahalle bu habere [[sevindi|sevinmek]].",
        ],
        glossary: [
          g("koşmak", "yugurmoq", "бежать", "to run"),
          g("kutu", "quti", "коробка", "box"),
          g("yavru", "bolasi (hayvon)", "детёныш, котёнок", "baby animal, kitten"),
          g("anne", "ona", "мама", "mother"),
          g("miyavlamak", "miyovlamoq", "мяукать", "to meow"),
          g("teşekkür", "rahmat, minnatdorchilik", "благодарность", "thanks"),
          g("sevinmek", "quvonmoq", "радоваться", "to be glad"),
        ],
        questions: [
          { q: "Pamuk nerede bulundu?", a: "Bakkalın arkasındaki eski bir kutuda." },
          { q: "Yavruların adları ne?", a: "Kar, Bulut ve Şeker." },
        ],
      },
    ],
  },

  {
    slug: "kapadokya-hafta-sonu",
    title: "Kapadokya'da Bir Hafta Sonu",
    level: "A2",
    tone: "bole",
    blurb: {
      uz: "Malika va Dilnoza Kapadokiyaga sayohat qilishadi: tungi avtobus, tongdagi havo sharlari va yer osti shahri.",
      ru: "Малика и Дильноза едут в Каппадокию: ночной автобус, воздушные шары на рассвете и подземный город.",
      en: "Malika and Dilnoza travel to Cappadocia: a night bus, balloons at dawn and an underground city.",
      tr: "Malika ve Dilnoza Kapadokya'ya gider: gece otobüsü, şafakta balonlar ve yeraltı şehri.",
    },
    chapters: [
      {
        title: "Gece Otobüsü",
        paragraphs: [
          "Malika ve Dilnoza İstanbul'da [[öğrenci|öğrenci]]. Geçen hafta bir karar verdiler: \"Bu hafta sonu Kapadokya'ya gideceğiz!\" Çünkü ikisi de oradaki balonları çok merak ediyordu.",
          "Cuma akşamı [[otogara|otogar]] gittiler. Otobüs saat on birde [[kalktı|kalkmak]]. Yolculuk on bir saat sürecekti. Dilnoza pencere [[kenarında|kenar]] oturdu, Malika yanında.",
          "Otobüste [[muavin]] çay ve kek dağıttı. Dilnoza \"Türk otobüsleri uçak gibi!\" dedi. Malika güldü. Gece boyunca biraz uyudular, biraz [[sohbet ettiler|sohbet etmek]].",
          "Sabah yedide Göreme'ye vardılar. Hava [[serin]] ama çok temizdi. Her yerde ilginç taşlar ve [[peri bacaları|peri bacası]] vardı. Malika \"Burası başka bir gezegen gibi!\" dedi.",
        ],
        glossary: [
          g("öğrenci", "talaba, o'quvchi", "студент", "student"),
          g("otogar", "avtovokzal", "автовокзал", "bus station"),
          g("kalkmak", "jo'nab ketmoq (transport)", "отправляться", "to depart"),
          g("kenar", "chet, yon", "край", "edge, side"),
          g("muavin", "avtobus yordamchisi", "стюард в автобусе", "bus attendant"),
          g("sohbet etmek", "suhbatlashmoq", "беседовать", "to chat"),
          g("serin", "salqin", "прохладный", "cool"),
          g("peri bacası", "\"pari mo'risi\" — Kapadokiyaning tosh ustunlari", "«дымоход фей» — каменные столбы", "fairy chimney (rock pillar)"),
        ],
        questions: [
          { q: "Yolculuk kaç saat sürdü?", a: "On bir saat." },
          { q: "Dilnoza Türk otobüslerini neye benzetti?", a: "Uçağa." },
        ],
      },
      {
        title: "Balonlar",
        paragraphs: [
          "Ertesi sabah saat beşte [[uyandılar|uyanmak]]. Dışarısı hâlâ karanlıktı. Bir [[minibüs]] onları bir tepeye götürdü. Orada yüzlerce insan bekliyordu.",
          "Güneş [[doğarken|doğmak]] gökyüzü pembe ve turuncu oldu. Sonra ilk balon havalandı. Ardından bir tane daha, sonra on tane, sonra yüz tane! Gökyüzü renkli balonlarla doldu.",
          "Malika'nın balona binecek parası yoktu. Ama hiç [[üzülmedi|üzülmek]]. \"Buradan izlemek de çok güzel,\" dedi ve bir sürü fotoğraf çekti. Dilnoza annesine video [[gönderdi|göndermek]].",
          "Yanlarında yaşlı bir Japon [[turist]] vardı. Dilnoza ona İngilizce \"Çok güzel, değil mi?\" diye sordu. Adam Türkçe cevap verdi: \"Evet, harika!\" İkisi de çok şaşırdı ve güldüler.",
        ],
        glossary: [
          g("uyanmak", "uyg'onmoq", "просыпаться", "to wake up"),
          g("minibüs", "mikroavtobus", "микроавтобус", "minibus"),
          g("doğmak", "chiqmoq (quyosh); tug'ilmoq", "всходить (о солнце); рождаться", "to rise (sun); to be born"),
          g("üzülmek", "xafa bo'lmoq", "огорчаться", "to be upset"),
          g("göndermek", "yubormoq", "отправлять", "to send"),
          g("turist", "sayyoh", "турист", "tourist"),
        ],
        questions: [
          { q: "Güneş doğarken gökyüzü ne renk oldu?", a: "Pembe ve turuncu." },
          { q: "Japon turist hangi dilde cevap verdi?", a: "Türkçe." },
        ],
      },
      {
        title: "Yeraltı Şehri",
        paragraphs: [
          "Öğleden sonra Derinkuyu Yeraltı Şehri'ni gezdiler. Bir [[rehber]] anlattı: \"Bu şehir binlerce yıl önce yapıldı. İnsanlar burada [[saklanırdı|saklanmak]]. Yerin altında sekiz kat var!\"",
          "Koridorlar çok dar ve [[alçaktı|alçak]]. Dilnoza başını iki kere tavana vurdu. İçeride hava serindi. Mutfaklar, ahırlar, hatta bir okul bile vardı.",
          "Malika \"Burada yaşamak zor olmalı,\" dedi. Rehber [[başını salladı|baş sallamak]]: \"Evet, ama güvenliydi.\"",
          "Pazar akşamı İstanbul'a döndüler. Otobüste Dilnoza defterine yazdı: \"Kapadokya'yı hiç [[unutmayacağım|unutmak]]. Bir gün mutlaka balona bineceğim!\"",
        ],
        glossary: [
          g("rehber", "gid, yo'lboshlovchi", "гид", "guide"),
          g("saklanmak", "yashirinmoq", "прятаться", "to hide"),
          g("alçak", "past (baland emas)", "низкий", "low"),
          g("baş sallamak", "bosh irg'amoq", "кивать", "to nod"),
          g("unutmak", "unutmoq", "забывать", "to forget"),
        ],
        questions: [
          { q: "Derinkuyu'da kaç kat var?", a: "Sekiz kat." },
          { q: "Dilnoza defterine ne yazdı?", a: "Kapadokya'yı hiç unutmayacağını ve bir gün balona bineceğini." },
        ],
      },
    ],
  },
];

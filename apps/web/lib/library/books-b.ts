// KUTUBXONA — B1 va B2 kitoblari. Original hikoyalar (qarang: books-a.ts).

import type { LibraryBook } from "./types";
import { g } from "./types";

export const BOOKS_B: LibraryBook[] = [
  // ════════════════════════════════════════════ B1
  {
    slug: "dedemin-saati",
    title: "Dedemin Saati",
    level: "B1",
    tone: "brass",
    blurb: {
      uz: "Kemal bobosidan qolgan eski soatni topadi. Soat to'xtab qolgan — va uning ichida yarim asrlik sir yashiringan.",
      ru: "Кемаль находит старые часы деда. Они остановились — и внутри скрыта тайна полувековой давности.",
      en: "Kemal finds his grandfather's old watch. It has stopped — and inside it hides a half-century-old secret.",
      tr: "Kemal, dedesinden kalan eski saati bulur. Saat durmuştur — ve içinde yarım asırlık bir sır saklıdır.",
    },
    chapters: [
      {
        title: "Çekmecedeki Kutu",
        paragraphs: [
          "Dedem öleli bir yıl olmuştu. Annem sonunda onun eşyalarını toplamaya karar verdi. Ben de yardım etmek için Bursa'daki eski eve gittim. Ev, dedemin kokusuyla doluydu: tütün, eski kitaplar ve [[lavanta]].",
          "Yatak odasındaki dolabın en alt [[çekmecesinde|çekmece]] küçük, ahşap bir kutu buldum. Kutunun üzerinde dedemin el yazısıyla \"Kemal'e\" yazıyordu. Benim adım da Kemal. Dedemin adını taşıyordum.",
          "Kutuyu açtığımda içinde gümüş bir cep saati gördüm. Çok eski görünüyordu ama hâlâ [[parlıyordu|parlamak]]. Saatin kapağında [[kazınmış|kazımak]] bir tarih vardı: 1974. Akrep ve yelkovan üçü on geçeyi gösteriyordu. Saat durmuştu.",
          "Annem saati görünce bir an sustu. Sonra \"Bu saati hiç görmemiştim,\" dedi. \"Baban hiç bahsetmemişti.\" Annemin şaşkınlığı beni daha da [[meraklandırdı|meraklandırmak]]. Dedem neden bu saati [[saklamıştı|saklamak]]?",
        ],
        glossary: [
          g("lavanta", "lavanda", "лаванда", "lavender"),
          g("çekmece", "tortma", "ящик (стола, шкафа)", "drawer"),
          g("parlamak", "yaltiramoq", "блестеть", "to shine"),
          g("kazımak", "o'yib yozmoq, o'ymoq", "гравировать, выцарапывать", "to engrave"),
          g("meraklandırmak", "qiziqtirmoq, xavotirlantirmoq", "вызывать любопытство", "to make curious"),
          g("saklamak", "yashirmoq; saqlamoq", "прятать; хранить", "to hide; to keep"),
        ],
        questions: [
          { q: "Kutunun üzerinde ne yazıyordu?", a: "\"Kemal'e\" — dedesinin el yazısıyla." },
          { q: "Saat hangi saati gösteriyordu?", a: "Üçü on geçeyi." },
        ],
      },
      {
        title: "Saatçi",
        paragraphs: [
          "Ertesi gün saati çarşıdaki eski bir saatçiye götürdüm. Dükkân daracık ve [[loştu|loş]]. Duvarlarda yüzlerce saat aynı anda tıkırdıyordu. Saatçi Rıza Usta yetmiş yaşlarında, beyaz bıyıklı bir adamdı.",
          "Saati eline alınca gözleri büyüdü. \"Bu saati ben tamir etmiştim,\" dedi. \"Hem de çok yıllar önce. Bak, şu [[çizik|çizik]] benim [[işaretim|işaret]].\" Kapağın içindeki küçük bir çizgiyi gösterdi.",
          "\"Deden buraya genç bir adamken gelmişti,\" diye devam etti. \"Saati tamir ettirdikten sonra bana bir şey söylemişti: 'Bu saat bir sözün saati, usta. Söz tutulana kadar [[durmalı|durmak]].' Ne demek istediğini anlamamıştım.\"",
          "Rıza Usta saati dikkatle açtı. Arka kapağın altında, katlanmış küçük bir kâğıt vardı. Kâğıt [[sararmıştı|sararmak]]. \"Bu senin [[hakkın|hak]],\" dedi ve kâğıdı bana uzattı. Ellerim titriyordu.",
        ],
        glossary: [
          g("loş", "xira yorug'", "полутёмный", "dim"),
          g("çizik", "tirnalgan iz", "царапина", "scratch"),
          g("işaret", "belgi", "знак, метка", "mark, sign"),
          g("durmak", "to'xtamoq; turmoq", "останавливаться; стоять", "to stop; to stand"),
          g("sararmak", "sarg'aymoq", "желтеть", "to turn yellow"),
          g("hak", "haq", "право", "right"),
        ],
        questions: [
          { q: "Rıza Usta saati nasıl tanıdı?", a: "Kapağın içindeki çizik onun işaretiydi." },
          { q: "Dede saat hakkında ne söylemişti?", a: "\"Bu saat bir sözün saati; söz tutulana kadar durmalı.\"" },
        ],
      },
      {
        title: "Mektup",
        paragraphs: [
          "Eve dönünce kâğıdı açtım. Kısa bir mektuptu: \"Sevgili torunum, bu mektubu okuyorsan ben artık yokum. 1974'te en yakın arkadaşım Selim'le [[kavga ettik|kavga etmek]]. Haksızdım ama özür dileyemedim. O gün saat üçü on geçe, istasyonda trenine yetişemedim. Bir daha hiç görüşmedik.\"",
          "\"Selim İzmir'de yaşıyordu. Eğer hâlâ hayattaysa, ona bu saati ver ve benim yerime [[özür dile|özür dilemek]]. Saati o zaman çalıştır. Yarım kalan sözümü sen tamamla.\"",
          "Bir hafta sonra İzmir'deydim. Biraz araştırınca Selim Bey'i bir [[huzurevinde|huzurevi]] buldum. Doksan yaşındaydı ama gözleri hâlâ canlıydı. Saati görünce uzun süre sustu. Sonra gülümsedi: \"Kemal... İnatçı Kemal. Ben onu çoktan [[affetmiştim|affetmek]].\"",
          "Saati kurdum. Tik tak, tik tak... Elli yıl sonra saat yeniden [[işlemeye|işlemek]] başladı. Selim Bey'in gözleri doldu. O gün anladım: bazı sözler gecikse de tutulmayı bekler.",
        ],
        glossary: [
          g("kavga etmek", "janjallashmoq", "ссориться", "to quarrel"),
          g("özür dilemek", "kechirim so'ramoq", "извиняться", "to apologise"),
          g("huzurevi", "qariyalar uyi", "дом престарелых", "care home"),
          g("affetmek", "kechirmoq", "прощать", "to forgive"),
          g("işlemek", "ishlamoq (mexanizm)", "работать (о механизме)", "to run, to work"),
        ],
        questions: [
          { q: "Dede neden özür dileyemedi?", a: "Selim'in trenine yetişemedi; bir daha görüşmediler." },
          { q: "Selim Bey ne dedi?", a: "Kemal'i çoktan affettiğini söyledi." },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════ B2
  {
    slug: "cevirmen",
    title: "Çevirmen",
    level: "B2",
    tone: "cobalt",
    blurb: {
      uz: "Yosh tarjimon Leyla hayotidagi eng muhim taklifni oladi. Ammo har bir so'zning og'irligi bor — va ba'zan to'g'ri tarjima eng qiyin tanlovdir.",
      ru: "Молодая переводчица Лейла получает самое важное предложение в жизни. Но у каждого слова есть вес — и порой верный перевод — самый трудный выбор.",
      en: "Young translator Leyla receives the offer of her life. But every word has weight — and sometimes the right translation is the hardest choice.",
      tr: "Genç çevirmen Leyla hayatının teklifini alır. Ama her kelimenin bir ağırlığı vardır — ve bazen doğru çeviri en zor seçimdir.",
    },
    chapters: [
      {
        title: "Teklif",
        paragraphs: [
          "Leyla, Ankara'da küçük bir çeviri bürosunda çalışıyordu. Günleri birbirine benziyordu: [[sözleşmeler|sözleşme]], kullanım kılavuzları, bitmek bilmeyen [[resmî|resmi]] belgeler. İşini seviyordu ama içinde bir yerde, kelimelerin bundan fazlası olması gerektiğine inanıyordu.",
          "Bir pazartesi sabahı telefonu çaldı. Arayan, ünlü bir yayınevinin editörü Nermin Hanım'dı. \"Leyla Hanım, sizi bir meslektaşınız önerdi. Elimizde Özbek bir yazarın romanı var. Türkçeye kazandırmak istiyoruz. Bu işi siz üstlenir misiniz?\"",
          "Leyla bir an [[duraksadı|duraksamak]]. Roman, son yılların en çok konuşulan kitaplarından biriydi: Aral Gölü'nün kuruyuşunu bir balıkçı ailesinin gözünden anlatıyordu. Hem büyük bir [[fırsattı|fırsat]] hem de büyük bir sorumluluk.",
          "\"Süre ne kadar?\" diye sordu. \"Altı ay,\" dedi Nermin Hanım. \"Yazar da çeviri sürecine katılmak istiyor. Size güveniyoruz.\" Leyla telefonu kapattığında kalbi deli gibi çarpıyordu. Bu, beklediği [[an|an]] olabilirdi.",
        ],
        glossary: [
          g("sözleşme", "shartnoma", "договор", "contract"),
          g("resmi", "rasmiy", "официальный", "official"),
          g("duraksamak", "bir lahza to'xtab qolmoq, ikkilanmoq", "запнуться, замешкаться", "to hesitate"),
          g("fırsat", "imkoniyat", "возможность", "opportunity"),
          g("an", "lahza, on", "миг, момент", "moment"),
        ],
        questions: [
          { q: "Roman neyi anlatıyordu?", a: "Aral Gölü'nün kuruyuşunu, bir balıkçı ailesinin gözünden." },
          { q: "Çeviri için ne kadar süre verildi?", a: "Altı ay." },
        ],
      },
      {
        title: "Kelimelerin Ağırlığı",
        paragraphs: [
          "İlk aylar zannettiğinden de zor geçti. Romanın dili hem şiirsel hem de son derece yerel bir dildi. Bazı kelimelerin Türkçede tam bir [[karşılığı|karşılık]] yoktu. Örneğin balıkçıların denize duydukları [[özlemi|özlem]] anlatan bir kelime vardı ki, Leyla onu haftalarca düşündü.",
          "Yazarla her cuma görüntülü görüşüyorlardı. Yazar, Nukuslu, yetmişlik, sakin sesli bir adamdı. Bir gün Leyla ona sordu: \"Bu kelimeyi 'hasret' diye çevirsem, çok mu [[yüzeysel|yüzeysel]] kalır?\" Yazar gülümsedi: \"Çeviri bir köprüdür, kızım. Köprünün iki ucu asla aynı toprağa basmaz.\"",
          "Bu cümle Leyla'nın aklından çıkmadı. Mükemmel çeviri diye bir şey yoktu belki ama [[sadık|sadık]] bir çeviri vardı: anlamı değil, duyguyu koruyan bir çeviri.",
          "Dördüncü ayın sonunda Nermin Hanım bir [[e-posta|e-posta]] gönderdi: \"Pazarlama ekibi bazı bölümlerin kısaltılmasını, sert sahnelerin yumuşatılmasını istiyor. Kitap daha geniş bir okur kitlesine ulaşmalı.\" Leyla ekranın önünde uzun süre kımıldamadan oturdu.",
        ],
        glossary: [
          g("karşılık", "muqobil, ekvivalent", "соответствие, эквивалент", "equivalent"),
          g("özlem", "sog'inch, intiqlik", "тоска", "longing"),
          g("yüzeysel", "yuzaki", "поверхностный", "superficial"),
          g("sadık", "sodiq", "верный", "faithful"),
          g("e-posta", "elektron xat", "электронное письмо", "email"),
        ],
        questions: [
          { q: "Yazar çeviriyi neye benzetti?", a: "Bir köprüye: iki ucu asla aynı toprağa basmaz." },
          { q: "Pazarlama ekibi ne istiyordu?", a: "Bazı bölümlerin kısaltılmasını, sert sahnelerin yumuşatılmasını." },
        ],
      },
      {
        title: "Karar",
        paragraphs: [
          "O gece Leyla uyuyamadı. Bir yanda kariyeri vardı: bu kitap adını herkese duyurabilirdi. Öte yanda yazara verdiği [[söz|söz]] vardı. Sert sahneler kitabın kalbiydi: kuruyan bir gölün acısını [[yumuşatmak|yumuşatmak]], o acıyı yok saymak demekti.",
          "Sabah yazarı aradı ve durumu anlattı. Yazar uzun bir sessizlikten sonra konuştu: \"Ben size kitabımı emanet ettim, Leyla Hanım. Kararı siz verin. Ne karar verirseniz verin, size [[kırılmam|kırılmak]].\"",
          "Leyla, Nermin Hanım'a bir mektup yazdı. Kitabın neden olduğu gibi kalması gerektiğini, okurların zor gerçeklerden kaçmak değil, onlarla [[yüzleşmek|yüzleşmek]] istediğini anlattı. Gerekirse işi bırakmaya hazır olduğunu da ekledi.",
          "İki gün sonra cevap geldi. Nermin Hanım yayın kuruluyla konuşmuş, ikna etmişti: kitap kısaltılmadan basılacaktı. Bir yıl sonra roman Türkiye'de en çok okunan kitaplar arasına girdi. Çevirmenin notunda tek bir cümle vardı: \"Bazı kelimeler taşınmaz; ancak [[omuzlanır|omuzlamak]].\"",
        ],
        glossary: [
          g("söz", "va'da; so'z", "обещание; слово", "promise; word"),
          g("yumuşatmak", "yumshatmoq", "смягчать", "to soften"),
          g("kırılmak", "ranjimoq; sinmoq", "обижаться; ломаться", "to be hurt; to break"),
          g("yüzleşmek", "yuzma-yuz kelmoq, tan olmoq", "сталкиваться лицом к лицу", "to face, to confront"),
          g("omuzlamak", "yelkaga olmoq, zimmaga olmoq", "взваливать на плечи", "to shoulder"),
        ],
        questions: [
          { q: "Leyla neden uyuyamadı?", a: "Kariyeri ile yazara verdiği söz arasında kalmıştı." },
          { q: "Kitap sonunda nasıl basıldı?", a: "Kısaltılmadan." },
        ],
      },
    ],
  },
];

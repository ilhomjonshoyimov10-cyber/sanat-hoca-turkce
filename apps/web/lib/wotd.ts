// KUN SO'ZI VA KUN MAQOLI.
//
// Har kuni (Toshkent vaqti bilan) ro'yxatdan navbatdagisi olinadi —
// hamma foydalanuvchida bir kunda bir xil so'z. Ro'yxat tugasa, boshidan.
//
// Tarjimalar uch tilda: o'zbek (kirill yozuvi shundan avtomatik olinadi),
// rus va ingliz. Turkcha interfeysda o'zbekcha tarjima ko'rsatiladi —
// chunki o'quvchi baribir turk tilini o'rganyapti.
//
// Ustoz tekshiruvidan o'tkazilishi tavsiya etiladi: docs/KONTENT.md.

export type Gloss = { uz: string; ru: string; en: string };

export interface WordOfDay {
  tr: string;
  level: "A1" | "A2" | "B1" | "B2";
  meaning: Gloss;
  example: string;
  exampleMeaning: Gloss;
}

export interface Proverb {
  tr: string;
  meaning: Gloss;
}

const w = (
  tr: string, level: WordOfDay["level"], uz: string, ru: string, en: string,
  example: string, exUz: string, exRu: string, exEn: string,
): WordOfDay => ({ tr, level, meaning: { uz, ru, en }, example, exampleMeaning: { uz: exUz, ru: exRu, en: exEn } });

export const WORDS: WordOfDay[] = [
  w("güneş", "A1", "quyosh", "солнце", "sun", "Bugün güneş çok parlak.", "Bugun quyosh juda yorqin.", "Сегодня солнце очень яркое.", "The sun is very bright today."),
  w("arkadaş", "A1", "do'st", "друг", "friend", "O benim en iyi arkadaşım.", "U mening eng yaxshi do'stim.", "Он мой лучший друг.", "He is my best friend."),
  w("kahvaltı", "A1", "nonushta", "завтрак", "breakfast", "Türk kahvaltısı çok zengindir.", "Turk nonushtasi juda to'kin bo'ladi.", "Турецкий завтрак очень богатый.", "A Turkish breakfast is very rich."),
  w("özlemek", "A2", "sog'inmoq", "скучать", "to miss", "Seni çok özledim.", "Seni juda sog'indim.", "Я очень по тебе скучал.", "I missed you so much."),
  w("merak", "B1", "qiziqish", "любопытство", "curiosity", "Merak ediyorum, ne oldu?", "Qiziq, nima bo'ldi ekan?", "Интересно, что случилось?", "I wonder what happened."),
  w("yağmur", "A1", "yomg'ir", "дождь", "rain", "Yağmur yağıyor, şemsiyeni al.", "Yomg'ir yog'yapti, soyabonni ol.", "Идёт дождь, возьми зонт.", "It's raining, take your umbrella."),
  w("komşu", "A2", "qo'shni", "сосед", "neighbour", "Komşumuz bize tatlı getirdi.", "Qo'shnimiz bizga shirinlik olib keldi.", "Соседка принесла нам сладости.", "Our neighbour brought us dessert."),
  w("sabır", "B1", "sabr", "терпение", "patience", "Dil öğrenmek sabır ister.", "Til o'rganish sabr talab qiladi.", "Изучение языка требует терпения.", "Learning a language takes patience."),
  w("ekmek", "A1", "non", "хлеб", "bread", "Fırından taze ekmek aldım.", "Novvoyxonadan yangi non oldim.", "Я купил свежий хлеб в пекарне.", "I bought fresh bread from the bakery."),
  w("vazgeçmek", "B2", "voz kechmoq", "отказываться", "to give up", "Asla hayallerinden vazgeçme.", "Hech qachon orzularingdan voz kechma.", "Никогда не отказывайся от своей мечты.", "Never give up on your dreams."),
  w("yolculuk", "A2", "safar", "поездка, путешествие", "journey, trip", "İyi yolculuklar!", "Oq yo'l!", "Счастливого пути!", "Have a good trip!"),
  w("sabah", "A1", "ertalab", "утро", "morning", "Her sabah çay içerim.", "Har ertalab choy ichaman.", "Каждое утро я пью чай.", "I drink tea every morning."),
  w("fırsat", "B1", "imkoniyat", "возможность", "opportunity", "Bu fırsatı kaçırma.", "Bu imkoniyatni boy berma.", "Не упусти эту возможность.", "Don't miss this opportunity."),
  w("misafir", "A2", "mehmon", "гость", "guest", "Bu akşam misafirimiz var.", "Bugun kechqurun mehmonimiz bor.", "Сегодня вечером у нас гости.", "We have guests tonight."),
  w("özgüven", "B2", "o'ziga ishonch", "уверенность в себе", "self-confidence", "Konuştukça özgüvenin artar.", "Gapirgan sari o'zingga ishonching ortadi.", "Чем больше говоришь, тем увереннее становишься.", "The more you speak, the more confident you get."),
  w("pazar", "A1", "bozor; yakshanba", "рынок; воскресенье", "market; Sunday", "Pazar günü pazara gidelim.", "Yakshanba kuni bozorga boraylik.", "Давай в воскресенье сходим на рынок.", "Let's go to the market on Sunday."),
  w("hatırlamak", "A2", "eslamoq", "помнить, вспоминать", "to remember", "Onun adını hatırlamıyorum.", "Uning ismini eslay olmayapman.", "Я не помню его имени.", "I don't remember his name."),
  w("alışkanlık", "B1", "odat", "привычка", "habit", "Kitap okumak güzel bir alışkanlıktır.", "Kitob o'qish — yaxshi odat.", "Чтение — хорошая привычка.", "Reading is a good habit."),
  w("hava", "A1", "havo; ob-havo", "воздух; погода", "air; weather", "Bugün hava çok güzel.", "Bugun havo juda yaxshi.", "Сегодня отличная погода.", "The weather is lovely today."),
  w("sorumluluk", "B2", "mas'uliyat", "ответственность", "responsibility", "Bu karar büyük bir sorumluluk.", "Bu qaror — katta mas'uliyat.", "Это решение — большая ответственность.", "This decision is a big responsibility."),
  w("hediye", "A2", "sovg'a", "подарок", "gift", "Bu hediye senin için.", "Bu sovg'a sen uchun.", "Этот подарок для тебя.", "This gift is for you."),
  w("mutlu", "A1", "baxtli, xursand", "счастливый", "happy", "Seni görünce çok mutlu oldum.", "Seni ko'rib juda xursand bo'ldim.", "Я очень обрадовался, увидев тебя.", "I was very happy to see you."),
  w("deneyim", "B1", "tajriba", "опыт", "experience", "Bu iş için deneyim gerekiyor.", "Bu ish uchun tajriba kerak.", "Для этой работы нужен опыт.", "This job requires experience."),
  w("umut", "A2", "umid", "надежда", "hope", "Umudunu kaybetme.", "Umidingni yo'qotma.", "Не теряй надежду.", "Don't lose hope."),
  w("eleştiri", "B2", "tanqid", "критика", "criticism", "Yapıcı eleştiri insanı geliştirir.", "Foydali tanqid insonni o'stiradi.", "Конструктивная критика помогает расти.", "Constructive criticism helps you grow."),
  w("ev", "A1", "uy", "дом", "house, home", "Akşam eve geç döndüm.", "Kechqurun uyga kech qaytdim.", "Вечером я поздно вернулся домой.", "I came home late in the evening."),
  w("başarı", "B1", "muvaffaqiyat", "успех", "success", "Başarının sırrı düzenli çalışmaktır.", "Muvaffaqiyat siri — muntazam mehnat.", "Секрет успеха — регулярная работа.", "The secret of success is steady work."),
  w("sağlık", "A2", "sog'liq", "здоровье", "health", "Sağlık her şeyden önemlidir.", "Sog'liq hamma narsadan muhim.", "Здоровье важнее всего.", "Health matters more than anything."),
  w("gönül", "B2", "ko'ngil", "душа, сердце", "heart, soul", "Gönlünü kırmak istemedim.", "Ko'nglini og'ritmoqchi emasdim.", "Я не хотел тебя обидеть.", "I didn't mean to hurt your feelings."),
  w("soru", "A1", "savol", "вопрос", "question", "Bir sorum var.", "Bir savolim bor.", "У меня есть вопрос.", "I have a question."),
  w("gelenek", "B1", "an'ana", "традиция", "tradition", "Bayramda büyüklerin elini öpmek bir gelenektir.", "Bayramda kattalarning qo'lini o'pish — an'ana.", "Целовать руку старшим в праздник — традиция.", "Kissing elders' hands on holidays is a tradition."),
  w("erken", "A2", "erta", "рано", "early", "Yarın erken kalkmam lazım.", "Ertaga erta turishim kerak.", "Завтра мне нужно рано встать.", "I need to get up early tomorrow."),
  w("hoşgörü", "B2", "bag'rikenglik", "терпимость", "tolerance", "Hoşgörü, birlikte yaşamanın temelidir.", "Bag'rikenglik — birga yashashning asosi.", "Терпимость — основа совместной жизни.", "Tolerance is the basis of living together."),
  w("yol", "A1", "yo'l", "дорога, путь", "road, way", "Bu yol nereye gidiyor?", "Bu yo'l qayerga boradi?", "Куда ведёт эта дорога?", "Where does this road go?"),
  w("hayal", "B1", "orzu, xayol", "мечта", "dream", "Hayalim İstanbul'da yaşamak.", "Orzuyim — Istanbulda yashash.", "Моя мечта — жить в Стамбуле.", "My dream is to live in Istanbul."),
  w("bilet", "A2", "chipta", "билет", "ticket", "İki bilet lütfen.", "Ikkita chipta, iltimos.", "Два билета, пожалуйста.", "Two tickets, please."),
  w("kavram", "B2", "tushuncha", "понятие", "concept", "Bu kavramı bir örnekle açıklar mısın?", "Bu tushunchani misol bilan tushuntirib bera olasanmi?", "Можешь объяснить это понятие на примере?", "Can you explain this concept with an example?"),
  w("yemek", "A1", "ovqat; yemoq", "еда; есть", "food; to eat", "Annemin yemekleri çok lezzetli.", "Onamning ovqatlari juda mazali.", "Мамины блюда очень вкусные.", "My mother's cooking is delicious."),
  w("anlaşmak", "B1", "kelishmoq; til topishmoq", "договориться; ладить", "to agree; to get along", "Kardeşimle çok iyi anlaşırız.", "Ukam bilan juda yaxshi til topishamiz.", "Мы с братом отлично ладим.", "My brother and I get along very well."),
  w("sevinç", "A2", "quvonch", "радость", "joy", "Gözlerinde sevinç vardı.", "Ko'zlarida quvonch bor edi.", "В его глазах была радость.", "There was joy in his eyes."),
  w("çevre", "B1", "atrof-muhit", "окружающая среда", "environment", "Çevreyi korumalıyız.", "Atrof-muhitni asrashimiz kerak.", "Мы должны беречь природу.", "We must protect the environment."),
  w("çalışmak", "A2", "ishlamoq; tayyorlanmoq", "работать; заниматься", "to work; to study", "Sınav için çok çalışıyorum.", "Imtihonga qattiq tayyorlanyapman.", "Я усердно готовлюсь к экзамену.", "I'm studying hard for the exam."),
];

const p = (tr: string, uz: string, ru: string, en: string): Proverb => ({ tr, meaning: { uz, ru, en } });

export const PROVERBS: Proverb[] = [
  p("Damlaya damlaya göl olur.", "Tomchi-tomchi ko'l bo'lur: oz-ozdan ko'p yig'iladi.", "Капля за каплей — и озеро: понемногу набирается многое.", "Drop by drop, a lake forms: small efforts add up."),
  p("Bir lisan bir insan, iki lisan iki insan.", "Bir til — bir inson, ikki til — ikki inson.", "Один язык — один человек, два языка — два человека.", "One language, one person; two languages, two persons."),
  p("Bugünün işini yarına bırakma.", "Bugungi ishni ertaga qoldirma.", "Не откладывай на завтра то, что можно сделать сегодня.", "Don't put off till tomorrow what you can do today."),
  p("Dost kara günde belli olur.", "Do'st boshga kun tushganda bilinadi.", "Друг познаётся в беде.", "A friend in need is a friend indeed."),
  p("Tatlı dil yılanı deliğinden çıkarır.", "Shirin so'z ilonni inidan chiqaradi: yumshoq so'z har eshikni ochadi.", "Ласковое слово и змею из норы выманит.", "A sweet tongue draws the snake from its hole: kindness works wonders."),
  p("Bilmemek ayıp değil, öğrenmemek ayıptır.", "Bilmaslik ayb emas, o'rganmaslik ayb.", "Не знать не стыдно, стыдно не учиться.", "Not knowing is no shame; not learning is."),
  p("Acele işe şeytan karışır.", "Shoshilgan ishga shayton aralashadi: shoshsang, xato qilasan.", "В спешное дело чёрт вмешивается: поспешишь — людей насмешишь.", "The devil meddles in hasty work: haste makes waste."),
  p("Ağaç yaşken eğilir.", "Daraxt ho'lligida egiladi: tarbiya yoshlikdan.", "Дерево гнётся, пока молодое: воспитывают с детства.", "A tree bends while it's young: learning starts early."),
  p("Söz gümüşse sükût altındır.", "So'z kumush bo'lsa, sukut oltindir.", "Слово — серебро, молчание — золото.", "Speech is silver, silence is golden."),
  p("İşleyen demir ışıldar.", "Ishlagan temir yaltiraydi: mashq qilgan mohir bo'ladi.", "Работающее железо блестит: навык — от практики.", "Iron in use shines: practice keeps you sharp."),
  p("Emek olmadan yemek olmaz.", "Mehnatsiz ovqat bo'lmas.", "Без труда не вытащишь и рыбку из пруда.", "No pain, no gain."),
  p("Bir elin nesi var, iki elin sesi var.", "Bir qo'ldan nima chiqadi, ikki qo'l — tovush chiqaradi: birgalikda kuch bor.", "Одной рукой не хлопнешь: вместе мы сильнее.", "One hand can't clap: together we are stronger."),
  p("Sabreden derviş muradına ermiş.", "Sabr qilgan darvesh muradiga yetibdi.", "Терпеливый дервиш достиг своей цели: терпение вознаграждается.", "The patient dervish reached his goal: patience pays off."),
  p("Ayağını yorganına göre uzat.", "Oyog'ingni ko'rpangga qarab uzat.", "По одёжке протягивай ножки.", "Cut your coat according to your cloth."),
  p("Gülü seven dikenine katlanır.", "Gulni sevgan tikaniga chidaydi.", "Кто любит розу, терпит и её шипы.", "Who loves the rose endures its thorns."),
  p("Bin bilsen de bir bilene danış.", "Ming bilsang ham, biluvchidan maslahat so'ra.", "Хоть тысячу знаешь — посоветуйся со знающим.", "Even if you know a thousand things, ask someone who knows."),
  p("Komşu komşunun külüne muhtaçtır.", "Qo'shni qo'shnining kuliga ham muhtoj: qo'shnilar bir-biriga kerak.", "Сосед нуждается даже в золе соседа: соседи нужны друг другу.", "A neighbour needs even his neighbour's ashes: neighbours need each other."),
  p("Rüzgâr eken fırtına biçer.", "Shamol ekkan bo'ron o'radi.", "Посеешь ветер — пожнёшь бурю.", "Sow the wind, reap the whirlwind."),
  p("Yalnız taş duvar olmaz.", "Yolg'iz tosh devor bo'lmas.", "Из одного камня стену не сложишь.", "One stone doesn't make a wall."),
  p("Her işte bir hayır vardır.", "Har ishda bir yaxshilik bor.", "Всё, что ни делается, — к лучшему.", "Every cloud has a silver lining."),
  p("Ak akçe kara gün içindir.", "Oq tanga qora kun uchun: qiyin kunga jamg'arib qo'y.", "Белая монета — на чёрный день.", "Keep a white coin for a dark day."),
  p("Sakla samanı, gelir zamanı.", "Somonni asra, vaqti keladi: keraksizdek tuyulgan narsa bir kun asqotadi.", "Береги солому — придёт её время: и ненужное пригодится.", "Keep the straw, its time will come: even small things prove useful."),
  p("Göz görmeyince gönül katlanır.", "Ko'z ko'rmasa, ko'ngil chidaydi.", "Чего глаз не видит, то сердце стерпит.", "What the eye doesn't see, the heart can bear."),
  p("Kaz gelecek yerden tavuk esirgenmez.", "G'oz keladigan joydan tovuq ayalmaydi: katta foyda uchun ozgina berishdan qochma.", "Где ждут гуся, курицы не жалеют.", "Don't begrudge a hen where a goose will come."),
];

/** Toshkent vaqti bo'yicha bugungi kun raqami (1970-01-01 dan beri). */
export function tashkentDayNumber(now = new Date()): number {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(now); // "2026-11-13"
  const [y, m, d] = ymd.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function todays(day: number) {
  return {
    word: WORDS[day % WORDS.length],
    // Maqol boshqa qadam bilan aylanadi: so'z va maqol juftligi har kuni yangi
    proverb: PROVERBS[(day * 7) % PROVERBS.length],
  };
}

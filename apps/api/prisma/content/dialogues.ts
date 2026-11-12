// SUHBAT MASHQLARI.
//
// Sizga nimadir aytiladi — to'g'ri javobni tanlaysiz. Chalg'ituvchi
// variantlar ATAYLAB grammatik jihatdan to'g'ri, lekin MA'NOSI mos
// kelmaydigan qilib yozilgan: maqsad — o'quvchi gapni tushunib
// javob tanlashi, tanish so'zni ko'rib taxmin qilmasligi.
//
// TEKSHIRISH KERAK: ustoz turkcha jumlalarni ko'rib chiqsin.

import type { Level } from '@prisma/client';

export interface Dialogue {
  prompt: string;
  answer: string;
  options: string[];
  situation: string;
  uzbek: string;
  level: Level;
}

export const dialogues: Dialogue[] = [
  // ───────── A1: tanishuv va kundalik ─────────
  {
    prompt: 'Merhaba, nasılsın?',
    answer: 'İyiyim, teşekkür ederim. Sen nasılsın?',
    options: ['Yarın görüşürüz.', 'Benim adım Ali.', 'Saat üç.'],
    situation: 'Tanishuv',
    uzbek: 'Salom, qalaysan?',
    level: 'A1',
  },
  {
    prompt: 'Adın ne?',
    answer: 'Benim adım Dilnoza.',
    options: ['Çok güzel.', 'Buharalıyım.', 'Yirmi yaşındayım.'],
    situation: 'Tanishuv',
    uzbek: 'Isming nima?',
    level: 'A1',
  },
  {
    prompt: 'Nerelisin?',
    answer: 'Özbekistanlıyım, Buhara’dan geliyorum.',
    options: ['Öğrenciyim.', 'Teşekkür ederim.', 'Evet, biliyorum.'],
    situation: 'Tanishuv',
    uzbek: 'Qayerliksan?',
    level: 'A1',
  },
  {
    prompt: 'Teşekkür ederim.',
    answer: 'Rica ederim.',
    options: ['Hoş geldiniz.', 'Günaydın.', 'Afiyet olsun.'],
    situation: 'Odob',
    uzbek: 'Rahmat.',
    level: 'A1',
  },
  {
    prompt: 'Hoş geldiniz!',
    answer: 'Hoş bulduk.',
    options: ['İyi geceler.', 'Görüşmek üzere.', 'Kolay gelsin.'],
    situation: 'Mehmon kutish',
    uzbek: 'Xush kelibsiz!',
    level: 'A1',
  },
  {
    prompt: 'Saat kaç?',
    answer: 'Saat yedi buçuk.',
    options: ['Yedi kişiyiz.', 'Yedi lira.', 'Yedinci kat.'],
    situation: 'Vaqt so‘rash',
    uzbek: 'Soat necha?',
    level: 'A1',
  },
  {
    prompt: 'Bu ne kadar?',
    answer: 'Yirmi lira.',
    options: ['Çok lezzetli.', 'İki tane.', 'Sağ tarafta.'],
    situation: 'Do‘konda',
    uzbek: 'Bu qancha turadi?',
    level: 'A1',
  },
  {
    prompt: 'Nasıl gidiyorsun okula?',
    answer: 'Otobüsle gidiyorum.',
    options: ['Sabah sekizde.', 'Çok uzak.', 'Öğretmenim var.'],
    situation: 'Kundalik hayot',
    uzbek: 'Maktabga qanday borasan?',
    level: 'A1',
  },
  {
    prompt: 'Afiyet olsun!',
    answer: 'Teşekkürler, elinize sağlık.',
    options: ['Güle güle.', 'Hoşça kal.', 'İyi yolculuklar.'],
    situation: 'Dasturxonda',
    uzbek: 'Yoqimli ishtaha!',
    level: 'A1',
  },
  {
    prompt: 'Yarın müsait misin?',
    answer: 'Evet, öğleden sonra müsaitim.',
    options: ['Dün gittim.', 'Çok teşekkürler.', 'Adım Mehmet.'],
    situation: 'Uchrashuv',
    uzbek: 'Ertaga vaqting bormi?',
    level: 'A1',
  },

  // ───────── A2: xizmatlar, yo'l so'rash ─────────
  {
    prompt: 'Affedersiniz, eczane nerede?',
    answer: 'Şu köşeden sağa dönün, hemen solda.',
    options: ['Saat dokuzda açılıyor.', 'Ben de bilmiyorum, doktorum.', 'Üç kutu alabilir miyim?'],
    situation: 'Yo‘l so‘rash',
    uzbek: 'Kechirasiz, dorixona qayerda?',
    level: 'A2',
  },
  {
    prompt: 'Hesabı alabilir miyim?',
    answer: 'Tabii, hemen getiriyorum.',
    options: ['Menüyü ister misiniz?', 'Masa dolu, bekleyin.', 'Mutfak kapandı.'],
    situation: 'Restoranda',
    uzbek: 'Hisobni olsam bo‘ladimi?',
    level: 'A2',
  },
  {
    prompt: 'Bu gömleğin başka rengi var mı?',
    answer: 'Mavi ve siyahı da var, bakmak ister misiniz?',
    options: ['Kasada ödeyebilirsiniz.', 'Beden kırk iki.', 'Mağaza sekizde kapanıyor.'],
    situation: 'Do‘konda',
    uzbek: 'Bu ko‘ylakning boshqa rangi bormi?',
    level: 'A2',
  },
  {
    prompt: 'Bir randevu almak istiyorum.',
    answer: 'Hangi gün için uygun olursunuz?',
    options: ['Reçeteniz hazır.', 'Buyurun, oturun.', 'Ücret iki yüz lira.'],
    situation: 'Shifokorda',
    uzbek: 'Qabulga yozilmoqchiman.',
    level: 'A2',
  },
  {
    prompt: 'Otobüs kaçta kalkıyor?',
    answer: 'On beş dakika sonra, peron üçten.',
    options: ['Bileti kaybettim.', 'Şoför çok yavaş.', 'Valizim ağır.'],
    situation: 'Avtovokzalda',
    uzbek: 'Avtobus soat nechada jo‘naydi?',
    level: 'A2',
  },
  {
    prompt: 'Odanızda internet var mı?',
    answer: 'Evet, tüm odalarda ücretsiz internet var.',
    options: ['Kahvaltı yedide.', 'Asansör bozuk.', 'İki gece kalacağım.'],
    situation: 'Mehmonxonada',
    uzbek: 'Xonangizda internet bormi?',
    level: 'A2',
  },
  {
    prompt: 'Maalesef geç kalacağım.',
    answer: 'Sorun değil, seni bekleriz.',
    options: ['Ben de geldim.', 'Yemek çok güzeldi.', 'Yolu biliyor musun?'],
    situation: 'Do‘st bilan',
    uzbek: 'Afsuski kechikaman.',
    level: 'A2',
  },
  {
    prompt: 'Yardım eder misiniz?',
    answer: 'Elbette, nasıl yardımcı olabilirim?',
    options: ['Ben de yeni geldim.', 'Çok pahalı değil.', 'Hava çok sıcak.'],
    situation: 'Ko‘chada',
    uzbek: 'Yordam bera olasizmi?',
    level: 'A2',
  },
  {
    prompt: 'Telefonunuz çalışmıyor mu?',
    answer: 'Galiba şarjı bitmiş, bir bakayım.',
    options: ['Numaranızı yazdım.', 'Mesaj gönderdim.', 'Sesini duyamıyorum.'],
    situation: 'Idorada',
    uzbek: 'Telefoningiz ishlamayaptimi?',
    level: 'A2',
  },
  {
    prompt: 'Kolay gelsin!',
    answer: 'Sağ olun, teşekkür ederim.',
    options: ['Hoş geldiniz.', 'Afiyet olsun.', 'Geçmiş olsun.'],
    situation: 'Ishlayotgan odamga',
    uzbek: 'Ishingiz oson bo‘lsin!',
    level: 'A2',
  },

  // ───────── B1: fikr bildirish, muammo hal qilish ─────────
  {
    prompt: 'Bu konuda ne düşünüyorsun?',
    answer: 'Bence fikir iyi ama uygulaması zor olabilir.',
    options: ['Evet, saat dörtte.', 'Hayır, hiç gitmedim.', 'Teşekkür ederim, sağ ol.'],
    situation: 'Yig‘ilishda',
    uzbek: 'Bu haqda nima deb o‘ylaysan?',
    level: 'B1',
  },
  {
    prompt: 'Siparişim hâlâ gelmedi.',
    answer: 'Özür dileriz, hemen kontrol edip size dönüyorum.',
    options: ['Sipariş vermek ister misiniz?', 'Kart mı, nakit mi?', 'Adresinizi biliyorum.'],
    situation: 'Mijoz xizmati',
    uzbek: 'Buyurtmam hali kelmadi.',
    level: 'B1',
  },
  {
    prompt: 'Neden bu işi seçtiniz?',
    answer: 'İnsanlarla çalışmayı sevdiğim için bu alanı tercih ettim.',
    options: ['Beş yıldır buradayım.', 'Maaş yeterli değil.', 'Pazartesi başlıyorum.'],
    situation: 'Ish suhbati',
    uzbek: 'Nega bu ishni tanladingiz?',
    level: 'B1',
  },
  {
    prompt: 'Toplantıyı erteleyebilir miyiz?',
    answer: 'Tabii, perşembeye alalım o zaman.',
    options: ['Toplantı odası ikinci katta.', 'Sunumu ben hazırladım.', 'Herkes geldi mi?'],
    situation: 'Ishda',
    uzbek: 'Yig‘ilishni keyinga qoldirsak bo‘ladimi?',
    level: 'B1',
  },
  {
    prompt: 'Bu kelimenin anlamını açıklar mısınız?',
    answer: 'Elbette, “ertelemek” bir işi sonraya bırakmak demek.',
    options: ['Sözlüğe bakın.', 'Ben de bilmiyorum.', 'Yarın sınav var.'],
    situation: 'Darsda',
    uzbek: 'Bu so‘zning ma‘nosini tushuntirasizmi?',
    level: 'B1',
  },
  {
    prompt: 'Tatilde nereye gitmeyi planlıyorsun?',
    answer: 'Henüz karar vermedim ama deniz kenarı olsun istiyorum.',
    options: ['Geçen yıl Ankara’daydım.', 'Uçak bileti pahalı.', 'Valizimi hazırladım.'],
    situation: 'Suhbat',
    uzbek: 'Ta‘tilda qayerga borishni rejalashtiryapsan?',
    level: 'B1',
  },
  {
    prompt: 'Sence hangisi daha mantıklı?',
    answer: 'İkincisi, çünkü hem daha ucuz hem daha hızlı.',
    options: ['İkisi de güzel.', 'Bilmiyorum, sen seç.', 'Evet, haklısın.'],
    situation: 'Qaror qabul qilish',
    uzbek: 'Senimcha qaysi biri mantiqliroq?',
    level: 'B1',
  },
  {
    prompt: 'Geçmiş olsun, nasılsınız?',
    answer: 'Teşekkür ederim, artık kendimi çok daha iyi hissediyorum.',
    options: ['Hastaneye gideceğim.', 'Doktor bekliyor.', 'İlaç almadım.'],
    situation: 'Kasallikdan keyin',
    uzbek: 'Tuzalib keting, qalaysiz?',
    level: 'B1',
  },

  // ───────── B2 / C1: nozik ohang ─────────
  {
    prompt: 'Maalesef teklifinizi kabul edemiyoruz.',
    answer: 'Anlıyorum. Yine de değerlendirdiğiniz için teşekkür ederim.',
    options: ['Öyleyse iptal edelim.', 'Neden bu kadar geç söylediniz?', 'Tamam, başka yere giderim.'],
    situation: 'Ishbilarmonlik yozishmasi',
    uzbek: 'Afsuski taklifingizni qabul qila olmaymiz.',
    level: 'B2',
  },
  {
    prompt: 'Bu konuda size katılmıyorum.',
    answer: 'Görüşünüzü anlıyorum; belki ortak bir noktada buluşabiliriz.',
    options: ['O zaman konuşmayalım.', 'Siz her zaman haklısınız.', 'Bu konu beni ilgilendirmiyor.'],
    situation: 'Munozara',
    uzbek: 'Bu masalada siz bilan rozi emasman.',
    level: 'B2',
  },
  {
    prompt: 'Projede bir aksaklık yaşandı.',
    answer: 'Sorunun kaynağını tespit edip bir çözüm planı hazırlayalım.',
    options: ['Kim yaptı bunu?', 'Ben zaten söylemiştim.', 'Bu benim işim değil.'],
    situation: 'Jamoa bilan ishlash',
    uzbek: 'Loyihada nosozlik yuz berdi.',
    level: 'B2',
  },
  {
    prompt: 'Bu araştırmanın sonuçları ne anlama geliyor?',
    answer: 'Sonuçlar, düzenli tekrarın öğrenmede belirleyici olduğuna işaret ediyor.',
    options: ['Araştırma uzun sürdü.', 'Katılımcılar memnun kaldı.', 'Veriler bilgisayarda.'],
    situation: 'Akademik suhbat',
    uzbek: 'Bu tadqiqot natijalari nimani anglatadi?',
    level: 'C1',
  },
  {
    prompt: 'Eleştirilerinizi nasıl karşılıyorsunuz?',
    answer: 'Yapıcı eleştiriyi gelişmek için bir fırsat olarak görüyorum.',
    options: ['Eleştiriden hoşlanmam.', 'Kimse beni anlamıyor.', 'Herkes eleştiriyor.'],
    situation: 'Suhbat',
    uzbek: 'Tanqidlarni qanday qabul qilasiz?',
    level: 'C1',
  },
  {
    prompt: 'Bütçeyi aşmamız mümkün mü?',
    answer: 'Mümkün değil; ancak önceliklendirme yaparsak yetişebiliriz.',
    options: [
      'Bütçe her zaman yetersizdir.',
      'Muhasebe bilir, ben bilmem.',
      'O zaman projeyi iptal edelim.',
    ],
    situation: 'Byudjet muhokamasi',
    uzbek: 'Byudjetdan oshib ketishimiz mumkinmi?',
    level: 'B2',
  },
  {
    prompt: 'Bu gecikmenin sorumlusu kim?',
    answer: 'Tek bir kişiyi suçlamak yerine süreci gözden geçirelim.',
    options: [
      'Kesinlikle tedarikçi suçlu.',
      'Benim bir ilgim yok.',
      'Herkes elinden geleni yaptı zaten.',
    ],
    situation: 'Muammoni tahlil qilish',
    uzbek: 'Bu kechikishga kim javobgar?',
    level: 'B2',
  },
  {
    prompt: 'Önerinizi biraz daha açar mısınız?',
    answer: 'Tabii, isterseniz adım adım örnek üzerinden anlatayım.',
    options: [
      'Zaten anlattım, dinlemediniz.',
      'Daha fazla söyleyecek bir şeyim yok.',
      'Sunumda yazıyor, bakabilirsiniz.',
    ],
    situation: 'Taqdimot',
    uzbek: 'Taklifingizni biroz ochib bera olasizmi?',
    level: 'B2',
  },
  {
    prompt: 'Bu veriler genellenebilir mi?',
    answer: 'Örneklem sınırlı olduğu için genelleme yapmak doğru olmaz.',
    options: [
      'Evet, her duruma uyar.',
      'Veriler zaten yeterince çok.',
      'Genelleme her zaman faydalıdır.',
    ],
    situation: 'Ilmiy munozara',
    uzbek: 'Bu ma‘lumotlarni umumlashtirish mumkinmi?',
    level: 'C1',
  },
  {
    prompt: 'Görüşünüzü destekleyen bir kanıt var mı?',
    answer: 'Evet, iki bağımsız çalışma aynı eğilimi gösteriyor.',
    options: [
      'Herkes böyle düşünüyor.',
      'Kanıta gerek yok, açık bir durum.',
      'Bunu yıllardır söylüyorum.',
    ],
    situation: 'Dalil keltirish',
    uzbek: 'Fikringizni tasdiqlovchi dalil bormi?',
    level: 'C1',
  },
];

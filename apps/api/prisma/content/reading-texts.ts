// Original turkcha o'qish matnlari.
//
// MUALLIFLIK HUQUQI: bu matnlar shu loyiha uchun yozilgan. Hech bir
// nashriyotning darsligidan ko'chirilmagan. Shuning uchun ularni erkin
// nashr qilish, o'zgartirish va sotish mumkin.
//
// USTOZ UCHUN MUHIM: matnlar sun'iy intellekt yordamida yozilgan va
// TURKCHASI TEKSHIRILISHI KERAK. Ustoz har matnni o'qib, tabiiy
// bo'lmagan joylarini tuzatsin. Tuzatishni admin panelidan yoki
// shu faylda qilish mumkin.

export type SeedQuestion = {
  kind: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  prompt: string;
  options?: string[];
  correctIndex?: number;
  correctText?: string[];
  explanation?: string;
};

import { READING_TEXTS_2 } from './reading-texts-2.js';

export type SeedText = {
  slug: string;
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  topic: string;
  body: string;
  bodyUz: string;
  glossary: [string, string][];
  questions: SeedQuestion[];
};

const TEXTS_1: SeedText[] = [
  // ───────────────────────── A1 ─────────────────────────
  {
    slug: 'benim-ailem',
    title: 'Benim Ailem',
    level: 'A1',
    topic: 'oila',
    body: `Benim adım Leyla. Yirmi iki yaşındayım. Taşkent'te yaşıyorum.

Ailem küçük. Annem, babam ve bir kardeşim var. Annem öğretmen. O bir okulda çalışıyor. Babam doktor. Kardeşimin adı Timur. O on beş yaşında ve öğrenci.

Biz birlikte yaşıyoruz. Evimiz büyük değil ama çok rahat. Akşam hep birlikte yemek yiyoruz. Annem çok güzel yemek yapıyor.

Ben Türkçe öğreniyorum. Türkçe kolay değil ama çok seviyorum.`,
    bodyUz: `Mening ismim Layla. Yigirma ikki yoshdaman. Toshkentda yashayman.

Oilam kichik. Onam, dadam va bitta ukam bor. Onam o'qituvchi. U maktabda ishlaydi. Dadam shifokor. Ukamning ismi Temur. U o'n besh yoshda va o'quvchi.

Biz birga yashaymiz. Uyimiz katta emas, lekin juda qulay. Kechqurun doim birga ovqatlanamiz. Onam juda mazali ovqat qiladi.

Men turk tilini o'rganyapman. Turkcha oson emas, lekin juda yaxshi ko'raman.`,
    glossary: [
      ['ailem', 'mening oilam'],
      ['yaşıyorum', 'yashayman'],
      ['kardeşim', 'ukam / singlim'],
      ['öğretmen', "o'qituvchi"],
      ['çalışıyor', 'ishlaydi'],
      ['birlikte', 'birga'],
      ['rahat', 'qulay, shinam'],
      ['kolay', 'oson'],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Leyla kaç yaşında?',
        options: ['On beş yaşında', 'Yirmi iki yaşında', 'Yirmi yaşında'],
        correctIndex: 1,
        explanation: "Matnda \"Yirmi iki yaşındayım\" deyilgan — ya'ni 22 yoshda.",
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Leyla’nın annesi ne iş yapıyor?',
        options: ['Doktor', 'Öğretmen', 'Mühendis'],
        correctIndex: 1,
        explanation: '"Annem öğretmen" — onasi o\'qituvchi. Dadasi esa shifokor (doktor).',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Leyla’nın evi çok büyük.',
        correctIndex: 1,
        explanation: '"Evimiz büyük değil" — uy katta EMAS. Shuning uchun javob: xato.',
      },
      {
        kind: 'SHORT_ANSWER',
        prompt: 'Leyla’nın kardeşinin adı ne?',
        correctText: ['Timur'],
        explanation: '"Kardeşimin adı Timur."',
      },
    ],
  },
  {
    slug: 'bir-gunum',
    title: 'Bir Günüm',
    level: 'A1',
    topic: 'kundalik hayot',
    body: `Her sabah saat yedide kalkıyorum. Önce yüzümü yıkıyorum, sonra kahvaltı yapıyorum. Kahvaltıda çay içiyorum ve ekmek yiyorum.

Saat sekizde evden çıkıyorum. Okula otobüsle gidiyorum. Otobüs yolculuğu yirmi dakika sürüyor.

Derslerim saat dokuzda başlıyor ve saat üçte bitiyor. Öğlen arkadaşlarımla yemek yiyorum.

Akşam eve dönüyorum. Ödevimi yapıyorum, sonra biraz televizyon izliyorum. Saat on birde yatıyorum.`,
    bodyUz: `Har kuni ertalab soat yettida uyg'onaman. Avval yuzimni yuvaman, keyin nonushta qilaman. Nonushtada choy ichaman va non yeyman.

Soat sakkizda uydan chiqaman. Maktabga avtobusda boraman. Avtobus safari yigirma daqiqa davom etadi.

Darslarim soat to'qqizda boshlanadi va soat uchda tugaydi. Tushda do'stlarim bilan ovqatlanaman.

Kechqurun uyga qaytaman. Uy vazifamni qilaman, keyin bir oz televizor ko'raman. Soat o'n birda yotaman.`,
    glossary: [
      ['kalkıyorum', "uyg'onaman, o'rnimdan turaman"],
      ['kahvaltı', 'nonushta'],
      ['çıkıyorum', 'chiqaman'],
      ['yolculuk', 'safar, yo\'l'],
      ['sürüyor', 'davom etadi'],
      ['başlıyor', 'boshlanadi'],
      ['bitiyor', 'tugaydi'],
      ['dönüyorum', 'qaytaman'],
      ['ödev', 'uy vazifasi'],
      ['yatıyorum', 'yotaman'],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Saat kaçta kalkıyor?',
        options: ['Saat altıda', 'Saat yedide', 'Saat sekizde'],
        correctIndex: 1,
        explanation: '"Her sabah saat yedide kalkıyorum."',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Okula nasıl gidiyor?',
        options: ['Yürüyerek', 'Otobüsle', 'Arabayla'],
        correctIndex: 1,
        explanation: '"Okula otobüsle gidiyorum." -le/-la qo\'shimchasi vositani bildiradi.',
      },
      {
        kind: 'SHORT_ANSWER',
        prompt: 'Dersler saat kaçta bitiyor? (Sadece sayıyı yazın: üç)',
        correctText: ['üç', 'uc', 'saat üçte', 'üçte'],
        explanation: '"Saat üçte bitiyor."',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Otobüs yolculuğu bir saat sürüyor.',
        correctIndex: 1,
        explanation: 'Yigirma daqiqa — "yirmi dakika sürüyor". Shuning uchun xato.',
      },
    ],
  },

  // ───────────────────────── A2 ─────────────────────────
  {
    slug: 'pazara-gittim',
    title: 'Pazara Gittim',
    level: 'A2',
    topic: 'xarid',
    body: `Dün sabah annemle pazara gittik. Pazar evimize yakın, bu yüzden yürüyerek gittik.

Pazarda çok kalabalık vardı. Her yerde taze sebze ve meyve satıyorlardı. Annem domates, salatalık ve biber aldı. Ben de üzüm istedim ama çok pahalıydı, bu yüzden almadık.

Bir satıcı bize "Buyurun, elmalar çok tatlı!" dedi. Annem iki kilo elma aldı. Satıcı fiyatı biraz indirdi çünkü annem her hafta ondan alışveriş yapıyor.

Eve döndüğümüzde çantalar çok ağırdı. Ama alışveriş yapmayı seviyorum, çünkü pazarda hep yeni şeyler görüyorum.`,
    bodyUz: `Kecha ertalab onam bilan bozorga bordik. Bozor uyimizga yaqin, shuning uchun piyoda bordik.

Bozorda juda gavjum edi. Hamma joyda yangi sabzavot va meva sotayotgan edilar. Onam pomidor, bodring va qalampir oldi. Men esa uzum so'radim, lekin juda qimmat edi, shuning uchun olmadik.

Bir sotuvchi bizga "Marhamat, olmalar juda shirin!" dedi. Onam ikki kilo olma oldi. Sotuvchi narxni bir oz tushirdi, chunki onam har hafta undan xarid qiladi.

Uyga qaytganimizda sumkalar juda og'ir edi. Lekin xarid qilishni yaxshi ko'raman, chunki bozorda doim yangi narsalar ko'raman.`,
    glossary: [
      ['kalabalık', 'gavjum, odam ko\'p'],
      ['taze', 'yangi, toza (meva-sabzavot)'],
      ['salatalık', 'bodring'],
      ['biber', 'qalampir'],
      ['pahalı', 'qimmat'],
      ['satıcı', 'sotuvchi'],
      ['buyurun', 'marhamat'],
      ['indirdi', 'tushirdi (narxni)'],
      ['alışveriş', 'xarid'],
      ['ağır', "og'ir"],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Pazara nasıl gittiler?',
        options: ['Otobüsle', 'Yürüyerek', 'Taksiyle'],
        correctIndex: 1,
        explanation: 'Bozor yaqin bo\'lgani uchun piyoda — "yürüyerek gittik".',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Neden üzüm almadılar?',
        options: ['Üzüm yoktu', 'Üzüm pahalıydı', 'Üzüm sevmiyorlar'],
        correctIndex: 1,
        explanation: '"çok pahalıydı, bu yüzden almadık" — qimmat bo\'lgani uchun.',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Satıcı neden fiyatı indirdi?',
        options: [
          'Elmalar bozuktu',
          'Annesi onun düzenli müşterisi',
          'Çok elma aldılar',
        ],
        correctIndex: 1,
        explanation: '"çünkü annem her hafta ondan alışveriş yapıyor" — doimiy xaridor.',
      },
      {
        kind: 'SHORT_ANSWER',
        prompt: 'Annesi kaç kilo elma aldı? (sayıyla yazın)',
        correctText: ['iki', '2', 'iki kilo', '2 kilo'],
        explanation: '"Annem iki kilo elma aldı."',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Pazarda sebze ve meyve tazeydi.',
        correctIndex: 0,
        explanation: '"Her yerde taze sebze ve meyve satıyorlardı."',
      },
    ],
  },
  {
    slug: 'ilk-is-gunum',
    title: 'İlk İş Günüm',
    level: 'A2',
    topic: 'ish',
    body: `Geçen ay yeni bir işe başladım. Bir kafede çalışıyorum. İlk gün çok heyecanlıydım.

Sabah erken geldim çünkü geç kalmak istemedim. Müdür bana kafeyi gösterdi ve işimi anlattı. "Önce müşterileri selamlayacaksın, sonra siparişlerini alacaksın," dedi.

İlk müşteri yaşlı bir adamdı. Bir bardak çay istedi. Çayı götürdüm ama elim titredi ve biraz döktüm. Çok utandım. Ama adam gülümsedi ve "Sorun değil, ben de ilk günümde aynısını yaptım," dedi.

O gün çok yoruldum ama mutluydum. Şimdi işimi iyi yapıyorum ve müşteriler beni tanıyor.`,
    bodyUz: `O'tgan oy yangi ishga kirdim. Bir kafeda ishlayman. Birinchi kun juda hayajonda edim.

Ertalab erta keldim, chunki kechikishni istamadim. Boshliq menga kafeni ko'rsatdi va ishimni tushuntirdi. "Avval mijozlarni salomlashasan, keyin buyurtmalarini olasan," dedi.

Birinchi mijoz keksa bir odam edi. Bir piyola choy so'radi. Choyni olib bordim, lekin qo'lim qaltiradi va bir oz to'kdim. Juda uyaldim. Lekin odam jilmayib: "Muammo emas, men ham birinchi kunimda shunday qilganman," dedi.

O'sha kun juda charchadim, lekin xursand edim. Hozir ishimni yaxshi qilaman va mijozlar meni taniydi.`,
    glossary: [
      ['heyecanlı', 'hayajonli'],
      ['geç kalmak', 'kechikish'],
      ['müdür', 'boshliq, direktor'],
      ['anlattı', 'tushuntirdi'],
      ['selamlamak', 'salomlashish'],
      ['sipariş', 'buyurtma'],
      ['titredi', 'qaltiradi'],
      ['döktüm', "to'kdim"],
      ['utandım', 'uyaldim'],
      ['gülümsedi', 'jilmaydi'],
      ['yoruldum', 'charchadim'],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Nerede çalışıyor?',
        options: ['Bir okulda', 'Bir kafede', 'Bir mağazada'],
        correctIndex: 1,
        explanation: '"Bir kafede çalışıyorum."',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'İlk gün neden erken geldi?',
        options: ['Müdür istedi', 'Geç kalmak istemedi', 'Otobüs erken geldi'],
        correctIndex: 1,
        explanation: '"çünkü geç kalmak istemedim".',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yaşlı adam ne yaptı?',
        options: ['Şikayet etti', 'Gülümsedi ve onu rahatlattı', 'Kafeden çıktı'],
        correctIndex: 1,
        explanation: 'Jilmayib, "Sorun değil" dedi — tinchlantirdi.',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Anlatıcı ilk gününde hiç hata yapmadı.',
        correctIndex: 1,
        explanation: 'Choyni to\'kib yuborgan — "biraz döktüm". Shuning uchun xato.',
      },
    ],
  },

  // ───────────────────────── B1 ─────────────────────────
  {
    slug: 'sehirden-koye',
    title: 'Şehirden Köye',
    level: 'B1',
    topic: 'hayot tarzi',
    body: `Üç yıl önce büyük bir şehirde yaşıyordum. İyi bir işim vardı ve maaşım fena değildi. Ama her sabah kalabalık metroda sıkışıyordum ve akşam eve yorgun dönüyordum. Zamanla kendime şunu sormaya başladım: Böyle mi yaşamak istiyorum?

Sonunda bir karar verdim. İşimden ayrıldım ve büyükannemin köydeki evine taşındım. Arkadaşlarım bu kararı anlamadı. Bazıları "Pişman olacaksın," dedi.

İlk aylar gerçekten zor geçti. İnternet yavaştı, en yakın hastane kırk kilometre uzaktaydı. Alıştığım birçok şey yoktu.

Ama bir şey değişti: zamanım oldu. Sabahları bahçede çalışıyorum, öğleden sonra çevrimiçi ders veriyorum. Kazancım şehirdekinin yarısı kadar, ama masraflarım da çok azaldı.

Herkese köye taşınmasını önermiyorum. Bu benim için doğru oldu, başkası için olmayabilir. Önemli olan, hayatını başkalarının beklentilerine göre değil, kendi seçimine göre kurmak.`,
    bodyUz: `Uch yil oldin katta shaharda yashardim. Yaxshi ishim bor edi va maoshim yomon emasdi. Lekin har kuni ertalab gavjum metroda qisilardim va kechqurun uyga charchab qaytardim. Vaqt o'tib o'zimga savol bera boshladim: shunday yashashni istaymanmi?

Oxirida qaror qildim. Ishdan bo'shadim va buvimning qishloqdagi uyiga ko'chdim. Do'stlarim bu qarorni tushunmadi. Ba'zilari "Pushaymon bo'lasan," dedi.

Birinchi oylar rostdan qiyin kechdi. Internet sekin edi, eng yaqin kasalxona qirq kilometr uzoqda edi. Men ko'nikkan ko'p narsa yo'q edi.

Lekin bitta narsa o'zgardi: vaqtim bo'ldi. Ertalab bog'da ishlayman, tushdan keyin onlayn dars beraman. Daromadim shahardagining yarmicha, lekin xarajatlarim ham ancha kamaydi.

Hammaga qishloqqa ko'chishni tavsiya qilmayman. Bu men uchun to'g'ri bo'ldi, boshqa odam uchun bo'lmasligi mumkin. Muhimi — hayotini boshqalarning kutganiga qarab emas, o'z tanlovingga qarab qurish.`,
    glossary: [
      ['maaş', 'maosh'],
      ['sıkışmak', 'qisilish'],
      ['karar vermek', 'qaror qilish'],
      ['ayrılmak', "bo'shash, ketish"],
      ['taşınmak', "ko'chish"],
      ['pişman olmak', "pushaymon bo'lish"],
      ['alışmak', "ko'nikish"],
      ['çevrimiçi', 'onlayn'],
      ['kazanç', 'daromad'],
      ['masraf', 'xarajat'],
      ['önermek', 'tavsiya qilish'],
      ['beklenti', 'kutilgan narsa, umid'],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Anlatıcı şehirde yaşarken en çok neyden rahatsızdı?',
        options: [
          'Maaşı çok azdı',
          'Günlük yorgunluk ve kalabalık',
          'Arkadaşı yoktu',
        ],
        correctIndex: 1,
        explanation: 'Maoshi yomon emasdi; muammo gavjumlik va charchoq edi.',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Köyde ilk aylar neden zordu?',
        options: [
          'İş bulamadı',
          'Alıştığı imkânlar yoktu',
          'Büyükannesi yardım etmedi',
        ],
        correctIndex: 1,
        explanation: 'Sekin internet, uzoq kasalxona — ko\'nikkan imkoniyatlar yo\'q edi.',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Anlatıcının sonuç cümlesi ne anlatıyor?',
        options: [
          'Herkes köye taşınmalı',
          'Şehir hayatı kötüdür',
          'Her insan kendi seçimini yapmalı',
        ],
        correctIndex: 2,
        explanation: '"Herkese köye taşınmasını önermiyorum... kendi seçimine göre kurmak."',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Köyde kazancı şehirdekinden daha fazla.',
        correctIndex: 1,
        explanation: '"Kazancım şehirdekinin yarısı kadar" — yarmicha, ya\'ni kamroq.',
      },
      {
        kind: 'SHORT_ANSWER',
        prompt: 'En yakın hastane kaç kilometre uzaktaydı? (sayıyla)',
        correctText: ['kırk', '40', 'kırk kilometre', '40 km'],
        explanation: '"en yakın hastane kırk kilometre uzaktaydı".',
      },
    ],
  },

  // ───────────────────────── B2 ─────────────────────────
  {
    slug: 'dil-ogrenmenin-sirri',
    title: 'Dil Öğrenmenin Sırrı Var mı?',
    level: 'B2',
    topic: 'ta\'lim',
    body: `İnternette sık sık şöyle başlıklar görüyoruz: "Otuz günde akıcı İngilizce", "Beyninizi hackleyin, bir ayda dil öğrenin". Bu vaatler kulağa hoş geliyor, ama dil öğrenmenin gerçeği biraz daha sıkıcı.

Dil öğrenimi üzerine yapılan çalışmalar, en belirleyici etkenin yetenek değil, düzenli temas olduğuna işaret ediyor. Günde yirmi dakika çalışan biri, haftada bir kez üç saat çalışan birinden genellikle daha hızlı ilerliyor. Çünkü beyin, bilgiyi tekrar tekrar gördüğünde onu önemli sayıyor ve uzun süreli hafızaya aktarıyor.

İkinci önemli nokta, hata yapma özgürlüğü. Konuşmaktan çekinen öğrenciler, dilbilgisini çok iyi bilseler bile konuşmada geride kalıyor. Hata, öğrenmenin yan etkisi değil, bizzat yöntemidir.

Üçüncüsü ise anlamlı içerik. Ezberlenen kelime listeleri çabuk uçup gidiyor; ama bir hikâyede, şarkıda ya da gerçek bir sohbette karşılaşılan kelime akılda kalıyor. Bu yüzden ilgi alanınıza uygun malzeme seçmek, yöntem seçmekten daha önemli olabilir.

Peki sır nerede? Aslında yok. Düzenlilik, hata yapma cesareti ve sevdiğiniz içerik. Bunlar sıkıcı görünebilir, ama işleyen tek yol bu.`,
    bodyUz: `Internetda tez-tez shunday sarlavhalarni ko'ramiz: "O'ttiz kunda ravon ingliz tili", "Miyangizni hack qiling, bir oyda til o'rganing". Bu va'dalar quloqqa yoqimli, lekin til o'rganishning haqiqati bir oz zerikarliroq.

Til o'rganish bo'yicha olib borilgan tadqiqotlar eng belgilovchi omil qobiliyat emas, balki muntazam muloqot ekaniga ishora qiladi. Kuniga yigirma daqiqa shug'ullanadigan odam, haftada bir marta uch soat shug'ullanadiganga qaraganda odatda tezroq rivojlanadi. Chunki miya ma'lumotni qayta-qayta ko'rganda uni muhim deb hisoblaydi va uzoq muddatli xotiraga o'tkazadi.

Ikkinchi muhim nuqta — xato qilish erkinligi. Gapirishdan qo'rqadigan o'quvchilar grammatikani juda yaxshi bilsalar ham, gapirishda orqada qoladi. Xato — o'rganishning yon ta'siri emas, aynan uslubi.

Uchinchisi — ma'noli kontent. Yodlangan so'z ro'yxatlari tez uchib ketadi; lekin hikoyada, qo'shiqda yoki haqiqiy suhbatda uchragan so'z yodda qoladi. Shuning uchun qiziqishingizga mos material tanlash, uslub tanlashdan muhimroq bo'lishi mumkin.

Xo'sh, sir qayerda? Aslida yo'q. Muntazamlik, xato qilish jasorati va yoqtirgan kontentingiz. Bular zerikarli ko'rinishi mumkin, lekin ishlaydigan yagona yo'l shu.`,
    glossary: [
      ['vaat', "va'da"],
      ['sıkıcı', 'zerikarli'],
      ['belirleyici', 'belgilovchi'],
      ['etken', 'omil'],
      ['düzenli', 'muntazam'],
      ['temas', 'muloqot, tegish'],
      ['aktarmak', "o'tkazish"],
      ['çekinmek', "qo'rqish, tortinish"],
      ['dilbilgisi', 'grammatika'],
      ['yan etki', "yon ta'sir"],
      ['bizzat', 'aynan, shaxsan'],
      ['ezberlemek', 'yodlash'],
      ['malzeme', 'material'],
      ['cesaret', 'jasorat'],
    ],
    questions: [
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Metne göre dil öğrenmede en belirleyici etken nedir?',
        options: ['Doğal yetenek', 'Düzenli temas', 'İyi bir öğretmen'],
        correctIndex: 1,
        explanation: '"en belirleyici etkenin yetenek değil, düzenli temas olduğuna işaret ediyor".',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yazar hata yapmak konusunda ne düşünüyor?',
        options: [
          'Hata öğrenmeyi yavaşlatır',
          'Hata öğrenmenin yöntemidir',
          'Hata sadece başlangıçta normaldir',
        ],
        correctIndex: 1,
        explanation: '"Hata, öğrenmenin yan etkisi değil, bizzat yöntemidir."',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Yazar neden ezberlenen kelime listelerine karşı?',
        options: [
          'Çok zaman alıyor',
          'Bağlamsız oldukları için çabuk unutuluyor',
          'Öğretmenler sevmiyor',
        ],
        correctIndex: 1,
        explanation: '"Ezberlenen kelime listeleri çabuk uçup gidiyor" — hikoya/suhbatdagi so\'z yodda qoladi.',
      },
      {
        kind: 'MULTIPLE_CHOICE',
        prompt: 'Metnin genel tonu nasıl?',
        options: [
          'Hızlı sonuç vaat eden reklam dili',
          'Gerçekçi ve iddiasız',
          'Öğrencileri suçlayan',
        ],
        correctIndex: 1,
        explanation: 'Muallif "sir yo\'q" deydi va oddiy, haqiqiy yo\'lni ko\'rsatadi.',
      },
      {
        kind: 'TRUE_FALSE',
        prompt: 'Yazara göre günde yirmi dakika çalışmak, haftada bir kez üç saat çalışmaktan daha etkilidir.',
        correctIndex: 0,
        explanation: 'Matnda aynan shunday yozilgan — muntazamlik muhimroq.',
      },
    ],
  },
];

// Ikkinchi to'plam alohida faylda (bitta fayl juda uzayib ketmasin).
// Ro'yxat tartibi = o'quvchiga ko'rinadigan tartib, shuning uchun
// darajama-daraja qo'shiladi.
export const READING_TEXTS: SeedText[] = [...TEXTS_1, ...READING_TEXTS_2];

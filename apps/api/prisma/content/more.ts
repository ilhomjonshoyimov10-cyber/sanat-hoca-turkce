// QO'SHIMCHA O'YIN KONTENTI — barcha darajalar, ayniqsa B2 va C1.
//
// Nega alohida fayl: asosiy fayllar katta, bu yerda esa "yangi to'plam"
// bir joyda ko'rinadi — ustoz tekshirishi oson. Har bir massiv tegishli
// asosiy faylning oxirida unga qo'shiladi (clozeItems.push(...) va h.k.),
// shuning uchun seeder ham, tekshiruv (pnpm content:check) ham ularni ko'radi.
//
// Qoidalar (check-content.ts tekshiradi):
//   • bo'shliqda faqat BITTA to'g'ri javob bo'lsin — chalg'ituvchi
//     grammatik jihatdan ham to'g'ri bo'lib qolmasin;
//   • mavzu yorlig'i javobni oshkor qilmasin;
//   • zid juftlikda ikkinchi so'z bir darajada takrorlanmasin.
//
// TEKSHIRISH KERAK: ustoz turkcha jumlalarni ko'rib chiqsin.

import type { Cloze } from './cloze.js';
import type { Dialogue } from './dialogues.js';
import type { SeedDrill, SeedSentence } from './drills.js';
import type { Pair } from './pairs.js';
import type { Topic } from './topics.js';
import type { Verb } from './verbs.js';

// ═════════════════════════ Bo'shliqni to'ldirish ═════════════════════════

export const moreCloze: Cloze[] = [
  // ── A1 ──
  {
    full: 'Ben sabah yedide kalkıyorum.', masked: 'Ben sabah yedi___ kalkıyorum.', answer: 'de',
    options: ['da', 'te', 'ta'], uzbek: 'Men ertalab yettida turaman.',
    explanation: 'yedi — oxirgi unli «i» (ingichka), oxirgi tovush unli → -de.', topic: 'Vaqt', level: 'A1',
  },
  {
    full: 'Saat üçte buluşalım.', masked: 'Saat üç___ buluşalım.', answer: 'te',
    options: ['de', 'ta', 'da'], uzbek: 'Soat uchda uchrashaylik.',
    explanation: 'üç — oxirgi unli «ü» (ingichka), oxirgi undosh «ç» jarangsiz → -te.', topic: 'Vaqt', level: 'A1',
  },
  {
    full: 'Biz parka gidiyoruz.', masked: 'Biz park___ gidiyoruz.', answer: 'a',
    options: ['e', 'ya', 'ye'], uzbek: 'Biz bog‘ga ketyapmiz.',
    explanation: 'park — oxirgi unli «a» (qalin), undosh bilan tugagan → -a (bufer «y» kerak emas).', topic: 'Yo‘nalish kelishigi', level: 'A1',
  },
  {
    full: 'Ali Ankara’dan geliyor.', masked: 'Ali Ankara’___ geliyor.', answer: 'dan',
    options: ['den', 'tan', 'ten'], uzbek: 'Ali Anqaradan kelyapti.',
    explanation: 'Ankara — oxirgi unli «a», unli bilan tugagan → -dan. Atoqli otga apostrof bilan qo‘shiladi.', topic: 'Chiqish kelishigi', level: 'A1',
  },
  {
    full: 'Benim iki kardeşim var.', masked: 'Benim iki kardeş___ var.', answer: 'im',
    options: ['ım', 'um', 'üm'], uzbek: 'Mening ikki aka-ukam bor.',
    explanation: 'kardeş — oxirgi unli «e» → «men»ning egaligi -im.', topic: 'Egalik (men)', level: 'A1',
  },
  {
    full: 'Kediler bahçede oynuyor.', masked: 'Kedi___ bahçede oynuyor.', answer: 'ler',
    options: ['lar', 'leri', 'ları'], uzbek: 'Mushuklar bog‘da o‘ynayapti.',
    explanation: 'kedi — oxirgi unli «i» (ingichka) → -ler.', topic: 'Ko‘plik', level: 'A1',
  },
  {
    full: 'Sen öğretmen misin?', masked: 'Sen öğretmen ___?', answer: 'misin',
    options: ['mısın', 'musun', 'müsün'], uzbek: 'Sen o‘qituvchimisan?',
    explanation: 'Savol yuklamasi alohida yoziladi. öğretmen — oxirgi unli «e» → mi + -sin.', topic: 'Savol yuklamasi', level: 'A1',
  },

  // ── A2 ──
  {
    full: 'Geçen yıl Türkiye’ye gittik.', masked: 'Geçen yıl Türkiye’___ gittik.', answer: 'ye',
    options: ['ya', 'e', 'a'], uzbek: 'O‘tgan yili Turkiyaga bordik.',
    explanation: 'Türkiye unli «e» bilan tugaydi → bufer «y» + -e.', topic: 'Yo‘nalish kelishigi', level: 'A2',
  },
  {
    full: 'Akşam yemeğinden sonra yürüyüş yaptık.', masked: 'Akşam yemeğin___ sonra yürüyüş yaptık.', answer: 'den',
    options: ['dan', 'ten', 'de'], uzbek: 'Kechki ovqatdan keyin sayr qildik.',
    explanation: '«sonra» oldidan chiqish kelishigi keladi. Oxirgi unli «i» → -den.', topic: 'Ko‘makchilar', level: 'A2',
  },
  {
    full: 'Kardeşim benden daha uzun.', masked: 'Kardeşim ben___ daha uzun.', answer: 'den',
    options: ['de', 'e', 'im'], uzbek: 'Ukam mendan bo‘yi uzunroq.',
    explanation: 'Taqqoslashda chiqish kelishigi: «mendan uzunroq» → benden daha uzun.', topic: 'Taqqoslash', level: 'A2',
  },
  {
    full: 'Çay mı içersin, kahve mi?', masked: 'Çay ___ içersin, kahve mi?', answer: 'mı',
    options: ['mi', 'mu', 'mü'], uzbek: 'Choy ichasanmi, qahvami?',
    explanation: 'çay — oxirgi unli «a» (qalin, yoyiq) → mı.', topic: 'Savol yuklamasi', level: 'A2',
  },
  {
    full: 'Bu yemeği annem için yaptım.', masked: 'Bu yemeği annem ___ yaptım.', answer: 'için',
    options: ['ile', 'gibi', 'kadar'], uzbek: 'Bu ovqatni onam uchun tayyorladim.',
    explanation: '«uchun» ma‘nosi — için.', topic: 'Ko‘makchilar', level: 'A2',
  },
  {
    full: 'Otobüsle işe gidiyorum.', masked: 'Otobüs___ işe gidiyorum.', answer: 'le',
    options: ['la', 'te', 'den'], uzbek: 'Ishga avtobusda boraman.',
    explanation: '-le («ile» qisqargan): vosita. otobüs — oxirgi unli «ü» (ingichka) → -le.', topic: 'Vosita', level: 'A2',
  },
  {
    full: 'Dün akşam evde değildim.', masked: 'Dün akşam evde değil___.', answer: 'dim',
    options: ['dım', 'tim', 'im'], uzbek: 'Kecha kechqurun uyda emas edim.',
    explanation: 'değil + o‘tgan zamon -di + -m. «l» jarangli → -d-, oxirgi unli «i» → -dim.', topic: 'O‘tgan zamon', level: 'A2',
  },
  {
    full: 'Sabahları koşmayı seviyorum.', masked: 'Sabahları koş___ seviyorum.', answer: 'mayı',
    options: ['mak', 'meyi', 'ma'], uzbek: 'Ertalablari yugurishni yaxshi ko‘raman.',
    explanation: '«sevmek» tushum kelishigini talab qiladi: koşmak → koşma + -yı.', topic: 'Masdar', level: 'A2',
  },

  // ── B1 ──
  {
    full: 'Kitabı okuyan öğrenci çok mutluydu.', masked: 'Kitabı oku___ öğrenci çok mutluydu.', answer: 'yan',
    options: ['yen', 'duğu', 'an'], uzbek: 'Kitobni o‘qigan talaba juda xursand edi.',
    explanation: 'Sifatdosh -(y)an: «o‘qigan talaba». Fe‘l unli bilan tugagani uchun «y» qo‘shiladi.', topic: 'Sifatdosh', level: 'B1',
  },
  {
    full: 'Ders bittikten sonra kafeye gittik.', masked: 'Ders bit___ sonra kafeye gittik.', answer: 'tikten',
    options: ['tiğinde', 'meden', 'ince'], uzbek: 'Dars tugagandan keyin kafega bordik.',
    explanation: '-dıktan sonra: «...gandan keyin». bit- jarangsiz «t» bilan tugaydi → -tikten.', topic: 'Ravishdosh', level: 'B1',
  },
  {
    full: 'Keşke daha çok çalışsaydım.', masked: 'Keşke daha çok çalış___.', answer: 'saydım',
    options: ['acağım', 'tım', 'ıyorum'], uzbek: 'Qani edi, ko‘proq o‘qiganimda.',
    explanation: 'keşke + -sa + -ydı + -m: o‘tmishdagi afsus. Keşke kelasi yoki aniq o‘tgan zamon bilan kelmaydi.', topic: 'Istak mayli', level: 'B1',
  },
  {
    full: 'Bu işi yapmak için zamana ihtiyacım var.', masked: 'Bu işi yapmak için zaman___ ihtiyacım var.', answer: 'a',
    options: ['ı', 'da', 'dan'], uzbek: 'Bu ishni qilish uchun menga vaqt kerak.',
    explanation: '«ihtiyaç» yo‘nalish kelishigini talab qiladi: bir şeye ihtiyaç.', topic: 'Boshqaruv', level: 'B1',
  },
  {
    full: 'Sen gelmeden önce yemek hazırdı.', masked: 'Sen gel___ önce yemek hazırdı.', answer: 'meden',
    options: ['dikten', 'ince', 'erek'], uzbek: 'Sen kelmasdan oldin ovqat tayyor edi.',
    explanation: '-meden önce: «...masdan oldin».', topic: 'Ravishdosh', level: 'B1',
  },
  {
    full: 'Ödevini bitirirsen dışarı çıkabilirsin.', masked: 'Ödevini bitirir___ dışarı çıkabilirsin.', answer: 'sen',
    options: ['san', 'sin', 'di'], uzbek: 'Uy vazifangni tugatsang, tashqariga chiqishing mumkin.',
    explanation: 'Shart: keng zamon -ir + -se + -n. Oxirgi unli «i» → -sen.', topic: 'Shart mayli', level: 'B1',
  },
  {
    full: 'Bu evde yaşadığımız yıllar çok güzeldi.', masked: 'Bu evde yaşa___ yıllar çok güzeldi.', answer: 'dığımız',
    options: ['yan', 'r', 'mak'], uzbek: 'Bu uyda yashagan yillarimiz juda go‘zal edi.',
    explanation: '-dık + -ımız: «biz yashagan yillar».', topic: 'Sifatdosh', level: 'B1',
  },

  // ── B2 ──
  {
    full: 'Ne kadar çalışırsa çalışsın, sonuç değişmedi.', masked: 'Ne kadar çalışırsa ___, sonuç değişmedi.', answer: 'çalışsın',
    options: ['çalıştı', 'çalışacak', 'çalışıyor'], uzbek: 'Qancha ishlamasin, natija o‘zgarmadi.',
    explanation: '«ne kadar ...-sa ...-sın» — «qancha ... -masin». Ikkinchi fe‘l istak-buyruq shaklida keladi.', topic: 'To‘siqsizlik', level: 'B2',
  },
  {
    full: 'Gelir gelmez beni aradı.', masked: 'Gelir ___ beni aradı.', answer: 'gelmez',
    options: ['gelmeden', 'gelince', 'gelmiş'], uzbek: 'Kelishi bilanoq menga qo‘ng‘iroq qildi.',
    explanation: '-ır ...-maz: «...ishi bilanoq». Bir fe‘l ikki marta: bo‘lishli va bo‘lishsiz keng zamon.', topic: 'Ravishdosh', level: 'B2',
  },
  {
    full: 'Hava kararmak üzereydi.', masked: 'Hava kararmak ___.', answer: 'üzereydi',
    options: ['içindi', 'gibiydi', 'yerineydi'], uzbek: 'Havo qorong‘i tushay deb qolgan edi.',
    explanation: '-mak üzere: harakat yaqinligi, «...ay deb qolgan».', topic: 'Harakat yaqinligi', level: 'B2',
  },
  {
    full: 'Sınavı geçebilmek için her gün çalışıyor.', masked: 'Sınavı geç___ için her gün çalışıyor.', answer: 'ebilmek',
    options: ['tiği', 'ecek', 'meden'], uzbek: 'Imtihondan o‘ta olish uchun har kuni o‘qiyapti.',
    explanation: '-(y)ebilmek için: «...a olish uchun» (maqsad + imkoniyat).', topic: 'Maqsad', level: 'B2',
  },
  {
    full: 'Onun söylediklerine göre toplantı iptal edildi.', masked: 'Onun söylediklerine ___ toplantı iptal edildi.', answer: 'göre',
    options: ['rağmen', 'kadar', 'karşın'], uzbek: 'Uning aytganlariga ko‘ra, yig‘ilish bekor qilindi.',
    explanation: '-a göre: manba, «...ga ko‘ra».', topic: 'Manba', level: 'B2',
  },
  {
    full: 'İster otobüsle ister trenle gidebilirsin.', masked: '___ otobüsle ister trenle gidebilirsin.', answer: 'İster',
    options: ['Hem', 'Ne', 'Ya'], uzbek: 'Xohlasang avtobusda, xohlasang poyezdda borishing mumkin.',
    explanation: '«ister ... ister»: juft bog‘lovchi, ikkala qismi bir xil bo‘ladi.', topic: 'Bog‘lovchilar', level: 'B2',
  },
  {
    full: 'Yorgun olduğundan erken yattı.', masked: 'Yorgun olduğu___ erken yattı.', answer: 'ndan',
    options: ['nda', 'na', 'nu'], uzbek: 'Charchagani uchun erta yotdi.',
    explanation: '-dığından: sabab, «...gani uchun».', topic: 'Sabab', level: 'B2',
  },
  {
    full: 'Ne kadar erken gelirsen o kadar iyi olur.', masked: 'Ne kadar erken gelirsen o ___ iyi olur.', answer: 'kadar',
    options: ['gibi', 'göre', 'için'], uzbek: 'Qancha erta kelsang, shuncha yaxshi.',
    explanation: '«ne kadar ... o kadar»: «qancha ... shuncha».', topic: 'Mutanosiblik', level: 'B2',
  },

  // ── C1 ──
  {
    full: 'Raporun sonuç bölümünde önerilere yer verilmiştir.', masked: 'Raporun sonuç bölümünde önerilere ___ verilmiştir.', answer: 'yer',
    options: ['söz', 'karar', 'izin'], uzbek: 'Hisobotning xulosa qismida takliflar keltirilgan.',
    explanation: '«-e yer vermek»: «...ga o‘rin bermoq», ya‘ni kiritmoq. Rasmiy matnlarda juda ko‘p uchraydi.', topic: 'Turg‘un birikmalar', level: 'C1',
  },
  {
    full: 'Alınan önlemler, beklenen sonucu vermekten uzak kaldı.', masked: 'Alınan önlemler, beklenen sonucu vermekten ___ kaldı.', answer: 'uzak',
    options: ['yakın', 'sonra', 'önce'], uzbek: 'Ko‘rilgan choralar kutilgan natijani berishdan yiroq qoldi.',
    explanation: '«-mekten uzak kalmak»: «...dan yiroq qolmoq», ya‘ni uddalay olmadi.', topic: 'Turg‘un birikmalar', level: 'C1',
  },
  {
    full: 'Konunun önemi göz önünde bulundurularak karar ertelendi.', masked: 'Konunun önemi göz önünde ___ karar ertelendi.', answer: 'bulundurularak',
    options: ['bakılarak', 'olarak', 'gelerek'], uzbek: 'Masalaning muhimligi inobatga olinib, qaror kechiktirildi.',
    explanation: '«göz önünde bulundurmak»: inobatga olmoq. Majhul + -arak: «inobatga olinib».', topic: 'Rasmiy uslub', level: 'C1',
  },
  {
    full: 'Bu iddia, hiçbir bilimsel temele dayanmamaktadır.', masked: 'Bu iddia, hiçbir bilimsel temele ___.', answer: 'dayanmamaktadır',
    options: ['dayanmaktadır', 'dayanmıştır', 'dayanacaktır'], uzbek: 'Bu da‘vo hech qanday ilmiy asosga tayanmaydi.',
    explanation: '«hiçbir» doim bo‘lishsiz fe‘l bilan keladi — qolgan uchta variant bo‘lishli.', topic: 'Inkor moslashuvi', level: 'C1',
  },
  {
    full: 'Mademki kararını verdin, arkasında durmalısın.', masked: '___ kararını verdin, arkasında durmalısın.', answer: 'Mademki',
    options: ['Halbuki', 'Oysa', 'Meğer'], uzbek: 'Modomiki qaroringni berding, endi uning ortida tur.',
    explanation: '«Mademki»: «modomiki, ...ekan» — sabab. Halbuki/Oysa — zidlik, Meğer — kutilmagan kashfiyot.', topic: 'Bog‘lovchilar', level: 'C1',
  },
  {
    full: 'Görünen o ki, taraflar uzlaşmaya varamayacak.', masked: 'Görünen ___ ki, taraflar uzlaşmaya varamayacak.', answer: 'o',
    options: ['bu', 'şu', 'ne'], uzbek: 'Ko‘rinishidan, tomonlar kelishuvga kela olmaydi.',
    explanation: '«Görünen o ki» — turg‘un ibora: «ko‘rinishidan, aftidan».', topic: 'Turg‘un birikmalar', level: 'C1',
  },
  {
    full: 'Uzmanlar, söz konusu ilacın yan etkileri konusunda uyarıda bulundu.', masked: 'Uzmanlar, söz konusu ilacın yan etkileri konusunda uyarıda ___.', answer: 'bulundu',
    options: ['yaptı', 'etti', 'oldu'], uzbek: 'Mutaxassislar ushbu dorining nojo‘ya ta‘siri haqida ogohlantirdi.',
    explanation: '«uyarıda bulunmak» — rasmiy «ogohlantirmoq». «uyarı yapmak» -da siz keladi.', topic: 'Rasmiy uslub', level: 'C1',
  },
  {
    full: 'Bu yöntem, maliyetleri düşürmenin yanı sıra kaliteyi de artırıyor.', masked: 'Bu yöntem, maliyetleri düşürmenin yanı ___ kaliteyi de artırıyor.', answer: 'sıra',
    options: ['sonra', 'gibi', 'kadar'], uzbek: 'Bu usul xarajatlarni kamaytirish bilan birga sifatni ham oshiradi.',
    explanation: '«-in yanı sıra»: «...bilan bir qatorda».', topic: 'Bog‘lovchilar', level: 'C1',
  },
];

// ═════════════════════════ Suhbat ═════════════════════════

export const moreDialogues: Dialogue[] = [
  // ── A1 ──
  { prompt: 'Kaç yaşındasın?', answer: 'On sekiz yaşındayım.', options: ['Taşkent’te oturuyorum.', 'Çok teşekkürler.', 'Saat beşte.'], situation: 'Tanishuv', uzbek: 'Necha yoshdasan?', level: 'A1' },
  { prompt: 'Ne iş yapıyorsun?', answer: 'Öğretmenim, bir okulda çalışıyorum.', options: ['Evet, çok seviyorum.', 'Ali ile geldim.', 'Bugün pazartesi.'], situation: 'Tanishuv', uzbek: 'Nima ish qilasan?', level: 'A1' },
  { prompt: 'Günaydın!', answer: 'Günaydın! Nasılsınız?', options: ['İyi geceler!', 'Afiyet olsun!', 'Güle güle!'], situation: 'Salomlashish', uzbek: 'Xayrli tong!', level: 'A1' },
  { prompt: 'Çay ister misin?', answer: 'Evet, lütfen. Şekersiz olsun.', options: ['Hayır, ben öğrenciyim.', 'Saat on iki.', 'Evet, ben Buharalıyım.'], situation: 'Mehmonda', uzbek: 'Choy xohlaysanmi?', level: 'A1' },
  { prompt: 'Bugün günlerden ne?', answer: 'Bugün çarşamba.', options: ['Bugün hava güzel.', 'Ben yirmi yaşındayım.', 'Okula gidiyorum.'], situation: 'Vaqt', uzbek: 'Bugun haftaning qaysi kuni?', level: 'A1' },

  // ── A2 ──
  { prompt: 'Bu otobüs Kızılay’a gider mi?', answer: 'Hayır, üç numaralı otobüse binmeniz lazım.', options: ['Evet, bilet çok pahalı.', 'Hayır, ben Ankaralı değilim.', 'Evet, yarın gidiyorum.'], situation: 'Transport', uzbek: 'Bu avtobus Qiziloyga boradimi?', level: 'A2' },
  { prompt: 'Hafta sonu ne yaptın?', answer: 'Ailemle pikniğe gittik.', options: ['Haftaya gideceğim.', 'Her gün çalışıyorum.', 'Pazartesi başlıyor.'], situation: 'Bo‘sh vaqt', uzbek: 'Dam olish kunlari nima qilding?', level: 'A2' },
  { prompt: 'Rezervasyonunuz var mı?', answer: 'Evet, Yılmaz adına iki kişilik.', options: ['Hayır, menüyü istemiyorum.', 'Evet, hesap lütfen.', 'Hayır, ben vejetaryenim.'], situation: 'Restoranda', uzbek: 'Joy band qilganmisiz?', level: 'A2' },
  { prompt: 'Başın mı ağrıyor?', answer: 'Evet, sabahtan beri ağrıyor.', options: ['Evet, çok lezzetli.', 'Hayır, iki kardeşim var.', 'Evet, otobüsle geldim.'], situation: 'Salomatlik', uzbek: 'Boshing og‘riyaptimi?', level: 'A2' },
  { prompt: 'Hangi bedeni giyiyorsunuz?', answer: 'Genellikle orta beden giyiyorum.', options: ['Kasada ödeyeceğim.', 'Dün aldım.', 'Mağaza saat dokuzda açılıyor.'], situation: 'Do‘konda', uzbek: 'Qaysi o‘lchamni kiyasiz?', level: 'A2' },

  // ── B1 ──
  { prompt: 'Daha önce hiç Türkiye’ye gittin mi?', answer: 'Evet, iki yıl önce İstanbul’a gitmiştim.', options: ['Evet, yarın gideceğim.', 'Hayır, Türkçe çok zor.', 'Evet, her gün gidiyorum.'], situation: 'Sayohat', uzbek: 'Ilgari hech Turkiyaga borganmisan?', level: 'B1' },
  { prompt: 'İşten neden ayrıldın?', answer: 'Daha iyi bir teklif aldığım için.', options: ['Saat dokuzda başlıyor.', 'Çünkü yarın tatil.', 'Maaşım çok yüksekti, o yüzden kaldım.'], situation: 'Ish', uzbek: 'Nega ishdan ketding?', level: 'B1' },
  { prompt: 'Bu daireyi kiralamak istiyorum, depozito ne kadar?', answer: 'İki aylık kira tutarında.', options: ['Daire üçüncü katta.', 'Anahtarı kaybettim.', 'Kira her ay ödenmez.'], situation: 'Uy ijarasi', uzbek: 'Bu kvartirani ijaraga olmoqchiman, garov puli qancha?', level: 'B1' },
  { prompt: 'Dün neden derse gelmedin?', answer: 'Hastaydım, doktora gitmem gerekti.', options: ['Yarın gelmeyeceğim.', 'Ders çok kolaydı.', 'Öğretmenimiz çok iyi.'], situation: 'Ta‘lim', uzbek: 'Kecha nega darsga kelmading?', level: 'B1' },

  // ── B2 ──
  { prompt: 'Sizce uzaktan çalışma verimliliği artırır mı?', answer: 'Bence bu, işin niteliğine bağlı.', options: ['Evet, ofis çok uzakta.', 'Hayır, bugün çalışmıyorum.', 'Verimlilik raporu dün geldi.'], situation: 'Munozara', uzbek: 'Sizningcha, masofadan ishlash samaradorlikni oshiradimi?', level: 'B2' },
  { prompt: 'Bu sözleşmeyi imzalamadan önce neye dikkat etmeliyim?', answer: 'Fesih koşullarını mutlaka okuyun.', options: ['İmzanız çok güzel.', 'Sözleşme dün bitti.', 'Kalemi masaya bırakın.'], situation: 'Huquq', uzbek: 'Bu shartnomani imzolashdan oldin nimaga e‘tibor berishim kerak?', level: 'B2' },
  { prompt: 'Toplantıda neden hiç söz almadınız?', answer: 'Konuyu yeterince bilmediğim için dinlemeyi tercih ettim.', options: ['Toplantı saat üçte başlıyor.', 'Söz veriyorum, yarın gelirim.', 'Oda çok küçüktü, o yüzden konuştum.'], situation: 'Ish', uzbek: 'Yig‘ilishda nega umuman so‘z olmadingiz?', level: 'B2' },
  { prompt: 'Ürünü iade etmek istiyorum, mümkün mü?', answer: 'Faturanız varsa on dört gün içinde iade edebilirsiniz.', options: ['Ürün çok popüler, stokta yok.', 'Fatura adresiniz neresi?', 'İade etmek istemiyorum.'], situation: 'Do‘konda', uzbek: 'Mahsulotni qaytarmoqchiman, mumkinmi?', level: 'B2' },
  { prompt: 'Bu kadar gecikmenin bir açıklaması var mı?', answer: 'Tedarikçiden kaynaklanan bir sorun yaşandı.', options: ['Açıklama yapmayı çok severim.', 'Gecikme yarın başlıyor.', 'Hayır, her şey zamanında bitti.'], situation: 'Ish', uzbek: 'Bunchalik kechikishning izohi bormi?', level: 'B2' },

  // ── C1 ──
  { prompt: 'Sizce yapay zekâ öğretmenlerin yerini alabilir mi?', answer: 'Bazı görevleri üstlenebilir, ama pedagojik ilişkinin yerini tutamaz.', options: ['Yapay zekâ dün güncellendi.', 'Öğretmenler odası ikinci katta.', 'Evet, yerimi değiştirmek istiyorum.'], situation: 'Munozara', uzbek: 'Sizningcha, sun‘iy intellekt o‘qituvchilar o‘rnini egallay oladimi?', level: 'C1' },
  { prompt: 'Bu politikanın uzun vadeli etkilerini nasıl değerlendiriyorsunuz?', answer: 'Kısa vadede maliyetli olsa da uzun vadede istikrar getireceğini düşünüyorum.', options: ['Politika dersini çok severdim.', 'Vadesi geçen faturayı ödedim.', 'Uzun bir yolculuktan yeni döndüm.'], situation: 'Tahlil', uzbek: 'Bu siyosatning uzoq muddatli ta‘sirini qanday baholaysiz?', level: 'C1' },
  { prompt: 'Makalenizde örneklem neden bu kadar dar tutuldu?', answer: 'Kaynak kısıtları nedeniyle; bu sınırlılığı tartışma bölümünde belirttik.', options: ['Makale dergide yayımlandı.', 'Örnekleri çok beğendim.', 'Dar sokaklarda yürümeyi severim.'], situation: 'Ilmiy muloqot', uzbek: 'Maqolangizda tanlanma nega bunchalik tor olindi?', level: 'C1' },
  { prompt: 'Bu eleştiriye nasıl bir yanıt vermeyi düşünüyorsunuz?', answer: 'Haklı noktaları kabul edip yöntemsel itirazlara verilerle yanıt vereceğim.', options: ['Eleştirmenler dün toplandı.', 'Yanıt anahtarı kitabın sonunda.', 'Hiç eleştiri almadım, o yüzden kabul ediyorum.'], situation: 'Munozara', uzbek: 'Bu tanqidga qanday javob bermoqchisiz?', level: 'C1' },
  { prompt: 'Görüşmeyi ertelemek zorunda kaldığımız için özür dileriz.', answer: 'Önemli değil, anlayışla karşılıyorum; yeni tarihi bekliyorum.', options: ['Özür dilemek zorunda değilim.', 'Görüşme odası boş mu?', 'Tarih dersini hiç sevmezdim.'], situation: 'Rasmiy yozishma', uzbek: 'Uchrashuvni kechiktirishga majbur bo‘lganimiz uchun uzr so‘raymiz.', level: 'C1' },
];

// ═════════════════════════ Zid ma'noli so'zlar ═════════════════════════

export const moreAntonyms: Pair[] = [
  // ── A1 ──
  { first: 'ön', second: 'arka', uzbek: 'old — orqa', level: 'A1' },
  { first: 'sağ', second: 'sol', uzbek: 'o‘ng — chap', level: 'A1' },
  { first: 'yukarı', second: 'aşağı', uzbek: 'yuqori — past', level: 'A1' },
  { first: 'içeri', second: 'dışarı', uzbek: 'ichkari — tashqari', level: 'A1' },
  { first: 'ağlamak', second: 'gülmek', uzbek: 'yig‘lamoq — kulmoq', level: 'A1' },
  { first: 'açmak', second: 'kapatmak', uzbek: 'ochmoq — yopmoq', level: 'A1' },
  { first: 'uyanmak', second: 'uyumak', uzbek: 'uyg‘onmoq — uxlamoq', level: 'A1' },
  { first: 'sabah', second: 'akşam', uzbek: 'ertalab — kechqurun', level: 'A1' },

  // ── A2 ──
  { first: 'kuru', second: 'ıslak', uzbek: 'quruq — ho‘l', level: 'A2' },
  { first: 'aç', second: 'tok', uzbek: 'och — to‘q', level: 'A2' },
  { first: 'sert', second: 'yumuşak', uzbek: 'qattiq — yumshoq', level: 'A2' },
  { first: 'geniş', second: 'dar', uzbek: 'keng — tor', level: 'A2' },
  { first: 'derin', second: 'sığ', uzbek: 'chuqur — sayoz', level: 'A2' },
  { first: 'aydınlık', second: 'karanlık', uzbek: 'yorug‘ — qorong‘i', level: 'A2' },
  { first: 'binmek', second: 'inmek', uzbek: 'minmoq — tushmoq', level: 'A2' },
  { first: 'itmek', second: 'çekmek', uzbek: 'itarmoq — tortmoq', level: 'A2' },

  // ── B1 ──
  { first: 'olumlu', second: 'olumsuz', uzbek: 'ijobiy — salbiy', level: 'B1' },
  { first: 'kazanç', second: 'kayıp', uzbek: 'foyda — yo‘qotish', level: 'B1' },
  { first: 'başarı', second: 'başarısızlık', uzbek: 'muvaffaqiyat — muvaffaqiyatsizlik', level: 'B1' },
  { first: 'savaş', second: 'barış', uzbek: 'urush — tinchlik', level: 'B1' },
  { first: 'yasal', second: 'yasadışı', uzbek: 'qonuniy — noqonuniy', level: 'B1' },
  { first: 'ithalat', second: 'ihracat', uzbek: 'import — eksport', level: 'B1' },
  { first: 'adil', second: 'adaletsiz', uzbek: 'adolatli — adolatsiz', level: 'B1' },
  { first: 'sabırlı', second: 'sabırsız', uzbek: 'sabrli — sabrsiz', level: 'B1' },

  // ── B2 ──
  { first: 'bağımlı', second: 'bağımsız', uzbek: 'qaram — mustaqil', level: 'B2' },
  { first: 'yapıcı', second: 'yıkıcı', uzbek: 'bunyodkor — vayronkor', level: 'B2' },
  { first: 'abartmak', second: 'küçümsemek', uzbek: 'oshirib yubormoq — kamsitmoq', level: 'B2' },
  { first: 'doğrudan', second: 'dolaylı', uzbek: 'bevosita — bilvosita', level: 'B2' },
  { first: 'kuramsal', second: 'uygulamalı', uzbek: 'nazariy — amaliy', level: 'B2' },
  { first: 'ilerlemek', second: 'gerilemek', uzbek: 'rivojlanmoq — orqaga ketmoq', level: 'B2' },
  { first: 'onaylamak', second: 'reddetmek', uzbek: 'tasdiqlamoq — rad etmoq', level: 'B2' },
  { first: 'nicel', second: 'nitel', uzbek: 'miqdoriy — sifat jihatidan', level: 'B2' },

  // ── C1 ──
  { first: 'evrensel', second: 'yerel', uzbek: 'umumbashariy — mahalliy', level: 'C1' },
  { first: 'örtük', second: 'açık', uzbek: 'yashirin (bilvosita) — ochiq', level: 'C1' },
  { first: 'tümevarım', second: 'tümdengelim', uzbek: 'induksiya — deduksiya', level: 'C1' },
  { first: 'özgün', second: 'taklit', uzbek: 'o‘ziga xos (original) — taqlid', level: 'C1' },
  { first: 'yoğunlaşmak', second: 'dağılmak', uzbek: 'jamlanmoq — tarqalmoq', level: 'C1' },
  { first: 'kapsayıcı', second: 'dışlayıcı', uzbek: 'qamrab oluvchi — chetlatuvchi', level: 'C1' },
  { first: 'ılımlı', second: 'aşırı', uzbek: 'mo‘tadil — haddan oshgan', level: 'C1' },
];

// ═════════════════════════ Fe'l shakllari ═════════════════════════

const SIMDIKI = 'şimdiki zaman';
const GECMIS = 'görülen geçmiş zaman';
const GENIS = 'geniş zaman';
const GELECEK = 'gelecek zaman';
const DUYULAN = 'duyulan geçmiş zaman';

export const moreVerbs: Verb[] = [
  // ── A1 ──
  { infinitive: 'konuşmak', person: 'ben', tense: SIMDIKI, negative: false, answer: 'konuşuyorum', uzbek: 'men gapiryapman', explanation: 'konuş- + -uyor (oxirgi unli «u») + -um.', level: 'A1' },
  { infinitive: 'izlemek', person: 'sen', tense: SIMDIKI, negative: false, answer: 'izliyorsun', uzbek: 'sen tomosha qilyapsan', explanation: 'izle- oxiridagi «e» -iyor oldida tushadi: izl + iyor + -sun.', level: 'A1' },
  { infinitive: 'beklemek', person: 'biz', tense: SIMDIKI, negative: false, answer: 'bekliyoruz', uzbek: 'biz kutyapmiz', explanation: 'bekle- → bekl + iyor + -uz.', level: 'A1' },
  { infinitive: 'uyumak', person: 'o', tense: SIMDIKI, negative: false, answer: 'uyuyor', uzbek: 'u uxlayapti', explanation: 'uyu- oxiridagi unli tushadi va -uyor qo‘shiladi: uy + uyor.', level: 'A1' },
  { infinitive: 'gitmek', person: 'biz', tense: SIMDIKI, negative: true, answer: 'gitmiyoruz', uzbek: 'biz bormayapmiz', explanation: 'Inkor -me + -iyor → -miyor. «t» yumshamaydi: undan keyin undosh «m» keladi.', level: 'A1' },

  // ── A2 ──
  { infinitive: 'konuşmak', person: 'biz', tense: GECMIS, negative: false, answer: 'konuştuk', uzbek: 'biz gaplashdik', explanation: 'konuş- jarangsiz «ş» bilan tugaydi → -tu + -k.', level: 'A2' },
  { infinitive: 'gitmek', person: 'onlar', tense: GECMIS, negative: false, answer: 'gittiler', uzbek: 'ular ketishdi', explanation: 'git- + -ti (jarangsiz «t» dan keyin) + -ler.', level: 'A2' },
  { infinitive: 'okumak', person: 'ben', tense: GENIS, negative: false, answer: 'okurum', uzbek: 'men o‘qiyman', explanation: 'Unli bilan tugagan fe‘lga faqat -r: okur + -um.', level: 'A2' },
  { infinitive: 'gitmek', person: 'biz', tense: GENIS, negative: false, answer: 'gideriz', uzbek: 'biz boramiz', explanation: 'git- unli oldida gid- bo‘ladi + -er + -iz.', level: 'A2' },
  { infinitive: 'yapmak', person: 'ben', tense: GENIS, negative: true, answer: 'yapmam', uzbek: 'men qilmayman', explanation: 'Keng zamon inkori 1-shaxs birlikda -mam/-mem (-z tushadi).', level: 'A2' },
  { infinitive: 'gelmek', person: 'sen', tense: GECMIS, negative: true, answer: 'gelmedin', uzbek: 'sen kelmading', explanation: 'gel- + -me (inkor) + -di + -n.', level: 'A2' },

  // ── B1 ──
  { infinitive: 'okumak', person: 'ben', tense: GELECEK, negative: false, answer: 'okuyacağım', uzbek: 'men o‘qiyman (kelasida)', explanation: 'oku- + bufer «y» + -acak; «k» unli oldida «ğ»: okuyacağım.', level: 'B1' },
  { infinitive: 'gelmek', person: 'biz', tense: GELECEK, negative: false, answer: 'geleceğiz', uzbek: 'biz kelamiz', explanation: 'gel- + -ecek + -iz; «k» → «ğ».', level: 'B1' },
  { infinitive: 'yapmak', person: 'onlar', tense: GELECEK, negative: true, answer: 'yapmayacaklar', uzbek: 'ular qilmaydi', explanation: 'yap- + -ma + bufer «y» + -acak + -lar.', level: 'B1' },
  { infinitive: 'gitmek', person: 'o', tense: DUYULAN, negative: false, answer: 'gitmiş', uzbek: 'u ketgan ekan', explanation: '-miş: eshitilgan/bilinmagan o‘tgan zamon. Oxirgi unli «i» → -miş.', level: 'B1' },
  { infinitive: 'almak', person: 'biz', tense: DUYULAN, negative: false, answer: 'almışız', uzbek: 'biz olgan ekanmiz', explanation: 'al- + -mış + -ız.', level: 'B1' },
  { infinitive: 'bilmek', person: 'sen', tense: GELECEK, negative: true, answer: 'bilmeyeceksin', uzbek: 'sen bilmaysan (kelasida)', explanation: 'bil- + -me + «y» + -ecek + -sin.', level: 'B1' },

  // ── B2 ──
  { infinitive: 'gelmek', person: 'biz', tense: 'gereklilik kipi', negative: false, answer: 'gelmeliyiz', uzbek: 'biz kelishimiz kerak', explanation: 'gel- + -meli + bufer «y» + -iz.', level: 'B2' },
  { infinitive: 'yapmak', person: 'ben', tense: 'şart kipi', negative: false, answer: 'yapsam', uzbek: 'men qilsam', explanation: 'yap- + -sa + -m.', level: 'B2' },
  { infinitive: 'gelmek', person: 'sen', tense: 'şart kipi', negative: true, answer: 'gelmesen', uzbek: 'sen kelmasang', explanation: 'gel- + -me + -se + -n.', level: 'B2' },
  { infinitive: 'gitmek', person: 'biz', tense: 'istek kipi', negative: false, answer: 'gidelim', uzbek: 'boraylik', explanation: '1-shaxs ko‘plik istak -elim; git- unli oldida gid-.', level: 'B2' },
  { infinitive: 'söylemek', person: 'o', tense: 'edilgen + görülen geçmiş', negative: false, answer: 'söylendi', uzbek: 'aytildi', explanation: 'Unli bilan tugagan o‘zakka majhul -n: söyle + n + di.', level: 'B2' },
  { infinitive: 'okumak', person: 'o', tense: 'ettirgen + görülen geçmiş', negative: false, answer: 'okuttu', uzbek: 'o‘qitdi', explanation: 'Unli bilan tugagan ko‘p bo‘g‘inli o‘zakka orttirma -t: oku + t + tu.', level: 'B2' },

  // ── C1 ──
  { infinitive: 'incelemek', person: 'o', tense: 'edilgen + gereklilik', negative: false, answer: 'incelenmelidir', uzbek: 'o‘rganilishi kerak', explanation: 'incele + n (majhul) + meli + dir (rasmiy).', level: 'C1' },
  { infinitive: 'tartışmak', person: 'o', tense: 'edilgen + gelecek', negative: false, answer: 'tartışılacaktır', uzbek: 'muhokama qilinadi', explanation: 'tartış + ıl (majhul) + acak + tır.', level: 'C1' },
  { infinitive: 'sağlamak', person: 'o', tense: 'edilgen + gelecek', negative: false, answer: 'sağlanacaktır', uzbek: 'ta‘minlanadi', explanation: 'sağla + n (unlidan keyin majhul -n) + acak + tır.', level: 'C1' },
  { infinitive: 'öngörmek', person: 'o', tense: 'edilgen + gereklilik', negative: false, answer: 'öngörülmelidir', uzbek: 'oldindan ko‘zda tutilishi kerak', explanation: 'öngör + ül (majhul) + meli + dir.', level: 'C1' },
  { infinitive: 'belirtmek', person: 'o', tense: 'edilgen + -mıştır (rasmiy)', negative: false, answer: 'belirtilmiştir', uzbek: 'ko‘rsatib o‘tilgan', explanation: 'belirt + il + miş + tir — ilmiy matnlarda «…gan» ma‘nosida.', level: 'C1' },
];

// ═════════════════════════ Gap tuzish ═════════════════════════

export const moreSentences: SeedSentence[] = [
  // A1
  { turkish: 'Benim adım Aziz', uzbek: 'Mening ismim Aziz', level: 'A1', topic: 'tanishuv' },
  { turkish: 'Kedi masanın altında uyuyor', uzbek: 'Mushuk stol tagida uxlayapti', level: 'A1', topic: 'uy' },
  { turkish: 'Bugün okula gitmiyorum', uzbek: 'Bugun maktabga bormayapman', level: 'A1', topic: 'maktab', note: 'gitmiyorum — inkor' },
  { turkish: 'Elmalar çok taze', uzbek: 'Olmalar juda yangi', level: 'A1', topic: 'ovqat' },
  // A2
  { turkish: 'Geçen hafta yeni bir telefon aldım', uzbek: 'O‘tgan hafta yangi telefon oldim', level: 'A2', topic: 'xarid' },
  { turkish: 'Kardeşim benden üç yaş küçük', uzbek: 'Ukam mendan uch yosh kichik', level: 'A2', topic: 'oila', note: 'benden — taqqoslash' },
  { turkish: 'Tatilde denize girmeyi çok seviyorum', uzbek: 'Ta‘tilda dengizda cho‘milishni juda yaxshi ko‘raman', level: 'A2', topic: 'bo‘sh vaqt' },
  { turkish: 'Bu sabah otobüsü kaçırdım', uzbek: 'Bugun ertalab avtobusga ulgurmadim', level: 'A2', topic: 'transport' },
  // B1
  { turkish: 'Ne kadar çok okursan o kadar çok öğrenirsin', uzbek: 'Qancha ko‘p o‘qisang, shuncha ko‘p o‘rganasan', level: 'B1', topic: 'ta‘lim' },
  { turkish: 'Annem gelmeden önce evi topladık', uzbek: 'Onam kelmasdan oldin uyni yig‘ishtirdik', level: 'B1', topic: 'oila' },
  { turkish: 'Sınavı geçtiğini duyunca çok sevindim', uzbek: 'Imtihondan o‘tganingni eshitib juda xursand bo‘ldim', level: 'B1', topic: 'his' },
  { turkish: 'Bu filmi izlemeni kesinlikle tavsiye ederim', uzbek: 'Bu filmni ko‘rishingni albatta maslahat beraman', level: 'B1', topic: 'kino' },
  // B2
  { turkish: 'Uzmanlara göre bu sorun kısa sürede çözülemez', uzbek: 'Mutaxassislarga ko‘ra, bu muammo qisqa vaqtda hal bo‘lmaydi', level: 'B2', topic: 'jamiyat' },
  { turkish: 'Ekonomik krize rağmen satışlar artmaya devam etti', uzbek: 'Iqtisodiy inqirozga qaramay, savdo o‘sishda davom etdi', level: 'B2', topic: 'iqtisod' },
  { turkish: 'Gelir gelmez toplantıya katılmak zorunda kaldı', uzbek: 'Kelishi bilanoq yig‘ilishga qatnashishga majbur bo‘ldi', level: 'B2', topic: 'ish' },
  { turkish: 'Bu kararın sonuçlarını önceden tahmin etmek mümkün değildi', uzbek: 'Bu qarorning oqibatlarini oldindan taxmin qilib bo‘lmas edi', level: 'B2', topic: 'tahlil' },
  // C1
  { turkish: 'Elde edilen bulgular önceki çalışmalarla örtüşmektedir', uzbek: 'Olingan natijalar avvalgi tadqiqotlar bilan mos keladi', level: 'C1', topic: 'ilm' },
  { turkish: 'Söz konusu yasa önümüzdeki yıl yürürlüğe girecektir', uzbek: 'Ushbu qonun kelgusi yili kuchga kiradi', level: 'C1', topic: 'huquq' },
  { turkish: 'Bu yaklaşımın sınırlılıkları göz ardı edilmemelidir', uzbek: 'Bu yondashuvning cheklovlari e‘tibordan chetda qolmasligi kerak', level: 'C1', topic: 'ilm' },
  { turkish: 'Araştırmanın amacı motivasyonun rolünü incelemektir', uzbek: 'Tadqiqotning maqsadi motivatsiyaning rolini o‘rganishdir', level: 'C1', topic: 'ilm' },
  { turkish: 'Kaynakların verimli kullanılması sürdürülebilirliğin temel koşuludur', uzbek: 'Resurslardan samarali foydalanish barqarorlikning asosiy shartidir', level: 'C1', topic: 'ekologiya' },
];

// ═════════════════════════ Qo'shimchalar ═════════════════════════

export const moreDrills: SeedDrill[] = [
  // ── A1 ──
  { level: 'A1', base: 'masa', prompt: '«stolDA»', answer: 'masada', explanation: 'masa — oxirgi unli «a» (qalin) → -da.', rule: 'locative' },
  { level: 'A1', base: 'kalem', prompt: '«qalamLAR»', answer: 'kalemler', explanation: 'kalem — oxirgi unli «e» (ingichka) → -ler.', rule: 'plural' },
  { level: 'A1', base: 'araba', prompt: '«mashinAM»', answer: 'arabam', explanation: 'Unli bilan tugagan so‘zga faqat -m.', rule: 'possessive' },
  { level: 'A1', base: 'okumak', prompt: '«o‘qimayapti»', answer: 'okumuyor', explanation: 'oku- + -mu (inkor, unli uyg‘unligi bilan) + -yor.', rule: 'negation' },
  { level: 'A1', base: 'şehir', prompt: '«shaharDA»', answer: 'şehirde', explanation: 'şehir — oxirgi unli «i» → -de.', rule: 'locative' },
  // ── A2 ──
  { level: 'A2', base: 'ağaç', prompt: '«daraxtNING»', answer: 'ağacın', explanation: '«ç» unli oldida «c» ga aylanadi; oxirgi unli «a» → -ın.', rule: 'softening' },
  { level: 'A2', base: 'renk', prompt: '«rangINI» (tushum)', answer: 'rengi', explanation: '«nk» unli oldida «ng» bo‘ladi: renk → rengi.', rule: 'softening' },
  { level: 'A2', base: 'sokak', prompt: '«ko‘chaGA»', answer: 'sokağa', explanation: 'Ko‘p bo‘g‘inli so‘z oxiridagi «k» unli oldida «ğ» bo‘ladi.', rule: 'softening' },
  { level: 'A2', base: 'içmek', prompt: '«ichdi»', answer: 'içti', explanation: 'iç- jarangsiz «ç» bilan tugaydi → -ti.', rule: 'past' },
  { level: 'A2', base: 'İzmir', prompt: '«IzmirDAN»', answer: "İzmir'den", explanation: 'Atoqli ot — apostrof bilan; oxirgi unli «i» → -den.', rule: 'ablative' },
  // ── B1 ──
  { level: 'B1', base: 'gelmek', prompt: '«agar kelsa» — keng zamon + shart', answer: 'gelirse', explanation: 'gel- + -ir (keng zamon) + -se.', rule: 'conditional' },
  { level: 'B1', base: 'yapmak', prompt: '«qilishi kerak»', answer: 'yapmalı', explanation: 'yap- + -malı (oxirgi unli «a»).', rule: 'necessity' },
  { level: 'B1', base: 'gitmek', prompt: '«borishi kerak»', answer: 'gitmeli', explanation: 'git- + -meli (oxirgi unli «i»).', rule: 'necessity' },
  { level: 'B1', base: 'okumak', prompt: '«o‘qigach» (-ınca)', answer: 'okuyunca', explanation: 'Unli bilan tugagan o‘zak: bufer «y» + -unca.', rule: 'converb' },
  { level: 'B1', base: 'gelmek', prompt: '«kelgach» (-ınca)', answer: 'gelince', explanation: 'gel- + -ince.', rule: 'converb' },
  { level: 'B1', base: 'çalışmak', prompt: '«ishlab» (-arak)', answer: 'çalışarak', explanation: 'çalış- + -arak: harakat usuli.', rule: 'converb' },
  // ── B2 ──
  { level: 'B2', base: 'yazmak', prompt: '«yoziladi» (majhul, keng zamon)', answer: 'yazılır', explanation: 'yaz- + -ıl (majhul) + -ır.', rule: 'passive' },
  { level: 'B2', base: 'görmek', prompt: '«ko‘rinadi / ko‘riladi»', answer: 'görülür', explanation: 'gör- + -ül + -ür.', rule: 'passive' },
  { level: 'B2', base: 'açmak', prompt: '«ochiladi»', answer: 'açılır', explanation: 'aç- + -ıl + -ır.', rule: 'passive' },
  { level: 'B2', base: 'yapmak', prompt: '«qildirmoq» (orttirma)', answer: 'yaptırmak', explanation: 'yap- + -tır: boshqaga qildirish.', rule: 'causative' },
  { level: 'B2', base: 'gülmek', prompt: '«kuldirmoq»', answer: 'güldürmek', explanation: 'gül- + -dür (jarangli «l» dan keyin -d-).', rule: 'causative' },
  { level: 'B2', base: 'gelmek', prompt: '«kelmasdan» (-meden)', answer: 'gelmeden', explanation: 'gel- + -meden.', rule: 'converb' },
  // ── C1 ──
  { level: 'C1', base: 'değerlendirmek', prompt: '«baholanmoqda» (rasmiy)', answer: 'değerlendirilmektedir', explanation: 'değerlendir + il + mekte + dir.', rule: 'formal-passive' },
  { level: 'C1', base: 'belirtmek', prompt: '«ko‘rsatilgan» (rasmiy)', answer: 'belirtilmiştir', explanation: 'belirt + il + miş + tir.', rule: 'formal-passive' },
  { level: 'C1', base: 'uygulamak', prompt: '«qo‘llanilmoqda» (rasmiy)', answer: 'uygulanmaktadır', explanation: 'uygula + n + makta + dır.', rule: 'formal-passive' },
  { level: 'C1', base: 'incelemek', prompt: '«o‘rganilgan» (rasmiy)', answer: 'incelenmiştir', explanation: 'incele + n + miş + tir.', rule: 'formal-passive' },
  { level: 'C1', base: 'artırmak', prompt: '«oshirilishi kerak» (rasmiy)', answer: 'artırılmalıdır', explanation: 'artır + ıl + malı + dır.', rule: 'formal-passive' },
];

// ═════════════════════════ Mavzular ("ortiqcha so'zni top") ═════════════════════════
// Faqat bir-biridan uzoq sohalar: kasb nomlari yoki tabiat bilan aralashib
// ketmasin (aks holda "ortiqcha" so'z ikki javobli bo'lib qoladi).

export const moreTopics: Topic[] = [
  {
    slug: 'sanat',
    title: 'San‘at',
    words: [
      { turkish: 'heykel', uzbek: 'haykal', level: 'B2' },
      { turkish: 'senfoni', uzbek: 'simfoniya', level: 'B2' },
      { turkish: 'tuval', uzbek: 'kanvas (rasm matosi)', level: 'B2' },
      { turkish: 'portre', uzbek: 'portret', level: 'B2' },
      { turkish: 'beste', uzbek: 'musiqiy asar', level: 'B2' },
      { turkish: 'şiir', uzbek: 'she‘r', level: 'A2' },
      { turkish: 'sahne', uzbek: 'sahna', level: 'A2' },
    ],
  },
  {
    slug: 'koinot',
    title: 'Koinot',
    words: [
      { turkish: 'gezegen', uzbek: 'sayyora', level: 'B2' },
      { turkish: 'yörünge', uzbek: 'orbita', level: 'B2' },
      { turkish: 'uydu', uzbek: 'yo‘ldosh', level: 'B2' },
      { turkish: 'galaksi', uzbek: 'galaktika', level: 'B2' },
      { turkish: 'teleskop', uzbek: 'teleskop', level: 'B2' },
      { turkish: 'göktaşı', uzbek: 'meteorit', level: 'B2' },
    ],
  },
  {
    slug: 'ilm',
    title: 'Ilmiy tadqiqot',
    words: [
      { turkish: 'hipotez', uzbek: 'gipoteza', level: 'C1' },
      { turkish: 'bulgu', uzbek: 'topilma, natija', level: 'C1' },
      { turkish: 'kuram', uzbek: 'nazariya', level: 'C1' },
      { turkish: 'örneklem', uzbek: 'tanlanma', level: 'C1' },
      { turkish: 'kaynakça', uzbek: 'adabiyotlar ro‘yxati', level: 'C1' },
      { turkish: 'varsayım', uzbek: 'faraz', level: 'C1' },
      { turkish: 'deney', uzbek: 'tajriba', level: 'B1' },
    ],
  },
  {
    slug: 'huquq',
    title: 'Sud va huquq',
    words: [
      { turkish: 'temyiz', uzbek: 'apellyatsiya', level: 'C1' },
      { turkish: 'beraat', uzbek: 'oqlanish', level: 'C1' },
      { turkish: 'iddianame', uzbek: 'ayblov xulosasi', level: 'C1' },
      { turkish: 'tutanak', uzbek: 'bayonnoma', level: 'C1' },
      { turkish: 'kefalet', uzbek: 'garov (kafillik)', level: 'C1' },
      { turkish: 'dava', uzbek: 'da‘vo, ish', level: 'B2' },
      { turkish: 'mahkeme', uzbek: 'sud', level: 'B1' },
    ],
  },
];

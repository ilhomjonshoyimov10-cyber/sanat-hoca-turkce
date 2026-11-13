// FE'L SHAKLLARI.
//
// Masdar + shaxs + zamon beriladi, o'quvchi to'g'ri shaklni YOZADI.
// Tanlash emas, yozish: fe'l qo'shimchalari turk tilining o'zagi va
// ularni tanib olish bilan yozib bilish — boshqa-boshqa narsa.
//
// Har bir yozuvda izoh bor: unli uyg'unligi, undosh yumshashi yoki
// istisno nima uchun shunday ishlagani.
//
// TEKSHIRISH KERAK: ustoz shakllarni ko'rib chiqsin.

import type { Level } from '@prisma/client';
import { moreVerbs } from './more.js';

export interface Verb {
  infinitive: string;
  person: string;
  tense: string;
  negative: boolean;
  answer: string;
  uzbek: string;
  explanation: string;
  level: Level;
}

const SIMDIKI = 'şimdiki zaman';
const GECMIS = 'görülen geçmiş zaman';
const GENIS = 'geniş zaman';
const GELECEK = 'gelecek zaman';

export const verbForms: Verb[] = [
  // ───────── A1: hozirgi zamon (-yor) ─────────
  {
    infinitive: 'gitmek', person: 'ben', tense: SIMDIKI, negative: false,
    answer: 'gidiyorum', uzbek: 'men ketyapman',
    explanation: "git- oxiridagi «t» ikki unli orasida «d» ga aylanadi: git → gid. Keyin -iyor + -um.",
    level: 'A1',
  },
  {
    infinitive: 'gelmek', person: 'sen', tense: SIMDIKI, negative: false,
    answer: 'geliyorsun', uzbek: 'sen kelyapsan',
    explanation: "gel- + -iyor + -sun. Oxirgi unli «e» ingichka → -iyor.",
    level: 'A1',
  },
  {
    infinitive: 'yapmak', person: 'o', tense: SIMDIKI, negative: false,
    answer: 'yapıyor', uzbek: 'u qilyapti',
    explanation: "yap- + -ıyor. «a» qalin unli → -ıyor. Uchinchi shaxsda qo‘shimcha yo‘q.",
    level: 'A1',
  },
  {
    infinitive: 'okumak', person: 'biz', tense: SIMDIKI, negative: false,
    answer: 'okuyoruz', uzbek: 'biz o‘qiyapmiz',
    explanation: "oku- unli bilan tugaydi: oxirgi «u» tushib qoladi → okuyor + -uz.",
    level: 'A1',
  },
  {
    infinitive: 'yazmak', person: 'siz', tense: SIMDIKI, negative: false,
    answer: 'yazıyorsunuz', uzbek: 'siz yozyapsiz',
    explanation: "yaz- + -ıyor + -sunuz.",
    level: 'A1',
  },
  {
    infinitive: 'gelmek', person: 'onlar', tense: SIMDIKI, negative: false,
    answer: 'geliyorlar', uzbek: 'ular kelyapti',
    explanation: "gel- + -iyor + -lar.",
    level: 'A1',
  },
  {
    infinitive: 'içmek', person: 'ben', tense: SIMDIKI, negative: true,
    answer: 'içmiyorum', uzbek: 'men ichmayapman',
    explanation: "Bo‘lishsizlik -me/-ma, «-yor» oldidan «i» ga aylanadi: iç + mi + yor + um.",
    level: 'A1',
  },
  {
    infinitive: 'anlamak', person: 'ben', tense: SIMDIKI, negative: true,
    answer: 'anlamıyorum', uzbek: 'men tushunmayapman',
    explanation: "anla- + -ma → «-yor» oldidan «mı»: anlamıyorum.",
    level: 'A1',
  },
  {
    infinitive: 'bilmek', person: 'o', tense: SIMDIKI, negative: true,
    answer: 'bilmiyor', uzbek: 'u bilmayapti',
    explanation: "bil- + -mi + -yor.",
    level: 'A1',
  },
  {
    infinitive: 'çalışmak', person: 'biz', tense: SIMDIKI, negative: false,
    answer: 'çalışıyoruz', uzbek: 'biz ishlayapmiz',
    explanation: "çalış- + -ıyor + -uz.",
    level: 'A1',
  },

  // ───────── A2: o'tgan zamon (-di) ─────────
  {
    infinitive: 'gitmek', person: 'ben', tense: GECMIS, negative: false,
    answer: 'gittim', uzbek: 'men bordim',
    explanation: "git- «t» jarangsiz bilan tugaydi → qo‘shimcha ham jarangsiz: -ti. gittim.",
    level: 'A2',
  },
  {
    infinitive: 'gelmek', person: 'sen', tense: GECMIS, negative: false,
    answer: 'geldin', uzbek: 'sen kelding',
    explanation: "gel- jarangli «l» → -di. geldin.",
    level: 'A2',
  },
  {
    infinitive: 'yazmak', person: 'o', tense: GECMIS, negative: false,
    answer: 'yazdı', uzbek: 'u yozdi',
    explanation: "yaz- jarangli «z», qalin unli → -dı.",
    level: 'A2',
  },
  {
    infinitive: 'bakmak', person: 'biz', tense: GECMIS, negative: false,
    answer: 'baktık', uzbek: 'biz qaradik',
    explanation: "bak- «k» jarangsiz → -tı; biz shaxsi → -k.",
    level: 'A2',
  },
  {
    infinitive: 'görmek', person: 'siz', tense: GECMIS, negative: false,
    answer: 'gördünüz', uzbek: 'siz ko‘rdingiz',
    explanation: "gör- «ö» lablangan ingichka unli → -dü + -nüz.",
    level: 'A2',
  },
  {
    infinitive: 'okumak', person: 'onlar', tense: GECMIS, negative: false,
    answer: 'okudular', uzbek: 'ular o‘qidilar',
    explanation: "oku- + -du + -lar.",
    level: 'A2',
  },
  {
    infinitive: 'içmek', person: 'ben', tense: GECMIS, negative: true,
    answer: 'içmedim', uzbek: 'men ichmadim',
    explanation: "iç- + -me (bo‘lishsiz) + -di + -m.",
    level: 'A2',
  },
  {
    infinitive: 'almak', person: 'o', tense: GECMIS, negative: true,
    answer: 'almadı', uzbek: 'u olmadi',
    explanation: "al- + -ma + -dı.",
    level: 'A2',
  },

  // ───────── A2: keng zamon (-ar/-er) ─────────
  {
    infinitive: 'gelmek', person: 'ben', tense: GENIS, negative: false,
    answer: 'gelirim', uzbek: 'men kelaman (odatda)',
    explanation: "Bir bo‘g‘inli fe‘llarning ko‘pchiligi -ir/-ır oladi: gel + ir + im.",
    level: 'A2',
  },
  {
    infinitive: 'yapmak', person: 'sen', tense: GENIS, negative: false,
    answer: 'yaparsın', uzbek: 'sen qilasan (odatda)',
    explanation: "yap- + -ar + -sın.",
    level: 'A2',
  },
  {
    infinitive: 'çalışmak', person: 'o', tense: GENIS, negative: false,
    answer: 'çalışır', uzbek: 'u ishlaydi (odatda)',
    explanation: "Ko‘p bo‘g‘inli fe‘l: çalış- + -ır.",
    level: 'A2',
  },
  {
    infinitive: 'bilmek', person: 'ben', tense: GENIS, negative: true,
    answer: 'bilmem', uzbek: 'men bilmayman',
    explanation: "Keng zamon bo‘lishsizi ISTISNO: «men» shaxsida -mez/-maz emas, faqat -me/-ma + -m. bilmem.",
    level: 'A2',
  },
  {
    infinitive: 'gelmek', person: 'o', tense: GENIS, negative: true,
    answer: 'gelmez', uzbek: 'u kelmaydi',
    explanation: "Uchinchi shaxs bo‘lishsizi: gel + mez.",
    level: 'A2',
  },

  // ───────── B1: kelasi zamon ─────────
  {
    infinitive: 'gitmek', person: 'ben', tense: GELECEK, negative: false,
    answer: 'gideceğim', uzbek: 'men boraman',
    explanation: "git → gid (yumshash), + -ecek; «k» ikki unli orasida «ğ» ga aylanadi: gideceğim.",
    level: 'B1',
  },
  {
    infinitive: 'yapmak', person: 'sen', tense: GELECEK, negative: false,
    answer: 'yapacaksın', uzbek: 'sen qilasan',
    explanation: "yap- qalin unli → -acak + -sın.",
    level: 'B1',
  },
  {
    infinitive: 'beklemek', person: 'o', tense: GELECEK, negative: false,
    answer: 'bekleyecek', uzbek: 'u kutadi',
    explanation: "bekle- unli bilan tugaydi → orasiga «y»: bekleyecek.",
    level: 'B1',
  },
  {
    infinitive: 'başlamak', person: 'biz', tense: GELECEK, negative: false,
    answer: 'başlayacağız', uzbek: 'biz boshlaymiz',
    explanation: "başla- + «y» + -acak → «k» yumshaydi: başlayacağız.",
    level: 'B1',
  },
  {
    infinitive: 'gelmek', person: 'ben', tense: GELECEK, negative: true,
    answer: 'gelmeyeceğim', uzbek: 'men kelmayman',
    explanation: "gel + me + «y» + ecek + im → gelmeyeceğim.",
    level: 'B1',
  },
  {
    infinitive: 'unutmak', person: 'onlar', tense: GELECEK, negative: true,
    answer: 'unutmayacaklar', uzbek: 'ular unutmaydi',
    explanation: "unut + ma + «y» + acak + lar.",
    level: 'B1',
  },

  // ───────── B1: aniqlanmagan o'tgan zamon (-miş) ─────────
  {
    infinitive: 'gelmek', person: 'o', tense: 'duyulan geçmiş zaman', negative: false,
    answer: 'gelmiş', uzbek: 'u kelgan ekan',
    explanation: "«-miş» — o‘zi ko‘rmagan, eshitgan voqea uchun: gel + miş.",
    level: 'B1',
  },
  {
    infinitive: 'yapmak', person: 'sen', tense: 'duyulan geçmiş zaman', negative: false,
    answer: 'yapmışsın', uzbek: 'sen qilgan ekansan',
    explanation: "yap- qalin unli → -mış + -sın.",
    level: 'B1',
  },
  {
    infinitive: 'görmek', person: 'ben', tense: 'duyulan geçmiş zaman', negative: false,
    answer: 'görmüşüm', uzbek: 'men ko‘rgan ekanman',
    explanation: "gör- «ö» lablangan ingichka → -müş + -üm.",
    level: 'B1',
  },

  // ───────── B2: murakkab shakllar ─────────
  {
    infinitive: 'gitmek', person: 'ben', tense: 'gereklilik kipi', negative: false,
    answer: 'gitmeliyim', uzbek: 'men borishim kerak',
    explanation: "Zaruriyat: git + meli + yim. Bu yerda «t» yumshamaydi, chunki keyin unli kelmaydi.",
    level: 'B2',
  },
  {
    infinitive: 'çalışmak', person: 'sen', tense: 'gereklilik kipi', negative: false,
    answer: 'çalışmalısın', uzbek: 'sen ishlashing kerak',
    explanation: "çalış- qalin unli → -malı + -sın.",
    level: 'B2',
  },
  {
    infinitive: 'gelmek', person: 'o', tense: 'şart kipi', negative: false,
    answer: 'gelse', uzbek: 'u kelsa',
    explanation: "Shart mayli: gel + se.",
    level: 'B2',
  },
  {
    infinitive: 'almak', person: 'ben', tense: 'istek kipi', negative: false,
    answer: 'alayım', uzbek: 'men olay',
    explanation: "Istak mayli: al + ayım.",
    level: 'B2',
  },
  {
    infinitive: 'yapmak', person: 'o', tense: 'edilgen (pasif)', negative: false,
    answer: 'yapılıyor', uzbek: 'qilinmoqda',
    explanation: "Majhul nisbat: undosh bilan tugagan fe‘lga -ıl/-il: yap + ıl + ıyor.",
    level: 'B2',
  },
  {
    infinitive: 'okumak', person: 'o', tense: 'edilgen (pasif)', negative: false,
    answer: 'okunuyor', uzbek: 'o‘qilmoqda',
    explanation: "Unli bilan tugagan fe‘lga -n: oku + n + uyor.",
    level: 'B2',
  },
  {
    infinitive: 'yazmak', person: 'o', tense: 'ettirgen (kauzatif)', negative: false,
    answer: 'yazdırıyor', uzbek: 'yozdiryapti',
    explanation: "Orttirma nisbat: yaz + dır + ıyor («boshqasiga yozdirmoq»).",
    level: 'B2',
  },

  // ───────── C1 ─────────
  {
    infinitive: 'bulmak', person: 'o', tense: 'edilgen + gereklilik', negative: false,
    answer: 'bulunmalıdır', uzbek: 'topilishi kerak',
    explanation: "bul + un (majhul) + malı + dır. Rasmiy matnlarda tez-tez uchraydi.",
    level: 'C1',
  },
  {
    infinitive: 'değerlendirmek', person: 'o', tense: 'edilgen (pasif)', negative: false,
    answer: 'değerlendirilir', uzbek: 'baholanadi',
    explanation: "değerlendir + il + ir. Uzun fe‘lda ham qoida bir xil.",
    level: 'C1',
  },
  {
    infinitive: 'uygulamak', person: 'o', tense: 'edilgen + gelecek', negative: false,
    answer: 'uygulanacaktır', uzbek: 'joriy etiladi',
    explanation: "uygula + n + acak + tır. Rasmiy uslubdagi odatiy shakl.",
    level: 'C1',
  },
];

// Qo'shimcha to'plam (content/more.ts)
verbForms.push(...moreVerbs);

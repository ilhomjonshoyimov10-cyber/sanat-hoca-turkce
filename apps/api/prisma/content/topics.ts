// MA'NO BO'YICHA MAVZULAR.
//
// NEGA KERAK: lug'at darslikdan import qilingan va u yerdagi `category`
// — "Ünite 1", ya'ni darslik bo'limi. Bitta bo'limda "salom", "qalam"
// va "dushanba" birga turishi mumkin. "Ortiqcha so'zni top" o'yini
// uchun esa HAQIQIY mavzu kerak: olma–nok–uzum–stol.
//
// Shuning uchun shu yerdagi so'zlarga "mavzu:<nom>" tegi qo'yiladi.
// Seeder ishlashi:
//   • so'z bazada bo'lsa (turkcha yozilishi bo'yicha) — unga teg qo'shiladi
//   • bo'lmasa — yangi so'z sifatida qo'shiladi
// Ya'ni mavjud lug'at BUZILMAYDI, faqat boyitiladi.
//
// TEKSHIRISH KERAK: turkcha yozilish va o'zbekcha tarjima ustoz
// tomonidan ko'rib chiqilsin. Men yozdim, lekin oxirgi so'z ustozniki.

import type { Level } from '@prisma/client';
import { moreTopics } from './more.js';

export interface TopicWord {
  turkish: string;
  uzbek: string;
  level: Level;
}

export interface Topic {
  /** Teg nomi: "mavzu:<slug>" ko'rinishida saqlanadi */
  slug: string;
  /** O'quvchiga ko'rinadigan nom */
  title: string;
  words: TopicWord[];
}

export const topics: Topic[] = [
  {
    slug: 'meva',
    title: 'Mevalar',
    words: [
      { turkish: 'elma', uzbek: 'olma', level: 'A1' },
      { turkish: 'armut', uzbek: 'nok', level: 'A1' },
      { turkish: 'üzüm', uzbek: 'uzum', level: 'A1' },
      { turkish: 'kiraz', uzbek: 'gilos', level: 'A1' },
      { turkish: 'çilek', uzbek: 'qulupnay', level: 'A1' },
      { turkish: 'karpuz', uzbek: 'tarvuz', level: 'A1' },
      { turkish: 'kavun', uzbek: 'qovun', level: 'A1' },
      { turkish: 'şeftali', uzbek: 'shaftoli', level: 'A2' },
      { turkish: 'kayısı', uzbek: 'o‘rik', level: 'A2' },
      { turkish: 'nar', uzbek: 'anor', level: 'A2' },
      { turkish: 'incir', uzbek: 'anjir', level: 'A2' },
      { turkish: 'erik', uzbek: 'olxo‘ri', level: 'A2' },
    ],
  },
  {
    slug: 'sabzavot',
    title: 'Sabzavotlar',
    words: [
      { turkish: 'domates', uzbek: 'pomidor', level: 'A1' },
      { turkish: 'salatalık', uzbek: 'bodring', level: 'A1' },
      { turkish: 'patates', uzbek: 'kartoshka', level: 'A1' },
      { turkish: 'soğan', uzbek: 'piyoz', level: 'A1' },
      { turkish: 'havuç', uzbek: 'sabzi', level: 'A1' },
      { turkish: 'biber', uzbek: 'qalampir', level: 'A2' },
      { turkish: 'patlıcan', uzbek: 'baqlajon', level: 'A2' },
      { turkish: 'lahana', uzbek: 'karam', level: 'A2' },
      { turkish: 'sarımsak', uzbek: 'sarimsoq', level: 'A2' },
      { turkish: 'kabak', uzbek: 'qovoq', level: 'A2' },
    ],
  },
  {
    slug: 'hayvon',
    title: 'Hayvonlar',
    words: [
      { turkish: 'kedi', uzbek: 'mushuk', level: 'A1' },
      { turkish: 'köpek', uzbek: 'it', level: 'A1' },
      { turkish: 'kuş', uzbek: 'qush', level: 'A1' },
      { turkish: 'balık', uzbek: 'baliq', level: 'A1' },
      { turkish: 'at', uzbek: 'ot', level: 'A1' },
      { turkish: 'inek', uzbek: 'sigir', level: 'A1' },
      { turkish: 'koyun', uzbek: 'qo‘y', level: 'A2' },
      { turkish: 'tavuk', uzbek: 'tovuq', level: 'A1' },
      { turkish: 'eşek', uzbek: 'eshak', level: 'A2' },
      { turkish: 'tavşan', uzbek: 'quyon', level: 'A2' },
      { turkish: 'kurt', uzbek: 'bo‘ri', level: 'A2' },
      { turkish: 'ayı', uzbek: 'ayiq', level: 'A2' },
    ],
  },
  {
    slug: 'oila',
    title: 'Oila',
    words: [
      { turkish: 'anne', uzbek: 'ona', level: 'A1' },
      { turkish: 'baba', uzbek: 'ota', level: 'A1' },
      { turkish: 'kardeş', uzbek: 'uka, singil', level: 'A1' },
      { turkish: 'abla', uzbek: 'opa', level: 'A1' },
      { turkish: 'ağabey', uzbek: 'aka', level: 'A1' },
      { turkish: 'dede', uzbek: 'bobo', level: 'A1' },
      { turkish: 'nine', uzbek: 'buvi', level: 'A1' },
      { turkish: 'teyze', uzbek: 'xola', level: 'A2' },
      { turkish: 'amca', uzbek: 'amaki', level: 'A2' },
      { turkish: 'dayı', uzbek: 'tog‘a', level: 'A2' },
      { turkish: 'hala', uzbek: 'amma', level: 'A2' },
      { turkish: 'yeğen', uzbek: 'jiyan', level: 'A2' },
    ],
  },
  {
    slug: 'uy',
    title: 'Uy va mebel',
    words: [
      { turkish: 'masa', uzbek: 'stol', level: 'A1' },
      { turkish: 'sandalye', uzbek: 'stul', level: 'A1' },
      { turkish: 'kapı', uzbek: 'eshik', level: 'A1' },
      { turkish: 'pencere', uzbek: 'deraza', level: 'A1' },
      { turkish: 'yatak', uzbek: 'karavot', level: 'A1' },
      { turkish: 'dolap', uzbek: 'shkaf', level: 'A1' },
      { turkish: 'halı', uzbek: 'gilam', level: 'A2' },
      { turkish: 'perde', uzbek: 'parda', level: 'A2' },
      { turkish: 'koltuk', uzbek: 'kreslo', level: 'A2' },
      { turkish: 'ayna', uzbek: 'oyna (ko‘zgu)', level: 'A2' },
      { turkish: 'mutfak', uzbek: 'oshxona', level: 'A1' },
      { turkish: 'banyo', uzbek: 'hammom', level: 'A1' },
    ],
  },
  {
    slug: 'kiyim',
    title: 'Kiyim-kechak',
    words: [
      { turkish: 'gömlek', uzbek: 'ko‘ylak (erkaklar)', level: 'A1' },
      { turkish: 'pantolon', uzbek: 'shim', level: 'A1' },
      { turkish: 'etek', uzbek: 'yubka', level: 'A1' },
      { turkish: 'ceket', uzbek: 'pidjak', level: 'A1' },
      { turkish: 'ayakkabı', uzbek: 'oyoq kiyim', level: 'A1' },
      { turkish: 'çorap', uzbek: 'paypoq', level: 'A1' },
      { turkish: 'şapka', uzbek: 'shlyapa', level: 'A2' },
      { turkish: 'elbise', uzbek: 'ko‘ylak (ayollar)', level: 'A1' },
      { turkish: 'kazak', uzbek: 'svitr', level: 'A2' },
      { turkish: 'eldiven', uzbek: 'qo‘lqop', level: 'A2' },
      { turkish: 'atkı', uzbek: 'sharf', level: 'A2' },
      { turkish: 'kemer', uzbek: 'kamar', level: 'A2' },
    ],
  },
  {
    slug: 'rang',
    title: 'Ranglar',
    words: [
      { turkish: 'kırmızı', uzbek: 'qizil', level: 'A1' },
      { turkish: 'mavi', uzbek: 'ko‘k', level: 'A1' },
      { turkish: 'yeşil', uzbek: 'yashil', level: 'A1' },
      { turkish: 'sarı', uzbek: 'sariq', level: 'A1' },
      { turkish: 'siyah', uzbek: 'qora', level: 'A1' },
      { turkish: 'beyaz', uzbek: 'oq', level: 'A1' },
      { turkish: 'mor', uzbek: 'siyohrang', level: 'A2' },
      { turkish: 'turuncu', uzbek: 'to‘q sariq', level: 'A2' },
      { turkish: 'gri', uzbek: 'kulrang', level: 'A2' },
      { turkish: 'pembe', uzbek: 'pushti', level: 'A2' },
      { turkish: 'kahverengi', uzbek: 'jigarrang', level: 'A2' },
    ],
  },
  {
    slug: 'kasb',
    title: 'Kasblar',
    words: [
      { turkish: 'öğretmen', uzbek: 'o‘qituvchi', level: 'A1' },
      { turkish: 'doktor', uzbek: 'shifokor', level: 'A1' },
      { turkish: 'mühendis', uzbek: 'muhandis', level: 'A1' },
      { turkish: 'öğrenci', uzbek: 'o‘quvchi, talaba', level: 'A1' },
      { turkish: 'aşçı', uzbek: 'oshpaz', level: 'A2' },
      { turkish: 'şoför', uzbek: 'haydovchi', level: 'A2' },
      { turkish: 'hemşire', uzbek: 'hamshira', level: 'A2' },
      { turkish: 'avukat', uzbek: 'advokat', level: 'B1' },
      { turkish: 'satıcı', uzbek: 'sotuvchi', level: 'A2' },
      { turkish: 'polis', uzbek: 'politsiya xodimi', level: 'A1' },
      { turkish: 'berber', uzbek: 'sartarosh', level: 'A2' },
      { turkish: 'terzi', uzbek: 'tikuvchi', level: 'B1' },
    ],
  },
  {
    slug: 'transport',
    title: 'Transport',
    words: [
      { turkish: 'araba', uzbek: 'mashina', level: 'A1' },
      { turkish: 'otobüs', uzbek: 'avtobus', level: 'A1' },
      { turkish: 'tren', uzbek: 'poyezd', level: 'A1' },
      { turkish: 'uçak', uzbek: 'samolyot', level: 'A1' },
      { turkish: 'bisiklet', uzbek: 'velosiped', level: 'A1' },
      { turkish: 'gemi', uzbek: 'kema', level: 'A2' },
      { turkish: 'taksi', uzbek: 'taksi', level: 'A1' },
      { turkish: 'metro', uzbek: 'metro', level: 'A1' },
      { turkish: 'motosiklet', uzbek: 'mototsikl', level: 'A2' },
      { turkish: 'vapur', uzbek: 'parom', level: 'B1' },
    ],
  },
  {
    slug: 'ovqat',
    title: 'Ovqat va ichimlik',
    words: [
      { turkish: 'ekmek', uzbek: 'non', level: 'A1' },
      { turkish: 'su', uzbek: 'suv', level: 'A1' },
      { turkish: 'çay', uzbek: 'choy', level: 'A1' },
      { turkish: 'kahve', uzbek: 'qahva', level: 'A1' },
      { turkish: 'süt', uzbek: 'sut', level: 'A1' },
      { turkish: 'peynir', uzbek: 'pishloq', level: 'A1' },
      { turkish: 'yumurta', uzbek: 'tuxum', level: 'A1' },
      { turkish: 'et', uzbek: 'go‘sht', level: 'A1' },
      { turkish: 'pirinç', uzbek: 'guruch', level: 'A2' },
      { turkish: 'çorba', uzbek: 'sho‘rva', level: 'A1' },
      { turkish: 'tuz', uzbek: 'tuz', level: 'A1' },
      { turkish: 'şeker', uzbek: 'shakar', level: 'A1' },
    ],
  },
  {
    slug: 'maktab',
    title: 'Maktab va o‘qish',
    words: [
      { turkish: 'okul', uzbek: 'maktab', level: 'A1' },
      { turkish: 'kitap', uzbek: 'kitob', level: 'A1' },
      { turkish: 'defter', uzbek: 'daftar', level: 'A1' },
      { turkish: 'kalem', uzbek: 'qalam', level: 'A1' },
      { turkish: 'silgi', uzbek: 'o‘chirg‘ich', level: 'A1' },
      { turkish: 'tahta', uzbek: 'doska', level: 'A1' },
      { turkish: 'sınıf', uzbek: 'sinf', level: 'A1' },
      { turkish: 'ders', uzbek: 'dars', level: 'A1' },
      { turkish: 'sınav', uzbek: 'imtihon', level: 'A2' },
      { turkish: 'ödev', uzbek: 'uy vazifasi', level: 'A1' },
      { turkish: 'çanta', uzbek: 'sumka', level: 'A1' },
      { turkish: 'sözlük', uzbek: 'lug‘at', level: 'A2' },
    ],
  },
  {
    slug: 'tana',
    title: 'Tana a‘zolari',
    words: [
      { turkish: 'baş', uzbek: 'bosh', level: 'A1' },
      { turkish: 'göz', uzbek: 'ko‘z', level: 'A1' },
      { turkish: 'burun', uzbek: 'burun', level: 'A1' },
      { turkish: 'ağız', uzbek: 'og‘iz', level: 'A1' },
      { turkish: 'kulak', uzbek: 'quloq', level: 'A1' },
      { turkish: 'el', uzbek: 'qo‘l', level: 'A1' },
      { turkish: 'ayak', uzbek: 'oyoq', level: 'A1' },
      { turkish: 'diş', uzbek: 'tish', level: 'A1' },
      { turkish: 'saç', uzbek: 'soch', level: 'A1' },
      { turkish: 'kalp', uzbek: 'yurak', level: 'A2' },
      { turkish: 'parmak', uzbek: 'barmoq', level: 'A2' },
      { turkish: 'boyun', uzbek: 'bo‘yin', level: 'A2' },
    ],
  },
  {
    slug: 'vaqt',
    title: 'Vaqt',
    words: [
      { turkish: 'bugün', uzbek: 'bugun', level: 'A1' },
      { turkish: 'yarın', uzbek: 'ertaga', level: 'A1' },
      { turkish: 'dün', uzbek: 'kecha', level: 'A1' },
      { turkish: 'sabah', uzbek: 'ertalab', level: 'A1' },
      { turkish: 'öğle', uzbek: 'tush payti', level: 'A1' },
      { turkish: 'akşam', uzbek: 'kechqurun', level: 'A1' },
      { turkish: 'gece', uzbek: 'tun', level: 'A1' },
      { turkish: 'hafta', uzbek: 'hafta', level: 'A1' },
      { turkish: 'ay', uzbek: 'oy', level: 'A1' },
      { turkish: 'yıl', uzbek: 'yil', level: 'A1' },
      { turkish: 'saat', uzbek: 'soat', level: 'A1' },
      { turkish: 'dakika', uzbek: 'daqiqa', level: 'A1' },
    ],
  },
  {
    slug: 'ob-havo',
    title: 'Ob-havo',
    words: [
      { turkish: 'güneş', uzbek: 'quyosh', level: 'A1' },
      { turkish: 'yağmur', uzbek: 'yomg‘ir', level: 'A1' },
      { turkish: 'kar', uzbek: 'qor', level: 'A1' },
      { turkish: 'rüzgâr', uzbek: 'shamol', level: 'A2' },
      { turkish: 'bulut', uzbek: 'bulut', level: 'A1' },
      { turkish: 'sıcak', uzbek: 'issiq', level: 'A1' },
      { turkish: 'soğuk', uzbek: 'sovuq', level: 'A1' },
      { turkish: 'sis', uzbek: 'tuman', level: 'B1' },
      { turkish: 'fırtına', uzbek: 'bo‘ron', level: 'B1' },
      { turkish: 'gök gürültüsü', uzbek: 'momaqaldiroq', level: 'B1' },
    ],
  },
  {
    slug: 'shahar',
    title: 'Shahar',
    words: [
      { turkish: 'sokak', uzbek: 'ko‘cha', level: 'A1' },
      { turkish: 'cadde', uzbek: 'katta ko‘cha', level: 'A2' },
      { turkish: 'meydan', uzbek: 'maydon', level: 'A2' },
      { turkish: 'köprü', uzbek: 'ko‘prik', level: 'A2' },
      { turkish: 'park', uzbek: 'bog‘', level: 'A1' },
      { turkish: 'hastane', uzbek: 'kasalxona', level: 'A1' },
      { turkish: 'eczane', uzbek: 'dorixona', level: 'A1' },
      { turkish: 'market', uzbek: 'do‘kon', level: 'A1' },
      { turkish: 'postane', uzbek: 'pochta', level: 'A2' },
      { turkish: 'banka', uzbek: 'bank', level: 'A1' },
      { turkish: 'cami', uzbek: 'masjid', level: 'A1' },
      { turkish: 'müze', uzbek: 'muzey', level: 'A2' },
    ],
  },
  {
    slug: 'sport',
    title: 'Sport',
    words: [
      { turkish: 'futbol', uzbek: 'futbol', level: 'A1' },
      { turkish: 'basketbol', uzbek: 'basketbol', level: 'A1' },
      { turkish: 'yüzme', uzbek: 'suzish', level: 'A2' },
      { turkish: 'koşu', uzbek: 'yugurish', level: 'A2' },
      { turkish: 'voleybol', uzbek: 'voleybol', level: 'A1' },
      { turkish: 'güreş', uzbek: 'kurash', level: 'B1' },
      { turkish: 'tenis', uzbek: 'tennis', level: 'A1' },
      { turkish: 'boks', uzbek: 'boks', level: 'A2' },
      { turkish: 'satranç', uzbek: 'shaxmat', level: 'A2' },
      { turkish: 'antrenman', uzbek: 'mashg‘ulot', level: 'B1' },
    ],
  },
  {
    slug: 'tabiat',
    title: 'Tabiat',
    words: [
      { turkish: 'ağaç', uzbek: 'daraxt', level: 'A1' },
      { turkish: 'çiçek', uzbek: 'gul', level: 'A1' },
      { turkish: 'dağ', uzbek: 'tog‘', level: 'A1' },
      { turkish: 'deniz', uzbek: 'dengiz', level: 'A1' },
      { turkish: 'nehir', uzbek: 'daryo', level: 'A2' },
      { turkish: 'göl', uzbek: 'ko‘l', level: 'A2' },
      { turkish: 'orman', uzbek: 'o‘rmon', level: 'A2' },
      { turkish: 'çöl', uzbek: 'cho‘l', level: 'B1' },
      { turkish: 'yaprak', uzbek: 'barg', level: 'A2' },
      { turkish: 'taş', uzbek: 'tosh', level: 'A1' },
      { turkish: 'toprak', uzbek: 'tuproq', level: 'A2' },
      { turkish: 'gökyüzü', uzbek: 'osmon', level: 'A2' },
    ],
  },
  {
    slug: 'his',
    title: 'His-tuyg‘ular',
    words: [
      { turkish: 'mutlu', uzbek: 'baxtli', level: 'A1' },
      { turkish: 'üzgün', uzbek: 'xafa', level: 'A1' },
      { turkish: 'kızgın', uzbek: 'jahli chiqqan', level: 'A2' },
      { turkish: 'yorgun', uzbek: 'charchagan', level: 'A1' },
      { turkish: 'heyecanlı', uzbek: 'hayajonli', level: 'A2' },
      { turkish: 'korkmuş', uzbek: 'qo‘rqqan', level: 'A2' },
      { turkish: 'şaşkın', uzbek: 'hayron', level: 'B1' },
      { turkish: 'endişeli', uzbek: 'xavotirli', level: 'B1' },
      { turkish: 'rahat', uzbek: 'xotirjam', level: 'A2' },
      { turkish: 'gururlu', uzbek: 'faxrlanayotgan', level: 'B1' },
    ],
  },
  {
    slug: 'oshxona',
    title: 'Oshxona buyumlari',
    words: [
      { turkish: 'tabak', uzbek: 'likopcha', level: 'A1' },
      { turkish: 'bardak', uzbek: 'stakan', level: 'A1' },
      { turkish: 'çatal', uzbek: 'vilka', level: 'A1' },
      { turkish: 'kaşık', uzbek: 'qoshiq', level: 'A1' },
      { turkish: 'bıçak', uzbek: 'pichoq', level: 'A1' },
      { turkish: 'tencere', uzbek: 'qozon', level: 'A2' },
      { turkish: 'tava', uzbek: 'tova', level: 'A2' },
      { turkish: 'buzdolabı', uzbek: 'muzlatgich', level: 'A1' },
      { turkish: 'fırın', uzbek: 'duxovka', level: 'A2' },
      { turkish: 'peçete', uzbek: 'salfetka', level: 'A2' },
    ],
  },
  {
    slug: 'texnologiya',
    title: 'Texnologiya',
    words: [
      { turkish: 'bilgisayar', uzbek: 'kompyuter', level: 'A1' },
      { turkish: 'telefon', uzbek: 'telefon', level: 'A1' },
      { turkish: 'internet', uzbek: 'internet', level: 'A1' },
      { turkish: 'ekran', uzbek: 'ekran', level: 'A2' },
      { turkish: 'klavye', uzbek: 'klaviatura', level: 'A2' },
      { turkish: 'yazıcı', uzbek: 'printer', level: 'B1' },
      { turkish: 'şarj', uzbek: 'quvvat (zaryad)', level: 'A2' },
      { turkish: 'uygulama', uzbek: 'ilova', level: 'B1' },
      { turkish: 'kamera', uzbek: 'kamera', level: 'A1' },
      { turkish: 'kulaklık', uzbek: 'quloqchin', level: 'A2' },
    ],
  },
  {
    slug: 'kun',
    title: 'Hafta kunlari',
    words: [
      { turkish: 'pazartesi', uzbek: 'dushanba', level: 'A1' },
      { turkish: 'salı', uzbek: 'seshanba', level: 'A1' },
      { turkish: 'çarşamba', uzbek: 'chorshanba', level: 'A1' },
      { turkish: 'perşembe', uzbek: 'payshanba', level: 'A1' },
      { turkish: 'cuma', uzbek: 'juma', level: 'A1' },
      { turkish: 'cumartesi', uzbek: 'shanba', level: 'A1' },
      { turkish: 'pazar', uzbek: 'yakshanba', level: 'A1' },
    ],
  },
  {
    slug: 'oy-nomi',
    title: 'Oy nomlari',
    words: [
      { turkish: 'ocak', uzbek: 'yanvar', level: 'A1' },
      { turkish: 'şubat', uzbek: 'fevral', level: 'A1' },
      { turkish: 'mart', uzbek: 'mart', level: 'A1' },
      { turkish: 'nisan', uzbek: 'aprel', level: 'A1' },
      { turkish: 'mayıs', uzbek: 'may', level: 'A1' },
      { turkish: 'haziran', uzbek: 'iyun', level: 'A1' },
      { turkish: 'temmuz', uzbek: 'iyul', level: 'A1' },
      { turkish: 'ağustos', uzbek: 'avgust', level: 'A1' },
      { turkish: 'eylül', uzbek: 'sentabr', level: 'A1' },
      { turkish: 'ekim', uzbek: 'oktabr', level: 'A1' },
      { turkish: 'kasım', uzbek: 'noyabr', level: 'A1' },
      { turkish: 'aralık', uzbek: 'dekabr', level: 'A1' },
    ],
  },
  {
    slug: 'ish',
    title: 'Ish va idora',
    words: [
      { turkish: 'ofis', uzbek: 'ofis', level: 'A2' },
      { turkish: 'toplantı', uzbek: 'yig‘ilish', level: 'B1' },
      { turkish: 'maaş', uzbek: 'maosh', level: 'A2' },
      { turkish: 'müdür', uzbek: 'rahbar', level: 'A2' },
      { turkish: 'çalışan', uzbek: 'xodim', level: 'B1' },
      { turkish: 'sözleşme', uzbek: 'shartnoma', level: 'B1' },
      { turkish: 'görüşme', uzbek: 'suhbat (intervyu)', level: 'B1' },
      { turkish: 'izin', uzbek: 'ta‘til, ruxsat', level: 'A2' },
      { turkish: 'mesai', uzbek: 'ish vaqti', level: 'B1' },
      { turkish: 'rapor', uzbek: 'hisobot', level: 'B1' },
    ],
  },
  {
    slug: 'sogliq',
    title: 'Sog‘liq',
    words: [
      { turkish: 'hasta', uzbek: 'kasal', level: 'A1' },
      { turkish: 'ilaç', uzbek: 'dori', level: 'A1' },
      { turkish: 'ateş', uzbek: 'isitma', level: 'A2' },
      { turkish: 'ağrı', uzbek: 'og‘riq', level: 'A2' },
      { turkish: 'öksürük', uzbek: 'yo‘tal', level: 'A2' },
      { turkish: 'reçete', uzbek: 'retsept', level: 'B1' },
      { turkish: 'muayene', uzbek: 'ko‘rik', level: 'B1' },
      { turkish: 'aşı', uzbek: 'emlash', level: 'B1' },
      { turkish: 'yara', uzbek: 'yara', level: 'A2' },
      { turkish: 'sağlık', uzbek: 'sog‘liq', level: 'A1' },
    ],
  },
];

// Qo'shimcha to'plam (content/more.ts)
topics.push(...moreTopics);

/** Jami nechta so'z — seed hisobotida ko'rsatiladi. */
export const topicWordCount = topics.reduce((n, t) => n + t.words.length, 0);

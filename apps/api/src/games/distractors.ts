// CHALG'ITUVCHI VARIANTLAR VA JAVOBNI OSHKOR QILMASLIK.
//
// Jonli saytda o'yinlarni o'ynab topilgan kamchiliklar:
//
//  1. "üzüm" savoliga variantlar: "uzum", "Tanishtiray", "Teledasturni e'lon
//     qiluvchi", "Dan gacha". Chalg'ituvchilar butun lug'atdan tasodifiy
//     olinardi — meva so'ziga "televizor boshlovchisi" variant bo'lsa,
//     javobni o'ylamasdan topib bo'ladi.
//
//  2. O'sha savolda faqat to'g'ri javob kichik harf bilan yozilgan edi
//     (lug'atda shunday). Harf o'lchami JAVOBNI AYTIB QO'YARDI.
//
//  3. "tuz" so'zining tarjimasi ham "tuz". Tinglab yozish o'yinida
//     "Tarjimasi: tuz" deb chiqardi — ya'ni javob ekranda yozilgan.
//
// Bu modul shu uch muammoni bir joyda hal qiladi.

export const TOPIC_TAG = 'mavzu:';

export interface DistractorWord {
  id: string;
  turkish: string;
  uzbek: string;
  level: string;
  category?: string | null;
  tags?: string[];
}

const lowerTr = (s: string) => s.toLocaleLowerCase('tr-TR');
const fold = (s: string) =>
  lowerTr(s.normalize('NFC').trim())
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‘’'`ʻʼ]/g, "'")
    .replace(/\s+/g, ' ');

/** Turkcha fe'l masdari (-mak/-mek bilan tugaydi). Chalg'ituvchi ham fe'l bo'lsin. */
export const isVerb = (turkish: string) => /m[ae]k$/u.test(lowerTr(turkish.trim()));

/**
 * Bosh harfni kichik qiladi — lekin faqat oddiy "Gap boshi" shaklida.
 *
 * "Satranç" -> "satranç", "Lise" -> "lise", lekin "TV" yoki "ABD" tegilmaydi
 * (ikkinchi harf ham katta — bu qisqartma, bosh harf emas).
 * Turkcha qoida bilan: "İ" -> "i", "I" -> "ı".
 */
export function soften(s: string, locale: 'tr' | 'uz' = 'tr'): string {
  const chars = [...s];
  if (chars.length === 0) return s;
  const [first, second] = chars;
  const isUpper = (c: string) => c !== c.toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'uz');
  if (!isUpper(first)) return s;
  if (second && isUpper(second)) return s; // qisqartma
  chars[0] = first.toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'uz');
  return chars.join('');
}

/** Ikki satr orasidagi tahrir masofasi (kichik satrlar uchun). */
function distance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

const bare = (w: { turkish: string; uzbek: string }) => ({
  a: fold(w.turkish),
  b: fold(w.uzbek).replace(/\s*\(.*?\)\s*/g, ''), // "(ayollar)" kabi izohsiz
});

/**
 * Tarjimasi AYNAN o'zi: tuz/tuz, taksi/taksi, üzüm/uzum, telefon/telefon.
 *
 * Bunday so'z hech bir tarjima o'yinida savol bo'la olmaydi — javob
 * ekranda yozilgan bo'ladi.
 *
 * DIQQAT: "elma/olma", "kitap/kitob" kabi O'XSHASH so'zlar bu yerga
 * KIRMAYDI. Turk va o'zbek tillari qarindosh, va o'xshash so'zni tanish —
 * o'rganishning tabiiy, foydali qismi. Ularni chiqarib tashlasak, A1
 * lug'atining katta qismi yo'qolardi.
 */
export function sameAsTranslation(w: { turkish: string; uzbek: string }): boolean {
  const { a, b } = bare(w);
  return a === b;
}

/**
 * Deyarli bir xil: bitta harf farqi (tenis/tennis, elma/olma).
 *
 * Faqat tarjima KO'RSATILIB, turkchasini YOZDIRADIGAN o'yinlarda ishlatiladi
 * (tinglab yozish, harflardan so'z): "Tarjimasi: tennis" deb turib "tenis"
 * ni yozdirish — savol emas.
 */
export function nearlySameAsTranslation(w: { turkish: string; uzbek: string }): boolean {
  const { a, b } = bare(w);
  if (a === b) return true;
  return Math.min(a.length, b.length) >= 4 && distance(a, b) <= 1;
}

function topicTags(w: DistractorWord): string[] {
  return (w.tags ?? []).filter((t) => t.startsWith(TOPIC_TAG));
}

function shuffled<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Chalg'ituvchi so'zlarni tanlaydi — eng "chalkashtiradigan"idan boshlab.
 *
 * Tartib:
 *   1. bir MAVZUdan (üzüm -> olma, nok, gilos): eng qiyin, eng foydali
 *   2. bir DARSLIK BO'LIMIdan va bir darajadan: birga o'rganilgan so'zlar
 *   3. bir darajadan
 *   4. qolgan hamma
 *
 * Har bosqichda so'z turi ham hisobga olinadi: fe'lga fe'l, otga ot.
 * "temiz" (sifat) savoliga "reddetmek" (fe'l) varianti bo'lsa, uni
 * grammatikadan bilib, o'ylamay chiqarib tashlash mumkin.
 *
 * Tarjimasi to'g'ri javob bilan bir xil yoki bir-biriga teng bo'lgan
 * so'zlar olinmaydi: ikkita "ona" varianti bo'lsa, savolning ikkita
 * to'g'ri javobi bo'lib qoladi.
 */
export function pickDistractors<T extends DistractorWord>(target: T, pool: T[], n: number): T[] {
  const targetUz = fold(target.uzbek);
  const targetTopics = new Set(topicTags(target));
  const targetIsVerb = isVerb(target.turkish);

  const candidates = pool.filter((w) => w.id !== target.id && fold(w.uzbek) !== targetUz);

  const tiers: T[][] = [
    candidates.filter((w) => topicTags(w).some((t) => targetTopics.has(t))),
    candidates.filter((w) => !!target.category && w.category === target.category && w.level === target.level),
    candidates.filter((w) => w.level === target.level),
    candidates,
  ];

  const picked: T[] = [];
  const usedUz = new Set<string>([targetUz]);
  const usedIds = new Set<string>();

  const take = (list: T[]) => {
    for (const w of shuffled(list)) {
      if (picked.length >= n) return;
      const uz = fold(w.uzbek);
      if (usedIds.has(w.id) || usedUz.has(uz)) continue;
      picked.push(w);
      usedIds.add(w.id);
      usedUz.add(uz);
    }
  };

  // Avval har bosqichdan so'z turi mos keladiganlarini, keyin qolganini
  for (const tier of tiers) {
    take(tier.filter((w) => isVerb(w.turkish) === targetIsVerb));
    if (picked.length >= n) break;
  }
  for (const tier of tiers) {
    take(tier);
    if (picked.length >= n) break;
  }
  return picked;
}

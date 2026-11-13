// O'ZBEK LOTIN → KIRILL.
//
// Kirill yozuvidagi lug'at qo'lda yozilmaydi: lotin lug'atidan shu funksiya
// bilan olinadi. Shunda ikki yozuv hech qachon bir-biridan "orqada"
// qolmaydi — lotinchada matn o'zgarsa, kirillchasi ham o'zgaradi.
//
// O'GIRILMAYDIGANLAR (ataylab):
//   • {n} kabi o'rinbosarlar
//   • raqamli yoki qisqa katta harfli kodlar: A1, B2, C1, XP, AI, CEFR
//   • o'zbek lotin alifbosida yo'q harfli so'zlar (c, w, ş, ç, ğ, ı, ö, ü):
//     bular turkcha yoki inglizcha so'z — ularni o'girish xato bo'lardi
//   • @nom, havolalar

const SINGLE: Record<string, string> = {
  a: "а", b: "б", d: "д", f: "ф", g: "г", h: "ҳ", i: "и", j: "ж", k: "к", l: "л",
  m: "м", n: "н", o: "о", p: "п", q: "қ", r: "р", s: "с", t: "т", u: "у", v: "в",
  x: "х", y: "й", z: "з",
};

const APOS = "'‘’ʻʼ`";
const isApos = (c: string | undefined) => !!c && APOS.includes(c);

/** Bitta so'zni o'giradi (so'z ichida faqat harflar va tutuq belgisi). */
function word(w: string): string {
  const lower = w.toLowerCase();
  let out = "";
  for (let i = 0; i < w.length; i++) {
    const c = w[i];
    const lc = lower[i];
    const next = lower[i + 1];
    const upper = c !== lc;
    // Katta harfli digraf: "SH" -> "Ш", "Sh" -> "Ш"
    const cap = (cyr: string) => (upper ? cyr.toUpperCase() : cyr);

    if ((lc === "o" || lc === "g") && isApos(w[i + 1])) {
      out += cap(lc === "o" ? "ў" : "ғ");
      i++;
      continue;
    }
    if (lc === "s" && next === "h") { out += cap("ш"); i++; continue; }
    if (lc === "c" && next === "h") { out += cap("ч"); i++; continue; }
    // "yo'q" — bu y + o', "ё" emas
    if (lc === "y" && next === "o" && !isApos(w[i + 2])) { out += cap("ё"); i++; continue; }
    if (lc === "y" && next === "u") { out += cap("ю"); i++; continue; }
    if (lc === "y" && next === "a") { out += cap("я"); i++; continue; }
    if (lc === "y" && next === "e") { out += cap("е"); i++; continue; }
    if (lc === "e") {
      // So'z boshida "э" (ertaga -> эртага), qolgan joyda "е"
      out += cap(i === 0 ? "э" : "е");
      continue;
    }
    if (isApos(c)) {
      // Tutuq belgisi (ma'lumot, san'at) -> ъ
      out += i > 0 && i < w.length - 1 ? "ъ" : c;
      continue;
    }
    const cyr = SINGLE[lc];
    out += cyr ? cap(cyr) : c;
  }
  return out;
}

const UZ_LATIN = /^[A-Za-z'‘’ʻʼ`]+$/;

function shouldKeep(token: string): boolean {
  if (!UZ_LATIN.test(token)) return true; // raqam, turkcha/inglizcha harf
  if (/[cwCW]/.test(token.replace(/ch/gi, ""))) return true; // "c" faqat "ch" ichida bo'ladi
  if (token.length <= 4 && token === token.toUpperCase() && /[A-Z]/.test(token)) return true; // XP, AI, CEFR
  if (/[a-z][A-Z]/.test(token)) return true; // YouTube kabi
  return false;
}

/** Butun matnni o'giradi. */
export function toCyrillic(text: string): string {
  // O'rinbosarlar, havolalar va @nomlar butunligicha saqlanadi
  return text.replace(
    /(\{\w+\}|https?:\/\/\S+|@\w+)|([A-Za-z0-9'‘’ʻʼ`]+)/g,
    (_m, keep: string | undefined, tok: string | undefined) => {
      if (keep) return keep;
      const t = tok as string;
      // So'z chetidagi tutuq/qo'shtirnoq belgilari so'zga kirmaydi
      const lead = t.match(/^['‘’ʻʼ`]+/)?.[0] ?? "";
      const trail = t.slice(lead.length).match(/['‘’ʻʼ`]+$/)?.[0] ?? "";
      let core = t.slice(lead.length, t.length - trail.length);
      // "o'" va "g'" oxirida bo'lsa (bo'g', to'g') — tutuq so'zga tegishli
      let tail = trail;
      if (tail && /[oOgG]$/.test(core)) {
        core += tail[0];
        tail = tail.slice(1);
      }
      if (!core || shouldKeep(core)) return t;
      return lead + word(core) + tail;
    },
  );
}

/** Lug'atdagi har bir satrni o'giradi (ichma-ich obyektlar ham). */
export function deepCyrillic<T>(value: T): T {
  if (typeof value === "string") return toCyrillic(value) as T;
  if (Array.isArray(value)) return value.map(deepCyrillic) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deepCyrillic(v)])) as T;
  }
  return value;
}

// TILLAR. Bu fayl ham serverda, ham brauzerda ishlatiladi.
//
// Qanday ishlaydi (qisqacha):
//   • Tanlangan til "lang" cookie'sida saqlanadi.
//   • proxy.ts har bir so'rovni ichkarida /<til>/... sahifasiga yo'naltiradi
//     (rewrite). Manzil satri O'ZGARMAYDI: /games hamma tilda /games.
//   • Har bir til uchun sahifalar oldindan tayyorlanadi (statik), shuning
//     uchun til almashtirish saytni sekinlashtirmaydi.

export const LOCALES = ["uz", "oz", "ru", "en", "tr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "uz";
export const LANG_COOKIE = "lang";

export const isLocale = (v: unknown): v is Locale =>
  typeof v === "string" && (LOCALES as readonly string[]).includes(v);

export const LOCALE_META: Record<Locale, { label: string; short: string; html: string; intl: string }> = {
  uz: { label: "O‘zbekcha", short: "UZ", html: "uz", intl: "uz-Latn-UZ" },
  // Kirill yozuvidagi o'zbekcha lotinchadan AVTOMATIK o'giriladi (translit.ts)
  oz: { label: "Ўзбекча", short: "ЎЗ", html: "uz-Cyrl", intl: "uz-Cyrl-UZ" },
  ru: { label: "Русский", short: "RU", html: "ru", intl: "ru-RU" },
  en: { label: "English", short: "EN", html: "en", intl: "en-GB" },
  tr: { label: "Türkçe", short: "TR", html: "tr", intl: "tr-TR" },
};

/** "{n} ta so'z" kabi matnga qiymat qo'yadi. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/**
 * Ko'plik shakli. Rus tilida "1 день / 2 дня / 5 дней" — uch xil.
 * Lug'atda shakllar "|" bilan yoziladi: "день|дня|дней" (one|few|many),
 * inglizchada "day|days" (one|other). O'zbek va turk tilida bitta shakl.
 */
export function plural(locale: Locale, n: number, forms: string): string {
  const list = forms.split("|");
  if (list.length === 1) return list[0];
  const cat = new Intl.PluralRules(LOCALE_META[locale].intl).select(n);
  if (list.length === 2) return cat === "one" ? list[0] : list[1];
  if (cat === "one") return list[0];
  if (cat === "few") return list[1];
  return list[2];
}

// Lug'atlarni yuklash. Server komponentlari ham, brauzer ham ishlatishi
// mumkin (lekin brauzerga butun lug'at to'plami EMAS, faqat tanlangan til
// lug'ati provider orqali yuboriladi — app/[lang]/layout.tsx).

import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import { en } from "./dict/en";
import { ru } from "./dict/ru";
import { tr } from "./dict/tr";
import { uz, type Dict } from "./dict/uz";
import { deepCyrillic } from "./translit";

export type { Dict } from "./dict/uz";

let ozCache: Dict | null = null;

export function getDictionary(locale: Locale): Dict {
  switch (locale) {
    case "ru":
      return ru;
    case "en":
      return en;
    case "tr":
      return tr;
    case "oz":
      // Bir marta o'giriladi va saqlanadi
      return (ozCache ??= deepCyrillic(uz));
    default:
      return uz;
  }
}

export const toLocale = (v: unknown): Locale => (isLocale(v) ? v : DEFAULT_LOCALE);

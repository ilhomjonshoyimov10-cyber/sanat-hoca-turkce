// Server komponentlari uchun: joriy tilni URL'dagi [lang] dan oladi.
// (next/root-params faqat serverda ishlaydi — brauzerda useI18n() ni ishlating.)

import { lang } from "next/root-params";
import { getDictionary, toLocale } from "./index";
import type { Locale } from "./config";

export async function getLocale(): Promise<Locale> {
  return toLocale(await lang());
}

export async function getT() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}

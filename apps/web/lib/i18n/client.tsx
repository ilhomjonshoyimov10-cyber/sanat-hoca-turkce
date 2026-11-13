"use client";

// Brauzer komponentlari uchun til konteksti.
//
// Til almashtirilganda sahifa TO'LIQ qayta yuklanadi. Bu ataylab:
// Next.js mijoz keshida oldingi tildagi sahifalar qolib ketmasin, va
// <html lang> ham to'g'ri bo'lsin. Til kamdan-kam almashtiriladi.

import { createContext, useContext, type ReactNode } from "react";
import { LANG_COOKIE, type Locale } from "./config";
import type { Dict } from "./dict/uz";

type Ctx = { locale: Locale; t: Dict };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, t: dict }}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n faqat I18nProvider ichida ishlaydi");
  return ctx;
}

/** Tilni saqlaydi va sahifani qayta yuklaydi. */
export function switchLocale(next: Locale) {
  // 1 yil. SameSite=Lax: boshqa saytdan kelgan havolada ham til saqlanadi.
  document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
  window.location.reload();
}

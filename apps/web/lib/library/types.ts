// Kutubxona ma'lumot turlari.

import { toCyrillic } from "../i18n/translit";

export type Level = "A1" | "A2" | "B1" | "B2" | "C1";
export type Tone = "cobalt" | "turquoise" | "brass" | "bole";

export interface Gloss {
  key: string;
  uz: string;
  ru: string;
  en: string;
}

export interface Chapter {
  title: string;
  /** [[so'z]] yoki [[shakl|kalit]] — lug'atdagi so'z belgisi */
  paragraphs: string[];
  glossary: Gloss[];
  questions: { q: string; a: string }[];
}

export interface LibraryBook {
  slug: string;
  title: string;
  level: Level;
  tone: Tone;
  blurb: { uz: string; ru: string; en: string; tr: string };
  chapters: Chapter[];
}

/** Lug'at yozuvi: kalit (turkcha, kichik harf) + uch tildagi ma'no. */
export const g = (key: string, uz: string, ru: string, en: string): Gloss => ({ key, uz, ru, en });

export type Segment = { text: string } | { text: string; key: string };

const MARK = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

/** Paragrafni oddiy matn va lug'at so'zlariga bo'ladi. */
export function segments(paragraph: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of paragraph.matchAll(MARK)) {
    if (m.index! > last) out.push({ text: paragraph.slice(last, m.index) });
    out.push({ text: m[1], key: (m[2] ?? m[1]).toLocaleLowerCase("tr") });
    last = m.index! + m[0].length;
  }
  if (last < paragraph.length) out.push({ text: paragraph.slice(last) });
  return out;
}

/** Belgilarsiz toza matn (ovoz chiqarib o'qish va so'z sanash uchun). */
export const plain = (paragraph: string) => paragraph.replace(MARK, (_m, a: string) => a);

export const wordCount = (b: LibraryBook) =>
  b.chapters.reduce((n, c) => n + c.paragraphs.reduce((k, p) => k + plain(p).split(/\s+/).filter(Boolean).length, 0), 0);

/** So'z ma'nosi interfeys tilida (turkcha interfeysda — o'zbekcha). */
export function meaning(g: Gloss, locale: string): string {
  if (locale === "ru") return g.ru;
  if (locale === "en") return g.en;
  if (locale === "oz") return toCyrillic(g.uz);
  return g.uz;
}

/** Kitob tavsifi interfeys tilida. */
export function blurbFor(b: LibraryBook, locale: string): string {
  if (locale === "ru" || locale === "en" || locale === "tr") return b.blurb[locale];
  if (locale === "oz") return toCyrillic(b.blurb.uz);
  return b.blurb.uz;
}

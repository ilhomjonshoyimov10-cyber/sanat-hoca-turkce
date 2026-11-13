// Sana va vaqt — har doim TOSHKENT vaqtida (UTC+5).
//
// Nega o'zimiz yozamiz: brauzerlarning ko'pida o'zbekcha oy nomlari yo'q,
// shuning uchun `toLocaleString("uz-UZ")` "M11 13, Fri 15:30" kabi
// tushunarsiz matn chiqaradi. O'zbek tili uchun nomlar shu yerda, boshqa
// tillar uchun brauzerning Intl'i (ular to'liq).

import type { Locale } from "./i18n/config";
import { LOCALE_META } from "./i18n/config";
import { toCyrillic } from "./i18n/translit";

const TZ = "Asia/Tashkent";
const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
const UZ_DAYS = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];

/** Toshkentdagi sana qismlari (brauzer qaysi mintaqada bo'lishidan qat'i nazar). */
function parts(d: Date) {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { y: Number(get("year")), m: Number(get("month")) - 1, d: Number(get("day")), wd, hh: get("hour"), mm: get("minute") };
}

/** "13-noyabr, juma, 15:30" (uz) · "пт, 13 нояб., 15:30" (ru) va h.k. */
export function formatDateTime(iso: string | Date, locale: Locale, opts: { weekday?: boolean; year?: boolean } = {}): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return "";
  if (locale === "uz" || locale === "oz") {
    const p = parts(date);
    const now = parts(new Date());
    const yr = opts.year || p.y !== now.y ? ` ${p.y}-yil` : "";
    const text = `${p.d}-${UZ_MONTHS[p.m]}${yr}${opts.weekday === false ? "" : `, ${UZ_DAYS[p.wd]}`}, ${p.hh}:${p.mm}`;
    return locale === "oz" ? toCyrillic(text) : text;
  }
  return date.toLocaleString(LOCALE_META[locale].intl, {
    timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    ...(opts.weekday === false ? {} : { weekday: "short" }),
    ...(opts.year ? { year: "numeric" } : {}),
  });
}

/** Faqat vaqt: "15:30" */
export function formatTime(iso: string | Date): string {
  const p = parts(typeof iso === "string" ? new Date(iso) : iso);
  return `${p.hh}:${p.mm}`;
}

/** Brauzerning mahalliy vaqtini <input type="datetime-local"> formatiga keltiradi. */
export function localInputValue(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** "12 daqiqadan keyin" / "2 soat 5 daqiqadan keyin" — faqat o'zbekcha panellar uchun. */
export function untilText(iso: string, now = Date.now()): string {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return "";
  const min = Math.ceil(ms / 60_000);
  if (min < 60) return `${min} daqiqadan keyin`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} soat${min % 60 ? ` ${min % 60} daqiqa` : ""}dan keyin`;
  const days = Math.floor(h / 24);
  return `${days} kundan keyin`;
}

/** Faqat sana: "13-noyabr" (boshqa yil bo'lsa "13-noyabr 2025-yil"). */
export function formatDate(iso: string | Date, locale: Locale = "uz"): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return "";
  if (locale === "uz" || locale === "oz") {
    const p = parts(date);
    const now = parts(new Date());
    const text = `${p.d}-${UZ_MONTHS[p.m]}${p.y !== now.y ? ` ${p.y}-yil` : ""}`;
    return locale === "oz" ? toCyrillic(text) : text;
  }
  return date.toLocaleDateString(LOCALE_META[locale].intl, { timeZone: TZ, day: "numeric", month: "short", year: "numeric" });
}

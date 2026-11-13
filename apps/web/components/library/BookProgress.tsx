"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { fmt } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

// O'qilgan boblar brauzerda saqlanadi (qulaylik uchun; boshqa qurilmaga
// o'tmaydi — bu ataylab: kutubxona kirmagan mehmonlar uchun ham ochiq).
const KEY = (slug: string) => `sh_lib_${slug}`;
const EVENT = "sh-lib-progress";

export function readDone(slug: string): number[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY(slug)) ?? "[]");
    return Array.isArray(v) ? v.filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

export function markDone(slug: string, chapter: number) {
  try {
    const set = new Set(readDone(slug));
    set.add(chapter);
    window.localStorage.setItem(KEY(slug), JSON.stringify([...set].sort((a, b) => a - b)));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* maxfiy rejim */
  }
}

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};

export function useDone(slug: string): number[] {
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(KEY(slug)) ?? "[]";
      } catch {
        return "[]";
      }
    },
    () => "[]",
  );
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Kitob sahifasidagi "Boshlash / Davom etish" va o'qilgan boblar soni. */
export function BookStart({ slug, total }: { slug: string; total: number }) {
  const { t } = useI18n();
  const done = useDone(slug);
  const next = Array.from({ length: total }, (_, i) => i + 1).find((n) => !done.includes(n)) ?? 1;
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Link href={`/kutubxona/${slug}/${next}`} className="btn btn-primary">
        {done.length > 0 && done.length < total ? t.library.continue : t.library.read}
      </Link>
      {done.length > 0 && (
        <span className="text-[0.9375rem] text-muted">{fmt(t.library.progress, { done: done.length, total })}</span>
      )}
    </div>
  );
}

/** Mundarijada: o'qilgan bob belgisi. */
export function DoneMark({ slug, chapter }: { slug: string; chapter: number }) {
  const done = useDone(slug);
  if (!done.includes(chapter)) return null;
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-turquoise" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-label="✓">
      <path d="m5 12 4 4 10-10" />
    </svg>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import { fmt } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import { BOOKS } from "@/lib/library";
import type { Stats } from "./games/types";

// YUTUQLAR — o'quvchining natijalaridan hisoblanadi (alohida jadval yo'q).
// Server statistikasi + kutubxonada o'qilgan kitoblar (brauzerda).
// Maqsad: keyingi qadam ko'rinib tursin ("yana 23 ta so'z — va nishon").

type Key = "first" | "week" | "month" | "w100" | "w500" | "mastered" | "lvl5" | "lvl10" | "reader";

function booksFinished(): number {
  try {
    return BOOKS.filter((b) => {
      const done = JSON.parse(window.localStorage.getItem(`sh_lib_${b.slug}`) ?? "[]");
      return Array.isArray(done) && done.length >= b.chapters.length;
    }).length;
  } catch {
    return 0;
  }
}
const noop = () => () => {};

const ICON: Record<Key, string> = {
  first: "M12 3l2.5 6.5L21 10l-5 4.5L17.5 21 12 17.5 6.5 21 8 14.5 3 10l6.5-.5z",
  week: "M12 3c1 3 4 4.5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s.5 2 2 2c0-3-1-5 1-8z",
  month: "M12 2c1.5 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.5-4.5 1.5-4.5S8 12 10 12c0-4-1.5-7 2-10z",
  w100: "M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z M8 7h6",
  w500: "M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z M8 7h6 M8 11h6",
  mastered: "M12 3l7 3v6c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6z M9 12l2 2 4-4",
  lvl5: "M12 2l3 6 6 .9-4.5 4.3 1 6.3L12 16.6 6.5 19.5l1-6.3L3 8.9 9 8z",
  lvl10: "M5 21h14 M7 21V10l5-7 5 7v11 M10 14h4",
  reader: "M4 5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 0-2 2z M20 5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2z",
};

export function Achievements({ stats }: { stats: Stats }) {
  const { t } = useI18n();
  const a = t.achievements;
  const read = useSyncExternalStore(noop, booksFinished, () => 0);

  const list: { key: Key; have: number; need: number }[] = [
    { key: "first", have: stats.xp, need: 10 },
    { key: "week", have: stats.longestStreak, need: 7 },
    { key: "w100", have: stats.learnedWords, need: 100 },
    { key: "reader", have: read, need: 1 },
    { key: "lvl5", have: stats.level, need: 5 },
    { key: "mastered", have: stats.masteredWords, need: 50 },
    { key: "month", have: stats.longestStreak, need: 30 },
    { key: "w500", have: stats.learnedWords, need: 500 },
    { key: "lvl10", have: stats.level, need: 10 },
  ];
  const got = list.filter((x) => x.have >= x.need).length;

  return (
    <section aria-labelledby="yutuqlar">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="yutuqlar" className="text-[1.4rem]">{a.title}</h2>
        <p className="text-[0.9375rem] text-muted">{fmt(a.count, { got, total: list.length })}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(({ key, have, need }) => {
          const done = have >= need;
          const pct = Math.min(100, Math.round((have / need) * 100));
          return (
            <li
              key={key}
              className={`flex items-center gap-4 border p-4 ${done ? "border-brass/50 bg-brass/[0.07]" : "border-cobalt/25 bg-ink"}`}
            >
              <span className={`grid size-12 shrink-0 place-items-center rounded-full border ${done ? "border-brass/70 bg-brass/15 text-brass" : "border-cobalt/30 text-muted/60"}`}>
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={ICON[key]} />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block font-semibold ${done ? "text-porcelain" : "text-porcelain/80"}`}>{a.list[key].title}</span>
                <span className="block text-[0.8125rem] text-muted">{a.list[key].text}</span>
                {!done && (
                  <span className="mt-2 block">
                    <span className="progress-bar block"><span style={{ width: `${pct}%` }} /></span>
                    <span className="mt-1 block text-[0.75rem] text-muted">{Math.min(have, need)} / {need}</span>
                  </span>
                )}
              </span>
              {done && <span className="sr-only">{a.done}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

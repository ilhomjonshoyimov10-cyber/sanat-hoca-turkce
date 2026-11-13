"use client";

import { useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import { toCyrillic } from "@/lib/i18n/translit";
import { speakTurkish, subscribeVoices, turkishVoiceAvailable } from "@/lib/speech";
import { tashkentDayNumber, todays, type Gloss } from "@/lib/wotd";

// Kun raqami faqat brauzerda hisoblanadi: sahifa oldindan (statik)
// tayyorlanadi va serverda "bugun" yig'ish kuni bo'lib qolardi.
const noop = () => () => {};
const useDay = () => useSyncExternalStore(noop, () => tashkentDayNumber(), () => -1);

function gloss(g: Gloss, locale: Locale): string {
  if (locale === "ru") return g.ru;
  if (locale === "en") return g.en;
  if (locale === "oz") return toCyrillic(g.uz);
  return g.uz; // uz va tr: o'quvchi turk tilini o'rganyapti — izoh o'zbekcha
}

const Speaker = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
);

export function WordOfDay() {
  const { t, locale } = useI18n();
  const day = useDay();
  const voice = useSyncExternalStore(subscribeVoices, turkishVoiceAvailable, () => false);

  if (day < 0) {
    // Server va birinchi chizish: joy band qilinadi, sahifa sakramaydi
    return <div className="min-h-[22rem] border border-cobalt/25 bg-cobalt/[0.04]" aria-hidden="true" />;
  }

  const { word, proverb } = todays(day);

  return (
    <div className="grid gap-px overflow-hidden border border-cobalt/25 bg-cobalt/25 lg:grid-cols-[1.35fr_1fr]">
      <article className="relative bg-ink p-7 sm:p-9">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2.5 text-sm font-medium text-turquoise">
            <span className="size-1.5 rotate-45 bg-turquoise" />
            {t.wotd.title}
          </p>
          <span className="badge">{word.level}</span>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-x-5 gap-y-3">
          <p lang="tr" className="t-word text-[clamp(2.8rem,6vw,4.2rem)] leading-none text-porcelain">{word.tr}</p>
          {voice && (
            <button
              type="button"
              onClick={() => speakTurkish(word.tr, 0.85)}
              className="btn btn-outline !min-h-10 !px-3.5 !py-1.5 text-sm"
              aria-label={`${t.wotd.listen}: ${word.tr}`}
            >
              <Speaker />
              {t.wotd.listen}
            </button>
          )}
        </div>
        <p className="mt-3 text-[1.35rem] font-medium text-brass">{gloss(word.meaning, locale)}</p>

        <div className="rule my-6 max-w-sm" />
        <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-muted">{t.wotd.example}</p>
        <p lang="tr" className="mt-2 text-[1.15rem] text-porcelain">
          {word.example}
          {voice && (
            <button type="button" onClick={() => speakTurkish(word.example, 0.85)} className="ml-2 inline-grid size-7 translate-y-1 place-items-center rounded-full text-muted transition-colors hover:text-porcelain" aria-label={`${t.wotd.listen}: ${word.example}`}>
              <Speaker />
            </button>
          )}
        </p>
        <p className="mt-1 text-muted">{gloss(word.exampleMeaning, locale)}</p>
      </article>

      <article className="relative flex flex-col justify-between overflow-hidden bg-[linear-gradient(165deg,#101c42,#060c1e)] p-7 sm:p-9">
        <div className="cini-field absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative">
          <p className="flex items-center gap-2.5 text-sm font-medium text-brass">
            <span className="size-1.5 rotate-45 bg-brass" />
            {t.wotd.proverb}
          </p>
          <blockquote lang="tr" className="t-word mt-6 text-[clamp(1.5rem,2.6vw,2rem)] leading-snug text-porcelain">
            &ldquo;{proverb.tr}&rdquo;
          </blockquote>
          <p className="mt-4 text-[1.0625rem] text-muted">{gloss(proverb.meaning, locale)}</p>
        </div>
        <p className="relative mt-8 text-[0.8125rem] text-muted">{t.wotd.tomorrow}</p>
      </article>
    </div>
  );
}

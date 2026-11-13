"use client";

import { useCallback, useRef, useState } from "react";
import { LOCALE_META, LOCALES, type Locale } from "@/lib/i18n/config";
import { switchLocale, useI18n } from "@/lib/i18n/client";
import { useDismiss } from "@/lib/useDismiss";

const Globe = ({ className = "size-[1.05rem]" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.6 2.7 3.9 5.7 3.9 9s-1.3 6.3-3.9 9c-2.6-2.7-3.9-5.7-3.9-9S9.4 5.7 12 3z" />
  </svg>
);

const Check = () => (
  <svg viewBox="0 0 24 24" className="size-4 text-turquoise" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12 4 4 10-10" />
  </svg>
);

/** Tillar ro'yxati — sarlavhadagi tugma ham, foydalanuvchi menyusi ham ishlatadi. */
export function LocaleList({ onPick }: { onPick?: () => void }) {
  const { locale } = useI18n();
  return (
    <ul className="grid gap-0.5">
      {LOCALES.map((l: Locale) => {
        const on = l === locale;
        return (
          <li key={l}>
            <button
              type="button"
              lang={LOCALE_META[l].html}
              aria-current={on ? "true" : undefined}
              onClick={() => {
                onPick?.();
                if (!on) switchLocale(l);
              }}
              className={`flex w-full items-center gap-3 rounded-[var(--r-field)] px-3 py-2.5 text-left text-[0.9375rem] transition-colors ${
                on ? "bg-cobalt/18 font-semibold text-porcelain" : "text-muted hover:bg-cobalt/10 hover:text-porcelain"
              }`}
            >
              <span className={`w-7 text-[0.75rem] font-bold tracking-wide ${on ? "text-brass" : "text-muted"}`}>
                {LOCALE_META[l].short}
              </span>
              <span className="flex-1">{LOCALE_META[l].label}</span>
              {on && <Check />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function LangSwitcher() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(box, open, close);

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${t.lang.choose}: ${LOCALE_META[locale].label}`}
        className="flex h-10 items-center gap-1.5 rounded-full border border-cobalt/35 px-3 text-[0.8125rem] font-bold tracking-wide text-porcelain transition-colors hover:border-cobalt/70 hover:bg-cobalt/10"
      >
        <Globe />
        {LOCALE_META[locale].short}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-[10px] border border-cobalt/40 bg-tile p-2 raise">
          <p className="flex items-center gap-2 px-3 pb-2 pt-1.5 text-[0.75rem] font-bold uppercase tracking-[0.08em] text-muted">
            <Globe className="size-3.5 text-turquoise" />
            {t.lang.title}
          </p>
          <LocaleList onPick={close} />
          <p className="mt-2 border-t border-cobalt/20 px-3 pb-1 pt-2.5 text-[0.75rem] leading-snug text-muted">{t.lang.note}</p>
        </div>
      )}
    </div>
  );
}

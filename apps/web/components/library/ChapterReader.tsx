"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n/client";
import { meaning, plain, segments, type Gloss } from "@/lib/library/types";
import { speakTurkish, subscribeVoices, turkishVoiceAvailable } from "@/lib/speech";
import { useDismiss } from "@/lib/useDismiss";
import { markDone } from "./BookProgress";

const SIZE_KEY = "sh_lib_font";
const SIZES = ["text-[1.0625rem]", "text-[1.1875rem]", "text-[1.3125rem]", "text-[1.5rem]"];

function readSize(): number {
  try {
    const n = Number(window.localStorage.getItem(SIZE_KEY));
    return Number.isInteger(n) && n >= 0 && n < SIZES.length ? n : 1;
  } catch {
    return 1;
  }
}

/** Bitta lug'at so'zi: bosilganda ostida tarjimasi chiqadi. */
function Word({ text, gloss, open, onToggle }: { text: string; gloss: Gloss | undefined; open: boolean; onToggle: () => void }) {
  const { locale } = useI18n();
  const box = useRef<HTMLSpanElement>(null);
  const close = useCallback(() => open && onToggle(), [open, onToggle]);
  useDismiss(box, open, close);
  if (!gloss) return <>{text}</>;
  return (
    <span ref={box} className="relative inline">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`rounded-[2px] underline decoration-brass/55 decoration-dotted decoration-2 underline-offset-[5px] transition-colors hover:bg-brass/15 ${open ? "bg-brass/20 text-porcelain" : ""}`}
      >
        {text}
      </button>
      {open && (
        <span
          role="tooltip"
          // Telefonda — ekran pastida (so'z chetda bo'lsa ham ekrandan chiqib ketmaydi)
          className="z-30 rounded-[10px] border border-brass/45 bg-tile px-4 py-3 text-left text-[1rem] leading-snug shadow-2xl raise max-sm:fixed max-sm:inset-x-4 max-sm:bottom-5 sm:absolute sm:left-1/2 sm:top-[calc(100%+6px)] sm:w-max sm:max-w-[16rem] sm:-translate-x-1/2 sm:text-[0.9375rem]"
        >
          <span lang="tr" className="block font-display font-semibold text-brass">{gloss.key}</span>
          <span className="block text-porcelain">{meaning(gloss, locale)}</span>
        </span>
      )}
    </span>
  );
}

const noop = () => () => {};

export function ChapterReader({
  slug,
  chapter,
  paragraphs,
  glossary,
}: {
  slug: string;
  chapter: number;
  paragraphs: string[];
  glossary: Gloss[];
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState<string | null>(null);
  const savedSize = useSyncExternalStore(noop, readSize, () => 1);
  const [size, setSize] = useState<number | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const voice = useSyncExternalStore(subscribeVoices, turkishVoiceAvailable, () => false);
  const end = useRef<HTMLDivElement>(null);
  const fontIdx = size ?? savedSize;

  const byKey = new Map(glossary.map((g) => [g.key, g]));

  // Bob oxirigacha o'qilsa — "o'qildi" deb belgilanadi
  useEffect(() => {
    const el = end.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        markDone(slug, chapter);
        io.disconnect();
      }
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [slug, chapter]);

  // Sahifadan chiqilganda ovoz to'xtasin
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function changeSize(d: number) {
    const n = Math.max(0, Math.min(SIZES.length - 1, fontIdx + d));
    setSize(n);
    try {
      window.localStorage.setItem(SIZE_KEY, String(n));
    } catch {
      /* maxfiy rejim */
    }
  }

  function toggleSpeak() {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const text = paragraphs.map(plain).join(" ");
    speakTurkish(text, 0.9);
    setSpeaking(true);
    // Ovoz tugaganini kuzatamiz
    const timer = window.setInterval(() => {
      if (!synth.speaking) {
        setSpeaking(false);
        window.clearInterval(timer);
      }
    }, 500);
  }

  return (
    <div>
      {/* Asboblar */}
      <div className="sticky top-[4.25rem] z-10 -mx-1 mb-8 flex flex-wrap items-center gap-2 border-b border-cobalt/20 bg-ink/90 px-1 py-2.5 backdrop-blur">
        <div role="group" aria-label={t.library.fontSize} className="flex items-center rounded-full border border-cobalt/35">
          <button type="button" onClick={() => changeSize(-1)} disabled={fontIdx === 0} className="grid size-9 place-items-center rounded-full text-[0.85rem] font-bold disabled:opacity-40" aria-label={`${t.library.fontSize} −`}>A−</button>
          <button type="button" onClick={() => changeSize(1)} disabled={fontIdx === SIZES.length - 1} className="grid size-9 place-items-center rounded-full text-[1.05rem] font-bold disabled:opacity-40" aria-label={`${t.library.fontSize} +`}>A+</button>
        </div>
        {voice && (
          <button type="button" onClick={toggleSpeak} aria-pressed={speaking} className="btn btn-outline !min-h-9 !px-3.5 !py-1 text-sm">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              {speaking ? <path d="M7 6h3v12H7zM14 6h3v12h-3z" /> : <><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></>}
            </svg>
            {speaking ? t.library.stop : t.library.listen}
          </button>
        )}
        <span className="ml-auto text-[0.8125rem] text-muted max-sm:hidden">{t.library.glossaryHelp}</span>
      </div>

      {/* Matn */}
      <div lang="tr" className={`grid gap-6 font-display leading-[1.75] text-porcelain/95 ${SIZES[fontIdx]}`}>
        {paragraphs.map((p, pi) => (
          <p key={pi}>
            {segments(p).map((s, si) =>
              "key" in s ? (
                <Word
                  key={si}
                  text={s.text}
                  gloss={byKey.get(s.key)}
                  open={open === `${pi}-${si}`}
                  onToggle={() => setOpen((o) => (o === `${pi}-${si}` ? null : `${pi}-${si}`))}
                />
              ) : (
                <span key={si}>{s.text}</span>
              ),
            )}
          </p>
        ))}
      </div>
      <div ref={end} aria-hidden="true" className="h-px" />
    </div>
  );
}

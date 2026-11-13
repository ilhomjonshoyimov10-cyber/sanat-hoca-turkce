"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { LOCALE_META } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import { toCyrillic } from "@/lib/i18n/translit";
import { describe, embedUrl, MEDIA_KINDS, watchUrl, type MediaItem, type MediaKind } from "@/lib/media";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
const SUBS_KEY = "sh_media_subs";

/** Subtitr tanlovi brauzerda eslab qolinadi (faqat qulaylik uchun). */
function readSubs(): boolean {
  try {
    return window.localStorage.getItem(SUBS_KEY) !== "0";
  } catch {
    return true;
  }
}
function writeSubs(on: boolean) {
  try {
    window.localStorage.setItem(SUBS_KEY, on ? "1" : "0");
  } catch {
    /* maxfiy rejim — e'tiborsiz */
  }
}

const Play = ({ className = "size-7" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
);

const KIND_BG: Record<MediaKind, string> = {
  SERIES: "linear-gradient(150deg,#1d3a8f,#070d1f)",
  FILM: "linear-gradient(150deg,#7d241d,#070d1f)",
  MUSIC: "linear-gradient(150deg,#7a5218,#070d1f)",
  KIDS: "linear-gradient(150deg,#0f6d6c,#070d1f)",
  LESSON: "linear-gradient(150deg,#2a3560,#070d1f)",
};

const KIND_TONE: Record<MediaKind, string> = {
  SERIES: "text-cobalt border-cobalt/45",
  FILM: "text-bole border-bole/45",
  MUSIC: "text-brass border-brass/45",
  KIDS: "text-turquoise border-turquoise/45",
  LESSON: "text-porcelain border-porcelain/30",
};

export function MediaBrowser() {
  const { t, locale } = useI18n();
  const m = t.media;
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [kind, setKind] = useState<MediaKind | "">("");
  const [level, setLevel] = useState("");
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState<MediaItem | null>(null);
  const [subs, setSubs] = useState(true);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    api<MediaItem[]>("/media")
      .then((rows) => {
        if (!alive) return;
        setItems(rows);
        // Ulashilgan havola: /media?v=<id> — o'sha video ochiq holda
        const want = new URLSearchParams(window.location.search).get("v");
        const hit = want ? rows.find((r) => r.id === want) : undefined;
        if (hit) setCurrent(hit);
        setSubs(readSubs());
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const open = useCallback((item: MediaItem) => {
    setCurrent(item);
    window.history.replaceState(null, "", `?v=${encodeURIComponent(item.id)}`);
    // Pleyerni ko'rinadigan joyga olib kelamiz (sarlavha ostida qolmasin)
    requestAnimationFrame(() => stage.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  const close = useCallback(() => {
    setCurrent(null);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const kinds = useMemo(() => MEDIA_KINDS.filter((k) => items?.some((i) => i.kind === k)), [items]);
  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return (items ?? []).filter(
      (i) =>
        (!kind || i.kind === kind) &&
        (!level || i.level === level) &&
        (!q || `${i.title} ${i.ytTitle ?? ""} ${i.channel ?? ""}`.toLocaleLowerCase("tr").includes(q)),
    );
  }, [items, kind, level, query]);

  const src = current ? embedUrl(current, { subtitles: subs, hl: LOCALE_META[locale].html.slice(0, 2) }) : null;

  return (
    <div className="grid gap-10">
      {/* ═════ Pleyer ═════ */}
      <div ref={stage} className="scroll-mt-24">
        {current && src && (
          <section aria-label={current.title} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <div className="overflow-hidden border border-cobalt/35 bg-well raise">
              <div className="relative aspect-video">
                {/* key: subtitr o'zgarsa iframe qayta yuklanadi */}
                <iframe
                  key={src}
                  src={src}
                  title={current.title}
                  className="absolute inset-0 size-full border-0"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>

            <div className="grid content-start gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge border ${KIND_TONE[current.kind]} !bg-transparent`}>{m.kindOne[current.kind]}</span>
                {current.level && <span className="badge">{current.level}</span>}
                {current.playlistId && <span className="badge badge-warn">{m.playlist}</span>}
              </div>
              <h2 lang="tr" className="text-[1.6rem] leading-tight">{current.title}</h2>
              {current.description && <p className="text-[0.9375rem] text-muted">{describe(current, locale, toCyrillic)}</p>}
              {current.channel && (
                <p className="text-[0.875rem] text-muted">
                  {m.channel}: <span className="font-medium text-porcelain">{current.channel}</span>
                </p>
              )}

              <label className="flex items-start gap-3 border border-cobalt/25 bg-cobalt/[0.05] p-3.5 text-[0.9375rem]">
                <input
                  type="checkbox"
                  checked={subs}
                  onChange={(e) => {
                    setSubs(e.target.checked);
                    writeSubs(e.target.checked);
                  }}
                  className="mt-0.5 size-5 shrink-0 accent-cobalt"
                />
                <span>
                  <span className="font-semibold">{m.subtitles}</span>
                  <span className="mt-0.5 block text-[0.8125rem] text-muted">{m.subtitlesHelp}</span>
                </span>
              </label>

              <div className="flex flex-wrap gap-2">
                <a href={watchUrl(current)} target="_blank" rel="noopener noreferrer" className="btn btn-outline !min-h-10 !px-4 !py-1.5 text-sm">
                  {m.openOnYoutube} ↗
                </a>
                <button type="button" onClick={close} className="btn btn-quiet !min-h-10 !px-4 !py-1.5 text-sm">
                  {t.common.close}
                </button>
              </div>
              <p className="text-[0.75rem] text-muted">{m.notAvailable}</p>
            </div>
          </section>
        )}
      </div>

      {/* ═════ Filtrlar ═════ */}
      <div className="grid gap-4">
        <div role="tablist" aria-label={m.title} className="flex flex-wrap gap-2">
          <button type="button" role="tab" aria-selected={kind === ""} onClick={() => setKind("")} className="tab">
            {m.all}
          </button>
          {kinds.map((k) => (
            <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)} className="tab">
              {m.kinds[k]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label={t.common.level} className="flex flex-wrap gap-1.5">
            {["", ...LEVELS].map((l) => (
              <button
                key={l || "any"}
                type="button"
                aria-pressed={level === l}
                data-on={level === l || undefined}
                onClick={() => setLevel(l)}
                className="tab !px-3 !py-1.5 text-[0.875rem]"
              >
                {l || m.anyLevel}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={m.search}
            aria-label={m.search}
            className="input !min-h-10 max-w-xs flex-1 !py-1.5"
          />
        </div>
      </div>

      {/* ═════ Ro'yxat ═════ */}
      {failed && <p className="alert-error" role="alert">{t.common.error}</p>}
      {!items && !failed && (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="skeleton aspect-[16/12]" />
          ))}
        </ul>
      )}
      {items && shown.length === 0 && <p className="text-muted">{m.empty}</p>}
      {items && shown.length > 0 && (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => open(item)}
                aria-current={current?.id === item.id ? "true" : undefined}
                className="group block h-full w-full overflow-hidden border border-cobalt/25 bg-ink text-left transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-cobalt/60 aria-[current=true]:border-brass/70"
              >
                <span className="relative block aspect-video overflow-hidden" style={{ background: KIND_BG[item.kind] }}>
                  {/* Muqova hali bo'lmasa (YouTube tekshiruvi kutilmoqda) — rangli fon va nom */}
                  {!item.thumbnail && (
                    <span lang="tr" className="absolute inset-0 grid place-items-center p-6 text-center font-display text-[1.5rem] font-semibold text-porcelain/85">
                      {item.title}
                    </span>
                  )}
                  {item.thumbnail && (
                    <Image
                      src={item.thumbnail}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  )}
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(3,6,15,.85))]" />
                  <span className="absolute left-3 top-3 flex gap-1.5">
                    <span className={`badge border ${KIND_TONE[item.kind]} !bg-ink/80 backdrop-blur`}>{m.kindOne[item.kind]}</span>
                    {item.level && <span className="badge !bg-ink/80 backdrop-blur">{item.level}</span>}
                  </span>
                  <span className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-full bg-[var(--bole-btn)] text-white shadow-lg transition-transform group-hover:scale-110">
                    <Play className="size-5 translate-x-px" />
                  </span>
                </span>
                <span className="block p-4">
                  <span lang="tr" className="block font-display text-[1.15rem] font-semibold leading-snug tracking-[-0.01em]">
                    {item.title}
                  </span>
                  {item.description && <span className="mt-1.5 line-clamp-2 block text-[0.875rem] text-muted">{describe(item, locale, toCyrillic)}</span>}
                  {item.channel && <span className="mt-2 block truncate text-[0.75rem] text-muted/80">{item.channel}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ═════ Maslahatlar ═════ */}
      <aside className="border border-cobalt/25 bg-cobalt/[0.04] p-6 sm:p-8">
        <h2 className="text-[1.3rem]">{m.tipsTitle}</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {m.tips.map((tip, i) => (
            <li key={i} className="flex gap-3 text-[0.9375rem] text-muted">
              <span className="t-num text-[1.4rem] leading-none text-brass">{i + 1}</span>
              {tip}
            </li>
          ))}
        </ol>
        <p className="mt-5 text-[0.75rem] text-muted">{m.source}</p>
      </aside>
    </div>
  );
}

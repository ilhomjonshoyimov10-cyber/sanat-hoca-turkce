"use client";

// Kichik, bog'liqliksiz SVG grafiklar: admin va ustoz panellari uchun.
//
// Qoidalar (dataviz tizimi): bitta grafikda BITTA o'lchov (ikki o'qli
// grafik yo'q), chiziq 2px, maydon ~10% shaffof, to'r chiziqlari xira,
// raqamlar matn rangida (seriya rangida emas), har grafikda sichqoncha
// ustida aniq qiymat va jadval ko'rinishi.

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** 1284 -> "1 284", 12900 -> "12,9K" (o'zbekcha kasr belgisi — vergul) */
export function compact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (Math.abs(n) >= 10_000) return `${(n / 1000).toFixed(1).replace(".", ",").replace(",0", "")}K`;
  return n.toLocaleString("ru-RU").replace(/ /g, " ");
}

/** Konteyner kengligi (px): grafik piksel aniqligida chiziladi, cho'zilmaydi. */
export function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** Toza o'q belgilari: 0, 5, 10, 15 ... */
function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const top = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
/** "2026-11-20" -> "20-noy" */
export function dayLabel(key: string): string {
  const [, m, d] = key.split("-").map(Number);
  return `${d}-${MONTHS[m - 1]}`;
}

// ───────────────────────── Sparkline ─────────────────────────

export function Sparkline({ values, color = "var(--cobalt)", height = 32 }: { values: number[]; color?: string; height?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? (w - 4) / (values.length - 1) : 0;
  const pts = values.map((v, i) => [2 + i * step, height - 3 - (v / max) * (height - 6)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  const last = pts.at(-1);
  return (
    <div ref={ref} className="relative h-8 w-full min-w-0" aria-hidden="true">
      {w > 0 && values.length > 1 && (
        <svg width={w} height={height} className="absolute left-0 top-0 overflow-visible">
          <path d={`${d}L${last![0]},${height}L2,${height}Z`} fill={color} opacity={0.1} />
          <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
          <circle cx={last![0]} cy={last![1]} r={3} fill={color} stroke="var(--ink)" strokeWidth={2} />
        </svg>
      )}
    </div>
  );
}

// ───────────────────────── O'zgarish belgisi ─────────────────────────

/** +12% ↑ (yaxshi) / −8% ↓ — rang + strelka + ishora: faqat rangga tayanmaydi */
export function Delta({ cur, prev, goodWhenUp = true, label = "oldingi davrga nisbatan" }: { cur: number; prev: number; goodWhenUp?: boolean; label?: string }) {
  if (prev === 0 && cur === 0) return <span className="text-[0.8125rem] text-muted">o&apos;zgarishsiz</span>;
  if (prev === 0) return <span className="text-[0.8125rem] text-muted">yangi · avval 0</span>;
  const pct = Math.round(((cur - prev) / prev) * 100);
  const up = pct > 0;
  const good = pct === 0 ? null : up === goodWhenUp;
  return (
    <span className={`inline-flex items-center gap-1 text-[0.8125rem] font-medium ${good === null ? "text-muted" : good ? "text-turquoise" : "text-danger"}`} title={`${pct > 0 ? "+" : ""}${pct}% ${label}`}>
      <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
        {pct === 0 ? <path d="M2 6h8" stroke="currentColor" strokeWidth="1.6" /> : <path d={up ? "M6 2 10 7H2Z" : "M6 10 2 5h8Z"} fill="currentColor" />}
      </svg>
      {pct > 0 ? "+" : pct < 0 ? "−" : ""}{Math.abs(pct)}%
      <span className="sr-only"> {label}</span>
    </span>
  );
}

// ───────────────────────── Kunlik grafik (bitta o'lchov) ─────────────────────────

export function TrendChart({
  days, values, label, color = "var(--cobalt)", height = 240, unit = "",
}: {
  days: string[]; values: number[]; label: string; color?: string; height?: number; unit?: string;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");
  const pad = { l: 40, r: 14, t: 14, b: 26 };
  const iw = Math.max(0, w - pad.l - pad.r);
  const ih = height - pad.t - pad.b;
  const ticks = niceTicks(Math.max(...values, 0));
  const top = ticks.at(-1) || 1;
  const x = (i: number) => pad.l + (values.length > 1 ? (i / (values.length - 1)) * iw : iw / 2);
  const y = (v: number) => pad.t + ih - (v / top) * ih;
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  // X o'qida ko'pi bilan ~6 ta sana — bir-birining ustiga chiqmasin
  const every = Math.max(1, Math.ceil(values.length / Math.max(2, Math.floor(iw / 90))));

  function move(e: React.PointerEvent<SVGRectElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - r.left) / Math.max(1, r.width);
    setHover(Math.max(0, Math.min(values.length - 1, Math.round(rel * (values.length - 1)))));
  }

  const h = hover;
  return (
    <div ref={ref} className="relative w-full min-w-0" style={{ height }}>
      {w > 0 && (
        <svg width={w} height={height} role="img" aria-label={`${label}: kunlik grafik`} className="absolute left-0 top-0">
          <defs>
            <linearGradient id={`g${gid}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-cobalt/15" />
              <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px]">{compact(t)}</text>
            </g>
          ))}
          {days.map((d, i) => (i % every === 0 || i === days.length - 1) && (i === days.length - 1 || days.length - 1 - i >= every * 0.6) ? (
            <text key={d} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === days.length - 1 ? "end" : "middle"} className="fill-muted text-[11px]">{dayLabel(d)}</text>
          ) : null)}
          <path d={`${line}L${x(values.length - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill={`url(#g${gid})`} />
          <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {h !== null && (
            <g>
              <line x1={x(h)} x2={x(h)} y1={pad.t} y2={pad.t + ih} stroke="currentColor" className="text-muted/50" />
              <circle cx={x(h)} cy={y(values[h])} r={5} fill={color} stroke="var(--ink)" strokeWidth={2} />
            </g>
          )}
          {h === null && values.length > 0 && (
            <circle cx={x(values.length - 1)} cy={y(values.at(-1)!)} r={4} fill={color} stroke="var(--ink)" strokeWidth={2} />
          )}
          <rect
            x={pad.l} y={pad.t} width={iw} height={ih} fill="transparent"
            onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHover(null)}
          />
        </svg>
      )}
      {h !== null && w > 0 && (
        <div
          role="status"
          className="pointer-events-none absolute top-1 z-10 min-w-[8rem] -translate-x-1/2 border border-cobalt/30 bg-well/95 px-3 py-2 text-[0.8125rem] shadow-lg backdrop-blur"
          style={{ left: Math.min(Math.max(x(h), 70), w - 70) }}
        >
          <p className="text-muted">{dayLabel(days[h])}</p>
          <p className="mt-0.5 flex items-center gap-2 font-semibold text-porcelain">
            <span className="size-2 rounded-full" style={{ background: color }} aria-hidden="true" />
            {compact(values[h])}{unit} <span className="font-normal text-muted">{label.toLowerCase()}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Gorizontal ustunlar ─────────────────────────

export function BarList({
  rows, color = "var(--cobalt)", valueLabel, empty = "Ma'lumot yo'q",
}: {
  rows: { key: string; label: ReactNode; value: number; note?: string }[];
  color?: string; valueLabel: string; empty?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="py-6 text-center text-[0.9375rem] text-muted">{empty}</p>;
  return (
    <ul className="grid gap-3">
      {rows.map((r) => (
        <li key={r.key} className="group grid gap-1.5" title={`${r.value} ${valueLabel}${r.note ? ` · ${r.note}` : ""}`}>
          <div className="flex items-baseline justify-between gap-3 text-[0.9375rem]">
            <span className="min-w-0 truncate">{r.label}</span>
            <span className="t-num shrink-0 text-porcelain">{compact(r.value)}{r.note && <span className="ml-1.5 font-sans text-[0.8125rem] font-normal text-muted">{r.note}</span>}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-cobalt/10">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out group-hover:brightness-125"
              style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ───────────────────────── Issiqlik xaritasi: hafta kuni x soat ─────────────────────────

const WEEK = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

export function Heatmap({ grid, label = "o'yin" }: { grid: number[][]; label?: string }) {
  const max = Math.max(1, ...grid.flat());
  const [hover, setHover] = useState<[number, number] | null>(null);
  // Ketma-ket rang: bitta rang, kamdan ko'pga — shaffoflik bosqichlari
  const step = (v: number) => (v === 0 ? 0 : 0.18 + 0.82 * Math.sqrt(v / max));
  return (
    <div className="grid gap-2">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] table-fixed border-separate border-spacing-[2px]" aria-label="Haftalik faollik: kun va soat bo'yicha">
          <thead>
            <tr>
              <th className="w-7" />
              {Array.from({ length: 24 }, (_, hr) => (
                <th key={hr} scope="col" className="p-0 text-center text-[10px] font-normal text-muted">{hr % 3 === 0 ? hr : ""}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, d) => (
              <tr key={d}>
                <th scope="row" className="pr-1 text-left text-[11px] font-normal text-muted">{WEEK[d]}</th>
                {row.map((v, hr) => (
                  <td
                    key={hr}
                    className="h-5 rounded-[3px] p-0 outline-offset-1 hover:outline hover:outline-1 hover:outline-porcelain/60"
                    style={{ background: v ? `color-mix(in oklab, var(--cobalt) ${Math.round(step(v) * 100)}%, transparent)` : "color-mix(in oklab, var(--cobalt) 6%, transparent)" }}
                    onPointerEnter={() => setHover([d, hr])}
                    onPointerLeave={() => setHover(null)}
                    title={`${WEEK[d]}, ${hr}:00–${hr + 1}:00 — ${v} ${label}`}
                  >
                    <span className="sr-only">{WEEK[d]} {hr}:00 — {v}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-[0.8125rem] text-muted">
        <span role="status" className="min-h-5">
          {hover ? <>{WEEK[hover[0]]}, {hover[1]}:00–{hover[1] + 1}:00 · <b className="text-porcelain">{grid[hover[0]][hover[1]]}</b> {label}</> : "Toshkent vaqti bilan"}
        </span>
        <span className="flex items-center gap-1.5">
          kam
          {[0.18, 0.4, 0.62, 0.82, 1].map((o) => (
            <span key={o} className="size-3 rounded-[3px]" style={{ background: `color-mix(in oklab, var(--cobalt) ${o * 100}%, transparent)` }} />
          ))}
          ko&apos;p
        </span>
      </div>
    </div>
  );
}

// ───────────────────────── Voronka ─────────────────────────

export function Funnel({ steps }: { steps: { key: string; label: string; count: number }[] }) {
  const first = Math.max(1, steps[0]?.count ?? 1);
  return (
    <ol className="grid gap-2.5">
      {steps.map((s, i) => {
        const pct = Math.round((s.count / first) * 100);
        const fromPrev = i > 0 && steps[i - 1].count > 0 ? Math.round((s.count / steps[i - 1].count) * 100) : null;
        return (
          <li key={s.key} className="grid gap-1">
            <div className="flex items-baseline justify-between gap-3 text-[0.9375rem]">
              <span>{s.label}</span>
              <span className="t-num text-porcelain">
                {compact(s.count)}
                <span className="ml-1.5 font-sans text-[0.8125rem] font-normal text-muted">{i === 0 ? "100%" : `${pct}%`}{fromPrev !== null && i > 0 ? ` · oldingidan ${fromPrev}%` : ""}</span>
              </span>
            </div>
            <div className="flex h-7 items-stretch justify-center">
              <div className="rounded-[4px] bg-turquoise/80 transition-[width] duration-700" style={{ width: `${Math.max(3, pct)}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

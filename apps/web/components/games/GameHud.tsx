"use client";

// O'yin "boshqaruv paneli": kunlik maqsad halqasi, ketma-ket to'g'ri
// javoblar (kombo), shu o'yindagi XP, ovozni yoqish/o'chirish va
// muhim lahzalarda (yangi daraja, maqsad bajarildi) qisqa tabrik.

import { useEffect, useSyncExternalStore } from "react";
import { setSoundOn, soundOn, subscribeSound } from "@/lib/sfx";

export function DailyRing({ value, goal, size = 44 }: { value: number; goal: number; size?: number }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, goal ? value / goal : 0);
  const done = p >= 1;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90" role="img" aria-label={`Kunlik maqsad: ${value} / ${goal} XP`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="color-mix(in oklab, var(--brass) 18%, transparent)" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={done ? "var(--turquoise)" : "var(--brass)"} strokeWidth={5} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - p)}
        style={{ transition: "stroke-dashoffset 600ms cubic-bezier(.2,.8,.2,1)" }}
      />
      {done && (
        <path
          d={`M${size * 0.34} ${size * 0.5} l${size * 0.11} ${size * 0.11} l${size * 0.2} -${size * 0.22}`}
          transform={`rotate(90 ${size / 2} ${size / 2})`}
          fill="none" stroke="var(--turquoise)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function SoundToggle() {
  const on = useSyncExternalStore(subscribeSound, soundOn, () => true);
  return (
    <button
      type="button" onClick={() => setSoundOn(!on)} aria-pressed={on}
      className="btn btn-quiet btn-sm" title={on ? "Ovoz effektlarini o'chirish" : "Ovoz effektlarini yoqish"}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4z" />
        {on ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="m16 9 5 6M21 9l-5 6" />}
      </svg>
      <span className="sr-only">{on ? "Ovoz yoqilgan" : "Ovoz o'chirilgan"}</span>
    </button>
  );
}

export function Hud({ todayXp, goal, combo, sessionXp, bump }: { todayXp: number; goal: number; combo: number; sessionXp: number; bump: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border border-cobalt/25 bg-ink/80 px-4 py-2.5 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <DailyRing value={todayXp} goal={goal} size={38} />
        <div className="leading-tight">
          <p className="text-[0.75rem] text-muted">Kunlik maqsad</p>
          <p className="t-num text-[0.95rem] text-porcelain">{Math.min(todayXp, goal)}<span className="text-muted">/{goal} XP</span></p>
        </div>
      </div>
      <div className="flex items-center gap-2" aria-live="polite">
        <span
          key={combo >= 2 ? bump : "none"}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8125rem] font-semibold transition-colors ${combo >= 2 ? "combo-pop bg-bole/15 text-bole" : "bg-cobalt/10 text-muted"}`}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
            <path d="M12 2c1 3.5 4.5 5 4.5 9.5a4.5 4.5 0 0 1-9 0C7.5 9 9 8 9 6c1.5 1 2 2.5 2 2.5S13 6 12 2Zm0 19a7 7 0 0 1-7-7c0-2.2.9-3.9 2-5.3.2 2.3 1.6 3.8 1.6 3.8A3.4 3.4 0 0 0 12 18a3.4 3.4 0 0 0 3.4-3.5c1.2 1 1.9 2.4 1.9 3.9A6.9 6.9 0 0 1 12 21Z" />
          </svg>
          {combo >= 2 ? `${combo} ta ketma-ket` : "Ketma-ketlik"}
        </span>
      </div>
      <p className="text-[0.875rem] text-muted">Shu o&apos;yinda: <b className="t-num text-brass">+{sessionXp} XP</b></p>
      <div className="ml-auto"><SoundToggle /></div>
    </div>
  );
}

export type Celebration = { key: number; title: string; text: string; tone: "brass" | "turquoise" | "bole" };

export function CelebrationToast({ item, onDone }: { item: Celebration | null; onDone: () => void }) {
  useEffect(() => {
    if (!item) return;
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [item, onDone]);
  if (!item) return null;
  const color = item.tone === "brass" ? "var(--brass)" : item.tone === "turquoise" ? "var(--turquoise)" : "var(--bole)";
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[80] flex justify-center px-4" role="status" aria-live="polite">
      <div key={item.key} className="celebrate relative overflow-visible border bg-well/95 px-6 py-4 text-center shadow-2xl backdrop-blur" style={{ borderColor: color }}>
        <span className="confetti" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} style={{ "--a": `${(i / 14) * 360}deg`, "--c": i % 3 === 0 ? "var(--brass)" : i % 3 === 1 ? "var(--turquoise)" : "var(--bole)" } as React.CSSProperties} />
          ))}
        </span>
        <p className="font-display text-[1.5rem] font-semibold" style={{ color }}>{item.title}</p>
        <p className="mt-0.5 text-[0.9375rem] text-porcelain">{item.text}</p>
      </div>
    </div>
  );
}

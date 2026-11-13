"use client";

// Haftalik reyting — "jonli": har 30 soniyada (sahifa ko'rinib turganda)
// va har javobdan keyin yangilanadi. Hafta Toshkent vaqti bilan dushanba
// 00:00 da yangilanadi — kim birinchi bo'lishini hamma 0 dan boshlab hal qiladi.

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { fmt } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

type Row = { rank: number; name: string; xp: number; isMe: boolean };
type Week = {
  weekStart: string; resetsAt: string; updatedAt: string;
  rows: Row[]; lastWeek: Row[];
  me: { xp: number; rank: number | null; optedIn: boolean };
};

const POLL_MS = 30_000;
const MEDAL = ["🥇", "🥈", "🥉"];

export function Leaderboard({ refreshKey, optIn, onOptIn }: { refreshKey: number; optIn: boolean | null; onOptIn: (v: boolean) => void }) {
  const { t } = useI18n();
  const g = t.games;
  const [week, setWeek] = useState<Week | null>(null);
  const [flash, setFlash] = useState<Set<string>>(new Set());
  const prev = useRef(new Map<string, number>());
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const w = await api<Week>("/games/leaderboard/week");
      // Kimning XP si oshgan bo'lsa — qatori bir lahza yonadi
      const changed = new Set<string>();
      for (const r of w.rows) {
        const before = prev.current.get(r.name);
        if (before !== undefined && before !== r.xp) changed.add(r.name);
        prev.current.set(r.name, r.xp);
      }
      setWeek(w);
      if (changed.size) {
        setFlash(changed);
        setTimeout(() => setFlash(new Set()), 1600);
      }
    } catch {
      /* jim: reyting kelmasa o'yin baribir ishlaydi */
    }
  }, []);

  useEffect(() => { void load(); }, [load, refreshKey]);

  useEffect(() => {
    const tick = () => { if (!document.hidden) { void load(); setNow(Date.now()); } };
    const id = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [load]);

  const left = week ? Math.max(0, new Date(week.resetsAt).getTime() - now) : 0;
  const d = Math.floor(left / 86400_000);
  const h = Math.floor((left % 86400_000) / 3600_000);
  const m = Math.floor((left % 3600_000) / 60_000);
  const leftText = d > 0 ? `${d} ${g.unitD} ${h} ${g.unitH}` : h > 0 ? `${h} ${g.unitH} ${m} ${g.unitM}` : `${m} ${g.unitM}`;
  const meInTop = week?.rows.some((r) => r.isMe);

  return (
    <aside className="self-start border border-cobalt/25 bg-cobalt/[0.05] p-6 lg:sticky lg:top-24" aria-labelledby="board-h">
      <div className="flex items-start justify-between gap-3">
        <h2 id="board-h" className="text-[1.2rem]">{g.board}</h2>
        <span className="mt-1 inline-flex items-center gap-1.5 text-[0.75rem] text-turquoise" title={g.boardLive}>
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-turquoise opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-turquoise" />
          </span>
          LIVE
        </span>
      </div>
      {week && <p className="mt-1 text-[0.8125rem] text-muted">{fmt(g.resetsIn, { t: leftText })}</p>}

      {!week ? (
        <div className="skeleton mt-4 h-32" />
      ) : week.rows.length === 0 ? (
        <p className="mt-3 text-[0.9375rem] text-muted">{g.boardEmpty}</p>
      ) : (
        <ol className="mt-3 grid gap-1.5" aria-live="polite">
          {week.rows.map((r) => (
            <li
              key={`${r.rank}-${r.name}`}
              className={`flex items-center justify-between gap-2 px-3 py-2 text-[0.9375rem] transition-colors duration-700 ${
                r.isMe ? "bg-brass/15 font-semibold text-brass" : flash.has(r.name) ? "bg-turquoise/20" : "bg-cobalt/10"
              }`}
            >
              <span className="min-w-0 truncate">
                <span className="inline-block w-7 tabular-nums">{r.rank <= 3 ? MEDAL[r.rank - 1] : `${r.rank}.`}</span>
                {r.name}
              </span>
              <span className="shrink-0 tabular-nums">{r.xp} XP</span>
            </li>
          ))}
        </ol>
      )}

      {week && !meInTop && (
        <div className="mt-3 border-t border-cobalt/20 pt-3 text-[0.9375rem]">
          {week.me.optedIn && week.me.rank ? (
            <p className="flex justify-between font-semibold text-brass">
              <span>{g.myRank}: {week.me.rank}</span>
              <span>{week.me.xp} XP</span>
            </p>
          ) : (
            <p className="text-muted">
              {g.thisWeek}: <strong className="text-porcelain">{week.me.xp} XP</strong>
              {!week.me.optedIn && <> · {g.notRanked}</>}
            </p>
          )}
        </div>
      )}

      {optIn !== null && (
        <label className="mt-5 flex items-start gap-3 text-[0.9375rem]">
          <input type="checkbox" checked={optIn} onChange={(e) => onOptIn(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-cobalt" />
          <span>{g.optIn}</span>
        </label>
      )}

      {week && week.lastWeek.length > 0 && (
        <div className="mt-5 border-t border-cobalt/20 pt-4">
          <p className="mb-2 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-muted">{g.lastWeek}</p>
          <ul className="grid gap-1 text-[0.875rem]">
            {week.lastWeek.map((r) => (
              <li key={r.rank} className="flex justify-between">
                <span>{MEDAL[r.rank - 1]} {r.name}</span>
                <span className="tabular-nums text-muted">{r.xp} XP</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

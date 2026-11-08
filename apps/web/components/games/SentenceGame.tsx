"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { levelParam, type GameProps, type Stats } from "./types";

type Item = { token: string; uzbek: string; note: string | null; words: string[] };
type Result = {
  correct: boolean;
  almost: boolean;
  answer: string;
  note: string | null;
  xpGained: number;
  capped: boolean;
  stats: Stats;
};

/** O'zbekcha ma'nosi berilgan gapni aralashtirilgan turkcha so'zlardan tuzish. */
export function SentenceGame({ onStats, onFail, onExit, level }: GameProps) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [index, setIndex] = useState(0);
  const [slots, setSlots] = useState<number[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [session, setSession] = useState({ correct: 0, xp: 0 });
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      const r = await api<{ items: Item[] }>(`/games/sentence?limit=5${levelParam(level)}`);
      setItems(r.items);
      setIndex(0);
      setSlots([]);
      setResult(null);
      setSession({ correct: 0, xp: 0 });
    } catch (e) {
      onFail(e);
    } finally {
      setBusy(false);
    }
  }

  async function check() {
    if (!items) return;
    const item = items[index];
    setBusy(true);
    try {
      const res = await api<Result>("/games/sentence/answer", {
        method: "POST",
        body: { token: item.token, answer: slots.map((i) => item.words[i]).join(" ") },
      });
      setResult(res);
      onStats(res.stats);
      setSession((s) => ({ correct: s.correct + (res.correct ? 1 : 0), xp: s.xp + res.xpGained }));
    } catch (e) {
      onFail(e);
    } finally {
      setBusy(false);
    }
  }

  if (!items) {
    return (
      <div className="card grid gap-3">
        <h2 className="text-xl font-bold">Gap tuzish</h2>
        <p className="text-muted">
          O&apos;zbekcha ma&apos;nosi beriladi — turkcha so&apos;zlarni to&apos;g&apos;ri tartibda
          joylashtiring. 5 ta gap.
        </p>
        <button type="button" onClick={start} disabled={busy} className="btn btn-primary">
          {busy ? "Yuklanmoqda..." : "Boshlash"}
        </button>
      </div>
    );
  }

  const finished = index >= items.length;
  if (items.length === 0 || finished) {
    return (
      <div className="card grid gap-3 text-center">
        {items.length === 0 ? (
          <>
            <h2 className="text-xl font-bold">Gap topilmadi</h2>
            <p className="text-muted">Bu darajada hali gap qo&apos;shilmagan. Boshqa darajani tanlang.</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold">Mashq tugadi</h2>
            <p className="text-lg">
              To&apos;g&apos;ri: <strong>{session.correct}</strong> / {items.length}
            </p>
            <p className="text-lg text-primary">
              Yig&apos;ilgan XP: <strong>+{session.xp}</strong>
            </p>
          </>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {items.length > 0 && (
            <button type="button" onClick={start} className="btn btn-primary">
              Yana o&apos;ynash
            </button>
          )}
          <button type="button" onClick={onExit} className="btn btn-outline">
            Boshqa o&apos;yin
          </button>
        </div>
      </div>
    );
  }

  const item = items[index];
  const used = new Set(slots);
  const full = slots.length === item.words.length;

  return (
    <div key={index} className="card question-in grid gap-5">
      {result && result.xpGained > 0 && (
        <span
          className="xp-float pointer-events-none absolute right-6 top-5 font-display text-2xl font-extrabold text-success"
          aria-hidden="true"
        >
          +{result.xpGained} XP
        </span>
      )}

      <div>
        <p className="mb-2 text-sm font-bold text-muted">
          Gap {index + 1} / {items.length}
        </p>
        <div
          className="progress-bar"
          role="progressbar"
          aria-label="Mashq jarayoni"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={index + (result ? 1 : 0)}
        >
          <span style={{ width: `${((index + (result ? 1 : 0)) / items.length) * 100}%` }} />
        </div>
      </div>

      <p className="text-center text-lg">
        Ma&apos;nosi: <strong className="font-display text-xl">{item.uzbek}</strong>
      </p>

      {/* Tuzilayotgan gap */}
      <div
        className={`min-h-16 border-2 p-3 ${
          result ? (result.correct ? "border-success bg-success/10" : "border-danger bg-danger/10") : "border-dashed border-white/20"
        }`}
        aria-label="Tuzilayotgan gap"
        lang="tr"
      >
        {slots.length === 0 ? (
          <p className="text-center text-muted">So&apos;zlarni bosing</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((wi, k) => (
              <button
                key={`${k}-${wi}`}
                type="button"
                disabled={Boolean(result) || busy}
                onClick={() => setSlots((s) => s.filter((_, j) => j !== k))}
                aria-label={`${item.words[wi]} so'zini olib tashlash`}
                className="border border-cobalt/40 bg-tile-2 px-3 py-1.5 text-[1.05rem]"
              >
                {item.words[wi]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tanlanadigan so'zlar */}
      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="So'zlar" lang="tr">
        {item.words.map((w, i) => (
          <button
            key={`${i}-${w}`}
            type="button"
            disabled={used.has(i) || Boolean(result) || busy}
            onClick={() => setSlots((s) => [...s, i])}
            className="btn btn-outline !min-h-11 !px-3 text-[1.05rem] disabled:opacity-30"
          >
            {w}
          </button>
        ))}
      </div>

      <div role="status" aria-live="polite" className="min-h-6">
        {result && (
          <div className={`font-bold ${result.correct ? "text-success" : "text-danger"}`}>
            {result.correct ? (
              result.capped ? (
                "To'g'ri! (bugunlik XP chegarasi tugadi, mashq esa davom etadi)"
              ) : (
                `To'g'ri! +${result.xpGained} XP`
              )
            ) : (
              <>
                Noto&apos;g&apos;ri. To&apos;g&apos;ri gap: <span lang="tr">{result.answer}</span>
              </>
            )}
            {result.note && <p className="mt-1 font-normal text-muted">{result.note}</p>}
          </div>
        )}
      </div>

      {result ? (
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setSlots([]);
            setIndex((n) => n + 1);
          }}
          className="btn btn-primary"
        >
          {index + 1 < items.length ? "Keyingi" : "Natijani ko'rish"}
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setSlots((s) => s.slice(0, -1))}
            disabled={slots.length === 0}
            className="btn btn-outline !px-2 text-sm"
          >
            O&apos;chirish
          </button>
          <button
            type="button"
            onClick={() => setSlots([])}
            disabled={slots.length === 0}
            className="btn btn-outline !px-2 text-sm"
          >
            Tozalash
          </button>
          <button type="button" onClick={check} disabled={!full || busy} className="btn btn-primary !px-2 text-sm">
            Tekshirish
          </button>
        </div>
      )}
    </div>
  );
}

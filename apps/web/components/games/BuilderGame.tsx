"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { levelParam, type GameProps, type Stats } from "./types";

type Item = { token: string; hint: string; example: string | null; length: number; tiles: string[] };
type Result = { correct: boolean; almost: boolean; answer: string; xpGained: number; stats: Stats };

export function BuilderGame({ onStats, onFail, onExit, level }: GameProps) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [index, setIndex] = useState(0);
  const [slots, setSlots] = useState<number[]>([]); // tanlangan harf (tile) indekslari, tartib bo'yicha
  const [result, setResult] = useState<Result | null>(null);
  const [session, setSession] = useState({ correct: 0, xp: 0 });
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      const r = await api<{ items: Item[] }>(`/games/builder?limit=5${levelParam(level)}`);
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
      const res = await api<Result>("/games/builder/answer", {
        method: "POST",
        body: { token: item.token, answer: slots.map((i) => item.tiles[i]).join("") },
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
        <h2 className="text-xl font-bold">Harflardan so&apos;z yig&apos;ish</h2>
        <p className="text-muted">Aralash harflardan turkcha so&apos;zni yig&apos;ing (ç, ğ, ı, ö, ş, ü harflariga e&apos;tibor bering). 5 ta so&apos;z.</p>
        <button type="button" onClick={start} disabled={busy} className="btn btn-primary">{busy ? "Yuklanmoqda..." : "Boshlash"}</button>
      </div>
    );
  }

  const finished = index >= items.length;
  if (items.length === 0 || finished) {
    return (
      <div className="card grid gap-3 text-center">
        {items.length === 0 ? (
          <>
            <h2 className="text-xl font-bold">Bugunlik hammasi tayyor!</h2>
            <p className="text-muted">Mos so&apos;z yo&apos;q. Keyinroq qaytib keling.</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold">Mashq tugadi</h2>
            <p className="text-lg">To&apos;g&apos;ri: <strong>{session.correct}</strong> / {items.length}</p>
            <p className="text-lg text-primary">Yig&apos;ilgan XP: <strong>+{session.xp}</strong></p>
          </>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {items.length > 0 && <button type="button" onClick={start} className="btn btn-primary">Yana o&apos;ynash</button>}
          <button type="button" onClick={onExit} className="btn btn-outline">Boshqa o&apos;yin</button>
        </div>
      </div>
    );
  }

  const item = items[index];
  const used = new Set(slots);
  const full = slots.length === item.length;

  return (
    <div key={index} className="card question-in grid gap-5">
      {result && result.xpGained > 0 && (
        <span className="xp-float pointer-events-none absolute right-6 top-5 font-display text-2xl font-extrabold text-success" aria-hidden="true">+{result.xpGained} XP</span>
      )}
      <div>
        <p className="mb-2 text-sm font-bold text-muted">So&apos;z {index + 1} / {items.length}</p>
        <div className="progress-bar" role="progressbar" aria-label="Mashq jarayoni" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={index + (result ? 1 : 0)}>
          <span style={{ width: `${((index + (result ? 1 : 0)) / items.length) * 100}%` }} />
        </div>
      </div>

      <p className="text-center text-lg">Tarjimasi: <strong className="font-display text-2xl">{item.hint}</strong></p>

      <div className="flex flex-wrap justify-center gap-2" aria-label="Yig'ilayotgan so'z" lang="tr">
        {Array.from({ length: item.length }, (_, k) => (
          <span key={k} className={`grid size-11 place-items-center rounded-xl border-2 font-display text-2xl font-extrabold ${
            result ? (result.correct ? "border-success bg-success/10" : "border-danger bg-danger/10") : slots[k] !== undefined ? "border-white/40 bg-white/10" : "border-dashed border-white/20"
          }`}>
            {slots[k] !== undefined ? item.tiles[slots[k]] : ""}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Harflar" lang="tr">
        {item.tiles.map((t, i) => (
          <button key={i} type="button" disabled={used.has(i) || !!result || busy} onClick={() => setSlots((s) => [...s, i])}
            className="btn btn-outline !min-h-11 !w-11 !px-0 font-display text-xl">
            {t}
          </button>
        ))}
      </div>

      <div role="status" aria-live="polite" className="min-h-6">
        {result && (
          <p className={`font-bold ${result.correct ? "text-success" : "text-danger"}`}>
            {result.correct ? (result.xpGained > 0 ? `To'g'ri! +${result.xpGained} XP` : "To'g'ri! (bu so'z hali takrorlash vaqtiga yetmagan, XP berilmaydi)") : <>Noto&apos;g&apos;ri. To&apos;g&apos;ri so&apos;z: <span lang="tr">{result.answer}</span></>}
          </p>
        )}
      </div>

      {result ? (
        <button type="button" onClick={() => { setResult(null); setSlots([]); setIndex((n) => n + 1); }} className="btn btn-primary">
          {index + 1 < items.length ? "Keyingi" : "Natijani ko'rish"}
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => setSlots((s) => s.slice(0, -1))} disabled={slots.length === 0} className="btn btn-outline !px-2 text-sm">O&apos;chirish</button>
          <button type="button" onClick={() => setSlots([])} disabled={slots.length === 0} className="btn btn-outline !px-2 text-sm">Tozalash</button>
          <button type="button" onClick={check} disabled={!full || busy} className="btn btn-primary !px-2 text-sm">Tekshirish</button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { type GameProps, type Stats } from "./types";

type MatchSet = { token: string | null; left: string[]; right: string[] };
type MatchResult = { results: { left: number; right: number; correct: boolean }[]; correctRight: number[]; xpGained: number; stats: Stats };

const COLORS = ["#ef4a60", "#f2c14e", "#6ce9a6", "#7aa2ff", "#c792ea", "#ff9f6e"];

export function MatchGame({ onStats, onFail, onExit, level }: GameProps) {
  const [set, setSet] = useState<MatchSet | null>(null);
  const [pairs, setPairs] = useState<(number | null)[]>([]); // pairs[chap] = o'ng indeks
  const [sel, setSel] = useState<number | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try {
      const s = await api<MatchSet>(`/games/match${level ? `?level=${level}` : ""}`);
      setSet(s);
      setPairs(s.left.map(() => null));
      setSel(null);
      setResult(null);
    } catch (e) {
      onFail(e);
    } finally {
      setBusy(false);
    }
  }

  function clickLeft(i: number) {
    if (result) return;
    if (pairs[i] !== null) {
      setPairs((p) => p.map((v, k) => (k === i ? null : v)));
      setSel(null);
    } else setSel(sel === i ? null : i);
  }

  function clickRight(j: number) {
    if (result) return;
    const owner = pairs.findIndex((p) => p === j);
    if (owner >= 0) {
      setPairs((p) => p.map((v, k) => (k === owner ? null : v)));
    } else if (sel !== null) {
      setPairs((p) => p.map((v, k) => (k === sel ? j : v)));
      setSel(null);
    }
  }

  async function check() {
    if (!set?.token) return;
    setBusy(true);
    try {
      const body = { token: set.token, pairs: pairs.map((r, left) => ({ left, right: r as number })) };
      const res = await api<MatchResult>("/games/match/answer", { method: "POST", body });
      setResult(res);
      onStats(res.stats);
    } catch (e) {
      onFail(e);
    } finally {
      setBusy(false);
    }
  }

  if (!set) {
    return (
      <div className="card grid gap-3">
        <h2 className="text-xl font-bold">Juftlikni top</h2>
        <p className="text-muted">Turkcha so&apos;zni chapdan, tarjimasini o&apos;ngdan tanlab juftlang. 6 ta juftlik.</p>
        <button type="button" onClick={load} disabled={busy} className="btn btn-primary">{busy ? "Yuklanmoqda..." : "Boshlash"}</button>
      </div>
    );
  }
  if (!set.token) {
    return (
      <div className="card grid gap-3 text-center">
        <h2 className="text-xl font-bold">Bugunlik hammasi tayyor!</h2>
        <p className="text-muted">Yangi yoki takrorlanadigan so&apos;z yo&apos;q. Keyinroq qaytib keling.</p>
        <button type="button" onClick={onExit} className="btn btn-primary">Boshqa o&apos;yin</button>
      </div>
    );
  }

  const done = pairs.filter((p) => p !== null).length;
  const colorOf = (left: number | null) => (left === null ? undefined : COLORS[left % COLORS.length]);
  const style = (left: number | null, state?: "ok" | "bad") =>
    left === null ? undefined : { borderColor: state === "ok" ? "var(--success)" : state === "bad" ? "var(--danger)" : colorOf(left), backgroundColor: `${state === "ok" ? "#6ce9a6" : state === "bad" ? "#ff8f86" : colorOf(left)}22` };

  return (
    <div className="card grid gap-5">
      <div>
        <p className="mb-2 text-sm font-bold text-muted" role="status" aria-live="polite">
          {result ? `${result.results.filter((r) => r.correct).length} / ${set.left.length} to'g'ri` : `Juftlashtirildi: ${done} / ${set.left.length}`}
        </p>
        <div className="progress-bar"><span style={{ width: `${(done / set.left.length) * 100}%` }} /></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ul className="grid content-start gap-3" aria-label="Turkcha so'zlar">
          {set.left.map((w, i) => {
            const r = result?.results.find((x) => x.left === i);
            return (
              <li key={w}>
                <button type="button" lang="tr" onClick={() => clickLeft(i)} aria-pressed={sel === i} disabled={!!result}
                  className={`btn btn-outline w-full !px-3 ${sel === i ? "!border-white/60 !bg-white/10" : ""}`}
                  style={style(pairs[i], r ? (r.correct ? "ok" : "bad") : undefined)}>
                  {w}
                </button>
              </li>
            );
          })}
        </ul>
        <ul className="grid content-start gap-3" aria-label="O'zbekcha tarjimalar">
          {set.right.map((w, j) => {
            const owner = pairs.findIndex((p) => p === j);
            const r = owner >= 0 ? result?.results.find((x) => x.left === owner) : undefined;
            return (
              <li key={w}>
                <button type="button" onClick={() => clickRight(j)} disabled={!!result}
                  className="btn btn-outline w-full !px-3"
                  style={style(owner >= 0 ? owner : null, r ? (r.correct ? "ok" : "bad") : undefined)}>
                  {w}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {result ? (
        <div className="grid gap-3">
          {result.xpGained > 0 ? <p className="alert-success">+{result.xpGained} XP!</p> : <p className="text-muted">XP berilmadi (so&apos;zlar hali takrorlash vaqtiga yetmagan yoki xato juftliklar).</p>}
          {result.results.some((r) => !r.correct) && (
            <ul className="grid gap-1 text-sm text-muted">
              {result.results.filter((r) => !r.correct).map((r) => (
                <li key={r.left}><span lang="tr" className="font-bold text-foreground">{set.left[r.left]}</span> = {set.right[result.correctRight[r.left]]}</li>
              ))}
            </ul>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={load} disabled={busy} className="btn btn-primary">Yana o&apos;ynash</button>
            <button type="button" onClick={onExit} className="btn btn-outline">Boshqa o&apos;yin</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={check} disabled={busy || done !== set.left.length} className="btn btn-primary">Tekshirish</button>
      )}
    </div>
  );
}

"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import { speakTurkish, subscribeVoices, turkishVoiceAvailable } from "@/lib/speech";
import { levelParam, TURKISH_LETTERS, type GameProps, type Stats } from "./types";

type Item = { token: string; hint: string; example: string | null; length: number; text: string };
type Result = { correct: boolean; almost: boolean; answer: string; xpGained: number; stats: Stats };

export function ListenGame({ onStats, onFail, onExit, level }: GameProps) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [session, setSession] = useState({ correct: 0, xp: 0 });
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const hasVoice = useSyncExternalStore(subscribeVoices, turkishVoiceAvailable, () => false);

  async function start() {
    setBusy(true);
    try {
      const r = await api<{ items: Item[] }>(`/games/listen?limit=5${levelParam(level)}`);
      setItems(r.items);
      setIndex(0);
      setValue("");
      setResult(null);
      setSession({ correct: 0, xp: 0 });
    } catch (e) {
      onFail(e);
    } finally {
      setBusy(false);
    }
  }

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!items || result) return;
    setBusy(true);
    try {
      const res = await api<Result>("/games/listen/answer", { method: "POST", body: { token: items[index].token, answer: value } });
      setResult(res);
      onStats(res.stats);
      setSession((s) => ({ correct: s.correct + (res.correct ? 1 : 0), xp: s.xp + res.xpGained }));
    } catch (err) {
      onFail(err);
    } finally {
      setBusy(false);
    }
  }

  function insert(ch: string) {
    const el = input.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + ch + value.slice(end);
    setValue(next);
    el?.focus();
    // Kursorni faqat matn shu orada o'zgarmagan bo'lsa tiklaymiz (aks holda yozayotgan harfni buzib yuboradi)
    requestAnimationFrame(() => {
      if (el && el.value === next) el.setSelectionRange(start + ch.length, start + ch.length);
    });
  }

  if (!items) {
    return (
      <div className="card grid gap-3">
        <h2 className="text-xl font-bold">Tinglab yozish</h2>
        <p className="text-muted">Turkcha so&apos;zni eshiting va to&apos;g&apos;ri yozing. Telefoningiz yoki brauzeringizning ovozidan foydalaniladi. 5 ta so&apos;z.</p>
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
  return (
    <form key={index} onSubmit={check} className="card question-in grid gap-5">
      {result && result.xpGained > 0 && (
        <span className="xp-float pointer-events-none absolute right-6 top-5 font-display text-2xl font-extrabold text-success" aria-hidden="true">+{result.xpGained} XP</span>
      )}
      <div>
        <p className="mb-2 text-sm font-bold text-muted">So&apos;z {index + 1} / {items.length}</p>
        <div className="progress-bar" role="progressbar" aria-label="Mashq jarayoni" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={index + (result ? 1 : 0)}>
          <span style={{ width: `${((index + (result ? 1 : 0)) / items.length) * 100}%` }} />
        </div>
      </div>

      <div className="grid gap-3 text-center">
        <p className="text-muted">Tarjimasi: <strong className="text-foreground">{item.hint}</strong></p>
        <div className="flex justify-center gap-2">
          <button type="button" onClick={() => speakTurkish(item.text, 0.9)} disabled={!hasVoice} className="btn btn-primary">Tinglash</button>
          <button type="button" onClick={() => speakTurkish(item.text, 0.55)} disabled={!hasVoice} className="btn btn-outline">Sekin</button>
        </div>
        {!hasVoice && (
          <p className="alert-error" role="note">
            Qurilmangizda turkcha ovoz topilmadi. O&apos;rniga so&apos;zni ko&apos;rib yozing: <strong lang="tr">{item.text}</strong>
          </p>
        )}
      </div>

      <div>
        <label htmlFor="listen-answer" className="label">Eshitganingizni yozing ({item.length} harf)</label>
        <input id="listen-answer" ref={input} value={value} onChange={(e) => setValue(e.target.value)} lang="tr" autoComplete="off" autoCapitalize="none" spellCheck={false}
          maxLength={40} required disabled={!!result} className="input text-center text-xl" />
        <div className="mt-2 flex flex-wrap justify-center gap-2" role="group" aria-label="Turkcha harflar">
          {TURKISH_LETTERS.map((ch) => (
            <button key={ch} type="button" lang="tr" onMouseDown={(e) => e.preventDefault()} onClick={() => insert(ch)} disabled={!!result} className="btn btn-outline !min-h-10 !w-10 !px-0 text-lg">{ch}</button>
          ))}
        </div>
      </div>

      <div role="status" aria-live="polite" className="min-h-6">
        {result && (
          <p className={`font-bold ${result.correct ? "text-success" : result.almost ? "text-accent" : "text-danger"}`}>
            {result.correct
              ? result.xpGained > 0 ? `To'g'ri! +${result.xpGained} XP` : "To'g'ri! (bu so'z hali takrorlash vaqtiga yetmagan, XP berilmaydi)"
              : result.almost
                ? <>Deyarli to&apos;g&apos;ri! Turkcha harflarga e&apos;tibor bering: <span lang="tr">{result.answer}</span></>
                : <>Noto&apos;g&apos;ri. To&apos;g&apos;ri yozilishi: <span lang="tr">{result.answer}</span></>}
          </p>
        )}
      </div>

      {result ? (
        <button type="button" onClick={() => { setResult(null); setValue(""); setIndex((n) => n + 1); }} className="btn btn-primary">
          {index + 1 < items.length ? "Keyingi" : "Natijani ko'rish"}
        </button>
      ) : (
        <button type="submit" disabled={busy || value.trim() === ""} className="btn btn-primary">Tekshirish</button>
      )}
    </form>
  );
}

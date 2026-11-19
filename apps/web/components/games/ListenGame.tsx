"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { fetchVoice, playTurkish, prefetchVoices, stopSpeech, turkishVoiceAvailable } from "@/lib/speech";
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
  // Ovoz holati: "checking" — birinchi so'z tayyorlanmoqda; "ready" — server
  // ovozi bor; "browser" — faqat brauzer ovozi; "none" — hech qaysi yo'q.
  const [voice, setVoice] = useState<"checking" | "ready" | "browser" | "none">("checking");
  const [playing, setPlaying] = useState(false);

  // O'yindan chiqilsa ovoz to'xtasin
  useEffect(() => () => stopSpeech(), []);

  const say = useCallback(async (text: string, rate = 0.9) => {
    setPlaying(true);
    const used = await playTurkish(text, { rate, onEnd: () => setPlaying(false) });
    if (used === "none") {
      setPlaying(false);
      setVoice("none");
    }
  }, []);

  /** Birinchi so'zning ovozini olib ko'ramiz: server ishlasa — qolganlari fon rejimida. */
  async function prepareVoice(list: Item[]) {
    if (!list.length) return;
    setVoice("checking");
    try {
      await fetchVoice(list[0].text);
      setVoice("ready");
      void prefetchVoices(list.slice(1).map((x) => x.text));
    } catch {
      // Brauzer ovozlar ro'yxatini kechikib yuklaydi — biroz kutib tekshiramiz
      await new Promise((r) => setTimeout(r, 600));
      setVoice(turkishVoiceAvailable() ? "browser" : "none");
    }
  }

  async function start() {
    setBusy(true);
    try {
      const r = await api<{ items: Item[] }>(`/games/listen?limit=5${levelParam(level)}`);
      setItems(r.items);
      void prepareVoice(r.items);
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
      onStats(res.stats, { correct: res.correct, xp: res.xpGained });
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

  // Yangi so'z chiqqanda ovoz o'zi bir marta eshittiriladi
  const current = items && index < items.length ? items[index] : null;
  useEffect(() => {
    if (!current || result || (voice !== "ready" && voice !== "browser")) return;
    const t = setTimeout(() => void say(current.text), 250);
    return () => clearTimeout(t);
    // result o'zgarganda qayta o'qimasin — faqat yangi so'z yoki ovoz tayyor bo'lganda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.token, voice]);

  // Hech qanday ovoz yo'q (server ham, brauzer ham) — o'yin ma'nosiz:
  // so'zni ekranga chiqarsak, "tinglab yozish" ko'chirib yozishga aylanadi.
  if (voice === "none") {
    return (
      <div className="card grid gap-4">
        <h2 className="text-xl font-bold">Tinglab yozish</h2>
        <p className="alert-error" role="note">
          Ovoz hozir yuklanmadi. Internet aloqasini tekshirib, qayta urinib ko&apos;ring.
        </p>
        <div className="grid gap-2 text-[0.95rem] text-muted">
          <p>Agar takrorlansa, qurilmangizga turkcha ovozni o&apos;rnatish ham yordam beradi:</p>
          <p><strong>Android:</strong> Sozlamalar → Tizim → Til → Matnni nutqqa aylantirish → &laquo;Google&raquo; → Turkcha.</p>
          <p><strong>iPhone:</strong> Sozlamalar → Maxsus imkoniyatlar → Gapirish → Ovozlar → Turkcha.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => (items ? void prepareVoice(items.slice(index)) : void start())} className="btn btn-primary">Qayta urinish</button>
          <button type="button" onClick={onExit} className="btn btn-outline">Boshqa o&apos;yin tanlash</button>
        </div>
      </div>
    );
  }

  if (!items) {
    return (
      <div className="card grid gap-3">
        <h2 className="text-xl font-bold">Tinglab yozish</h2>
        <p className="text-muted">Turkcha so&apos;zni eshiting va to&apos;g&apos;ri yozing. 5 ta so&apos;z. Ovozni yoqib qo&apos;ying yoki quloqchin taqing.</p>
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
          <button type="button" onClick={() => void say(item.text, 0.9)} disabled={voice === "checking"} className="btn btn-primary" aria-busy={playing}>
            <svg viewBox="0 0 24 24" className={`size-5 ${playing ? "animate-pulse" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
            </svg>
            {voice === "checking" ? "Ovoz tayyorlanmoqda..." : "Tinglash"}
          </button>
          <button type="button" onClick={() => void say(item.text, 0.55)} disabled={voice === "checking"} className="btn btn-outline">Sekin</button>
        </div>
        {voice === "browser" && <p className="text-[0.8125rem] text-muted">Qurilmangiz ovozi ishlatilmoqda.</p>}

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

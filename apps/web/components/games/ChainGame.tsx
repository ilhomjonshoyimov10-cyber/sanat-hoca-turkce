"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { TURKISH_LETTERS, type GameProps, type Stats } from "./types";

type Start = {
  token: string;
  current: string;
  currentUz: string;
  nextLetter: string;
  step: number;
  total: number;
};

type Answer = {
  correct: boolean;
  reason?: string;
  accepted?: string;
  acceptedUz?: string;
  finished?: boolean;
  step: number;
  total: number;
  nextLetter: string | null;
  token?: string | null;
  xpGained: number;
  capped?: boolean;
  stats?: Stats;
};

type Link = { word: string; uzbek: string };

/** So'z zanjiri: keyingi so'z oldingisining oxirgi harfidan boshlanadi. */
export function ChainGame({ onStats, onFail, onExit, level }: GameProps) {
  const [state, setState] = useState<Start | null>(null);
  const [chain, setChain] = useState<Link[]>([]);
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [wrong, setWrong] = useState(false);
  const [xp, setXp] = useState(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      // DIQQAT: server ortiqcha so'rov maydonlarini rad etadi
      // (forbidNonWhitelisted), shuning uchun "?1=1" kabi to'ldiruvchi
      // qo'yish mumkin emas — manzilni toza yasaymiz.
      const r = await api<Start>(`/games/chain${level ? `?level=${level}` : ""}`);
      setState(r);
      setChain([{ word: r.current, uzbek: r.currentUz }]);
      setValue("");
      setMessage("");
      setWrong(false);
      setXp(0);
      setDone(false);
    } catch (e) {
      onFail(e);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!state || !value.trim()) return;
    setBusy(true);
    try {
      const r = await api<Answer>("/games/chain/answer", {
        method: "POST",
        body: { token: state.token, answer: value.trim() },
      });

      if (!r.correct) {
        setWrong(true);
        setMessage(r.reason ?? "Qabul qilinmadi");
        return;
      }

      setWrong(false);
      setChain((c) => [...c, { word: r.accepted ?? value.trim(), uzbek: r.acceptedUz ?? "" }]);
      setXp((x) => x + r.xpGained);
      setValue("");
      setMessage(r.capped ? "To'g'ri! (bugunlik XP chegarasi tugadi)" : `To'g'ri! +${r.xpGained} XP`);
      if (r.stats) onStats(r.stats);

      if (r.finished || !r.token) {
        setDone(true);
      } else {
        setState({
          token: r.token,
          current: r.accepted ?? value.trim(),
          currentUz: r.acceptedUz ?? "",
          nextLetter: r.nextLetter ?? "",
          step: r.step,
          total: r.total,
        });
      }
    } catch (e) {
      onFail(e);
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return (
      <div className="card grid gap-3">
        <h2 className="text-xl font-bold">So&apos;z zanjiri</h2>
        <p className="text-muted">
          Har bir so&apos;z oldingisining <strong>oxirgi harfidan</strong> boshlanishi kerak. So&apos;z
          lug&apos;atda bo&apos;lishi va takrorlanmasligi shart. 10 qadam.
        </p>
        <button type="button" onClick={start} disabled={busy} className="btn btn-primary">
          {busy ? "Yuklanmoqda..." : "Boshlash"}
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card grid gap-4 text-center">
        <h2 className="text-xl font-bold">Zanjir tugadi!</h2>
        <p className="text-lg">
          Uzunligi: <strong>{chain.length}</strong> so&apos;z
        </p>
        <p className="text-lg text-primary">
          Yig&apos;ilgan XP: <strong>+{xp}</strong>
        </p>
        <ol className="grid gap-1 text-left" lang="tr">
          {chain.map((l, i) => (
            <li key={`${i}-${l.word}`} className="flex items-baseline justify-between gap-3 border-b border-cobalt/20 py-1.5">
              <span className="font-display text-[1.1rem]">{l.word}</span>
              <span className="text-sm text-muted">{l.uzbek}</span>
            </li>
          ))}
        </ol>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={start} className="btn btn-primary">
            Yana o&apos;ynash
          </button>
          <button type="button" onClick={onExit} className="btn btn-outline">
            Boshqa o&apos;yin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card question-in grid gap-5">
      <div>
        <p className="mb-2 text-sm font-bold text-muted">
          Qadam {state.step} / {state.total}
        </p>
        <div
          className="progress-bar"
          role="progressbar"
          aria-label="Zanjir uzunligi"
          aria-valuemin={0}
          aria-valuemax={state.total}
          aria-valuenow={state.step}
        >
          <span style={{ width: `${(state.step / state.total) * 100}%` }} />
        </div>
      </div>

      {/* Zanjir */}
      <div className="flex flex-wrap items-center justify-center gap-2" lang="tr">
        {chain.map((l, i) => (
          <span key={`${i}-${l.word}`} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted" aria-hidden="true">→</span>}
            <span className="border border-cobalt/30 bg-tile px-3 py-1.5 font-display text-[1.05rem]" title={l.uzbek}>
              {l.word}
            </span>
          </span>
        ))}
      </div>

      <p className="text-center text-lg">
        Keyingi so&apos;z{" "}
        <strong className="font-display text-3xl text-brass" lang="tr">
          {state.nextLetter}
        </strong>{" "}
        harfidan boshlanadi
      </p>

      <div>
        <label htmlFor="chain-answer" className="label">
          So&apos;zingiz
        </label>
        <input
          id="chain-answer"
          lang="tr"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setWrong(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void submit();
            }
          }}
          disabled={busy}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={40}
          className={`input text-center font-display text-xl ${wrong ? "!border-danger" : ""}`}
        />
        <div className="mt-2 flex flex-wrap justify-center gap-1.5" role="group" aria-label="Turkcha harflar">
          {TURKISH_LETTERS.map((ch) => (
            <button
              key={ch}
              type="button"
              disabled={busy}
              onClick={() => setValue((v) => v + ch)}
              className="btn btn-outline !min-h-10 !w-10 !px-0 font-display"
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      <div role="status" aria-live="polite" className="min-h-6">
        {message && <p className={`font-bold ${wrong ? "text-danger" : "text-success"}`}>{message}</p>}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={submit} disabled={!value.trim() || busy} className="btn btn-primary">
          Yuborish
        </button>
        <button type="button" onClick={() => setDone(true)} className="btn btn-outline">
          Tugatish
        </button>
      </div>
    </div>
  );
}

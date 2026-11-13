"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { levelParam, TURKISH_LETTERS, type GameProps, type Stats } from "./types";

type Item = { token: string; base: string; prompt: string; rule?: string | null };

/**
 * Qaysi qoida so'ralayotgani. Ilgari ekranda faqat "ev" va "«uyLAR»"
 * chiqardi — nima qilish kerakligini o'quvchi o'zi taxmin qilishi kerak edi.
 */
const RULE_LABEL: Record<string, string> = {
  locative: "O'rin kelishigi",
  dative: "Yo'nalish kelishigi",
  ablative: "Chiqish kelishigi",
  accusative: "Tushum kelishigi",
  genitive: "Qaratqich kelishigi",
  possessive: "Egalik qo'shimchasi",
  plural: "Ko'plik qo'shimchasi",
  "present-continuous": "Hozirgi zamon",
  past: "O'tgan zamon",
  future: "Kelasi zamon",
  ability: "Imkoniyat",
  negation: "Bo'lishsiz shakl",
  softening: "Undosh yumshashi",
};
type Result = {
  correct: boolean;
  almost: boolean;
  answer: string;
  explanation: string | null;
  xpGained: number;
  capped: boolean;
  stats: Stats;
};

/** Turkcha qo'shimchalar mashqi: asos so'z + topshiriq -> to'g'ri shakl. */
export function SuffixGame({ onStats, onFail, onExit, level }: GameProps) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [session, setSession] = useState({ correct: 0, xp: 0 });
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      const r = await api<{ items: Item[] }>(`/games/suffix?limit=5${levelParam(level)}`);
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

  async function check() {
    if (!items || !value.trim()) return;
    setBusy(true);
    try {
      const res = await api<Result>("/games/suffix/answer", {
        method: "POST",
        body: { token: items[index].token, answer: value.trim() },
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
        <h2 className="text-xl font-bold">Qo&apos;shimchalar mashqi</h2>
        <p className="text-muted">
          Turk tilidagi eng ko&apos;p xato qilinadigan joy — qo&apos;shimchalar. Unlilar moslashuvi
          (ünlü uyumu) va undoshlarning yumshashi (kitap → kitabı) shu yerda mashq qilinadi.
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
            <h2 className="text-xl font-bold">Mashq topilmadi</h2>
            <p className="text-muted">Bu darajada hali mashq qo&apos;shilmagan.</p>
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
          Mashq {index + 1} / {items.length}
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

      <div className="text-center">
        <p className="font-display text-3xl font-bold" lang="tr">
          {item.base}
        </p>
        <p className="mt-2 text-lg text-muted">{item.prompt}</p>
        {item.rule && RULE_LABEL[item.rule] && (
          <p className="mt-2">
            <span className="badge">{RULE_LABEL[item.rule]}</span>
          </p>
        )}
      </div>

      <div>
        <label htmlFor="suffix-answer" className="label">
          To&apos;g&apos;ri shakli
        </label>
        <input
          id="suffix-answer"
          lang="tr"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !result) {
              e.preventDefault();
              void check();
            }
          }}
          disabled={Boolean(result) || busy}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={60}
          className={`input text-center font-display text-xl ${
            result ? (result.correct ? "!border-success" : "!border-danger") : ""
          }`}
        />
        {/* Turkcha harflar klaviaturada bo'lmasligi mumkin */}
        <div className="mt-2 flex flex-wrap justify-center gap-1.5" role="group" aria-label="Turkcha harflar">
          {TURKISH_LETTERS.map((ch) => (
            <button
              key={ch}
              type="button"
              disabled={Boolean(result) || busy}
              onClick={() => setValue((v) => v + ch)}
              className="btn btn-outline !min-h-10 !w-10 !px-0 font-display"
            >
              {ch}
            </button>
          ))}
        </div>
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
            ) : result.almost ? (
              <>
                Deyarli! Turkcha harflarga e&apos;tibor bering: <span lang="tr">{result.answer}</span>
              </>
            ) : (
              <>
                Noto&apos;g&apos;ri. To&apos;g&apos;risi: <span lang="tr">{result.answer}</span>
              </>
            )}
            {result.explanation && <p className="mt-1 font-normal text-muted">{result.explanation}</p>}
          </div>
        )}
      </div>

      {result ? (
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setValue("");
            setIndex((n) => n + 1);
          }}
          className="btn btn-primary"
        >
          {index + 1 < items.length ? "Keyingi" : "Natijani ko'rish"}
        </button>
      ) : (
        <button type="button" onClick={check} disabled={!value.trim() || busy} className="btn btn-primary">
          Tekshirish
        </button>
      )}
    </div>
  );
}

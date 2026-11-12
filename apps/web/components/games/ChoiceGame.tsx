"use client";

// Variantli mashqlar uchun UMUMIY o'yin: bo'shliq to'ldirish, suhbat,
// zid ma'no, ortiqcha so'z.
//
// Nega umumiy: bu to'rt o'yinning farqi faqat savolni qanday ko'rsatishda.
// Qolgan hammasi bir xil — to'plam olish, variant tanlash, javobni
// serverga yuborish, natijani ko'rsatish. To'rt marta nusxa ko'chirsak,
// bitta xato to'rt joyda tuzatilishi kerak bo'lardi.

import { useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { levelParam, type GameProps, type Stats } from "./types";

export interface ChoiceItem {
  token: string;
  options: string[];
}

interface Answer {
  correct: boolean;
  correctIndex: number;
  answer?: string;
  full?: string;
  explanation?: string | null;
  xpGained: number;
  capped?: boolean;
  stats: Stats;
}

export interface ChoiceConfig<T extends ChoiceItem> {
  /** Sarlavha va kirish matni */
  title: string;
  intro: string;
  /** Savollar manzili, masalan "cloze" -> /games/cloze */
  path: string;
  limit?: number;
  /** Savolni qanday ko'rsatish */
  prompt: (item: T) => ReactNode;
  /** Material topilmasa ko'rsatiladigan matn */
  empty?: string;
}

export function ChoiceGame<T extends ChoiceItem>({
  config,
  onStats,
  onFail,
  onExit,
  level,
}: { config: ChoiceConfig<T> } & GameProps) {
  const [items, setItems] = useState<T[] | null>(null);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [session, setSession] = useState({ correct: 0, xp: 0 });
  const [busy, setBusy] = useState(false);

  const limit = config.limit ?? 6;

  async function start() {
    setBusy(true);
    try {
      const res = await api<{ items: T[] }>(`/games/${config.path}?limit=${limit}${levelParam(level)}`);
      setItems(res.items);
      setIndex(0);
      setChosen(null);
      setAnswer(null);
      setSession({ correct: 0, xp: 0 });
    } catch (e) {
      onFail(e);
    } finally {
      setBusy(false);
    }
  }

  async function choose(i: number) {
    if (!items || answer || busy) return;
    setChosen(i);
    setBusy(true);
    try {
      const res = await api<Answer>(`/games/${config.path}/answer`, {
        method: "POST",
        body: { token: items[index].token, choice: i },
      });
      setAnswer(res);
      onStats(res.stats);
      setSession((s) => ({ correct: s.correct + (res.correct ? 1 : 0), xp: s.xp + res.xpGained }));
    } catch (e) {
      setChosen(null);
      onFail(e);
    } finally {
      setBusy(false);
    }
  }

  if (!items) {
    return (
      <div className="card grid gap-3">
        <h2 className="text-xl font-bold">{config.title}</h2>
        <p className="text-muted">{config.intro}</p>
        <button type="button" onClick={start} disabled={busy} className="btn btn-primary">
          {busy ? "Yuklanmoqda..." : "Boshlash"}
        </button>
      </div>
    );
  }

  const finished = index >= items.length;

  if (finished) {
    return (
      <div className="card grid gap-3 text-center">
        {items.length === 0 ? (
          <>
            <h2 className="text-xl font-bold">Material hali tayyor emas</h2>
            <p className="text-muted">
              {config.empty ?? "Bu daraja uchun mashqlar hali qo'shilmagan. Boshqa darajani tanlab ko'ring."}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold">Mashq tugadi</h2>
            <p className="text-lg">
              To&apos;g&apos;ri javoblar: <strong>{session.correct}</strong> / {items.length}
            </p>
            <p className="text-lg text-primary">
              Yig&apos;ilgan XP: <strong>+{session.xp}</strong>
            </p>
          </>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => setItems(null)} className="btn btn-primary">Yana</button>
          <button type="button" onClick={onExit} className="btn btn-outline">Boshqa o&apos;yin</button>
        </div>
      </div>
    );
  }

  const item = items[index];

  return (
    <div key={index} className="card question-in grid gap-5">
      {answer && answer.xpGained > 0 && (
        <span
          className="xp-float pointer-events-none absolute right-6 top-5 font-display text-2xl font-extrabold text-success"
          aria-hidden="true"
        >
          +{answer.xpGained} XP
        </span>
      )}

      <div>
        <p className="mb-2 text-sm font-bold text-muted">
          Savol {index + 1} / {items.length}
        </p>
        <div
          className="progress-bar"
          role="progressbar"
          aria-label="Mashq jarayoni"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={index + (answer ? 1 : 0)}
        >
          <span style={{ width: `${((index + (answer ? 1 : 0)) / items.length) * 100}%` }} />
        </div>
      </div>

      <div className="text-center">{config.prompt(item)}</div>

      <div className="grid gap-3" role="group" aria-label="Javob variantlari">
        {item.options.map((opt, i) => {
          const isCorrect = answer && i === answer.correctIndex;
          const isWrong = answer && i === chosen && !answer.correct;
          return (
            <button
              key={`${opt}-${i}`}
              type="button"
              onClick={() => choose(i)}
              disabled={!!answer || busy}
              lang="tr"
              className={`btn btn-outline w-full justify-start gap-3 text-left ${
                isCorrect ? "answer-correct" : isWrong ? "answer-wrong" : ""
              }`}
            >
              <span
                className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/10 text-sm font-extrabold"
                aria-hidden="true"
              >
                {"ABCD"[i]}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      <div role="status" aria-live="polite" className="grid min-h-6 gap-2">
        {answer && (
          <>
            <p className={`font-bold ${answer.correct ? "text-success" : "text-danger"}`}>
              {answer.correct
                ? answer.xpGained > 0
                  ? `To'g'ri! +${answer.xpGained} XP`
                  : "To'g'ri! (bugungi XP chegarasi tugadi — mashq davom etaveradi)"
                : "Noto'g'ri. To'g'ri javob yashil rangda"}
            </p>
            {answer.full && (
              <p lang="tr" className="text-[1.05rem]">
                {answer.full}
              </p>
            )}
            {answer.explanation && <p className="text-muted">{answer.explanation}</p>}
          </>
        )}
      </div>

      {answer && (
        <button
          type="button"
          onClick={() => {
            setChosen(null);
            setAnswer(null);
            setIndex((i) => i + 1);
          }}
          className="btn btn-primary"
        >
          {index + 1 < items.length ? "Keyingi" : "Natijani ko'rish"}
        </button>
      )}
    </div>
  );
}

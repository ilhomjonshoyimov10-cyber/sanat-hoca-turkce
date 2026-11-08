"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { levelParam, type GameProps, type Stats } from "./types";

type Question = { token: string; prompt: string; example: string | null; options: string[] };
type Answer = { correct: boolean; correctIndex: number; xpGained: number; stats: Stats };

export function QuizGame({ onStats, onFail, onExit, level }: GameProps) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [session, setSession] = useState({ correct: 0, xp: 0 });
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      const res = await api<{ questions: Question[] }>(`/games/quiz?limit=10${levelParam(level)}`);
      setQuestions(res.questions);
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
    if (!questions || answer || busy) return;
    setChosen(i);
    setBusy(true);
    try {
      const res = await api<Answer>("/games/answer", { method: "POST", body: { token: questions[index].token, choice: i } });
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

  const finished = questions !== null && index >= questions.length;
  const q = questions && !finished ? questions[index] : null;

  if (!questions) {
    return (
      <div className="card grid gap-3">
        <h2 className="text-xl font-bold">So&apos;z mashqi</h2>
        <p className="text-muted">Turkcha so&apos;zning o&apos;zbekcha tarjimasini toping. Bilmagan so&apos;zlaringiz tez-tez, bilganlaringiz kamroq qaytadi.</p>
        <button type="button" onClick={start} disabled={busy} className="btn btn-primary">{busy ? "Yuklanmoqda..." : "Boshlash"}</button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="card grid gap-3 text-center">
        {questions.length === 0 ? (
          <>
            <h2 className="text-xl font-bold">Bugunlik hammasi tayyor!</h2>
            <p className="text-muted">Takrorlanadigan so&apos;z yo&apos;q. Keyingi takrorlash vaqti kelganda qaytib keling.</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold">Mashq tugadi</h2>
            <p className="text-lg">To&apos;g&apos;ri javoblar: <strong>{session.correct}</strong> / {questions.length}</p>
            <p className="text-lg text-primary">Yig&apos;ilgan XP: <strong>+{session.xp}</strong></p>
          </>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => setQuestions(null)} className="btn btn-primary">Orqaga</button>
          <button type="button" onClick={onExit} className="btn btn-outline">Boshqa o&apos;yin</button>
        </div>
      </div>
    );
  }

  return (
    <div key={index} className="card question-in grid gap-5">
      {answer && answer.xpGained > 0 && (
        <span className="xp-float pointer-events-none absolute right-6 top-5 font-display text-2xl font-extrabold text-success" aria-hidden="true">+{answer.xpGained} XP</span>
      )}
      <div>
        <p className="mb-2 text-sm font-bold text-muted">Savol {index + 1} / {questions.length}</p>
        <div className="progress-bar" role="progressbar" aria-label="Mashq jarayoni" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={index + (answer ? 1 : 0)}>
          <span style={{ width: `${((index + (answer ? 1 : 0)) / questions.length) * 100}%` }} />
        </div>
      </div>
      <div className="text-center">
        <p lang="tr" className="font-display text-4xl font-bold sm:text-5xl">{q!.prompt}</p>
        {q!.example && <p lang="tr" className="mt-3 text-muted">{q!.example}</p>}
      </div>
      <div className="grid gap-3" role="group" aria-label="Javob variantlari">
        {q!.options.map((opt, i) => {
          const isCorrect = answer && i === answer.correctIndex;
          const isWrong = answer && i === chosen && !answer.correct;
          return (
            <button key={opt} type="button" onClick={() => choose(i)} disabled={!!answer || busy}
              className={`btn btn-outline w-full justify-start gap-3 text-left ${isCorrect ? "answer-correct" : isWrong ? "answer-wrong" : ""}`}>
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/10 text-sm font-extrabold" aria-hidden="true">{"ABCD"[i]}</span>
              {opt}
            </button>
          );
        })}
      </div>
      <div role="status" aria-live="polite" className="min-h-6">
        {answer && (
          <p className={`font-bold ${answer.correct ? "text-success" : "text-danger"}`}>
            {answer.correct ? (answer.xpGained > 0 ? `To'g'ri! +${answer.xpGained} XP` : "To'g'ri! (bu so'z hali takrorlash vaqtiga yetmagan, XP berilmaydi)") : "Noto'g'ri. To'g'ri javob yashil rangda ko'rsatildi"}
          </p>
        )}
      </div>
      {answer && (
        <button type="button" onClick={() => { setChosen(null); setAnswer(null); setIndex((i) => i + 1); }} className="btn btn-primary">
          {index + 1 < questions.length ? "Keyingi" : "Natijani ko'rish"}
        </button>
      )}
    </div>
  );
}

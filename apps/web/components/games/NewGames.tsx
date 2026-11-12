"use client";

// To'rtta variantli o'yin — hammasi ChoiceGame ustida qurilgan, farqi
// faqat savolni ko'rsatishda. Beshinchisi (fe'l shakli) javob YOZILADI,
// shuning uchun alohida.

import { useState } from "react";
import { api } from "@/lib/api";
import { ChoiceGame, type ChoiceItem } from "./ChoiceGame";
import { levelParam, TURKISH_LETTERS, type GameProps, type Stats } from "./types";

// ───────────────────── Bo'shliqni to'ldirish ─────────────────────

interface ClozeItem extends ChoiceItem {
  masked: string;
  uzbek: string | null;
  topic: string | null;
}

export function ClozeGame(props: GameProps) {
  return (
    <ChoiceGame<ClozeItem>
      {...props}
      config={{
        title: "Bo'shliqni to'ldirish",
        intro:
          "Jumlada bitta joy bo'sh. To'g'ri qo'shimcha yoki so'zni tanlang. " +
          "Javobdan keyin qoidaning izohi ko'rsatiladi.",
        path: "cloze",
        prompt: (it) => (
          <>
            <p lang="tr" className="font-display text-[clamp(1.4rem,4vw,2.1rem)] font-bold leading-snug">
              {it.masked}
            </p>
            {it.uzbek && <p className="mt-3 text-muted">{it.uzbek}</p>}
            {it.topic && <p className="mt-1 text-sm text-muted">Mavzu: {it.topic}</p>}
          </>
        ),
      }}
    />
  );
}

// ───────────────────── Suhbat ─────────────────────

interface DialogueItem extends ChoiceItem {
  prompt: string;
  situation: string | null;
  uzbek: string | null;
}

export function DialogueGame(props: GameProps) {
  return (
    <ChoiceGame<DialogueItem>
      {...props}
      config={{
        title: "Suhbat",
        intro: "Sizga nimadir aytildi. To'g'ri javobni tanlang — haqiqiy suhbatdagidek.",
        path: "dialogue",
        prompt: (it) => (
          <>
            {it.situation && <p className="mb-2 text-sm text-muted">{it.situation}</p>}
            <p
              lang="tr"
              className="mx-auto max-w-md rounded-[var(--r-tile)] border border-cobalt/30 bg-cobalt/[0.08] px-5 py-4 font-display text-[clamp(1.3rem,3.5vw,1.8rem)] font-bold"
            >
              {it.prompt}
            </p>
            {it.uzbek && <p className="mt-3 text-muted">{it.uzbek}</p>}
          </>
        ),
      }}
    />
  );
}

// ───────────────────── Zid ma'noli so'z ─────────────────────

interface PairItem extends ChoiceItem {
  word: string;
  uzbek: string | null;
}

export function AntonymGame(props: GameProps) {
  return (
    <ChoiceGame<PairItem>
      {...props}
      config={{
        title: "Zid ma'noli so'z",
        intro: "Berilgan so'zning teskari ma'nolisini toping.",
        path: "antonym",
        prompt: (it) => (
          <>
            <p className="text-sm text-muted">Bu so&apos;zning teskarisi qaysi?</p>
            <p lang="tr" className="mt-2 font-display text-[clamp(1.8rem,5vw,2.8rem)] font-bold">
              {it.word}
            </p>
            {it.uzbek && <p className="mt-2 text-muted">{it.uzbek}</p>}
          </>
        ),
      }}
    />
  );
}

// ───────────────────── Ortiqcha so'zni top ─────────────────────

interface OddItem extends ChoiceItem {
  hint: string | null;
}

export function OddOneOutGame(props: GameProps) {
  return (
    <ChoiceGame<OddItem>
      {...props}
      config={{
        title: "Ortiqcha so'zni top",
        intro:
          "To'rtta so'zdan uchtasi bir mavzuga tegishli, bittasi — yo'q. " +
          "Ortiqchasini toping.",
        path: "odd",
        empty:
          "Bu o'yin uchun lug'atda mavzu bo'yicha ajratilgan so'zlar yetarli emas. " +
          "Ustoz lug'atga mavzu qo'shgach ishlaydi.",
        prompt: () => (
          <p className="font-display text-[clamp(1.2rem,3vw,1.6rem)] font-bold">
            Qaysi so&apos;z boshqalarga qo&apos;shilmaydi?
          </p>
        ),
      }}
    />
  );
}

// ───────────────────── Fe'l shakli (javob yoziladi) ─────────────────────

interface VerbItem {
  token: string;
  infinitive: string;
  person: string;
  tense: string;
  negative: boolean;
  uzbek: string | null;
}
interface VerbAnswer {
  correct: boolean;
  almost: boolean;
  answer: string;
  explanation: string | null;
  xpGained: number;
  capped: boolean;
  stats: Stats;
}

export function VerbGame({ onStats, onFail, onExit, level }: GameProps) {
  const [items, setItems] = useState<VerbItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [answer, setAnswer] = useState<VerbAnswer | null>(null);
  const [session, setSession] = useState({ correct: 0, xp: 0 });
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      const res = await api<{ items: VerbItem[] }>(`/games/verb?limit=6${levelParam(level)}`);
      setItems(res.items);
      setIndex(0);
      setValue("");
      setAnswer(null);
      setSession({ correct: 0, xp: 0 });
    } catch (e) {
      onFail(e);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!items || answer || busy || !value.trim()) return;
    setBusy(true);
    try {
      const res = await api<VerbAnswer>("/games/verb/answer", {
        method: "POST",
        body: { token: items[index].token, answer: value.trim() },
      });
      setAnswer(res);
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
        <h2 className="text-xl font-bold">Fe&apos;l shakli</h2>
        <p className="text-muted">
          Masdar, shaxs va zamon beriladi — fe&apos;lni to&apos;g&apos;ri shaklga qo&apos;ying.
          Masalan: gitmek + ben + şimdiki zaman → gidiyorum.
        </p>
        <button type="button" onClick={start} disabled={busy} className="btn btn-primary">
          {busy ? "Yuklanmoqda..." : "Boshlash"}
        </button>
      </div>
    );
  }

  if (index >= items.length) {
    return (
      <div className="card grid gap-3 text-center">
        {items.length === 0 ? (
          <>
            <h2 className="text-xl font-bold">Material hali tayyor emas</h2>
            <p className="text-muted">Bu daraja uchun fe&apos;l mashqlari qo&apos;shilmagan.</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold">Mashq tugadi</h2>
            <p className="text-lg">To&apos;g&apos;ri javoblar: <strong>{session.correct}</strong> / {items.length}</p>
            <p className="text-lg text-primary">Yig&apos;ilgan XP: <strong>+{session.xp}</strong></p>
          </>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => setItems(null)} className="btn btn-primary">Yana</button>
          <button type="button" onClick={onExit} className="btn btn-outline">Boshqa o&apos;yin</button>
        </div>
      </div>
    );
  }

  const it = items[index];

  return (
    <div key={index} className="card question-in grid gap-5">
      {answer && answer.xpGained > 0 && (
        <span className="xp-float pointer-events-none absolute right-6 top-5 font-display text-2xl font-extrabold text-success" aria-hidden="true">
          +{answer.xpGained} XP
        </span>
      )}

      <div>
        <p className="mb-2 text-sm font-bold text-muted">Savol {index + 1} / {items.length}</p>
        <div className="progress-bar" role="progressbar" aria-label="Mashq jarayoni"
          aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={index + (answer ? 1 : 0)}>
          <span style={{ width: `${((index + (answer ? 1 : 0)) / items.length) * 100}%` }} />
        </div>
      </div>

      <div className="text-center">
        <p lang="tr" className="font-display text-[clamp(1.8rem,5vw,2.6rem)] font-bold">{it.infinitive}</p>
        <p className="mt-3 flex flex-wrap justify-center gap-2">
          <span className="badge">{it.person}</span>
          <span className="badge" lang="tr">{it.tense}</span>
          {it.negative && <span className="badge badge-warn">bo&apos;lishsiz</span>}
        </p>
        {it.uzbek && <p className="mt-3 text-muted">{it.uzbek}</p>}
      </div>

      <div className="grid gap-2">
        <label htmlFor="verb-ans" className="label">Javobingiz</label>
        <input
          id="verb-ans"
          lang="tr"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void submit(); }}
          disabled={!!answer}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="input text-center font-display text-xl"
        />
        {/* Turkcha harflar klaviaturada bo'lmasligi mumkin */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {TURKISH_LETTERS.map((ch) => (
            <button
              key={ch}
              type="button"
              disabled={!!answer}
              onClick={() => setValue((v) => v + ch)}
              className="btn btn-quiet !min-h-9 !px-3"
              lang="tr"
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {!answer && (
        <button type="button" onClick={submit} disabled={busy || !value.trim()} className="btn btn-primary">
          Tekshirish
        </button>
      )}

      <div role="status" aria-live="polite" className="grid min-h-6 gap-2">
        {answer && (
          <>
            <p className={`font-bold ${answer.correct ? "text-success" : answer.almost ? "text-brass" : "text-danger"}`}>
              {answer.correct
                ? answer.xpGained > 0 ? `To'g'ri! +${answer.xpGained} XP` : "To'g'ri! (bugungi XP chegarasi tugadi)"
                : answer.almost
                  ? "Deyarli to'g'ri — turkcha harflarga e'tibor bering"
                  : "Noto'g'ri"}
            </p>
            {!answer.correct && (
              <p lang="tr" className="text-[1.05rem]">
                To&apos;g&apos;ri javob: <strong>{answer.answer}</strong>
              </p>
            )}
            {answer.explanation && <p className="text-muted">{answer.explanation}</p>}
          </>
        )}
      </div>

      {answer && (
        <button
          type="button"
          onClick={() => { setAnswer(null); setValue(""); setIndex((i) => i + 1); }}
          className="btn btn-primary"
        >
          {index + 1 < items.length ? "Keyingi" : "Natijani ko'rish"}
        </button>
      )}
    </div>
  );
}

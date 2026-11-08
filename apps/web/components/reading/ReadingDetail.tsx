"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useEffect } from "react";
import { api, ApiError } from "@/lib/api";

type Glossary = { id: string; turkish: string; uzbek: string };
type Question = { id: string; kind: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER"; prompt: string; options: string[] };
type Attempt = { score: number; total: number; createdAt: string };

type Text = {
  id: string;
  slug: string;
  title: string;
  level: string;
  topic: string | null;
  body: string;
  bodyUz: string | null;
  wordCount: number;
  isDraft: boolean;
  glossary: Glossary[];
  questions: Question[];
  attempts: Attempt[];
};

type Result = {
  questionId: string;
  correct: boolean;
  correctIndex: number | null;
  correctText: string[];
  explanation: string | null;
};

const TRUE_FALSE = ["To'g'ri", "Xato"];

/** Matnni paragraflarga bo'lib, lug'atdagi so'zlarni bosiladigan qilamiz.
 *  Lug'at so'zi topilganda ustiga bosib tarjimasini ko'rish mumkin. */
function useHighlighter(glossary: Glossary[]) {
  return useMemo(() => {
    if (glossary.length === 0) return null;
    // Uzunidan boshlab qidiramiz, aks holda "ev" so'zi "evde" ichida tutilib qoladi
    const sorted = [...glossary].sort((a, b) => b.turkish.length - a.turkish.length);
    const escaped = sorted.map((g) => g.turkish.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    // \p{L} — harf: so'z chetlarini turkcha harflar bilan ham to'g'ri topadi
    const re = new RegExp(`(?<!\\p{L})(${escaped.join("|")})(?!\\p{L})`, "giu");
    const byWord = new Map(glossary.map((g) => [g.turkish.toLocaleLowerCase("tr"), g]));
    return { re, byWord };
  }, [glossary]);
}

export function ReadingDetail() {
  const params = useParams<{ slug: string }>();
  const [text, setText] = useState<Text | null>(null);
  const [error, setError] = useState("");
  const [showUz, setShowUz] = useState(false);
  const [answers, setAnswers] = useState<Record<string, { choice?: number; text?: string }>>({});
  const [results, setResults] = useState<Result[] | null>(null);
  const [score, setScore] = useState<{ score: number; total: number } | null>(null);
  const [sending, setSending] = useState(false);
  const [openWord, setOpenWord] = useState<Glossary | null>(null);

  const hl = useHighlighter(text?.glossary ?? []);

  useEffect(() => {
    if (!params?.slug) return;
    void api<Text>(`/reading/${params.slug}`)
      .then(setText)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Matn topilmadi"));
  }, [params?.slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text || sending) return;
    setSending(true);
    setError("");
    try {
      const r = await api<{ score: number; total: number; results: Result[] }>(`/reading/${text.slug}/submit`, {
        method: "POST",
        body: {
          answers: text.questions.map((q) => ({
            questionId: q.id,
            choice: answers[q.id]?.choice,
            text: answers[q.id]?.text,
          })),
        },
      });
      setResults(r.results);
      setScore({ score: r.score, total: r.total });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Javoblarni yuborib bo'lmadi");
    } finally {
      setSending(false);
    }
  }

  function retry() {
    setResults(null);
    setScore(null);
    setAnswers({});
  }

  if (error && !text) {
    return (
      <div>
        <p className="text-bole" role="alert">
          {error}
        </p>
        <Link href="/oqish" className="mt-4 inline-block text-turquoise hover:underline">
          ← Matnlarga qaytish
        </Link>
      </div>
    );
  }
  if (!text) return <p className="text-muted" role="status">Yuklanmoqda...</p>;

  const resultFor = (id: string) => results?.find((r) => r.questionId === id);

  return (
    <div>
      <Link href="/oqish" className="mb-5 inline-block text-sm text-turquoise hover:underline">
        ← O&apos;qish matnlari
      </Link>

      <h1 className="font-display text-[2rem] font-bold leading-tight" lang="tr">
        {text.title}
      </h1>
      <p className="mt-2 text-muted">
        {text.level}
        {text.topic ? ` · ${text.topic}` : ""} · {text.wordCount} so&apos;z
        {text.isDraft ? " · qoralama" : ""}
      </p>

      {/* Matn */}
      <article className="mt-7 border border-cobalt/25 bg-well p-5 sm:p-7">
        <div lang="tr" className="grid gap-4 text-[1.0625rem] leading-relaxed">
          {text.body.split(/\n\s*\n/).map((para, i) => (
            <p key={i}>{hl ? renderWithGlossary(para, hl, setOpenWord) : para}</p>
          ))}
        </div>

        {text.glossary.length > 0 && (
          <p className="mt-5 text-sm text-muted">
            Tagi chizilgan so&apos;zlarni bosib tarjimasini ko&apos;ring.
          </p>
        )}
      </article>

      {/* Tanlangan so'z */}
      {openWord && (
        <div className="raise mt-3 flex items-center justify-between gap-4 border border-brass/40 bg-tile p-4">
          <p>
            <strong lang="tr" className="text-[1.1rem]">
              {openWord.turkish}
            </strong>
            <span className="mx-2 text-muted">—</span>
            {openWord.uzbek}
          </p>
          <button type="button" onClick={() => setOpenWord(null)} aria-label="Yopish" className="text-muted hover:text-porcelain">
            ✕
          </button>
        </div>
      )}

      {/* Tarjima */}
      {text.bodyUz && (
        <div className="mt-5">
          <button type="button" onClick={() => setShowUz((v) => !v)} className="btn btn-outline !min-h-10 !px-4 text-sm">
            {showUz ? "Tarjimani yashirish" : "O'zbekcha tarjimani ko'rish"}
          </button>
          {showUz && (
            <div className="mt-4 grid gap-4 border-l-2 border-cobalt/40 pl-5 text-muted">
              {text.bodyUz.split(/\n\s*\n/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Savollar */}
      {text.questions.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[1.3rem]">Savollar</h2>
            {score && (
              <p className="text-[1.05rem]">
                Natija: <strong className={score.score === score.total ? "text-turquoise" : "text-brass"}>
                  {score.score} / {score.total}
                </strong>
              </p>
            )}
          </div>

          <form onSubmit={submit} method="post" className="grid gap-5">
            {text.questions.map((q, qi) => {
              const res = resultFor(q.id);
              const options = q.kind === "TRUE_FALSE" ? TRUE_FALSE : q.options;
              return (
                <fieldset
                  key={q.id}
                  className={`border p-5 ${
                    res ? (res.correct ? "border-turquoise/50 bg-turquoise/[0.06]" : "border-bole/50 bg-bole/[0.06]") : "border-cobalt/25"
                  }`}
                >
                  <legend className="px-2 text-sm text-muted">
                    {qi + 1}-savol{res ? (res.correct ? " · to'g'ri" : " · xato") : ""}
                  </legend>
                  <p className="mb-3 text-[1.0625rem]" lang={q.kind === "SHORT_ANSWER" ? "tr" : undefined}>
                    {q.prompt}
                  </p>

                  {q.kind === "SHORT_ANSWER" ? (
                    <input
                      type="text"
                      lang="tr"
                      value={answers[q.id]?.text ?? ""}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: { text: e.target.value } }))}
                      disabled={Boolean(results)}
                      maxLength={200}
                      aria-label={`${qi + 1}-savolga javob`}
                      className="input"
                    />
                  ) : (
                    <div className="grid gap-2">
                      {options.map((opt, oi) => {
                        const chosen = answers[q.id]?.choice === oi;
                        const isRight = res?.correctIndex === oi;
                        return (
                          <label
                            key={oi}
                            className={`flex cursor-pointer items-center gap-3 border px-4 py-2.5 ${
                              res && isRight
                                ? "border-turquoise/60"
                                : chosen
                                  ? "border-cobalt/60 bg-tile-2"
                                  : "border-cobalt/25 hover:bg-tile"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              checked={chosen}
                              onChange={() => setAnswers((a) => ({ ...a, [q.id]: { choice: oi } }))}
                              disabled={Boolean(results)}
                              className="size-4 accent-primary"
                            />
                            <span lang="tr">{opt}</span>
                            {res && isRight && <span className="ml-auto text-sm text-turquoise">to&apos;g&apos;ri javob</span>}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {res && res.correctText.length > 0 && (
                    <p className="mt-3 text-[0.9375rem]">
                      Kutilgan javob: <strong lang="tr">{res.correctText.join(", ")}</strong>
                    </p>
                  )}
                  {res?.explanation && <p className="mt-2 text-[0.9375rem] text-muted">{res.explanation}</p>}
                </fieldset>
              );
            })}

            {error && (
              <p className="text-bole" role="alert">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              {!results ? (
                <button type="submit" disabled={sending} className="btn btn-primary">
                  {sending ? "Yuborilmoqda..." : "Javoblarni yuborish"}
                </button>
              ) : (
                <button type="button" onClick={retry} className="btn btn-outline">
                  Qaytadan ishlash
                </button>
              )}
            </div>
          </form>

          {text.attempts.length > 0 && !results && (
            <p className="mt-5 text-sm text-muted">
              Oldingi natijalar: {text.attempts.map((a) => `${a.score}/${a.total}`).join(", ")}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

/** Paragrafdagi lug'at so'zlarini bosiladigan qilib chiqaradi. */
function renderWithGlossary(
  para: string,
  hl: { re: RegExp; byWord: Map<string, Glossary> },
  onPick: (g: Glossary) => void,
) {
  const parts = para.split(hl.re);
  return parts.map((part, i) => {
    const hit = hl.byWord.get(part.toLocaleLowerCase("tr"));
    if (!hit) return part;
    return (
      <button
        key={`${i}-${part}`}
        type="button"
        onClick={() => onPick(hit)}
        className="underline decoration-brass decoration-dotted underline-offset-4 hover:text-brass"
      >
        {part}
      </button>
    );
  });
}

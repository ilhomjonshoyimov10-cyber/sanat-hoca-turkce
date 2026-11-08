"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";

type Question = { id: string; kind: string; prompt: string; options: string[] };
type Glossary = { id: string; turkish: string; uzbek: string };

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;

/** Ro'yxat sahifasidagi "yangi matn" formasi. */
export function NewTextForm({ onCreated }: { onCreated: (slug: string) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const r = await api<{ slug: string }>("/reading/texts", {
        method: "POST",
        body: {
          title: String(form.get("title") ?? ""),
          level: String(form.get("level") ?? "A1"),
          body: String(form.get("body") ?? ""),
          bodyUz: String(form.get("bodyUz") ?? "").trim() || undefined,
          topic: String(form.get("topic") ?? "").trim() || undefined,
        },
      });
      setOpen(false);
      onCreated(r.slug);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary !min-h-10 !px-4 mb-6 text-sm">
        Yangi matn qo&apos;shish
      </button>
    );
  }

  return (
    <form onSubmit={submit} method="post" className="mb-7 grid gap-4 border border-cobalt/30 bg-well p-5 sm:p-6">
      <p className="text-[0.9375rem] text-muted">
        Matn <strong>o&apos;zingiz yozgan</strong> bo&apos;lishi kerak. Darslikdan ko&apos;chirish
        mualliflik huquqini buzadi. Paragraflarni bo&apos;sh qator bilan ajrating.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor="rt-title" className="label">
            Sarlavha (turkcha)
          </label>
          <input id="rt-title" name="title" lang="tr" required minLength={2} maxLength={200} className="input" />
        </div>
        <div>
          <label htmlFor="rt-level" className="label">
            Daraja
          </label>
          <select id="rt-level" name="level" className="input" defaultValue="A1">
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="rt-topic" className="label">
          Mavzu (ixtiyoriy)
        </label>
        <input id="rt-topic" name="topic" maxLength={80} placeholder="kundalik hayot" className="input" />
      </div>
      <div>
        <label htmlFor="rt-body" className="label">
          Turkcha matn (kamida 50 belgi)
        </label>
        <textarea id="rt-body" name="body" lang="tr" required minLength={50} maxLength={20000} rows={8} className="input" />
      </div>
      <div>
        <label htmlFor="rt-bodyuz" className="label">
          O&apos;zbekcha tarjima (ixtiyoriy — o&apos;quvchi o&apos;zi ochib ko&apos;radi)
        </label>
        <textarea id="rt-bodyuz" name="bodyUz" maxLength={20000} rows={6} className="input" />
      </div>
      {error && (
        <p className="text-bole" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? "Saqlanmoqda..." : "Saqlash (qoralama)"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-outline">
          Bekor qilish
        </button>
      </div>
      <p className="text-sm text-muted">
        Saqlagandan keyin savollar va lug&apos;at qo&apos;shasiz, so&apos;ngra nashr qilasiz.
      </p>
    </form>
  );
}

/** Matn sahifasidagi ustoz paneli: nashr, savollar, lug'at. */
export function TextAdmin({
  textId,
  slug,
  isDraft,
  questions,
  glossary,
  onChanged,
}: {
  textId: string;
  slug: string;
  isDraft: boolean;
  questions: Question[];
  glossary: Glossary[];
  onChanged: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"nashr" | "savol" | "lugat">("nashr");
  const [kind, setKind] = useState("MULTIPLE_CHOICE");

  async function publish(next: boolean) {
    setBusy(true);
    setError("");
    try {
      await api(`/reading/texts/${textId}`, { method: "PATCH", body: { published: next } });
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "O'zgartirib bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  async function addQuestion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      kind,
      prompt: String(form.get("prompt") ?? ""),
      explanation: String(form.get("explanation") ?? "").trim() || undefined,
      position: questions.length,
    };

    if (kind === "MULTIPLE_CHOICE") {
      const options = [0, 1, 2, 3]
        .map((i) => String(form.get(`opt${i}`) ?? "").trim())
        .filter(Boolean);
      body.options = options;
      body.correctIndex = Number(form.get("correct") ?? 0);
      if (options.length < 2) {
        setError("Kamida 2 variant yozing");
        setBusy(false);
        return;
      }
      if (Number(body.correctIndex) >= options.length) {
        setError("To'g'ri variant mavjud variantlardan tanlanishi kerak");
        setBusy(false);
        return;
      }
    } else if (kind === "TRUE_FALSE") {
      body.correctIndex = Number(form.get("tf") ?? 0);
    } else {
      const answers = String(form.get("answers") ?? "")
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      if (!answers.length) {
        setError("Qabul qilinadigan javobni yozing");
        setBusy(false);
        return;
      }
      body.correctText = answers;
    }

    try {
      await api(`/reading/texts/${textId}/questions`, { method: "POST", body });
      (e.target as HTMLFormElement).reset();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Savolni qo'shib bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  async function removeQuestion(id: string) {
    try {
      await api(`/reading/questions/${id}`, { method: "DELETE" });
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "O'chirib bo'lmadi");
    }
  }

  async function saveGlossary(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const raw = String(new FormData(e.currentTarget).get("pairs") ?? "");
    // Har qator: turkcha = o'zbekcha
    const items = raw
      .split("\n")
      .map((line) => line.split("="))
      .filter((parts) => parts.length >= 2)
      .map((parts, i) => ({
        turkish: parts[0].trim(),
        uzbek: parts.slice(1).join("=").trim(),
        position: i,
      }))
      .filter((it) => it.turkish && it.uzbek);

    try {
      await api(`/reading/texts/${textId}/glossary`, { method: "PUT", body: { items } });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 border border-brass/40 bg-well p-5 sm:p-6">
      <h2 className="mb-1 text-[1.2rem]">Ustoz paneli</h2>
      <p className="mb-4 text-sm text-muted">
        Bu bo&apos;lim faqat ustoz va adminga ko&apos;rinadi. Manzil: /oqish/{slug}
      </p>

      <div className="segment mb-5 flex flex-wrap gap-1" role="tablist" aria-label="Ustoz amallari">
        <button type="button" role="tab" aria-selected={tab === "nashr"} onClick={() => setTab("nashr")} className="min-h-10 px-4 text-sm">
          Nashr
        </button>
        <button type="button" role="tab" aria-selected={tab === "savol"} onClick={() => setTab("savol")} className="min-h-10 px-4 text-sm">
          Savollar ({questions.length})
        </button>
        <button type="button" role="tab" aria-selected={tab === "lugat"} onClick={() => setTab("lugat")} className="min-h-10 px-4 text-sm">
          Lug&apos;at ({glossary.length})
        </button>
      </div>

      {error && (
        <p className="mb-4 text-bole" role="alert">
          {error}
        </p>
      )}

      {tab === "nashr" && (
        <div>
          <p className="mb-4">
            Holati:{" "}
            <strong className={isDraft ? "text-brass" : "text-turquoise"}>
              {isDraft ? "qoralama — o'quvchilar ko'rmaydi" : "nashr qilingan"}
            </strong>
          </p>
          {isDraft && questions.length === 0 && (
            <p className="mb-4 text-[0.9375rem] text-muted">
              Savol qo&apos;shmasdan nashr qilsangiz, o&apos;quvchi faqat matnni o&apos;qiydi — bu ham
              foydali, lekin savollar bilan yaxshiroq.
            </p>
          )}
          <button type="button" onClick={() => void publish(isDraft)} disabled={busy} className="btn btn-primary">
            {isDraft ? "Nashr qilish" : "Qoralamaga qaytarish"}
          </button>
        </div>
      )}

      {tab === "savol" && (
        <div className="grid gap-6">
          {questions.length > 0 && (
            <ol className="grid gap-2">
              {questions.map((q, i) => (
                <li key={q.id} className="flex items-start justify-between gap-4 border border-cobalt/25 bg-tile p-3">
                  <span>
                    <span className="text-muted">{i + 1}.</span> {q.prompt}
                    <span className="block text-xs text-muted">
                      {q.kind === "MULTIPLE_CHOICE" ? `variantli (${q.options.length})` : q.kind === "TRUE_FALSE" ? "to'g'ri/xato" : "qisqa javob"}
                    </span>
                  </span>
                  <button type="button" onClick={() => void removeQuestion(q.id)} className="shrink-0 text-muted hover:text-bole">
                    O&apos;chirish
                  </button>
                </li>
              ))}
            </ol>
          )}

          <form onSubmit={addQuestion} method="post" className="grid gap-4 border-t border-cobalt/25 pt-5">
            <div>
              <label htmlFor="q-kind" className="label">
                Savol turi
              </label>
              <select id="q-kind" value={kind} onChange={(e) => setKind(e.target.value)} className="input">
                <option value="MULTIPLE_CHOICE">Variantli</option>
                <option value="TRUE_FALSE">To&apos;g&apos;ri / Xato</option>
                <option value="SHORT_ANSWER">Qisqa javob</option>
              </select>
            </div>

            <div>
              <label htmlFor="q-prompt" className="label">
                Savol matni
              </label>
              <input id="q-prompt" name="prompt" lang="tr" required minLength={3} maxLength={500} className="input" />
            </div>

            {kind === "MULTIPLE_CHOICE" && (
              <fieldset className="grid gap-3 border border-cobalt/25 p-4">
                <legend className="px-2 text-sm text-muted">Variantlar (kamida 2 ta)</legend>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correct"
                      value={i}
                      defaultChecked={i === 0}
                      aria-label={`${i + 1}-variant to'g'ri`}
                      className="size-4 shrink-0 accent-primary"
                    />
                    <input
                      name={`opt${i}`}
                      lang="tr"
                      maxLength={200}
                      placeholder={`${i + 1}-variant${i < 2 ? "" : " (ixtiyoriy)"}`}
                      className="input"
                    />
                  </div>
                ))}
                <p className="text-sm text-muted">Chapdagi doirani to&apos;g&apos;ri variantga qo&apos;ying.</p>
              </fieldset>
            )}

            {kind === "TRUE_FALSE" && (
              <fieldset className="grid gap-2 border border-cobalt/25 p-4">
                <legend className="px-2 text-sm text-muted">To&apos;g&apos;ri javob</legend>
                <label className="flex items-center gap-3">
                  <input type="radio" name="tf" value={0} defaultChecked className="size-4 accent-primary" />
                  To&apos;g&apos;ri
                </label>
                <label className="flex items-center gap-3">
                  <input type="radio" name="tf" value={1} className="size-4 accent-primary" />
                  Xato
                </label>
              </fieldset>
            )}

            {kind === "SHORT_ANSWER" && (
              <div>
                <label htmlFor="q-answers" className="label">
                  Qabul qilinadigan javoblar (vergul bilan)
                </label>
                <input id="q-answers" name="answers" lang="tr" required maxLength={400} placeholder="gazete, gazeteyi" className="input" />
                <p className="mt-1 text-sm text-muted">
                  Katta-kichik harf, nuqta va ortiqcha bo&apos;shliq hisobga olinmaydi.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="q-exp" className="label">
                Izoh (javobdan keyin ko&apos;rinadi)
              </label>
              <input id="q-exp" name="explanation" maxLength={500} className="input" />
            </div>

            <div>
              <button type="submit" disabled={busy} className="btn btn-primary">
                Savol qo&apos;shish
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "lugat" && (
        <form onSubmit={saveGlossary} method="post" className="grid gap-4">
          <div>
            <label htmlFor="g-pairs" className="label">
              Qiyin so&apos;zlar — har qatorda: turkcha = o&apos;zbekcha
            </label>
            <textarea
              id="g-pairs"
              name="pairs"
              rows={10}
              defaultValue={glossary.map((g) => `${g.turkish} = ${g.uzbek}`).join("\n")}
              className="input font-mono text-[0.9375rem]"
              placeholder={"kalabalık = gavjum\ntaze = yangi"}
            />
            <p className="mt-1 text-sm text-muted">
              Bu so&apos;zlar matnda tagi chizilib, o&apos;quvchi bosganda tarjimasi chiqadi.
              Ro&apos;yxat <strong>butunlay almashtiriladi</strong>.
            </p>
          </div>
          <div>
            <button type="submit" disabled={busy} className="btn btn-primary">
              Lug&apos;atni saqlash
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

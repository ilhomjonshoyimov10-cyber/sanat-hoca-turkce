"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { errorText, type Homework, type Sub } from "./shared";
import { PageLoader } from "@/components/Loader";
import { formatDate } from "@/lib/datetime";

type TeacherSub = Sub & { studentId: string; studentName: string; submittedAt: string };

const STATUS: Record<string, [string, string]> = {
  SUBMITTED: ["Topshirilgan", "badge-warn"],
  GRADED: ["Baholangan", "badge-ok"],
  RETURNED: ["Qaytarilgan", "badge-bad"],
};

function StudentView({ hw, onChanged }: { hw: Homework; onChanged: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const mine = hw.mySubmission;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = String(new FormData(e.currentTarget).get("text") ?? "").trim();
    setBusy(true);
    setError("");
    try {
      await api(`/homework/${hw.id}/submission`, { method: "POST", body: { text } });
      onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <p className="whitespace-pre-wrap leading-relaxed">{hw.description}</p>
      {mine?.status === "GRADED" ? (
        <div className="grid gap-2">
          <p className="alert-success">Baho: {mine.score} / {hw.maxScore}</p>
          {mine.feedback && <p className="text-muted">Ustoz izohi: {mine.feedback}</p>}
          <p className="whitespace-pre-wrap rounded-xl bg-white/5 p-3 text-sm text-muted">{mine.text}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-3">
          {mine?.status === "RETURNED" && (
            <p className="alert-error">Ustoz qayta ishlashni so&apos;radi{mine.feedback ? `: ${mine.feedback}` : "."}</p>
          )}
          <div>
            <label htmlFor={`t-${hw.id}`} className="label">Javobingiz</label>
            <textarea id={`t-${hw.id}`} name="text" required rows={5} maxLength={5000} defaultValue={mine?.text ?? ""} className="input" />
          </div>
          {error && <p className="alert-error" role="alert">{error}</p>}
          <button type="submit" disabled={busy} className="btn btn-primary justify-self-start">
            {busy ? "Yuborilmoqda..." : mine ? "Qayta topshirish" : "Topshirish"}
          </button>
        </form>
      )}
    </div>
  );
}

function TeacherView({ hw, onChanged }: { hw: Homework; onChanged: () => void }) {
  const [subs, setSubs] = useState<TeacherSub[] | null>(null);
  const [ver, setVer] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api<{ submissions: TeacherSub[] }>(`/homework/${hw.id}`)
      .then((r) => !cancelled && setSubs(r.submissions))
      .catch((e) => !cancelled && setError(errorText(e)));
    return () => {
      cancelled = true;
    };
  }, [hw.id, ver]);

  async function grade(s: TeacherSub, form: HTMLFormElement, returnForRevision: boolean) {
    const d = new FormData(form);
    const scoreRaw = String(d.get("score") ?? "");
    setError("");
    try {
      await api(`/submissions/${s.id}`, {
        method: "PATCH",
        body: { score: returnForRevision || scoreRaw === "" ? undefined : Number(scoreRaw), feedback: String(d.get("feedback") ?? "").trim() || undefined, returnForRevision },
      });
      setVer((n) => n + 1);
      onChanged();
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <div className="grid gap-4">
      <p className="whitespace-pre-wrap leading-relaxed">{hw.description}</p>
      {error && <p className="alert-error" role="alert">{error}</p>}
      {subs === null && !error && <PageLoader />}
      {subs && subs.length === 0 && <p className="text-muted">Hali hech kim topshirmagan.</p>}
      {subs?.map((s) => {
        const [label, cls] = STATUS[s.status];
        return (
          <form
            key={s.id}
            onSubmit={(e) => { e.preventDefault(); void grade(s, e.currentTarget, false); }}
            className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-extrabold">{s.studentName}</p>
              <span className={`badge ${cls}`}>{label}{s.status === "GRADED" ? `: ${s.score}/${hw.maxScore}` : ""}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{s.text}</p>
            <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
              <div>
                <label htmlFor={`sc-${s.id}`} className="label">Ball (0–{hw.maxScore})</label>
                <input id={`sc-${s.id}`} name="score" type="number" min={0} max={hw.maxScore} defaultValue={s.score ?? ""} className="input" />
              </div>
              <div>
                <label htmlFor={`fb-${s.id}`} className="label">Izoh</label>
                <input id={`fb-${s.id}`} name="feedback" maxLength={1000} defaultValue={s.feedback ?? ""} className="input" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn btn-primary !min-h-10 text-sm">Baholash</button>
              <button type="button" className="btn btn-outline !min-h-10 text-sm" onClick={(e) => void grade(s, e.currentTarget.form!, true)}>
                Qayta ishlashga qaytarish
              </button>
            </div>
          </form>
        );
      })}
    </div>
  );
}

export function HomeworkSection({ groupId, canManage }: { groupId: string; canManage: boolean }) {
  const [items, setItems] = useState<Homework[] | null>(null);
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<Homework[]>(`/groups/${groupId}/homework`)
      .then((x) => !cancelled && setItems(x))
      .catch((e) => !cancelled && setError(errorText(e)));
    return () => {
      cancelled = true;
    };
  }, [groupId, reload]);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    const due = String(d.get("dueAt") ?? "");
    setBusy(true);
    setError("");
    try {
      await api(`/groups/${groupId}/homework`, {
        method: "POST",
        body: {
          title: String(d.get("title") ?? "").trim(),
          description: String(d.get("description") ?? "").trim(),
          maxScore: d.get("maxScore") ? Number(d.get("maxScore")) : undefined,
          dueAt: due ? new Date(`${due}T23:59:00+05:00`).toISOString() : undefined,
        },
      });
      form.reset();
      setReload((n) => n + 1);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const badge = (h: Homework) => {
    if (canManage) return <span className="badge">{h.submittedCount ?? 0} topshirgan · {h.gradedCount ?? 0} baholangan</span>;
    const m = h.mySubmission;
    if (!m) return <span className="badge badge-bad">Topshirilmagan</span>;
    const [label, cls] = STATUS[m.status];
    return <span className={`badge ${cls}`}>{label}{m.status === "GRADED" ? `: ${m.score}/${h.maxScore}` : ""}</span>;
  };

  return (
    <div className="grid gap-5">
      {error && <p className="alert-error" role="alert">{error}</p>}
      {items === null && !error && <PageLoader />}
      {items && items.length === 0 && <p className="card text-muted">Hozircha vazifa yo&apos;q.</p>}

      {items && items.length > 0 && (
        <ul className="grid gap-3">
          {items.map((h) => (
            <li key={h.id} className="card overflow-hidden !p-0">
              <button
                type="button" aria-expanded={open === h.id} onClick={() => setOpen(open === h.id ? null : h.id)}
                className="flex w-full items-center justify-between gap-3 p-5 text-left"
              >
                <span>
                  <span className="block font-extrabold">{h.title}</span>
                  <span className="text-sm text-muted">
                    {h.dueAt ? `Muddat: ${formatDate(h.dueAt, "uz")} · ` : ""}Maksimal ball: {h.maxScore}
                  </span>
                </span>
                {badge(h)}
              </button>
              {open === h.id && (
                <div className="border-t border-white/10 p-5">
                  {canManage ? <TeacherView hw={h} onChanged={() => setReload((n) => n + 1)} /> : <StudentView hw={h} onChanged={() => setReload((n) => n + 1)} />}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <form onSubmit={create} className="card grid gap-3">
          <h3 className="text-lg font-extrabold">Yangi vazifa</h3>
          <div>
            <label htmlFor="h-title" className="label">Sarlavha</label>
            <input id="h-title" name="title" required minLength={2} maxLength={120} className="input" />
          </div>
          <div>
            <label htmlFor="h-desc" className="label">Topshiriq matni</label>
            <textarea id="h-desc" name="description" required rows={4} maxLength={3000} className="input" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="h-due" className="label">Muddat (ixtiyoriy)</label>
              <input id="h-due" name="dueAt" type="date" className="input" />
            </div>
            <div>
              <label htmlFor="h-max" className="label">Maksimal ball</label>
              <input id="h-max" name="maxScore" type="number" min={1} max={1000} defaultValue={100} className="input" />
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn btn-primary justify-self-start">{busy ? "Saqlanmoqda..." : "Vazifa berish"}</button>
        </form>
      )}
    </div>
  );
}

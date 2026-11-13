"use client";

// Foydalanuvchilarning murojaatlari: ko'rish, javob berish, holatni belgilash.

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useHydrated } from "@/lib/hydrated";
import { FRESH_EVENT } from "@/lib/notify";
import { errorText } from "../groups/shared";
import { formatDate, formatDateTime } from "@/lib/datetime";

interface Person { id: string; firstName: string; lastName: string; role: string; phone?: string | null }
interface Row {
  id: string; topic: string; subject: string; status: string; createdAt: string;
  user: Person; _count: { replies: number };
}
interface Reply { id: string; body: string; createdAt: string; author: Person }
interface Detail extends Row { body: string; replies: Reply[] }

const TOPIC: Record<string, string> = {
  PROFILE: "Profil", LESSON: "Dars", PAYMENT: "To'lov", TECHNICAL: "Texnik", OTHER: "Boshqa",
};
const STATUS: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "Yangi", cls: "badge badge-warn" },
  ANSWERED: { label: "Javob berildi", cls: "badge" },
  RESOLVED: { label: "Hal qilindi", cls: "badge badge-ok" },
  CLOSED: { label: "Yopilgan", cls: "badge" },
};

export function SupportTab({ onError, focusId }: { onError: (m: string) => void; focusId?: string }) {
  const hydrated = useHydrated();
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState<Detail | null>(null);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const qs = filter ? `?status=${filter}` : "";
      setRows(await api<Row[]>(`/support/manage${qs}`));
    } catch (e) {
      onError(errorText(e));
    }
  }, [filter, onError]);

  useEffect(() => { void load(); }, [load]);

  const show = useCallback(async (id: string) => {
    onError("");
    try {
      setOpen(await api<Detail>(`/support/${id}`));
      // Telefonda ro'yxat uzun: ochilgan murojaatga aylantiramiz
      requestAnimationFrame(() => document.getElementById("support-thread")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      onError(errorText(e));
    }
  }, [onError]);

  // Bildirishnomadan kelgan bo'lsa (?id=...) — o'sha murojaat darhol ochiladi
  useEffect(() => {
    if (focusId) void show(focusId);
  }, [focusId, show]);

  // Yangi murojaat kelsa — ro'yxat o'zi yangilanadi
  useEffect(() => {
    const onFresh = (e: Event) => {
      const fresh = (e as CustomEvent<{ type: string }[]>).detail ?? [];
      if (fresh.some((n) => n.type === "SUPPORT")) void load();
    };
    window.addEventListener(FRESH_EVENT, onFresh);
    return () => window.removeEventListener(FRESH_EVENT, onFresh);
  }, [load]);

  async function reply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!open) return;
    const form = e.currentTarget;
    const body = String(new FormData(form).get("body") ?? "").trim();
    if (!body) return;
    setBusy(true); onError("");
    try {
      await api(`/support/${open.id}/replies`, { method: "POST", body: { body } });
      form.reset();
      await show(open.id);
      await load();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: string) {
    if (!open) return;
    onError("");
    try {
      await api(`/support/${open.id}/status`, { method: "PATCH", body: { status } });
      await show(open.id);
      await load();
    } catch (e) {
      onError(errorText(e));
    }
  }

  return (
    <div className="grid gap-6">
      <div className="segment" role="tablist" aria-label="Holat bo'yicha">
        {[
          { v: "", l: "Hammasi" },
          { v: "OPEN", l: "Yangi" },
          { v: "ANSWERED", l: "Javob berilgan" },
          { v: "RESOLVED", l: "Hal qilingan" },
          { v: "CLOSED", l: "Yopilgan" },
        ].map((f) => (
          <button key={f.v} type="button" role="tab" aria-selected={filter === f.v} onClick={() => setFilter(f.v)}>
            {f.l}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-muted">Murojaat yo&apos;q.</p>
      ) : (
        <ul className="grid gap-2">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => void show(r.id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 rounded-[var(--r-tile)] border border-cobalt/20 px-4 py-3 text-left hover:border-cobalt/50"
              >
                <span className="min-w-0">
                  <span className="block font-medium">{r.subject}</span>
                  <span className="text-sm text-muted">
                    {r.user.firstName} {r.user.lastName}
                    {r.user.phone && ` · ${r.user.phone}`} · {TOPIC[r.topic] ?? r.topic} ·{" "}
                    {formatDate(r.createdAt, "uz")}
                  </span>
                </span>
                <span className={STATUS[r.status]?.cls ?? "badge"}>{STATUS[r.status]?.label ?? r.status}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <section id="support-thread" aria-labelledby="sup-open" className="border border-cobalt/25 bg-cobalt/[0.04] p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="sup-open" className="text-[1.3rem]">{open.subject}</h2>
            <button type="button" className="btn btn-quiet" onClick={() => setOpen(null)}>Yopish</button>
          </div>

          <article className="mb-4 rounded-[var(--r-tile)] border border-cobalt/20 p-4">
            <p className="mb-1 text-sm text-muted">
              {open.user.firstName} {open.user.lastName} · {formatDateTime(open.createdAt, "uz")}
            </p>
            <p className="whitespace-pre-line">{open.body}</p>
          </article>

          {open.replies.map((r) => (
            <article key={r.id} className="mb-3 rounded-[var(--r-tile)] border border-cobalt/20 p-4">
              <p className="mb-1 text-sm text-muted">
                {r.author.firstName} {r.author.lastName} · {formatDateTime(r.createdAt, "uz")}
              </p>
              <p className="whitespace-pre-line">{r.body}</p>
            </article>
          ))}

          <form onSubmit={reply} method="post" className="mt-4 grid gap-3">
            <label htmlFor="sup-reply" className="label">Javob</label>
            <textarea id="sup-reply" name="body" required maxLength={2000} rows={3} className="input resize-y" />
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={busy || !hydrated} className="btn btn-primary">Javob yuborish</button>
              <button type="button" className="btn btn-outline" onClick={() => void setStatus("RESOLVED")}>
                Hal qilindi
              </button>
              <button type="button" className="btn btn-quiet" onClick={() => void setStatus("CLOSED")}>
                Yopish
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

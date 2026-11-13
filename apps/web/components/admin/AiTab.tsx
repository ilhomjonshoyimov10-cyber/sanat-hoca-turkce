"use client";

// AI suhbatlar: kim nima so'radi, AI nima javob berdi, qaysi so'rov xato berdi.
// Har bir savol AI javob bermasa ham saqlanadi (xato sababi bilan).

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/datetime";
import { errorText } from "../groups/shared";

interface Stats {
  enabled: boolean; provider: string; model: string; fallbackModels: string[];
  conversations: number; questions: number;
  today: { answered: number; users: number; failed: number };
  health: { lastOkAt: string | null; lastErrorAt: string | null; lastError: string | null };
}
interface Row {
  id: string; title: string; task: string; updatedAt: string; messages: number;
  user: { id: string; name: string; role: string };
  last: { role: string; content: string; error: string | null; createdAt: string } | null;
}
interface Page { total: number; page: number; pages: number; items: Row[] }
interface Msg { id: string; role: "USER" | "ASSISTANT"; content: string; error: string | null; model: string | null; createdAt: string }
interface Thread { id: string; title: string; task: string; user: { id: string; name: string; role: string }; messages: Msg[] }

const TASK: Record<string, string> = { CHAT: "Suhbat", GRAMMAR: "Grammatika", EXPLAIN: "Tushuntirish", EXERCISE: "Mashq" };
const ROLE: Record<string, string> = { STUDENT: "O'quvchi", TEACHER: "Ustoz", ADMIN: "Admin", PARENT: "Ota-ona" };

export function AiTab({ onError }: { onError: (m: string) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [data, setData] = useState<Page | null>(null);
  const [q, setQ] = useState("");
  const [failed, setFailed] = useState(false);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<Thread | null>(null);

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ page: String(page) });
      if (q) qs.set("q", q);
      if (failed) qs.set("failed", "1");
      const [s, d] = await Promise.all([
        api<Stats>("/ai/admin/stats"),
        api<Page>(`/ai/admin/conversations?${qs}`),
      ]);
      setStats(s);
      setData(d);
    } catch (e) {
      onError(errorText(e));
    }
  }, [q, failed, page, onError]);

  useEffect(() => { void load(); }, [load]);
  // Yangi savollar ko'rinib tursin: har daqiqada yangilanadi
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) void load(); }, 60_000);
    return () => clearInterval(t);
  }, [load]);

  async function show(id: string) {
    onError("");
    try {
      setOpen(await api<Thread>(`/ai/admin/conversations/${id}`));
      requestAnimationFrame(() => document.getElementById("ai-thread")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      onError(errorText(e));
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Bu suhbat butunlay o'chiriladi. Davom etasizmi?")) return;
    try {
      await api(`/ai/admin/conversations/${id}`, { method: "DELETE" });
      if (open?.id === id) setOpen(null);
      await load();
    } catch (e) {
      onError(errorText(e));
    }
  }

  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPage(0);
    setQ(String(new FormData(e.currentTarget).get("q") ?? "").trim());
  }

  const healthy = stats?.health.lastOkAt && (!stats.health.lastErrorAt || stats.health.lastOkAt > stats.health.lastErrorAt);

  return (
    <div className="grid gap-6">
      {stats && (
        <section aria-label="AI holati" className="grid gap-px overflow-hidden border border-cobalt/25 bg-cobalt/25 sm:grid-cols-4">
          <div className="bg-ink p-5">
            <p className="t-meta">Holat</p>
            <p className={`mt-1 font-semibold ${!stats.enabled ? "text-danger" : healthy || !stats.health.lastErrorAt ? "text-turquoise" : "text-brass"}`}>
              {!stats.enabled ? "O'chiq (kalit yo'q)" : healthy || !stats.health.lastErrorAt ? "Ishlayapti" : "Oxirgi so'rov xato"}
            </p>
            <p className="mt-1 text-[0.8125rem] text-muted">{stats.model}{stats.fallbackModels.length > 0 && ` → ${stats.fallbackModels.join(", ")}`}</p>
          </div>
          <div className="bg-ink p-5">
            <p className="t-meta">Bugun javob berildi</p>
            <p className="t-num mt-1 text-[1.8rem] leading-none">{stats.today.answered}</p>
            <p className="mt-1 text-[0.8125rem] text-muted">{stats.today.users} ta foydalanuvchi</p>
          </div>
          <div className="bg-ink p-5">
            <p className="t-meta">Bugun xato</p>
            <p className={`t-num mt-1 text-[1.8rem] leading-none ${stats.today.failed ? "text-danger" : ""}`}>{stats.today.failed}</p>
            {stats.health.lastError && <p className="mt-1 line-clamp-2 text-[0.8125rem] text-muted" title={stats.health.lastError}>{stats.health.lastError}</p>}
          </div>
          <div className="bg-ink p-5">
            <p className="t-meta">Jami</p>
            <p className="t-num mt-1 text-[1.8rem] leading-none">{stats.questions}</p>
            <p className="mt-1 text-[0.8125rem] text-muted">savol · {stats.conversations} suhbat</p>
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <form onSubmit={search} className="flex min-w-[16rem] flex-1 gap-2">
          <label htmlFor="ai-q" className="sr-only">Qidirish</label>
          <input id="ai-q" name="q" defaultValue={q} maxLength={80} className="input" placeholder="Ism yoki savol matni bo'yicha qidirish" />
          <button type="submit" className="btn btn-outline">Qidirish</button>
        </form>
        <label className="flex items-center gap-2 text-[0.9375rem]">
          <input type="checkbox" checked={failed} onChange={(e) => { setPage(0); setFailed(e.target.checked); }} className="size-4" />
          Faqat xato berganlar
        </label>
      </div>

      {!data ? (
        <div className="skeleton h-40" />
      ) : data.items.length === 0 ? (
        <p className="text-muted">Suhbat topilmadi.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Foydalanuvchi</th><th>Mavzu</th><th>Oxirgi xabar</th><th>Vaqt</th><th /></tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="font-medium">{r.user.name}</span>
                      <span className="block text-[0.8125rem] text-muted">{ROLE[r.user.role] ?? r.user.role}</span>
                    </td>
                    <td>
                      <span className="badge mr-1">{TASK[r.task] ?? r.task}</span>
                      <span className="text-[0.875rem]">{r.title}</span>
                      <span className="block text-[0.8125rem] text-muted">{r.messages} xabar</span>
                    </td>
                    <td className="max-w-[20rem]">
                      {r.last?.error ? (
                        <span className="badge badge-bad">Javob bermadi</span>
                      ) : (
                        <span className="line-clamp-2 text-[0.875rem] text-muted">{r.last?.content}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-[0.875rem] text-muted">{formatDateTime(r.updatedAt, "uz", { weekday: false })}</td>
                    <td className="whitespace-nowrap">
                      <button type="button" className="btn btn-quiet btn-sm" onClick={() => void show(r.id)}>Ochish</button>
                      <button type="button" className="btn btn-quiet btn-sm" onClick={() => void remove(r.id)}>O&apos;chirish</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.pages > 1 && (
            <div className="flex items-center gap-3">
              <button type="button" className="btn btn-outline btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Oldingi</button>
              <span className="text-[0.875rem] text-muted">{page + 1} / {data.pages} · jami {data.total}</span>
              <button type="button" className="btn btn-outline btn-sm" disabled={page + 1 >= data.pages} onClick={() => setPage((p) => p + 1)}>Keyingi</button>
            </div>
          )}
        </>
      )}

      {open && (
        <section id="ai-thread" aria-labelledby="ai-thread-h" className="border border-cobalt/25 bg-cobalt/[0.04] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="ai-thread-h" className="text-[1.25rem]">
              {open.user.name}: {open.title}
            </h2>
            <button type="button" className="btn btn-quiet" onClick={() => setOpen(null)}>Yopish</button>
          </div>
          <div className="grid gap-2">
            {open.messages.map((m) => (
              <article
                key={m.id}
                className={`bubble ${m.role === "USER" ? "" : "bubble-mine"} ${m.error ? "!border-danger/50" : ""}`}
              >
                <p className="mb-1 text-[0.75rem] text-muted">
                  {m.role === "USER" ? open.user.name : `AI${m.model ? ` · ${m.model}` : ""}`} · {formatDateTime(m.createdAt, "uz", { weekday: false })}
                </p>
                {m.error ? (
                  <p className="text-danger">Javob kelmadi: {m.error}</p>
                ) : (
                  <p className="whitespace-pre-line">{m.content}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

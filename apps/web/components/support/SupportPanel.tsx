"use client";

// Foydalanuvchining adminga murojaatlari.
//
// Nega alohida oqim kerak: profildagi ba'zi maydonlarni foydalanuvchi
// o'zi o'zgartira olmaydi (daraja, guruh, ism rasmiy hujjatlarda) —
// aks holda davomat va reyting yozuvlari buziladi. Shuning uchun
// o'zgartirishni ODAM tasdiqlaydi.

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useHydrated } from "@/lib/hydrated";
import { errorText } from "../groups/shared";

const TOPICS = [
  { value: "PROFILE", label: "Profil ma'lumotlarim" },
  { value: "LESSON", label: "Dars, guruh, jadval" },
  { value: "PAYMENT", label: "To'lov" },
  { value: "TECHNICAL", label: "Sayt ishlamayapti" },
  { value: "OTHER", label: "Boshqa" },
] as const;

const STATUS: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "Ko'rib chiqilmoqda", cls: "badge" },
  ANSWERED: { label: "Javob berildi", cls: "badge badge-ok" },
  RESOLVED: { label: "Hal qilindi", cls: "badge badge-ok" },
  CLOSED: { label: "Yopilgan", cls: "badge badge-warn" },
};

interface Row {
  id: string; topic: string; subject: string; status: string;
  createdAt: string; _count: { replies: number };
}
interface Person { id: string; firstName: string; lastName: string; role: string }
interface Reply { id: string; body: string; createdAt: string; author: Person }
interface Detail {
  id: string; topic: string; subject: string; body: string; status: string;
  createdAt: string; user: Person; replies: Reply[];
}

export function SupportPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hydrated = useHydrated();
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const list = await api<Row[]>("/support").catch(() => [] as Row[]);
    setRows(list);
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) void reload();
  }, [user, reload]);

  if (loading || !user) return <p className="text-muted" role="status">Yuklanmoqda...</p>;

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true); setError(""); setNote("");
    try {
      await api("/support", {
        method: "POST",
        body: {
          topic: String(f.get("topic")),
          subject: String(f.get("subject")),
          body: String(f.get("body")),
        },
      });
      form.reset();
      setNote("Murojaat yuborildi. Javob kelganda bildirishnoma olasiz.");
      await reload();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function show(id: string) {
    setError("");
    try {
      setOpen(await api<Detail>(`/support/${id}`));
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function reply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!open) return;
    const form = e.currentTarget;
    const body = String(new FormData(form).get("reply") ?? "").trim();
    if (!body) return;
    setBusy(true); setError("");
    try {
      await api(`/support/${open.id}/replies`, { method: "POST", body: { body } });
      form.reset();
      await show(open.id);
      await reload();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8">
      <header className="border-b border-cobalt/25 pb-6">
        <h1 className="text-[clamp(1.9rem,4vw,2.6rem)]">Administratorga murojaat</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Ma&apos;lumotlaringizni o&apos;zgartirish, dars yoki to&apos;lov bo&apos;yicha savol —
          shu yerga yozing. Javob bildirishnoma orqali keladi.
        </p>
      </header>

      {error && <p className="alert-error" role="alert">{error}</p>}
      {note && <p className="alert-success" role="status">{note}</p>}

      <section aria-labelledby="new-h" className="border border-cobalt/25 bg-cobalt/[0.04] p-6">
        <h2 id="new-h" className="mb-5 text-[1.3rem]">Yangi murojaat</h2>
        <form onSubmit={send} method="post" className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="s-topic" className="label">Mavzu</label>
              <select id="s-topic" name="topic" defaultValue="PROFILE" className="input">
                {TOPICS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="s-subject" className="label">Qisqacha sarlavha</label>
              <input id="s-subject" name="subject" required minLength={3} maxLength={120} className="input"
                placeholder="Masalan: familiyam xato yozilgan" />
            </div>
          </div>
          <div>
            <label htmlFor="s-body" className="label">Batafsil</label>
            <textarea id="s-body" name="body" required minLength={5} maxLength={2000} rows={4} className="input resize-y" />
          </div>
          <div>
            <button type="submit" disabled={busy || !hydrated} className="btn btn-primary">Yuborish</button>
          </div>
        </form>
      </section>

      <section aria-labelledby="list-h">
        <h2 id="list-h" className="mb-4 text-[1.3rem]">Murojaatlarim</h2>
        {rows.length === 0 ? (
          <p className="text-muted">Hali murojaat yo&apos;q.</p>
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
                      {new Date(r.createdAt).toLocaleDateString("uz-UZ")}
                      {r._count.replies > 0 && ` · ${r._count.replies} javob`}
                    </span>
                  </span>
                  <span className={STATUS[r.status]?.cls ?? "badge"}>
                    {STATUS[r.status]?.label ?? r.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {open && (
        <section aria-labelledby="open-h" className="border border-cobalt/25 bg-cobalt/[0.04] p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="open-h" className="text-[1.3rem]">{open.subject}</h2>
            <button type="button" className="btn btn-quiet" onClick={() => setOpen(null)}>Yopish</button>
          </div>

          <article className="mb-4 rounded-[var(--r-tile)] border border-cobalt/20 p-4">
            <p className="mb-1 text-sm text-muted">
              Siz · {new Date(open.createdAt).toLocaleString("uz-UZ")}
            </p>
            <p className="whitespace-pre-line">{open.body}</p>
          </article>

          {open.replies.map((r) => {
            const mine = r.author.id === user.id;
            return (
              <article
                key={r.id}
                className={`mb-3 rounded-[var(--r-tile)] border p-4 ${
                  mine ? "border-cobalt/20" : "border-turquoise/35 bg-turquoise/[0.06]"
                }`}
              >
                <p className="mb-1 text-sm text-muted">
                  {mine ? "Siz" : `${r.author.firstName} ${r.author.lastName}`} ·{" "}
                  {new Date(r.createdAt).toLocaleString("uz-UZ")}
                </p>
                <p className="whitespace-pre-line">{r.body}</p>
              </article>
            );
          })}

          {open.status === "CLOSED" ? (
            <p className="help">Bu murojaat yopilgan. Yangi savol bo&apos;lsa, yangi murojaat qoldiring.</p>
          ) : (
            <form onSubmit={reply} method="post" className="mt-4 grid gap-3">
              <label htmlFor="r-body" className="label">Javob yozish</label>
              <textarea id="r-body" name="reply" required maxLength={2000} rows={3} className="input resize-y" />
              <div>
                <button type="submit" disabled={busy || !hydrated} className="btn btn-primary">Yuborish</button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}

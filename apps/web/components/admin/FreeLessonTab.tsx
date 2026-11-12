"use client";

// Bepul dars: video kutubxonasi, arizalar, biriktirish va yozishma.

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useHydrated } from "@/lib/hydrated";
import { errorText } from "../groups/shared";

interface Video {
  id: string; title: string; description: string | null; url: string;
  level: string | null; position: number; isActive: boolean;
  _count?: { assignments: number };
}
interface Person { id: string; firstName: string; lastName: string; role?: string }
interface LeadRow {
  id: string; name: string; phone: string; level: string | null; message: string | null;
  status: string; createdAt: string; userId: string | null; user: Person | null;
  videos: { videoId: string; watchedAt: string | null; video: { id: string; title: string } }[];
  _count: { messages: number };
}
interface Msg { id: string; body: string; createdAt: string; sender: Person }

const LEAD_STATUS: Record<string, { label: string; cls: string }> = {
  NEW: { label: "Yangi", cls: "badge badge-warn" },
  CONTACTED: { label: "Bog'lanildi", cls: "badge" },
  ENROLLED: { label: "Qabul qilindi", cls: "badge badge-ok" },
  REJECTED: { label: "Rad etildi", cls: "badge badge-bad" },
};

export function FreeLessonTab({ onError, isAdmin }: { onError: (m: string) => void; isAdmin: boolean }) {
  const hydrated = useHydrated();
  const [videos, setVideos] = useState<Video[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [open, setOpen] = useState<{ lead: LeadRow; messages: Msg[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const [v, l] = await Promise.all([
        api<Video[]>("/free-lesson/videos"),
        api<LeadRow[]>("/free-lesson/leads"),
      ]);
      setVideos(v);
      setLeads(l);
    } catch (e) {
      onError(errorText(e));
    }
  }, [onError]);

  useEffect(() => { void load(); }, [load]);

  async function addVideo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true); onError(""); setNote("");
    try {
      await api("/free-lesson/videos", {
        method: "POST",
        body: {
          title: String(f.get("title")),
          url: String(f.get("url")),
          description: String(f.get("description") ?? "").trim() || undefined,
          position: Number(f.get("position") || 0),
        },
      });
      form.reset();
      setNote("Video qo'shildi");
      await load();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function assign(leadId: string, videoId: string) {
    if (!videoId) return;
    onError("");
    try {
      await api(`/free-lesson/leads/${leadId}/videos`, { method: "POST", body: { videoId } });
      await load();
      if (open?.lead.id === leadId) await openThread(leadId);
    } catch (e) {
      onError(errorText(e));
    }
  }

  async function setStatus(leadId: string, status: string) {
    onError("");
    try {
      await api(`/free-lesson/leads/${leadId}/status`, { method: "PATCH", body: { status } });
      await load();
    } catch (e) {
      onError(errorText(e));
    }
  }

  const openThread = useCallback(async (leadId: string) => {
    onError("");
    try {
      setOpen(await api<{ lead: LeadRow; messages: Msg[] }>(`/free-lesson/leads/${leadId}`));
    } catch (e) {
      onError(errorText(e));
    }
  }, [onError]);

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!open) return;
    const form = e.currentTarget;
    const body = String(new FormData(form).get("body") ?? "").trim();
    if (!body) return;
    setBusy(true); onError("");
    try {
      await api(`/free-lesson/leads/${open.lead.id}/messages`, { method: "POST", body: { body } });
      form.reset();
      await openThread(open.lead.id);
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8">
      {note && <p className="alert-success" role="status">{note}</p>}

      {isAdmin && (
        <section aria-labelledby="v-h" className="border border-cobalt/25 bg-cobalt/[0.04] p-6">
          <h2 id="v-h" className="mb-1 text-[1.3rem]">Bepul dars videolari</h2>
          <p className="mb-5 text-muted">
            Video havolasi saqlanadi (YouTube, Telegram va h.k.) — fayl serverda turmaydi.
          </p>

          <form onSubmit={addVideo} method="post" className="mb-6 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
              <div>
                <label htmlFor="v-title" className="label">Nomi</label>
                <input id="v-title" name="title" required maxLength={120} className="input" placeholder="1-dars: Tanishuv" />
              </div>
              <div>
                <label htmlFor="v-pos" className="label">Tartib</label>
                <input id="v-pos" name="position" type="number" min={0} max={999} defaultValue={0} className="input" />
              </div>
            </div>
            <div>
              <label htmlFor="v-url" className="label">Havola</label>
              <input id="v-url" name="url" required maxLength={500} className="input" placeholder="https://..." />
              <p className="help">Faqat https havola qabul qilinadi.</p>
            </div>
            <div>
              <label htmlFor="v-desc" className="label">Izoh (ixtiyoriy)</label>
              <textarea id="v-desc" name="description" maxLength={1000} rows={2} className="input resize-y" />
            </div>
            <div>
              <button type="submit" disabled={busy || !hydrated} className="btn btn-primary">Qo&apos;shish</button>
            </div>
          </form>

          {videos.length > 0 && (
            <ul className="grid gap-2">
              {videos.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--r-tile)] border border-cobalt/20 px-4 py-3">
                  <span>
                    <strong>{v.title}</strong>
                    <span className="ml-2 text-sm text-muted">{v._count?.assignments ?? 0} ta arizachiga berilgan</span>
                  </span>
                  <span className={v.isActive ? "badge badge-ok" : "badge badge-warn"}>
                    {v.isActive ? "Faol" : "O'chirilgan"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="l-h">
        <h2 id="l-h" className="mb-4 text-[1.3rem]">Bepul darsga arizalar</h2>
        {leads.length === 0 ? (
          <p className="text-muted">Ariza yo&apos;q.</p>
        ) : (
          <ul className="grid gap-3">
            {leads.map((l) => (
              <li key={l.id} className="rounded-[var(--r-tile)] border border-cobalt/20 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={LEAD_STATUS[l.status]?.cls ?? "badge"}>
                    {LEAD_STATUS[l.status]?.label ?? l.status}
                  </span>
                  <strong>{l.name}</strong>
                  <a href={`tel:${l.phone}`} className="text-muted underline">{l.phone}</a>
                  {l.level && <span className="badge">{l.level}</span>}
                  {l.userId ? (
                    <span className="badge badge-ok">Hisobga bog&apos;langan</span>
                  ) : (
                    <span className="badge badge-warn">Hisobsiz</span>
                  )}
                </div>

                {l.message && <p className="mb-3 text-muted">{l.message}</p>}

                {l.videos.length > 0 && (
                  <p className="mb-3 text-sm">
                    Berilgan videolar:{" "}
                    {l.videos.map((v) => (
                      <span key={v.videoId} className="badge mr-1">
                        {v.video.title}
                        {v.watchedAt ? " ✓" : ""}
                      </span>
                    ))}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label={`${l.name} uchun video biriktirish`}
                    defaultValue=""
                    className="input max-w-xs"
                    onChange={(e) => { void assign(l.id, e.target.value); e.target.value = ""; }}
                  >
                    <option value="">Video biriktirish...</option>
                    {videos
                      .filter((v) => v.isActive && !l.videos.some((x) => x.videoId === v.id))
                      .map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
                  </select>

                  <select
                    aria-label={`${l.name} arizasining holati`}
                    value={l.status}
                    className="input max-w-[12rem]"
                    onChange={(e) => void setStatus(l.id, e.target.value)}
                  >
                    {Object.entries(LEAD_STATUS).map(([v, s]) => (
                      <option key={v} value={v}>{s.label}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={!l.userId}
                    title={l.userId ? undefined : "Arizachi hali ro'yxatdan o'tmagan"}
                    onClick={() => void openThread(l.id)}
                  >
                    Yozishma{l._count.messages > 0 && ` (${l._count.messages})`}
                  </button>
                </div>

                {!l.userId && (
                  <p className="help">
                    Yozishish uchun arizachi shu telefon raqami bilan ro&apos;yxatdan o&apos;tishi kerak —
                    shunda ariza hisobga avtomatik bog&apos;lanadi.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {open && (
        <section aria-labelledby="th-h" className="border border-cobalt/25 bg-cobalt/[0.04] p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="th-h" className="text-[1.3rem]">{open.lead.name} bilan yozishma</h2>
            <button type="button" className="btn btn-quiet" onClick={() => setOpen(null)}>Yopish</button>
          </div>

          {open.messages.length === 0 ? (
            <p className="mb-4 text-muted">Hali xabar yo&apos;q. Birinchi bo&apos;lib yozing.</p>
          ) : (
            <div className="mb-4 grid gap-2">
              {open.messages.map((m) => {
                const staff = m.sender.role === "ADMIN" || m.sender.role === "TEACHER";
                return (
                  <article
                    key={m.id}
                    className={`rounded-[var(--r-tile)] border p-3 ${
                      staff ? "border-turquoise/35 bg-turquoise/[0.06]" : "border-cobalt/20"
                    }`}
                  >
                    <p className="mb-1 text-sm text-muted">
                      {m.sender.firstName} {m.sender.lastName} · {new Date(m.createdAt).toLocaleString("uz-UZ")}
                    </p>
                    <p className="whitespace-pre-line">{m.body}</p>
                  </article>
                );
              })}
            </div>
          )}

          <form onSubmit={send} method="post" className="grid gap-3">
            <label htmlFor="th-body" className="label">Xabar</label>
            <textarea id="th-body" name="body" required maxLength={2000} rows={3} className="input resize-y" />
            <div>
              <button type="submit" disabled={busy || !hydrated} className="btn btn-primary">Yuborish</button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

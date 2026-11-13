"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { formatDateTime, localInputValue } from "@/lib/datetime";
import { useI18n } from "@/lib/i18n/client";
import { errorText } from "./shared";

interface Lesson {
  id: string;
  title: string;
  startsAt: string;
  durationMin: number;
  status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
  attendeeCount: number;
  joinable: boolean;
}
interface JoinInfo { url: string; title: string; isModerator: boolean; durationMin: number }

const STATUS_LABEL: Record<Lesson["status"], string> = {
  SCHEDULED: "Rejalashtirilgan",
  LIVE: "Jonli",
  ENDED: "Tugagan",
  CANCELLED: "Bekor qilingan",
};


export function LessonsSection({ groupId, canManage }: { groupId: string; canManage: boolean }) {
  const { locale } = useI18n();
  const fmt = (iso: string) => formatDateTime(iso, locale);
  const [items, setItems] = useState<Lesson[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<(JoinInfo & { opened: boolean }) | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await api<Lesson[]>(`/groups/${groupId}/lessons`));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { void load(); }, [load]);

  // Dars boshlanish vaqti kelganda tugma o'zi yonishi uchun har daqiqada yangilaymiz
  useEffect(() => {
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setCreating(true);
    setError("");
    try {
      await api(`/groups/${groupId}/lessons`, {
        method: "POST",
        body: {
          title: String(form.get("title") ?? ""),
          // datetime-local mahalliy vaqt beradi — ISO (UTC) ga aylantiramiz
          startsAt: new Date(String(form.get("startsAt"))).toISOString(),
          durationMin: Number(form.get("durationMin")) || 60,
        },
      });
      (e.target as HTMLFormElement).reset();
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setCreating(false);
    }
  }

  async function join(id: string) {
    setError("");
    // Yangi oyna DARHOL ochiladi (aks holda brauzer bloklaydi), manzil keyin
    let win: Window | null = null;
    try { win = window.open("about:blank", "_blank"); } catch { win = null; }
    try {
      const info = await api<JoinInfo>(`/lessons/${id}/join`, { method: "POST" });
      let opened = false;
      if (win && !win.closed) {
        win.opener = null;
        win.location.href = info.url;
        opened = true;
      }
      setRoom({ ...info, opened });
      void load();
    } catch (e) {
      win?.close();
      setError(errorText(e));
    }
  }

  async function cancel(id: string) {
    await api(`/lessons/${id}`, { method: "DELETE" }).catch((e) => setError(errorText(e)));
    await load();
  }

  return (
    <section aria-labelledby="lessons-h" className="border border-cobalt/25 bg-cobalt/[0.04]">
      <h2 id="lessons-h" className="border-b border-cobalt/25 px-5 py-4 font-display text-[1.25rem] font-semibold">
        Video darslar
      </h2>

      <div className="p-5">
        {error && <p className="alert-error mb-4" role="alert">{error}</p>}
        {room && (
          <div className="alert-success mb-4 grid gap-2" role="status">
            <p>{room.opened ? "Dars yangi oynada ochildi" : "Dars tayyor"}: {room.title}</p>
            <p className="flex flex-wrap gap-2">
              <a href={room.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                {room.opened ? "Oynani qayta ochish" : "Darsni ochish"}
              </a>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => setRoom(null)}>Yopish</button>
            </p>
            {room.isModerator && (
              <p className="text-[0.875rem] text-muted">
                Birinchi kirganingizda meet.jit.si Google/GitHub orqali kirishni so&apos;raydi — bu sizni moderator qiladi.
                Guruh a&apos;zolariga &quot;Dars boshlandi&quot; xabari ketdi.
              </p>
            )}
          </div>
        )}
        {loading && <div className="skeleton h-20" />}
        {!loading && items.length === 0 && (
          <p className="text-[0.9375rem] text-muted">Hozircha rejalashtirilgan dars yo&apos;q.</p>
        )}

        <ul className="grid gap-3">
          {items.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-cobalt/25 bg-ink p-4">
              <div className="min-w-[12rem] flex-1">
                <p className="font-medium">{l.title}</p>
                <p className="text-[0.875rem] text-muted">
                  {fmt(l.startsAt)} &middot; {l.durationMin} daqiqa &middot; {l.attendeeCount} ishtirokchi
                </p>
              </div>
              <span className={`badge ${l.status === "LIVE" ? "badge-ok" : l.status === "CANCELLED" ? "badge-bad" : ""}`}>
                {STATUS_LABEL[l.status]}
              </span>
              {l.joinable || (canManage && l.status === "SCHEDULED") ? (
                <button type="button" onClick={() => join(l.id)} className="btn btn-primary">
                  {canManage && l.status === "SCHEDULED" ? "Darsni boshlash" : "Darsga kirish"}
                </button>
              ) : (
                <span className="text-[0.875rem] text-muted">
                  {l.status === "SCHEDULED" ? "Boshlanishiga 15 daqiqa qolganda ochiladi" : ""}
                </span>
              )}
              {canManage && l.status !== "CANCELLED" && l.status !== "ENDED" && (
                <button type="button" onClick={() => cancel(l.id)} className="btn btn-quiet">Bekor qilish</button>
              )}
            </li>
          ))}
        </ul>

        {canManage && (
          <form onSubmit={create} method="post" className="mt-6 grid gap-3 border-t border-cobalt/25 pt-5 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
            <div>
              <label htmlFor="l-title" className="label">Dars nomi</label>
              <input id="l-title" name="title" required minLength={2} maxLength={120} className="input" placeholder="A1 grammatika" />
            </div>
            <div>
              <label htmlFor="l-start" className="label">Boshlanishi</label>
              <input
                id="l-start" name="startsAt" type="datetime-local" required className="input"
                defaultValue={localInputValue(new Date(Date.now() + 60 * 60_000))}
              />
            </div>
            <div>
              <label htmlFor="l-dur" className="label">Daqiqa</label>
              <input id="l-dur" name="durationMin" type="number" min={10} max={300} defaultValue={60} className="input w-24" />
            </div>
            <button type="submit" disabled={creating} className="btn btn-outline">Dars qo&apos;shish</button>
          </form>
        )}
      </div>
    </section>
  );
}

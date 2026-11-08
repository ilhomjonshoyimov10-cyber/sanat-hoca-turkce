"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
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
interface JoinInfo { roomName: string; title: string; isModerator: boolean; durationMin: number }

const STATUS_LABEL: Record<Lesson["status"], string> = {
  SCHEDULED: "Rejalashtirilgan",
  LIVE: "Jonli",
  ENDED: "Tugagan",
  CANCELLED: "Bekor qilingan",
};

/** Jitsi ommaviy serveri. O'z serveringizga ko'chirsangiz shu qatorni almashtiring. */
const JITSI_HOST = "meet.jit.si";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("uz-UZ", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tashkent",
  });

/** Brauzerning mahalliy vaqtini <input type="datetime-local"> formatiga keltiradi. */
function localInputValue(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function LessonsSection({ groupId, canManage }: { groupId: string; canManage: boolean }) {
  const [items, setItems] = useState<Lesson[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<JoinInfo | null>(null);
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
    try {
      setRoom(await api<JoinInfo>(`/lessons/${id}/join`, { method: "POST" }));
    } catch (e) {
      setError(errorText(e));
    }
  }

  async function cancel(id: string) {
    await api(`/lessons/${id}`, { method: "DELETE" }).catch((e) => setError(errorText(e)));
    await load();
  }

  if (room) return <JitsiRoom info={room} onLeave={() => { setRoom(null); void load(); }} />;

  return (
    <section aria-labelledby="lessons-h" className="border border-cobalt/25 bg-cobalt/[0.04]">
      <h2 id="lessons-h" className="border-b border-cobalt/25 px-5 py-4 font-display text-[1.25rem] font-semibold">
        Video darslar
      </h2>

      <div className="p-5">
        {error && <p className="alert-error mb-4" role="alert">{error}</p>}
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
              {l.joinable ? (
                <button type="button" onClick={() => join(l.id)} className="btn btn-primary">Darsga kirish</button>
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

/** Jitsi xonasi iframe ichida. Xona nomi serverdan keladi va taxmin qilib bo'lmaydi. */
function JitsiRoom({ info, onLeave }: { info: JoinInfo; onLeave: () => void }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const url =
    `https://${JITSI_HOST}/${encodeURIComponent(info.roomName)}` +
    `#config.prejoinPageEnabled=true&config.disableDeepLinking=true`;

  return (
    <section aria-labelledby="room-h" className="border border-cobalt/25 bg-cobalt/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cobalt/25 px-5 py-4">
        <h2 id="room-h" className="font-display text-[1.25rem] font-semibold">
          {info.title}
          {info.isModerator && <span className="badge badge-warn ml-3">Siz moderatorsiz</span>}
        </h2>
        <button type="button" onClick={onLeave} className="btn btn-outline">Darsdan chiqish</button>
      </div>
      <iframe
        ref={ref}
        src={url}
        title={`Video dars: ${info.title}`}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="block h-[clamp(20rem,70vh,46rem)] w-full border-0 bg-well"
      />
      <p className="px-5 py-3 text-[0.8125rem] text-muted">
        Video {JITSI_HOST} orqali ishlaydi. Kamera va mikrofonga ruxsat so&apos;raladi.
      </p>
    </section>
  );
}

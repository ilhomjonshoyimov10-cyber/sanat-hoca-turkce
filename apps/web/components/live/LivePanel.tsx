"use client";

// Jonli efir: guruhga bog'liq bo'lmagan ochiq darslar.
//
// Xona nomi ro'yxatda KELMAYDI — faqat "Kirish" bosilganda, vaqti kelganda
// serverdan olinadi. Jitsi'ning ommaviy serverida xona nomini bilgan odam
// kirib oladi, shuning uchun nomni oldindan tarqatmaymiz.

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useHydrated } from "@/lib/hydrated";
import { errorText } from "../groups/shared";

const JITSI_HOST = "meet.jit.si";
const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;

interface Session {
  id: string; title: string; description: string | null;
  startsAt: string; durationMin: number; level: string | null;
  status: string; host: string; attendeeCount: number;
  joinable: boolean; isHost: boolean;
}
interface JoinInfo { roomName: string; title: string; isHost: boolean }

const STATUS: Record<string, { label: string; cls: string }> = {
  SCHEDULED: { label: "Rejalashtirilgan", cls: "badge" },
  LIVE: { label: "Jonli efirda", cls: "badge badge-bad" },
  ENDED: { label: "Tugagan", cls: "badge badge-warn" },
  CANCELLED: { label: "Bekor qilingan", cls: "badge badge-warn" },
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("uz-UZ", {
    weekday: "short", day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tashkent",
  });

export function LivePanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hydrated = useHydrated();
  const [rows, setRows] = useState<Session[]>([]);
  const [room, setRoom] = useState<JoinInfo | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await api<Session[]>("/live"));
    } catch (e) {
      setError(errorText(e));
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  if (loading || !user) return <p className="text-muted" role="status">Yuklanmoqda...</p>;

  const canHost = user.role === "TEACHER" || user.role === "ADMIN";

  async function join(id: string) {
    setError("");
    try {
      setRoom(await api<JoinInfo>(`/live/${id}/join`, { method: "POST" }));
    } catch (e) {
      setError(errorText(e));
    }
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true); setError("");
    try {
      const level = String(f.get("level") ?? "");
      await api("/live", {
        method: "POST",
        body: {
          title: String(f.get("title")),
          description: String(f.get("description") ?? "").trim() || undefined,
          // datetime-local mahalliy vaqt beradi
          startsAt: new Date(String(f.get("startsAt"))).toISOString(),
          durationMin: Number(f.get("durationMin") || 60),
          level: level || undefined,
        },
      });
      form.reset();
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function setLive(id: string, action: "start" | "end") {
    setError("");
    try {
      await api(`/live/${id}/${action}`, { method: "POST" });
      await load();
    } catch (e) {
      setError(errorText(e));
    }
  }

  if (room) {
    const url =
      `https://${JITSI_HOST}/${encodeURIComponent(room.roomName)}` +
      `#config.prejoinPageEnabled=true&config.disableDeepLinking=true`;
    return (
      <section aria-labelledby="room-h" className="border border-cobalt/25 bg-cobalt/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cobalt/25 px-5 py-4">
          <h2 id="room-h" className="font-display text-[1.25rem] font-semibold">
            {room.title}
            {room.isHost && <span className="badge badge-warn ml-3">Siz olib boryapsiz</span>}
          </h2>
          <button type="button" onClick={() => { setRoom(null); void load(); }} className="btn btn-outline">
            Efirdan chiqish
          </button>
        </div>
        <iframe
          src={url}
          title={`Jonli dars: ${room.title}`}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="block h-[clamp(20rem,70vh,46rem)] w-full border-0 bg-well"
        />
        <p className="px-5 py-3 text-[0.8125rem] text-muted">
          Video {JITSI_HOST} orqali ishlaydi. Kamera va mikrofonga ruxsat so&apos;raladi.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-8">
      <header className="border-b border-cobalt/25 pb-6">
        <h1 className="text-[clamp(1.9rem,4vw,2.6rem)]">Jonli darslar</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Ochiq darslar — guruhga bog&apos;liq emas. Vaqti kelganda &quot;Kirish&quot; tugmasi
          faollashadi (15 daqiqa oldin ochiladi).
        </p>
      </header>

      {error && <p className="alert-error" role="alert">{error}</p>}

      {rows.length === 0 ? (
        <p className="text-muted">Hozircha rejalashtirilgan jonli dars yo&apos;q.</p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((s) => (
            <li key={s.id} className="rounded-[var(--r-tile)] border border-cobalt/20 p-5">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className={STATUS[s.status]?.cls ?? "badge"}>{STATUS[s.status]?.label ?? s.status}</span>
                {s.level ? <span className="badge">{s.level}</span> : <span className="badge">Hamma daraja</span>}
                <strong className="text-[1.05rem]">{s.title}</strong>
              </div>
              <p className="text-muted">
                {fmt(s.startsAt)} · {s.durationMin} daqiqa · {s.host}
                {s.attendeeCount > 0 && ` · ${s.attendeeCount} ishtirokchi`}
              </p>
              {s.description && <p className="mt-2 text-muted">{s.description}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!s.joinable && !s.isHost}
                  onClick={() => void join(s.id)}
                >
                  {s.joinable || s.isHost ? "Kirish" : "Hali vaqti bo'lmadi"}
                </button>
                {s.isHost && s.status === "SCHEDULED" && (
                  <button type="button" className="btn btn-outline" onClick={() => void setLive(s.id, "start")}>
                    Efirni boshlash
                  </button>
                )}
                {s.isHost && s.status === "LIVE" && (
                  <button type="button" className="btn btn-quiet" onClick={() => void setLive(s.id, "end")}>
                    Efirni tugatish
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canHost && (
        <section aria-labelledby="new-h" className="border border-cobalt/25 bg-cobalt/[0.04] p-6">
          <h2 id="new-h" className="mb-5 text-[1.3rem]">Yangi jonli dars</h2>
          <form onSubmit={create} method="post" className="grid gap-4">
            <div>
              <label htmlFor="l-title" className="label">Mavzu</label>
              <input id="l-title" name="title" required minLength={3} maxLength={120} className="input" />
            </div>
            <div>
              <label htmlFor="l-desc" className="label">Izoh (ixtiyoriy)</label>
              <textarea id="l-desc" name="description" maxLength={1000} rows={2} className="input resize-y" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="l-when" className="label">Qachon</label>
                <input id="l-when" name="startsAt" type="datetime-local" required className="input" />
              </div>
              <div>
                <label htmlFor="l-dur" className="label">Davomiyligi (daq.)</label>
                <input id="l-dur" name="durationMin" type="number" min={10} max={300} defaultValue={60} className="input" />
              </div>
              <div>
                <label htmlFor="l-level" className="label">Daraja</label>
                <select id="l-level" name="level" defaultValue="" className="input">
                  <option value="">Hamma uchun</option>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <button type="submit" disabled={busy || !hydrated} className="btn btn-primary">
                Rejalashtirish
              </button>
            </div>
            <p className="help">
              Tanlangan darajadagi o&apos;quvchilarga bildirishnoma ketadi.
            </p>
          </form>
        </section>
      )}
    </div>
  );
}

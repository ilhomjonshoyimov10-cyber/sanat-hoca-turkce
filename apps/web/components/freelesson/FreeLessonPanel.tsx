"use client";

// O'quvchining "Bepul dars" sahifasi: arizam qabul qilinganmi, qaysi
// videolar biriktirilgan va ustoz bilan yozishma.

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useHydrated } from "@/lib/hydrated";
import { errorText } from "../groups/shared";
import { PageLoader } from "@/components/Loader";
import { formatDateTime } from "@/lib/datetime";

interface Video {
  id: string; title: string; description: string | null; url: string;
  coverUrl: string | null; level: string | null;
  assignedAt: string; watchedAt: string | null;
}
interface Msg {
  id: string; body: string; createdAt: string;
  sender: { id: string; firstName: string; lastName: string; role: string };
}
interface Data {
  lead: { id: string; status: string; level: string | null; createdAt: string } | null;
  videos: Video[];
  messages: Msg[];
}

const STATUS: Record<string, string> = {
  NEW: "Arizangiz qabul qilindi — ustoz tez orada bog'lanadi",
  CONTACTED: "Ustoz siz bilan bog'landi",
  ENROLLED: "Siz guruhga qabul qilindingiz",
  REJECTED: "Ariza yopildi. Savol bo'lsa, quyida yozing",
};

/** "https://t.me/SanatHoca/41?single" -> "SanatHoca/41" (faqat ochiq kanal postlari). */
function telegramPost(url: string): string | null {
  const m = /^https:\/\/t\.me\/([A-Za-z0-9_]{4,32})\/(\d{1,9})(?:[?#].*)?$/.exec(url);
  return m ? `${m[1]}/${m[2]}` : null;
}

export function FreeLessonPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hydrated = useHydrated();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api<Data>("/free-lesson/me"));
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

  if (loading || !user) return <PageLoader />;

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data?.lead) return;
    const form = e.currentTarget;
    const body = String(new FormData(form).get("body") ?? "").trim();
    if (!body) return;
    setBusy(true); setError("");
    try {
      await api(`/free-lesson/leads/${data.lead.id}/messages`, { method: "POST", body: { body } });
      form.reset();
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function markWatched(videoId: string) {
    await api(`/free-lesson/me/videos/${videoId}/watched`, { method: "POST" }).catch(() => undefined);
    await load();
  }

  return (
    <div className="grid gap-8">
      <header className="border-b border-cobalt/25 pb-6">
        <h1 className="text-[clamp(1.9rem,4vw,2.6rem)]">Bepul dars</h1>
        {data?.lead && <p className="mt-2 text-muted">{STATUS[data.lead.status] ?? ""}</p>}
      </header>

      {error && <p className="alert-error" role="alert">{error}</p>}

      {!data?.lead && (
        <section className="border border-cobalt/25 bg-cobalt/[0.04] p-6">
          <h2 className="mb-2 text-[1.3rem]">Sizda hali ariza yo&apos;q</h2>
          <p className="mb-5 text-muted">
            Bepul darsga yozilish uchun bosh sahifadagi formani to&apos;ldiring. Ariza
            <strong> shu hisobingizdagi telefon raqami</strong> bilan yuborilsa, u avtomatik
            shu yerga bog&apos;lanadi va ustoz bilan shu sahifada yozisha olasiz.
          </p>
          <Link href="/#ariza" className="btn btn-primary">Bepul darsga yozilish</Link>
        </section>
      )}

      {data?.lead && (
        <>
          <section aria-labelledby="v-h">
            <h2 id="v-h" className="mb-4 text-[1.3rem]">Sizga biriktirilgan darslar</h2>
            {data.videos.length === 0 ? (
              <p className="text-muted">
                Hali video biriktirilmagan. Ustoz tayyorlagach, bu yerda ko&apos;rinadi va
                bildirishnoma olasiz.
              </p>
            ) : (
              <ul className="grid gap-3">
                {data.videos.map((v) => (
                  <li key={v.id} className="rounded-[var(--r-tile)] border border-cobalt/20 p-4">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <strong className="text-[1.05rem]">{v.title}</strong>
                      {v.watchedAt && <span className="badge badge-ok">Ko&apos;rilgan</span>}
                      {v.level && <span className="badge">{v.level}</span>}
                    </div>
                    {v.description && <p className="mb-3 text-muted">{v.description}</p>}
                    {telegramPost(v.url) && (
                      // Telegram kanalidagi post sahifa ichida: video shu yerda o'ynaydi
                      <iframe
                        src={`https://t.me/${telegramPost(v.url)}?embed=1&mode=tme&single=1`}
                        title={v.title}
                        loading="lazy"
                        className="mb-3 block h-[min(36rem,80vh)] w-full max-w-xl rounded-[var(--r-tile)] border border-cobalt/25 bg-white"
                      />
                    )}
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => void markWatched(v.id)}
                      className="btn btn-primary"
                    >
                      {telegramPost(v.url) ? "Telegramda ochish" : "Darsni ochish"}
                    </a>
                    {telegramPost(v.url) && !v.watchedAt && (
                      <button type="button" className="btn btn-quiet ml-2" onClick={() => void markWatched(v.id)}>
                        Ko&apos;rdim ✓
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="chat-h" className="border border-cobalt/25 bg-cobalt/[0.04] p-6">
            <h2 id="chat-h" className="mb-4 text-[1.3rem]">Ustoz bilan yozishma</h2>

            {data.messages.length === 0 ? (
              <p className="mb-4 text-muted">
                Savolingiz bormi? Shu yerga yozing — ustoz javob beradi.
              </p>
            ) : (
              <div className="mb-4 grid gap-2">
                {data.messages.map((m) => {
                  const mine = m.sender.id === user.id;
                  return (
                    <article
                      key={m.id}
                      className={`rounded-[var(--r-tile)] border p-3 ${
                        mine ? "border-cobalt/20" : "border-turquoise/35 bg-turquoise/[0.06]"
                      }`}
                    >
                      <p className="mb-1 text-sm text-muted">
                        {mine ? "Siz" : `${m.sender.firstName} ${m.sender.lastName}`} ·{" "}
                        {formatDateTime(m.createdAt, "uz")}
                      </p>
                      <p className="whitespace-pre-line">{m.body}</p>
                    </article>
                  );
                })}
              </div>
            )}

            <form onSubmit={send} method="post" className="grid gap-3">
              <label htmlFor="fl-body" className="label">Xabar</label>
              <textarea id="fl-body" name="body" required maxLength={2000} rows={3} className="input resize-y" />
              <div>
                <button type="submit" disabled={busy || !hydrated} className="btn btn-primary">Yuborish</button>
              </div>
            </form>
          </section>
        </>
      )}
    </div>
  );
}

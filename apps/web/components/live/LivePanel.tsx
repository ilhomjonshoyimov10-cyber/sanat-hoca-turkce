"use client";

// Jonli darslar: hammaga ochiq, darajaga yoki BITTA guruhga.
//
// Muhim qarorlar:
//  • Dars YANGI OYNADA ochiladi, sayt ichida emas. meet.jit.si boshqa saytga
//    joylashtirilgan qo'ng'iroqni 5 daqiqada uzadi va iframe ichida kamera/
//    mikrofon ko'p brauzerda ishlamaydi (oldingi "qora ekran" xatosi shu edi).
//  • Xona havolasi ro'yxatda KELMAYDI — faqat "Kirish" bosilganda, vaqti
//    kelganda (yoki ustoz boshlaganda) serverdan olinadi.
//  • Ustoz xohlasa o'z Zoom / Google Meet / Telegram havolasini qo'yadi.

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDateTime, localInputValue, untilText } from "@/lib/datetime";
import { useHydrated } from "@/lib/hydrated";
import { useI18n } from "@/lib/i18n/client";
import { FRESH_EVENT } from "@/lib/notify";
import { PageLoader } from "@/components/Loader";
import { errorText } from "../groups/shared";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;

interface Session {
  id: string; title: string; description: string | null;
  startsAt: string; durationMin: number; level: string | null;
  group: { id: string; name: string } | null;
  provider: "JITSI" | "EXTERNAL"; maxParticipants: number;
  status: string; host: string; attendeeCount: number;
  joinable: boolean; isHost: boolean;
}
interface JoinInfo { title: string; isHost: boolean; provider: "JITSI" | "EXTERNAL"; url: string }
interface GroupRow { id: string; name: string; level: string }

const STATUS: Record<string, { label: string; cls: string }> = {
  SCHEDULED: { label: "Rejalashtirilgan", cls: "badge" },
  LIVE: { label: "Hozir efirda", cls: "badge badge-bad" },
  ENDED: { label: "Tugagan", cls: "badge badge-warn" },
  CANCELLED: { label: "Bekor qilingan", cls: "badge badge-warn" },
};

/**
 * Yangi oyna "Kirish" bosilgan ZAHOTI ochiladi (server javobidan oldin) —
 * aks holda brauzer uni reklama oynasi deb bloklaydi. Javob kelgach
 * manzil beriladi. Bloklangan bo'lsa — havola sahifada ko'rsatiladi.
 */
function openPending(): Window | null {
  try {
    const w = window.open("about:blank", "_blank");
    if (w) w.document.title = "Jonli dars ochilmoqda…";
    return w;
  } catch {
    return null;
  }
}

export function LivePanel() {
  const { user, loading } = useAuth();
  const { locale } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();
  const [rows, setRows] = useState<Session[] | null>(null);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [joined, setJoined] = useState<(JoinInfo & { blocked: boolean }) | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [audience, setAudience] = useState<"all" | "level" | "group">("all");
  const [provider, setProvider] = useState<"JITSI" | "EXTERNAL">("JITSI");
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      setRows(await api<Session[]>("/live"));
    } catch (e) {
      setError(errorText(e));
      setRows((r) => r ?? []);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const canHost = user?.role === "TEACHER" || user?.role === "ADMIN";

  useEffect(() => {
    if (!user) return;
    void load();
    if (canHost) api<GroupRow[]>("/groups").then(setGroups).catch(() => undefined);
    // Har 30 soniyada: "Kirish" tugmasi o'z vaqtida yonsin, ishtirokchilar soni yangilansin
    const t = setInterval(() => { void load(); setTick((n) => n + 1); }, 30_000);
    // Ustoz efirni boshlasa — bildirishnoma keladi, ro'yxat darhol yangilanadi
    const onFresh = (e: Event) => {
      const fresh = (e as CustomEvent<{ type: string }[]>).detail ?? [];
      if (fresh.some((n) => n.type === "LIVE")) void load();
    };
    window.addEventListener(FRESH_EVENT, onFresh);
    return () => { clearInterval(t); window.removeEventListener(FRESH_EVENT, onFresh); };
  }, [user, canHost, load]);

  if (loading || !user || rows === null) return <PageLoader />;

  async function join(id: string) {
    setError(""); setNote("");
    const win = openPending();
    try {
      const info = await api<JoinInfo>(`/live/${id}/join`, { method: "POST" });
      let blocked = true;
      if (win && !win.closed) {
        win.opener = null; // yangi oyna bizning sahifani boshqara olmasin
        win.location.href = info.url;
        blocked = false;
      }
      setJoined({ ...info, blocked });
      void load();
    } catch (e) {
      win?.close();
      setError(errorText(e));
    }
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true); setError(""); setNote("");
    try {
      const level = String(f.get("level") ?? "");
      const groupId = String(f.get("groupId") ?? "");
      await api("/live", {
        method: "POST",
        body: {
          title: String(f.get("title")),
          description: String(f.get("description") ?? "").trim() || undefined,
          // datetime-local mahalliy vaqt beradi — ISO (UTC) ga aylantiramiz
          startsAt: new Date(String(f.get("startsAt"))).toISOString(),
          durationMin: Number(f.get("durationMin") || 60),
          maxParticipants: Number(f.get("maxParticipants") || 100),
          ...(audience === "level" && level ? { level } : {}),
          ...(audience === "group" && groupId ? { groupId } : {}),
          provider,
          ...(provider === "EXTERNAL" ? { externalUrl: String(f.get("externalUrl") ?? "").trim() } : {}),
        },
      });
      form.reset();
      setAudience("all");
      setProvider("JITSI");
      setNote("Dars rejalashtirildi. Tegishli o'quvchilarga bildirishnoma yuborildi.");
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function action(id: string, what: "start" | "end" | "delete") {
    setError(""); setNote("");
    if (what === "delete" && !window.confirm("Darsni o'chirasizmi? O'quvchilar ro'yxatidan ham yo'qoladi.")) return;
    try {
      if (what === "delete") await api(`/live/${id}`, { method: "DELETE" });
      else await api(`/live/${id}/${what}`, { method: "POST" });
      if (what === "start") setNote("Efir boshlandi — o'quvchilar ekraniga \"Kiring!\" xabari ketdi. Endi \"Kirish\" ni bosing.");
      await load();
    } catch (e) {
      setError(errorText(e));
    }
  }

  const audienceLabel = (s: Session) =>
    s.group ? `Guruh: ${s.group.name}` : s.level ? `${s.level} darajasi` : "Hamma o'quvchilar";

  return (
    <div className="grid gap-8">
      <header className="border-b border-cobalt/25 pb-6">
        <h1 className="text-[clamp(1.9rem,4vw,2.6rem)]">Jonli darslar</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Ustoz efirni boshlashi bilan &quot;Kirish&quot; tugmasi yonadi va ekraningizga xabar keladi.
          Dars yangi oynada ochiladi — kamera, mikrofon va ekran ulashish o&apos;sha yerda ishlaydi.
        </p>
      </header>

      {error && <p className="alert-error" role="alert">{error}</p>}
      {note && <p className="alert-success" role="status">{note}</p>}

      {joined && (
        <section aria-labelledby="joined-h" className="border border-turquoise/40 bg-turquoise/[0.06] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 id="joined-h" className="text-[1.2rem]">
              {joined.blocked ? "Dars tayyor" : "Dars yangi oynada ochildi"}: {joined.title}
            </h2>
            <button type="button" className="btn btn-quiet" onClick={() => setJoined(null)}>Yopish</button>
          </div>
          <p className="mt-3">
            <a href={joined.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              {joined.blocked ? "Darsni ochish" : "Oynani qayta ochish"}
            </a>
          </p>
          {joined.blocked && (
            <p className="help">Brauzer yangi oynani to&apos;sib qo&apos;ydi — yuqoridagi tugmani bosing.</p>
          )}
          <ul className="mt-4 grid gap-1.5 text-[0.9375rem] text-muted">
            {joined.provider === "JITSI" && joined.isHost && (
              <>
                <li>• <strong className="text-porcelain">Birinchi marta:</strong> meet.jit.si sizdan Google, GitHub yoki Facebook orqali kirishni so&apos;raydi — bu sizni dars boshlovchisi (moderator) qiladi. O&apos;quvchilar kirmaydi, faqat siz.</li>
                <li>• Ekran ulashish: pastki paneldagi monitor belgisi (&quot;Share screen&quot;).</li>
                <li>• 100 kishilik darsda o&apos;quvchilar mikrofoni o&apos;chiq kiradi; savolni &quot;qo&apos;l ko&apos;tarish&quot; bilan berishadi.</li>
              </>
            )}
            {joined.provider === "JITSI" && !joined.isHost && (
              <>
                <li>• Brauzer kamera va mikrofonga ruxsat so&apos;raydi — &quot;Ruxsat berish&quot;ni bosing.</li>
                <li>• Siz mikrofon va kamera O&apos;CHIQ holda kirasiz. Gapirish uchun mikrofon belgisini bosing.</li>
                <li>• &quot;Ustoz kirishini kutyapmiz&quot; desa — ustoz hali kirmagan, oynani yopmang.</li>
                <li>• Telefonda: Jitsi Meet ilovasini o&apos;rnatish taklif qilinsa, &quot;brauzerda davom etish&quot; ham mumkin.</li>
              </>
            )}
            {joined.provider === "EXTERNAL" && <li>• Dars ustoz bergan havola orqali ochiladi (Zoom, Google Meet yoki Telegram).</li>}
          </ul>
        </section>
      )}

      {rows.length === 0 ? (
        <p className="text-muted">Hozircha rejalashtirilgan jonli dars yo&apos;q.</p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((s) => {
            const until = s.status === "SCHEDULED" ? untilText(s.startsAt) : "";
            const live = s.status === "LIVE";
            return (
              <li key={s.id} className={`rounded-[var(--r-tile)] border p-5 ${live ? "border-bole/60 bg-bole/[0.05]" : "border-cobalt/20"}`}>
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className={STATUS[s.status]?.cls ?? "badge"}>
                    {live && <span className="inline-block size-2 animate-pulse rounded-full bg-current" aria-hidden="true" />}
                    {STATUS[s.status]?.label ?? s.status}
                  </span>
                  <span className="badge">{audienceLabel(s)}</span>
                  {s.provider === "EXTERNAL" && <span className="badge badge-warn">Tashqi havola</span>}
                </div>
                <h2 className="font-display text-[1.2rem] font-semibold">{s.title}</h2>
                <p className="mt-1 text-muted">
                  {formatDateTime(s.startsAt, locale)} · {s.durationMin} daqiqa · {s.host}
                  {" · "}
                  {s.attendeeCount}/{s.maxParticipants} kishi
                </p>
                {until && <p className="mt-1 text-[0.875rem] font-medium text-brass">{until} boshlanadi</p>}
                {s.description && <p className="mt-2 text-muted">{s.description}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!s.joinable && !s.isHost}
                    onClick={() => void join(s.id)}
                  >
                    {s.isHost ? (live ? "Efirga kirish" : "Xonani oldindan ochish") : s.joinable ? "Kirish" : "Ustoz boshlashini kuting"}
                  </button>
                  {s.isHost && s.status === "SCHEDULED" && (
                    <button type="button" className="btn btn-outline" onClick={() => void action(s.id, "start")}>
                      Efirni boshlash
                    </button>
                  )}
                  {s.isHost && live && (
                    <button type="button" className="btn btn-outline" onClick={() => void action(s.id, "end")}>
                      Efirni tugatish
                    </button>
                  )}
                  {s.isHost && (
                    <button type="button" className="btn btn-quiet" onClick={() => void action(s.id, "delete")}>
                      O&apos;chirish
                    </button>
                  )}
                </div>
                {!s.joinable && !s.isHost && (
                  <p className="help">Boshlanishidan 15 daqiqa oldin yoki ustoz efirni boshlashi bilan ochiladi.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canHost && (
        <section aria-labelledby="new-h" className="border border-cobalt/25 bg-cobalt/[0.04] p-6">
          <h2 id="new-h" className="mb-5 text-[1.3rem]">Yangi jonli dars</h2>
          <form onSubmit={create} method="post" className="grid gap-5">
            <div>
              <label htmlFor="l-title" className="label">Mavzu</label>
              <input id="l-title" name="title" required minLength={3} maxLength={120} className="input" placeholder="Fe'l zamonlari: -yor" />
            </div>
            <div>
              <label htmlFor="l-desc" className="label">Izoh (ixtiyoriy)</label>
              <textarea id="l-desc" name="description" maxLength={1000} rows={2} className="input resize-y" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="l-when" className="label">Qachon</label>
                <input
                  id="l-when" name="startsAt" type="datetime-local" required className="input"
                  defaultValue={hydrated ? localInputValue(new Date(Date.now() + 60 * 60_000)) : undefined}
                />
              </div>
              <div>
                <label htmlFor="l-dur" className="label">Davomiyligi (daq.)</label>
                <input id="l-dur" name="durationMin" type="number" min={10} max={300} defaultValue={60} className="input" />
              </div>
              <div>
                <label htmlFor="l-max" className="label">Ko&apos;pi bilan necha kishi</label>
                <input id="l-max" name="maxParticipants" type="number" min={2} max={300} defaultValue={100} className="input" />
              </div>
            </div>

            <fieldset className="grid gap-3">
              <legend className="label">Kim qatnashadi</legend>
              <div className="segment w-fit flex-wrap" role="tablist" aria-label="Kim qatnashadi">
                {([["all", "Hamma o'quvchilar"], ["level", "Daraja bo'yicha"], ["group", "Faqat bitta guruh"]] as const).map(([k, label]) => (
                  <button key={k} type="button" role="tab" aria-selected={audience === k} onClick={() => setAudience(k)}>{label}</button>
                ))}
              </div>
              {audience === "level" && (
                <div className="max-w-xs">
                  <label htmlFor="l-level" className="label">Daraja</label>
                  <select id="l-level" name="level" required className="input" defaultValue="A1">
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}
              {audience === "group" && (
                groups.length === 0 ? (
                  <p className="help">Sizda hali guruh yo&apos;q. Avval &quot;Guruhlar&quot; bo&apos;limida guruh oching.</p>
                ) : (
                  <div className="max-w-sm">
                    <label htmlFor="l-group" className="label">Guruh</label>
                    <select id="l-group" name="groupId" required className="input">
                      {groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.level})</option>)}
                    </select>
                    <p className="help">Faqat shu guruh a&apos;zolari ko&apos;radi, xabar oladi va kira oladi.</p>
                  </div>
                )
              )}
            </fieldset>

            <fieldset className="grid gap-3">
              <legend className="label">Qayerda o&apos;tadi</legend>
              <div className="segment w-fit flex-wrap" role="tablist" aria-label="Qayerda o'tadi">
                <button type="button" role="tab" aria-selected={provider === "JITSI"} onClick={() => setProvider("JITSI")}>Sayt orqali (Jitsi, bepul)</button>
                <button type="button" role="tab" aria-selected={provider === "EXTERNAL"} onClick={() => setProvider("EXTERNAL")}>O&apos;z havolam</button>
              </div>
              {provider === "JITSI" ? (
                <p className="help max-w-2xl">
                  Xona avtomatik yaratiladi. Siz birinchi kirganingizda meet.jit.si Google/GitHub orqali kirishni so&apos;raydi
                  (moderator bo&apos;lish uchun). 30–40 kishidan ko&apos;p bo&apos;lsa, o&apos;quvchilar kamerasini o&apos;chirib turishni so&apos;rang.
                </p>
              ) : (
                <div>
                  <label htmlFor="l-url" className="label">Havola (https)</label>
                  <input id="l-url" name="externalUrl" type="url" required maxLength={500} className="input" placeholder="https://meet.google.com/... yoki https://t.me/..." />
                  <p className="help max-w-2xl">
                    Zoom (bepulda 40 daqiqa), Google Meet (100 kishi, bepulda 60 daqiqa) yoki Telegram guruh video chati
                    (ko&apos;p tomoshabin uchun eng barqarori). Havola faqat kirish bosilganda beriladi.
                  </p>
                </div>
              )}
            </fieldset>

            <div>
              <button type="submit" disabled={busy || !hydrated} className="btn btn-primary">
                {busy ? "Saqlanmoqda..." : "Rejalashtirish va xabar yuborish"}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

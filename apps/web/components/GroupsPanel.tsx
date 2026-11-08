"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, needs2fa } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { errorText } from "./groups/shared";

type Row = { id: string; name: string; level: string; schedule: string | null; isActive: boolean; memberCount: number; teacherName: string };
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

export function GroupsPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const canManage = user?.role === "TEACHER" || user?.role === "ADMIN";

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api<Row[]>("/groups")
      .then((g) => !cancelled && setGroups(g))
      .catch((e) => {
        if (cancelled) return;
        if (needs2fa(e)) router.push("/security");
        else setError(errorText(e));
      });
    return () => {
      cancelled = true;
    };
  }, [user, router, reload]);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    setBusy(true);
    setError("");
    try {
      await api("/groups", {
        method: "POST",
        body: {
          name: String(d.get("name") ?? "").trim(),
          level: String(d.get("level") ?? "A1"),
          schedule: String(d.get("schedule") ?? "").trim() || undefined,
          meetingUrl: String(d.get("meetingUrl") ?? "").trim() || undefined,
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

  if (loading || !user) return <p className="text-muted" role="status">Yuklanmoqda...</p>;

  return (
    <div className="grid gap-8">
      {error && <p className="alert-error" role="alert">{error}</p>}

      {groups === null && !error && <p className="text-muted" role="status">Yuklanmoqda...</p>}
      {groups && groups.length === 0 && (
        <p className="card text-muted">
          {canManage ? "Hali guruh yo'q. Pastdan birinchi guruhni yarating." : "Siz hali hech qaysi guruhga qo'shilmagansiz. Ustoz sizni guruhga qo'shadi."}
        </p>
      )}
      {groups && groups.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Link href={`/groups/${g.id}`} className="card block h-full">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-extrabold">{g.name}</h2>
                  <span className="badge badge-warn">{g.level}</span>
                </div>
                {g.schedule && <p className="mt-2 text-sm text-muted">{g.schedule}</p>}
                <p className="mt-3 text-sm text-muted">
                  {g.memberCount} ta o&apos;quvchi · Ustoz: {g.teacherName}
                  {!g.isActive && <span className="badge badge-bad ml-2">Faol emas</span>}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <form onSubmit={create} className="card grid gap-4">
          <h2 className="text-xl font-extrabold">Yangi guruh</h2>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div>
              <label htmlFor="g-name" className="label">Guruh nomi</label>
              <input id="g-name" name="name" required minLength={2} maxLength={80} className="input" placeholder="A1 kechki guruh" />
            </div>
            <div>
              <label htmlFor="g-level" className="label">Daraja</label>
              <select id="g-level" name="level" className="input" defaultValue="A1">
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="g-schedule" className="label">Jadval (ixtiyoriy)</label>
              <input id="g-schedule" name="schedule" maxLength={120} className="input" placeholder="Du-Chor-Ju 19:00" />
            </div>
            <div>
              <label htmlFor="g-url" className="label">Onlayn dars havolasi (ixtiyoriy)</label>
              <input id="g-url" name="meetingUrl" type="url" maxLength={300} className="input" placeholder="https://meet.google.com/..." />
              <p className="help">Faqat https:// bilan boshlanadigan havola.</p>
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn btn-primary justify-self-start">
            {busy ? "Yaratilmoqda..." : "Guruh yaratish"}
          </button>
        </form>
      )}
    </div>
  );
}

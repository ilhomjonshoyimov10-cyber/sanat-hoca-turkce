"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api, needs2fa } from "@/lib/api";
import { errorText } from "../groups/shared";
import { AnnouncementsTab } from "./AnnouncementsTab";
import { AuditLog } from "./AuditLog";
import { FreeLessonTab } from "./FreeLessonTab";
import { StatsCards } from "./StatsCards";
import { SupportTab } from "./SupportTab";
import { UsersTable } from "./UsersTable";

export type Tab = "stats" | "users" | "announcements" | "support" | "free" | "audit";
const TABS: { key: Tab; label: string }[] = [
  { key: "stats", label: "Ko'rsatkichlar" },
  { key: "users", label: "Foydalanuvchilar" },
  { key: "announcements", label: "E'lonlar" },
  { key: "support", label: "Murojaatlar" },
  { key: "free", label: "Bepul dars" },
  { key: "audit", label: "Audit jurnali" },
];

export function AdminPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("stats");
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    // Admin bo'lmagan odam bu sahifada ishi yo'q — o'z paneliga yuboriladi.
    if (user.role !== "ADMIN") router.replace(user.role === "TEACHER" ? "/ustoz" : "/dashboard");
  }, [loading, user, router]);

  if (loading || !user) return <p className="text-muted" role="status">Yuklanmoqda...</p>;
  if (user.role !== "ADMIN") return null;

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-cobalt/25 pb-6">
        <div>
          <h1 className="text-[clamp(1.9rem,4vw,2.6rem)]">Administrator paneli</h1>
          <p className="mt-2 text-muted">Butun tizim shu yerdan boshqariladi.</p>
        </div>
        <div className="segment" role="tablist" aria-label="Bo'limlar">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => { setTab(t.key); setError(""); }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {error && <p className="alert-error" role="alert">{error}</p>}

      {tab === "stats" && <StatsCards onError={setError} />}
      {tab === "users" && <UsersTable meId={user.id} onError={setError} />}
      {tab === "announcements" && <AnnouncementsTab onError={setError} />}
      {tab === "support" && <SupportTab onError={setError} />}
      {tab === "free" && <FreeLessonTab onError={setError} isAdmin />}
      {tab === "audit" && <AuditLog onError={setError} />}
    </div>
  );
}

/** Admin bo'limlari uchun umumiy yuklovchi. 2FA talab qilinsa /security ga yuboradi. */
export function useAdminData<T>(path: string, onError: (m: string) => void) {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [busy, setBusy] = useState(true);

  const reload = useCallback(async () => {
    setBusy(true);
    try {
      setData(await api<T>(path));
    } catch (e) {
      if (needs2fa(e)) { router.push("/security"); return; }
      onError(errorText(e));
    } finally {
      setBusy(false);
    }
  }, [path, onError, router]);

  useEffect(() => { void reload(); }, [reload]);
  return { data, busy, reload };
}

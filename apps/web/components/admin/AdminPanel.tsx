"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api, needs2fa } from "@/lib/api";
import { errorText } from "../groups/shared";
import { AiTab } from "./AiTab";
import { AnnouncementsTab } from "./AnnouncementsTab";
import { AuditLog } from "./AuditLog";
import { FreeLessonTab } from "./FreeLessonTab";
import { MediaTab } from "./MediaTab";
import { StatsCards } from "./StatsCards";
import { SupportTab } from "./SupportTab";
import { UsersTable } from "./UsersTable";
import { PageLoader } from "@/components/Loader";

export type Tab = "stats" | "users" | "announcements" | "media" | "support" | "free" | "ai" | "audit";
const TABS: { key: Tab; label: string }[] = [
  { key: "stats", label: "Ko'rsatkichlar" },
  { key: "users", label: "Foydalanuvchilar" },
  { key: "support", label: "Murojaatlar" },
  { key: "free", label: "Bepul dars" },
  { key: "announcements", label: "E'lonlar" },
  { key: "ai", label: "AI suhbatlar" },
  { key: "media", label: "Kino va musiqa" },
  { key: "audit", label: "Audit jurnali" },
];
const isTab = (v: string | null): v is Tab => !!v && TABS.some((t) => t.key === v);

export function AdminPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Bo'lim manzilda turadi (?tab=support&id=...): bildirishnomadagi havola
  // to'g'ridan-to'g'ri kerakli murojaat yoki arizani ochadi.
  const params = useSearchParams();
  const fromUrl = params.get("tab");
  const tab: Tab = isTab(fromUrl) ? fromUrl : "stats";
  const focusId = params.get("id") ?? params.get("lead") ?? undefined;
  const [error, setError] = useState("");
  const setTab = (next: Tab) => router.replace(`${pathname}?tab=${next}`, { scroll: false });

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    // Admin bo'lmagan odam bu sahifada ishi yo'q — o'z paneliga yuboriladi.
    if (user.role !== "ADMIN") router.replace(user.role === "TEACHER" ? "/ustoz" : "/dashboard");
  }, [loading, user, router]);

  if (loading || !user) return <PageLoader />;
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
      {tab === "media" && <MediaTab onError={setError} />}
      {tab === "support" && <SupportTab onError={setError} focusId={focusId} />}
      {tab === "free" && <FreeLessonTab onError={setError} isAdmin focusId={focusId} />}
      {tab === "ai" && <AiTab onError={setError} />}
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

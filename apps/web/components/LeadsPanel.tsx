"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, needs2fa } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageLoader } from "@/components/Loader";
import { formatDateTime } from "@/lib/datetime";

type Lead = { id: string; name: string; phone: string; level: string | null; message: string | null; status: string; createdAt: string };

export function LeadsPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!user) return;
    api<Lead[]>("/leads")
      .then(setLeads)
      .catch((e) => {
        if (needs2fa(e)) router.push("/security");
        else setError(e instanceof ApiError && e.status === 403 ? "Bu bo'lim faqat ustoz va administrator uchun" : "Yuklab bo'lmadi");
      });
  }, [loading, user, router]);

  if (loading || !user) return <PageLoader />;
  if (error) return <p className="alert-error" role="alert">{error}</p>;
  if (!leads) return <PageLoader />;
  if (leads.length === 0) return <p className="card text-muted">Hozircha arizalar yo&apos;q.</p>;

  return (
    <ul className="grid gap-3">
      {leads.map((l) => (
        <li key={l.id} className="card !p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold">{l.name}</h2>
            <time className="text-sm text-muted" dateTime={l.createdAt}>{formatDateTime(l.createdAt, "uz")}</time>
          </div>
          <p className="mt-1">
            <a href={`tel:${l.phone}`} className="font-bold text-primary underline">{l.phone}</a>
            {l.level && <span className="ml-3 rounded-full bg-surface-2 px-2 py-0.5 text-sm">{l.level}</span>}
          </p>
          {l.message && <p className="mt-2 text-muted">{l.message}</p>}
        </li>
      ))}
    </ul>
  );
}

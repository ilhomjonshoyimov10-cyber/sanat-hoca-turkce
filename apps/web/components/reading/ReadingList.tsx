"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { NewTextForm } from "./ReadingEditor";

type Item = {
  id: string;
  slug: string;
  title: string;
  level: string;
  topic: string | null;
  wordCount: number;
  questionCount: number;
  isDraft: boolean;
  best: { score: number; total: number } | null;
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;

export function ReadingList() {
  const { user } = useAuth();
  const canEdit = user?.role === "TEACHER" || user?.role === "ADMIN";
  const [items, setItems] = useState<Item[]>([]);
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    api<Item[]>(`/reading${level ? `?level=${level}` : ""}`)
      .then(setItems)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Ro'yxatni olib bo'lmadi"))
      .finally(() => setLoading(false));
  }, [level]);

  return (
    <div>
      {canEdit && <NewTextForm onCreated={(slug) => router.push(`/oqish/${slug}`)} />}

      <div className="segment mb-6 flex flex-wrap gap-1" role="tablist" aria-label="Daraja">
        <button type="button" role="tab" aria-selected={level === ""} onClick={() => setLevel("")} className="min-h-10 px-3 text-sm">
          Hammasi
        </button>
        {LEVELS.map((l) => (
          <button key={l} type="button" role="tab" aria-selected={level === l} onClick={() => setLevel(l)} className="min-h-10 px-3 text-sm">
            {l}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 text-bole" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <ul className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="skeleton h-20" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="text-muted">
          Bu darajada matn yo&apos;q.
          {canEdit ? " Ustoz panelidan qo'shishingiz mumkin." : ""}
        </p>
      ) : (
        <ul className="grid gap-3">
          {items.map((t) => (
            <li key={t.id}>
              <Link
                href={`/oqish/${t.slug}`}
                className="raise flex flex-wrap items-center justify-between gap-4 border border-cobalt/25 bg-tile p-5 hover:bg-tile-2"
              >
                <div className="min-w-0">
                  <h2 className="text-[1.1rem]">
                    {t.title}
                    {t.isDraft && <span className="ml-2 border border-brass/50 px-2 py-0.5 text-xs text-brass">qoralama</span>}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {t.level}
                    {t.topic ? ` · ${t.topic}` : ""} · {t.wordCount} so&apos;z · {t.questionCount} savol
                  </p>
                </div>
                {t.best && (
                  <span className="shrink-0 text-sm text-turquoise">
                    {t.best.score}/{t.best.total}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

// Admin yuborgan e'lon va reklamalar. Har bir sahifada, menyu ostida.
//
// Dizayn qarori: e'lon sahifa MAZMUNINI surib yuboradi, ustiga chiqmaydi.
// Qalqib turuvchi oyna darsni to'sib qo'yadi va telefonda ayniqsa
// bezovta qiladi — o'quvchi mashq qilayotganda bu qabul qilib bo'lmas.

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n/client";

interface Announcement {
  id: string;
  kind: "INFO" | "PROMO" | "EVENT" | "WARNING";
  title: string;
  body: string;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  dismissible: boolean;
  pinned: boolean;
}

const TONE: Record<Announcement["kind"], { ring: string; chip: string }> = {
  INFO: { ring: "border-cobalt/35 bg-cobalt/[0.07]", chip: "badge" },
  PROMO: { ring: "border-brass/45 bg-brass/[0.08]", chip: "badge badge-warn" },
  EVENT: { ring: "border-turquoise/45 bg-turquoise/[0.08]", chip: "badge badge-ok" },
  WARNING: { ring: "border-danger/45 bg-danger/[0.08]", chip: "badge badge-bad" },
};

export function AnnouncementBar() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    api<Announcement[]>("/announcements")
      .then((rows) => alive && setItems(rows))
      // E'lon kelmasa sahifa baribir ishlashi kerak — jim o'tamiz
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [user]);

  const dismiss = useCallback(async (id: string) => {
    // Darhol yo'qotamiz: server javobini kutib turish sekin tuyuladi.
    setItems((prev) => prev.filter((a) => a.id !== id));
    await api(`/announcements/${id}/dismiss`, { method: "POST" }).catch(() => undefined);
  }, []);

  if (!user || items.length === 0) return null;

  return (
    <div className="container-page mt-4 grid gap-3">
      {items.map((a) => {
        const tone = TONE[a.kind];
        const external = a.linkUrl?.startsWith("https://");
        return (
          <article
            key={a.id}
            className={`relative overflow-hidden rounded-[var(--r-tile)] border p-4 sm:p-5 ${tone.ring}`}
          >
            <div className="flex flex-wrap items-start gap-4">
              {a.imageUrl && (
                <Image
                  src={a.imageUrl}
                  alt=""
                  width={96}
                  height={96}
                  className="h-20 w-20 shrink-0 rounded-[var(--r-tile)] object-cover sm:h-24 sm:w-24"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className={tone.chip}>{t.notif.kinds[a.kind]}</span>
                  <h2 className="text-[1.05rem] font-semibold">{a.title}</h2>
                </div>
                <p className="whitespace-pre-line text-[0.95rem] text-muted">{a.body}</p>
                {a.linkUrl &&
                  (external ? (
                    // Tashqi havola: yangi oynada va referrer yuborilmaydi
                    <a
                      href={a.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline mt-3 inline-flex"
                    >
                      {a.linkLabel || t.notif.more}
                    </a>
                  ) : (
                    <Link href={a.linkUrl} className="btn btn-outline mt-3 inline-flex">
                      {a.linkLabel || t.notif.more}
                    </Link>
                  ))}
              </div>
              {a.dismissible && (
                <button
                  type="button"
                  onClick={() => dismiss(a.id)}
                  aria-label={`${t.common.close}: ${a.title}`}
                  className="btn btn-quiet shrink-0 px-3 py-1 text-lg leading-none"
                >
                  ×
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

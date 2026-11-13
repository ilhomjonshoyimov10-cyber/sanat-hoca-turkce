"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmt, LOCALE_META } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

interface Item {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

const POLL_MS = 60_000;

export function NotificationBell() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await api<{ items: Item[]; unread: number }>("/notifications");
      setItems(r.items);
      setUnread(r.unread);
    } catch {
      /* jim: bildirishnoma kelmasa sahifa baribir ishlayveradi */
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [user, load]);

  // Tashqariga bosilsa yopiladi; Escape ham yopadi
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  async function markAll() {
    setUnread(0);
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })));
    await api("/notifications/read-all", { method: "PATCH" }).catch(() => undefined);
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); if (!open) void load(); }}
        aria-expanded={open}
        aria-label={unread ? `${t.notif.title}, ${fmt(t.notif.unread, { n: unread })}` : t.notif.title}
        className="relative grid size-10 place-items-center rounded-full text-muted transition-colors hover:text-porcelain"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
          <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" />
          <path d="M10 18.5a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 && <span className="dot">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t.notif.title}
          className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] border border-cobalt/40 bg-tile raise"
        >
          <div className="flex items-center justify-between border-b border-cobalt/25 px-4 py-3">
            <h2 className="font-display text-[1.05rem] font-semibold">{t.notif.title}</h2>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="text-[0.8125rem] text-brass underline underline-offset-4">
                {t.notif.markAll}
              </button>
            )}
          </div>

          <ul className="max-h-[22rem] overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-8 text-center text-[0.9375rem] text-muted">{t.notif.empty}</li>}
            {items.map((n) => {
              const inner = (
                <>
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-[0.875rem] text-muted">{n.body}</p>}
                  <p className="mt-1 text-[0.75rem] text-muted">{new Date(n.createdAt).toLocaleString(LOCALE_META[locale].intl)}</p>
                </>
              );
              return (
                <li key={n.id} className={`border-b border-cobalt/14 last:border-0 ${n.readAt ? "" : "bg-cobalt/8"}`}>
                  {n.link ? (
                    <Link href={n.link} onClick={() => setOpen(false)} className="block px-4 py-3 transition-colors hover:bg-cobalt/10">
                      {inner}
                    </Link>
                  ) : (
                    <div className="px-4 py-3">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

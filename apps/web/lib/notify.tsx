"use client";

// Bildirishnomalar markazi: butun sayt uchun BITTA so'rovchi.
//
// Nega bitta: oldin qo'ng'iroqcha, e'lonlar paneli va chat har biri o'zi
// so'rardi — xabar kelsa ham hech kim ekranda ko'rmasdi. Endi:
//   1. har 30 soniyada (sahifa ko'rinib turganda) /notifications/pulse;
//   2. yangi xabar kelsa — ekran burchagida "Sizga xabar keldi" oynasi;
//   3. tab belgisida qizil raqam — boshqa tabda tursa ham ko'rinadi;
//   4. ruxsat berilgan bo'lsa — brauzerning o'z bildirishnomasi (tab yashirin bo'lsa);
//   5. "sh-notif-fresh" hodisasi: e'lonlar paneli va chat darhol yangilanadi.
//
// Cheklov (ochiq aytamiz): bu "push" emas, so'rov. Vercel'ning serverless
// funksiyalari doimiy ulanishni (WebSocket) ushlab turmaydi, shuning uchun
// xabar ekranga ko'pi bilan ~30 soniya kechikib chiqadi.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "./api";
import { useAuth } from "./auth";
import { fmt } from "./i18n/config";
import { useI18n } from "./i18n/client";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

type Pulse = { unread: number; fresh: NotificationItem[]; now: string };
type Toast = { key: string; item?: NotificationItem; summary?: number };

type Ctx = {
  unread: number;
  /** Har yangi xabarda oshadi: ro'yxatni ko'rsatayotgan komponent qayta yuklaydi */
  version: number;
  refresh: () => void;
  setUnread: (n: number) => void;
};

const NotifyContext = createContext<Ctx>({ unread: 0, version: 0, refresh: () => undefined, setUnread: () => undefined });
export const useNotifications = () => useContext(NotifyContext);

export const FRESH_EVENT = "sh-notif-fresh";
export const OPEN_BELL_EVENT = "sh-open-bell";

const VISIBLE_MS = 30_000;
const HIDDEN_MS = 120_000;
const TOAST_MS = 9_000;
const SUMMARY_KEY = "sh-notif-summary";

/**
 * Brauzer tabidagi belgi (favicon) ustiga qizil raqam: boshqa tabda tursa
 * ham "xabar bor" ko'rinadi. Sarlavha matniga tegmaymiz — uni React/Next
 * boshqaradi va ikkalasi bir-biriga xalaqit berardi ("(1) (1)" xatosi).
 */
function useFaviconBadge(unread: number) {
  useEffect(() => {
    const ID = "sh-badge-icon";
    const old = document.getElementById(ID);
    if (unread <= 0) {
      old?.remove();
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const size = 64;
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const g = c.getContext("2d");
      if (!g) return;
      g.drawImage(img, 0, 0, size, size);
      const r = 17;
      g.beginPath();
      g.arc(size - r, r, r, 0, Math.PI * 2);
      g.fillStyle = "#e0453a";
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = "#ffffff";
      g.stroke();
      g.fillStyle = "#ffffff";
      g.font = "bold 22px system-ui, sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(unread > 9 ? "9+" : String(unread), size - r, r + 1);
      const link = (document.getElementById(ID) as HTMLLinkElement | null) ?? document.createElement("link");
      link.id = ID;
      link.rel = "icon";
      link.type = "image/png";
      link.href = c.toDataURL("image/png");
      // Oxirgi e'lon qilingan belgi ishlatiladi — shuning uchun <head> oxiriga
      document.head.appendChild(link);
    };
    img.src = "/brand/icon-96.png";
    return () => {
      cancelled = true;
    };
  }, [unread]);
  useEffect(() => () => document.getElementById("sh-badge-icon")?.remove(), []);
}

function systemNotify(item: NotificationItem, onClick: () => void) {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (!document.hidden) return; // sahifa ko'rinib tursa — o'zimizning oyna yetarli
    const n = new Notification(item.title, {
      body: item.body ?? undefined,
      icon: "/brand/icon-192.png",
      badge: "/brand/icon-192.png",
      tag: item.id,
    });
    n.onclick = () => {
      window.focus();
      onClick();
      n.close();
    };
  } catch {
    /* ba'zi brauzerlarda (iOS) faqat o'rnatilgan ilovada ishlaydi */
  }
}

export function NotificationCenter({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [version, setVersion] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const since = useRef<string | null>(null);
  const seen = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef(false);

  const go = useCallback(
    (item: NotificationItem) => {
      void api(`/notifications/${item.id}/read`, { method: "PATCH" }).catch(() => undefined);
      setUnread((n) => Math.max(0, n - (item.readAt ? 0 : 1)));
      if (item.link) router.push(item.link);
    },
    [router],
  );

  const poll = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      const q = since.current ? `?since=${encodeURIComponent(since.current)}` : "";
      const r = await api<Pulse>(`/notifications/pulse${q}`);
      const first = since.current === null;
      since.current = r.now;
      setUnread(r.unread);

      if (first) {
        // Sahifa endi ochildi: eski xabarlarni bittalab ko'rsatmaymiz —
        // bitta umumiy eslatma (seansda bir marta)
        let shown = false;
        try { shown = sessionStorage.getItem(SUMMARY_KEY) === "1"; } catch { /* maxfiy rejim */ }
        if (r.unread > 0 && !shown) {
          setToasts((ts) => [...ts, { key: "summary", summary: r.unread }]);
          try { sessionStorage.setItem(SUMMARY_KEY, "1"); } catch { /* jim */ }
        }
        return;
      }

      const fresh = r.fresh.filter((n) => !seen.current.has(n.id) && !n.readAt);
      if (!fresh.length) return;
      for (const n of fresh) seen.current.add(n.id);
      setVersion((v) => v + 1);
      window.dispatchEvent(new CustomEvent(FRESH_EVENT, { detail: fresh }));
      // Eng yangisi yuqorida; bir vaqtda ko'pi bilan 3 ta oyna
      setToasts((ts) => [...fresh.slice(0, 3).map((item) => ({ key: item.id, item })), ...ts].slice(0, 3));
      for (const item of fresh.slice(0, 3)) systemNotify(item, () => go(item));
    } catch {
      /* tarmoq yo'q yoki sessiya tugagan — keyingi safar */
    } finally {
      inflight.current = false;
    }
  }, [go]);

  // So'rov jadvali: ko'rinib turganda tez, yashirin tabda sekin
  useEffect(() => {
    if (!user) {
      since.current = null;
      seen.current.clear();
      setUnread(0);
      setToasts([]);
      return;
    }
    let stopped = false;
    const schedule = () => {
      if (stopped) return;
      timer.current = setTimeout(async () => {
        await poll();
        schedule();
      }, document.hidden ? HIDDEN_MS : VISIBLE_MS);
    };
    const wake = () => {
      if (document.hidden) return;
      if (timer.current) clearTimeout(timer.current);
      void poll().then(schedule);
    };
    void poll().then(schedule);
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);
    return () => {
      stopped = true;
      if (timer.current) clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
      window.removeEventListener("online", wake);
    };
  }, [user, poll]);

  useFaviconBadge(user ? unread : 0);

  const dismiss = useCallback((key: string) => setToasts((ts) => ts.filter((x) => x.key !== key)), []);

  const value = useMemo<Ctx>(() => ({ unread, version, refresh: () => void poll(), setUnread }), [unread, version, poll]);

  return (
    <NotifyContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-stretch gap-3 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[23rem]"
      >
        {toasts.map((toast) => (
          <ToastCard
            key={toast.key}
            toast={toast}
            onClose={() => dismiss(toast.key)}
            onOpen={() => {
              dismiss(toast.key);
              if (toast.item) go(toast.item);
              else window.dispatchEvent(new Event(OPEN_BELL_EVENT));
            }}
            labels={{ heading: t.notif.toast, open: toast.summary ? t.notif.show : t.notif.open, close: t.notif.close }}
            summaryText={toast.summary ? fmt(t.notif.summary, { n: toast.summary }) : ""}
          />
        ))}
      </div>
    </NotifyContext.Provider>
  );
}

function ToastCard({
  toast, onClose, onOpen, labels, summaryText,
}: {
  toast: Toast;
  onClose: () => void;
  onOpen: () => void;
  labels: { heading: string; open: string; close: string };
  summaryText: string;
}) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const id = setTimeout(onClose, toast.summary ? TOAST_MS + 3000 : TOAST_MS);
    return () => clearTimeout(id);
  }, [paused, onClose, toast.summary]);

  const item = toast.item;
  return (
    <div
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="toast pointer-events-auto"
    >
      <span className="toast-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" />
          <path d="M10 18.5a2 2 0 0 0 4 0" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="toast-kicker">{labels.heading}</p>
        <p className="mt-0.5 font-medium leading-snug">{item ? item.title : summaryText}</p>
        {item?.body && <p className="mt-0.5 line-clamp-2 text-[0.875rem] text-muted">{item.body}</p>}
        <div className="mt-2.5 flex items-center gap-3">
          {item?.link ? (
            <Link href={item.link} onClick={(e) => { e.preventDefault(); onOpen(); }} className="btn btn-primary btn-sm">
              {labels.open}
            </Link>
          ) : (
            <button type="button" onClick={onOpen} className="btn btn-primary btn-sm">{labels.open}</button>
          )}
        </div>
      </div>
      <button type="button" onClick={onClose} aria-label={labels.close} className="toast-close">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}

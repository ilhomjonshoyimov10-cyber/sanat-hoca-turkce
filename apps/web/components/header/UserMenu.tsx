"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { useAuth, type User } from "@/lib/auth";
import { fmt, LOCALE_META } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import { useDismiss } from "@/lib/useDismiss";
import type { Stats } from "../games/types";
import { Avatar } from "./Avatar";
import { LocaleList } from "./LangSwitcher";
import { homeFor } from "./links";

/** Serverdagi qoida bilan bir xil: har daraja 100 XP (apps/api/src/games/srs.ts). */
const XP_PER_LEVEL = 100;
const DOTS = 20;

const I = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" className="size-[1.15rem] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const icons = {
  cabinet: <I><rect x="3" y="3" width="7" height="8" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="15" width="7" height="6" rx="1" /></I>,
  home: <I><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-5h4v5" /></I>,
  profile: <I><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></I>,
  security: <I><path d="M12 3l7 3v6c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6z" /><path d="m9 12 2 2 4-4" /></I>,
  support: <I><path d="M4 5h16v11H8l-4 4z" /><path d="M8 9h8M8 12h5" /></I>,
  lang: <I><path d="M4 5h8M8 3v2M6 5c0 4 2.5 7 6 8" /><path d="M11 5c-.5 3.5-3 6.5-7 8" /><path d="m13 21 4-9 4 9M14.5 18h5" /></I>,
  logout: <I><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M10 16l-4-4 4-4M6 12h10" /></I>,
  flame: <I><path d="M12 3c1 3 4 4.5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s.5 2 2 2c0-3-1-5 1-8z" /></I>,
  chevron: <I><path d="m9 6 6 6-6 6" /></I>,
};

function Row({ href, icon, children, onClick }: { href: string; icon: ReactNode; children: ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-[var(--r-field)] px-3 py-2.5 text-[0.9375rem] font-medium text-porcelain transition-colors hover:bg-cobalt/12"
    >
      <span className="text-muted">{icon}</span>
      {children}
    </Link>
  );
}

export function UserMenu({ user }: { user: User }) {
  const { t, locale } = useI18n();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [leaving, setLeaving] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const isStudent = user.role === "STUDENT" || user.role === "PARENT";

  const close = useCallback(() => {
    setOpen(false);
    setLangOpen(false);
  }, []);
  useDismiss(box, open, close);

  // Statistika menyu OCHILGANDA olinadi: har bir sahifa yuklanishida
  // og'ir so'rov yubormaslik uchun.
  useEffect(() => {
    if (!open || !isStudent) return;
    let alive = true;
    api<Stats>("/games/me")
      .then((s) => alive && setStats(s))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [open, isStudent]);

  const inLevel = stats ? stats.xp % XP_PER_LEVEL : 0;
  const filled = Math.round((inLevel / XP_PER_LEVEL) * DOTS);

  async function onLogout() {
    setLeaving(true);
    await logout();
    // To'liq qayta yuklash: oldingi foydalanuvchining ma'lumotlari brauzer
    // xotirasidan tozalanadi (o'quv markazidagi umumiy kompyuterlarda muhim).
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- ataylab: to'liq qayta yuklash
    window.location.assign("/");
  }

  const roleLine = isStudent && stats
    ? `${t.user.roles[user.role]} · ${fmt(t.user.levelN, { n: stats.level })}`
    : t.user.roles[user.role];

  return (
    <div className="relative" ref={box}>
      <button
        ref={button}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${t.user.openMenu}: ${user.firstName} ${user.lastName}`}
        className="rounded-full transition-transform hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        <Avatar user={user} size={34} progress={stats ? inLevel / XP_PER_LEVEL : undefined} />
      </button>

      {open && (
        <div className="absolute right-0 top-[3.1rem] z-50 w-[min(21rem,calc(100vw-1.5rem))] rounded-[14px] border border-cobalt/40 bg-tile p-2 raise">
          {/* ── Kim ── */}
          <Link
            href="/profil"
            onClick={close}
            className="group flex items-center gap-3 rounded-[10px] p-3 transition-colors hover:bg-cobalt/10"
          >
            <Avatar user={user} size={46} progress={stats ? inLevel / XP_PER_LEVEL : undefined} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[1.08rem] font-semibold tracking-[-0.01em]">
                {user.firstName} {user.lastName}
              </span>
              <span className="block truncate text-[0.875rem] text-muted">{roleLine}</span>
            </span>
            <span className="text-muted transition-transform group-hover:translate-x-0.5">{icons.chevron}</span>
          </Link>

          {/* ── Bugungi holat (faqat o'quvchi) ── */}
          {isStudent && (
            <div className="mx-1 mb-1.5 mt-1 rounded-[10px] border border-cobalt/25 bg-ink/60 p-3.5">
              <div className="flex items-baseline justify-between text-[0.875rem]">
                <span className="font-semibold">{stats ? fmt(t.user.levelN, { n: stats.level }) : "—"}</span>
                <span className="text-muted">{stats ? fmt(t.user.toNext, { n: XP_PER_LEVEL - inLevel }) : ""}</span>
              </div>
              {/* Nuqtalar: har biri 5 XP. Rasmdagi "kreditlar" g'oyasi — lekin bizda bu daraja */}
              <div className="mt-2.5 flex gap-[3px]" aria-hidden="true">
                {Array.from({ length: DOTS }, (_, i) => (
                  <span
                    key={i}
                    className={`h-[7px] flex-1 rounded-full ${i < filled ? "bg-brass" : "bg-cobalt/25"}`}
                  />
                ))}
              </div>

              <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-cobalt/20 pt-3">
                <div className="flex min-w-0 items-center gap-2 text-[0.875rem]">
                  <span className={stats && stats.streak > 0 ? "text-bole" : "text-muted"}>{icons.flame}</span>
                  <span className="truncate">
                    {stats
                      ? stats.dueWords > 0
                        ? fmt(t.user.due, { n: stats.dueWords })
                        : t.user.dueNone
                      : t.common.loading}
                  </span>
                </div>
                <Link href="/games" onClick={close} className="btn btn-primary !min-h-8 shrink-0 !px-3.5 !py-1 text-[0.8125rem]">
                  {t.user.startReview}
                </Link>
              </div>
              {stats && stats.streak > 0 && (
                <p className="mt-1.5 text-[0.8125rem] text-muted">
                  {t.user.streak}: <strong className="text-porcelain">{fmt(t.user.streakDays, { n: stats.streak })}</strong>
                </p>
              )}
            </div>
          )}

          {/* ── Havolalar ── */}
          <nav aria-label={t.user.openMenu} className="grid gap-0.5 py-1">
            <Row href={homeFor(user.role)} icon={icons.cabinet} onClick={close}>{t.user.cabinet}</Row>
            <Row href="/" icon={icons.home} onClick={close}>{t.user.home}</Row>
            <Row href="/profil" icon={icons.profile} onClick={close}>{t.user.profile}</Row>
            <Row href="/security" icon={icons.security} onClick={close}>{t.user.security}</Row>
            {user.role !== "ADMIN" && (
              <Row href="/murojaat" icon={icons.support} onClick={close}>{t.user.support}</Row>
            )}

            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              aria-expanded={langOpen}
              className="flex items-center gap-3 rounded-[var(--r-field)] px-3 py-2.5 text-left text-[0.9375rem] font-medium transition-colors hover:bg-cobalt/12"
            >
              <span className="text-muted">{icons.lang}</span>
              <span className="flex-1">{t.user.language}</span>
              <span className="text-[0.875rem] text-muted">{LOCALE_META[locale].label}</span>
              <span className={`text-muted transition-transform ${langOpen ? "rotate-90" : ""}`}>{icons.chevron}</span>
            </button>
            {langOpen && (
              <div className="mx-1 mb-1 rounded-[10px] bg-ink/60 p-1">
                <LocaleList onPick={close} />
              </div>
            )}
          </nav>

          <div className="mt-1 border-t border-cobalt/25 pt-1.5">
            <button
              type="button"
              onClick={onLogout}
              disabled={leaving}
              className="flex w-full items-center gap-3 rounded-[var(--r-field)] px-3 py-2.5 text-left text-[0.9375rem] font-medium text-danger transition-colors hover:bg-bole/12 disabled:opacity-60"
            >
              {icons.logout}
              {leaving ? t.user.loggingOut : t.user.logout}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

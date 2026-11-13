"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmt } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import { Achievements } from "./Achievements";
import type { Stats } from "./games/types";
import { PageLoader } from "@/components/Loader";

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

/** XP → keyingi darajagacha. Serverdagi qoida bilan bir xil: har daraja 100 XP. */
const XP_PER_LEVEL = 100;

function Metric({ value, label, note, tone }: { value: string; label: string; note: string; tone: string }) {
  return (
    <div className="bg-ink p-6">
      <p className={`t-num text-[2.6rem] leading-none ${tone}`}>{value}</p>
      <p className="mt-3 font-medium">{label}</p>
      <p className="mt-1 text-[0.875rem] text-muted">{note}</p>
    </div>
  );
}

export function Dashboard() {
  const { t } = useI18n();
  const d = t.dash;
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  // Eslatma: bu faqat qulaylik uchun yo'naltirish. Haqiqiy himoya serverda (API) bajariladi.
  useEffect(() => {
    if (loading || leaving) return;
    if (!user) { router.replace("/login"); return; }
    // Admin va ustoz o'z paneliga tushadi — kabinet o'quvchi uchun.
    if (user.role === "ADMIN") router.replace("/admin");
    else if (user.role === "TEACHER") router.replace("/ustoz");
  }, [loading, user, leaving, router]);

  // Statistika ixtiyoriy: kelmasa sahifa baribir ishlaydi (masalan 2FA talab qilinsa).
  useEffect(() => {
    if (!user) return;
    let alive = true;
    api<Stats>("/games/me")
      .then((s) => { if (alive) setStats(s); })
      .catch(() => {});
    return () => { alive = false; };
  }, [user]);

  if (loading || !user) {
    return <PageLoader />;
  }

  const isStaff = user.role === "TEACHER" || user.role === "ADMIN";
  const toNext = stats ? XP_PER_LEVEL - (stats.xp % XP_PER_LEVEL) : 0;
  const pct = stats ? ((stats.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100 : 0;

  return (
    <div className="grid gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-cobalt/25 pb-7">
        <div>
          <h1 className="text-[clamp(2rem,4vw,2.8rem)]">{fmt(d.hello, { name: user.firstName })}</h1>
          <p className="mt-2 text-muted">{t.user.roles[user.role]}</p>
        </div>
        <button
          onClick={async () => {
            setLeaving(true); // "kirmagan" yo'naltirishi bilan poyga bo'lmasligi uchun
            await logout();
            // To'liq qayta yuklash: oldingi foydalanuvchining ma'lumotlari brauzer xotirasidan
            // tozalanadi (o'quv markazi kompyuterlarida muhim).
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- ataylab: to'liq qayta yuklash
            window.location.assign("/");
          }}
          className="btn btn-quiet"
        >
          {t.user.logout}
        </button>
      </div>

      {isStaff && !user.twoFactorEnabled && (
        <p className="alert-error" role="alert">
          {d.twoFa}{" "}
          <Link href="/security" className="underline underline-offset-4">{d.twoFaNow}</Link>
        </p>
      )}

      {/* ═════ Bugungi ish ═════ */}
      <section>
        <div className="grid items-center gap-8 border border-cobalt/30 bg-cobalt/[0.06] p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:gap-12">
          <div>
            <h2 className="text-[1.6rem] sm:text-[2rem]">
              {stats && stats.dueWords > 0 ? fmt(d.dueTitle, { n: stats.dueWords }) : d.doneTitle}
            </h2>
            <p className="mt-3 max-w-[46ch] text-muted">
              {stats && stats.dueWords > 0 ? d.dueText : d.doneText}
            </p>

            {stats && (
              <div className="mt-7 max-w-md">
                <div className="flex items-baseline justify-between text-[0.875rem]">
                  <span className="font-medium">{fmt(t.user.levelN, { n: stats.level })}</span>
                  <span className="text-muted">{fmt(t.user.toNext, { n: toNext })}</span>
                </div>
                <div className="progress-bar mt-2">
                  <span style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </div>

          <Link href="/games" className="btn btn-primary justify-self-start lg:justify-self-end">
            {d.start}
          </Link>
        </div>
      </section>

      {/* ═════ Natijalar ═════ */}
      {stats && (
        <section className="grid gap-px border border-cobalt/25 bg-cobalt/25 sm:grid-cols-2 lg:grid-cols-4">
          <Metric value={String(stats.xp)} label="XP" note={d.xpNote} tone="text-brass" />
          <Metric value={String(stats.streak)} label={d.streak} note={fmt(d.longest, { n: stats.longestStreak })} tone="text-bole" />
          <Metric value={String(stats.learnedWords)} label={d.learned} note={d.learnedNote} tone="text-porcelain" />
          <Metric value={String(stats.masteredWords)} label={d.mastered} note={d.masteredNote} tone="text-turquoise" />
        </section>
      )}

      {/* ═════ Yutuqlar ═════ */}
      {stats && !isStaff && <Achievements stats={stats} />}

      {/* ═════ Bo'limlar ═════ */}
      <section>
        <h2 className="mb-5 text-[1.4rem]">{d.sections}</h2>
        <div className="grid gap-px border border-cobalt/25 bg-cobalt/25 sm:grid-cols-2">
          <Link href="/groups" className="group bg-ink p-7 transition-colors hover:bg-cobalt/10">
            <span className="mb-4 inline-grid size-9 place-items-center border border-cobalt/40 text-cobalt">
              <Icon><circle cx="9" cy="8" r="3.2" /><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><circle cx="17.5" cy="9" r="2.4" /><path d="M17 14c2.5 0 4.5 1.7 4.5 4.5" /></Icon>
            </span>
            <h3 className="text-[1.2rem]">{t.nav.groups}</h3>
            <p className="mt-2 text-[0.9375rem] text-muted">{d.groupsText}</p>
          </Link>

          <Link href="/games" className="group bg-ink p-7 transition-colors hover:bg-cobalt/10">
            <span className="mb-4 inline-grid size-9 place-items-center border border-brass/40 text-brass">
              <Icon><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></Icon>
            </span>
            <h3 className="text-[1.2rem]">{t.nav.games}</h3>
            <p className="mt-2 text-[0.9375rem] text-muted">{d.gamesText}</p>
          </Link>

          <Link href="/kutubxona" className="group bg-ink p-7 transition-colors hover:bg-cobalt/10">
            <span className="mb-4 inline-grid size-9 place-items-center border border-turquoise/40 text-turquoise">
              <Icon><path d="M4 5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 0-2 2z" /><path d="M20 5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2z" /></Icon>
            </span>
            <h3 className="text-[1.2rem]">{t.nav.library}</h3>
            <p className="mt-2 text-[0.9375rem] text-muted">{d.libraryText}</p>
          </Link>

          <Link href="/media" className="group bg-ink p-7 transition-colors hover:bg-cobalt/10">
            <span className="mb-4 inline-grid size-9 place-items-center border border-bole/40 text-bole">
              <Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10 9 5 3-5 3z" /></Icon>
            </span>
            <h3 className="text-[1.2rem]">{t.nav.media}</h3>
            <p className="mt-2 text-[0.9375rem] text-muted">{d.mediaText}</p>
          </Link>

          {isStaff && (
            <Link href="/arizalar" className="group bg-ink p-7 transition-colors hover:bg-cobalt/10">
              <span className="mb-4 inline-grid size-9 place-items-center border border-turquoise/40 text-turquoise">
                <Icon><path d="M4 5h16v14H4z" /><path d="m4 7 8 5 8-5" /></Icon>
              </span>
              <h3 className="text-[1.2rem]">{t.nav.applications}</h3>
              <p className="mt-2 text-[0.9375rem] text-muted">{d.applicationsText}</p>
            </Link>
          )}

          <Link href="/security" className="group bg-ink p-7 transition-colors hover:bg-cobalt/10">
            <span className={`mb-4 inline-grid size-9 place-items-center border ${user.twoFactorEnabled ? "border-turquoise/40 text-turquoise" : "border-bole/50 text-bole"}`}>
              <Icon><path d="M12 3l7 3v6c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6z" /></Icon>
            </span>
            <h3 className="text-[1.2rem]">{d.security}</h3>
            <p className="mt-2 text-[0.9375rem] text-muted">
              {fmt(d.securityText, { state: user.twoFactorEnabled ? d.on : d.off })}
            </p>
          </Link>

          {/* Toq sonli koshinda oxirgi katak bo'sh qolmasligi uchun */}
          {!isStaff && <div className="hidden bg-ink sm:block" aria-hidden="true" />}
        </div>
      </section>
    </div>
  );
}

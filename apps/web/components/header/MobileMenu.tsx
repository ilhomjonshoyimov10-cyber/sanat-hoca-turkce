"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n/client";
import { isActive, useCleanPathname } from "@/lib/path";
import { useDismiss } from "@/lib/useDismiss";
import { LocaleList } from "./LangSwitcher";
import { PUBLIC_LINKS, sectionLinks } from "./links";

/** Tor ekranda: barcha bo'limlar bitta ro'yxatda. */
export function MobileMenu() {
  const { t } = useI18n();
  const { user } = useAuth();
  const pathname = useCleanPathname();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(box, open, close);

  // Boshqa sahifaga o'tilganda menyu yopiladi
  const [seen, setSeen] = useState(pathname);
  if (seen !== pathname) {
    setSeen(pathname);
    setOpen(false);
  }

  // Ochiq menyu ortidagi sahifa siljimasin
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const section = user ? sectionLinks(user.role) : [];
  const item = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      onClick={close}
      aria-current={isActive(pathname, href) ? "page" : undefined}
      className="nav-item text-[1.0625rem]"
    >
      {label}
    </Link>
  );

  return (
    <div ref={box} className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={t.nav.menu}
        className="grid size-10 place-items-center rounded-full text-porcelain transition-colors hover:bg-cobalt/12"
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[4.25rem] z-40 overflow-y-auto border-t border-cobalt/30 bg-ink/97 backdrop-blur-md">
          <nav aria-label={t.nav.main} className="container-page grid gap-1 py-5">
            {PUBLIC_LINKS.map((l) => item(l.href, t.nav[l.key]))}
            {!user && item("/#ariza", t.nav.freeLessonCta)}
          </nav>
          {section.length > 0 && (
            <nav aria-label={t.nav.section} className="container-page grid gap-1 border-t border-cobalt/20 pb-8 pt-5">
              {section.filter((l) => !PUBLIC_LINKS.some((p) => p.href === l.href)).map((l) => item(l.href, t.nav[l.key]))}
            </nav>
          )}
          <div className="container-page border-t border-cobalt/20 pb-10 pt-5">
            <p className="mb-2 px-3 text-[0.75rem] font-bold uppercase tracking-[0.08em] text-muted">{t.lang.title}</p>
            <LocaleList onPick={close} />
          </div>
        </div>
      )}
    </div>
  );
}

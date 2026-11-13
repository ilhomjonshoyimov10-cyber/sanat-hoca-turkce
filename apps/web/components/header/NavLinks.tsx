"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import { isActive, useCleanPathname } from "@/lib/path";
import { PUBLIC_LINKS } from "./links";

/** Sarlavhadagi asosiy havolalar, joriy sahifa belgilangan holda. */
export function NavLinks() {
  const { t } = useI18n();
  const pathname = useCleanPathname();
  return (
    <>
      {PUBLIC_LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={isActive(pathname, l.href) ? "page" : undefined}
          className="nav-item !py-2 text-[0.9375rem] whitespace-nowrap"
        >
          {t.nav[l.key]}
        </Link>
      ))}
    </>
  );
}

/** Suspense ichida pathname hali ma'lum bo'lmaganda — xuddi shu havolalar, belgisiz. */
export function NavLinksStatic() {
  const { t } = useI18n();
  return (
    <>
      {PUBLIC_LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="nav-item !py-2 text-[0.9375rem] whitespace-nowrap">
          {t.nav[l.key]}
        </Link>
      ))}
    </>
  );
}

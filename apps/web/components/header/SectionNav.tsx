"use client";

import Link from "next/link";
import { useAuth, useAuthHint } from "@/lib/auth";
import { useI18n } from "@/lib/i18n/client";
import { isActive, useCleanPathname } from "@/lib/path";
import { sectionLinks } from "./links";

const HIDDEN = ["/login", "/register", "/kirish"];

/**
 * Kirgan foydalanuvchi uchun bo'lim menyusi — sarlavha ostida, bitta qator.
 *
 * Ilgari kabinetda IKKI to'liq sarlavha ustma-ust turardi (har birida
 * logotip, ism, tugmalar). Endi sarlavha bitta; bu — faqat bo'limlar.
 * Bosh sahifaga yo'l: logotip, "Bosh sahifa" havolasi va avatar menyusi.
 */
export function SectionNav() {
  const { t } = useI18n();
  const { user, checked } = useAuth();
  const hinted = useAuthHint();
  const pathname = useCleanPathname();

  if (HIDDEN.some((p) => pathname.startsWith(p))) return null;
  // Tekshiruv paytida joyni band qilib turamiz — sahifa pastga sakramasin
  if (!user) return hinted && !checked ? <div className="h-[3.05rem] border-b border-cobalt/20" aria-hidden="true" /> : null;

  return (
    <div className="border-b border-cobalt/25 bg-cobalt/[0.05]">
      <nav aria-label={t.nav.section} className="container-page flex items-center gap-1 overflow-x-auto py-1.5 [scrollbar-width:none]">
        {sectionLinks(user.role).map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(pathname, l.href) ? "page" : undefined}
            className="nav-item !py-2 text-[0.9375rem] whitespace-nowrap"
          >
            {t.nav[l.key]}
          </Link>
        ))}
      </nav>
    </div>
  );
}

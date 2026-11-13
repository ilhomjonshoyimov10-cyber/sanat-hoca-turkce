import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { site } from "@/lib/content";
import { getT } from "@/lib/i18n/server";
import { HeaderScroll } from "../fx/HeaderScroll";
import { HeaderUser } from "./HeaderUser";
import { LangSwitcher } from "./LangSwitcher";
import { MobileMenu } from "./MobileMenu";
import { NavLinks, NavLinksStatic } from "./NavLinks";
import { SectionNav } from "./SectionNav";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Saytning YAGONA sarlavhasi — ommaviy sahifalarda ham, kabinetda ham.
 *
 *   logotip (→ bosh sahifa) · asosiy havolalar · til · qo'ng'iroqcha · avatar
 *
 * Kirgan foydalanuvchi uchun ostida bo'lim menyusi (SectionNav) chiqadi.
 */
export async function Header() {
  const { t } = await getT();
  return (
    <>
      <header className="site-header">
        <HeaderScroll />
        <div className="container-page flex h-[4.25rem] items-center gap-2 sm:gap-3">
          <Link
            href="/"
            aria-label={`${site.name} — ${t.nav.home}`}
            className="group flex min-w-0 shrink items-center gap-2 font-display text-[1.02rem] font-semibold tracking-[-0.02em] sm:gap-2.5 sm:text-[1.3rem]"
          >
            <Image
              src="/brand/logo-256.webp"
              alt=""
              width={44}
              height={44}
              priority
              className="brand-logo size-9 shrink-0 transition-transform duration-500 [transition-timing-function:var(--ease-out)] group-hover:-translate-y-0.5 group-hover:rotate-[-4deg] sm:size-11"
            />
            <span className="truncate whitespace-nowrap max-[350px]:hidden">{site.name}</span>
          </Link>

          <nav aria-label={t.nav.main} className="ml-4 hidden items-center gap-0.5 lg:flex">
            {/* usePathname() so'rov vaqtida ma'lum bo'ladi — Suspense kerak */}
            <Suspense fallback={<NavLinksStatic />}>
              <NavLinks />
            </Suspense>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Telefonda til tanlash menyu ichida — sarlavhaga sig'maydi */}
            <div className="max-sm:hidden">
              <LangSwitcher />
            </div>
            <div className="max-sm:hidden">
              <ThemeToggle />
            </div>
            <HeaderUser />
            <Suspense fallback={null}>
              <MobileMenu />
            </Suspense>
          </div>
        </div>
      </header>
      <Suspense fallback={null}>
        <SectionNav />
      </Suspense>
    </>
  );
}

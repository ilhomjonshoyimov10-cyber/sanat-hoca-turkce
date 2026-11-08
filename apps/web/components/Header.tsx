import Link from "next/link";
import { Mosque } from "./fx/Mosque";
import { HeaderAuth } from "./fx/HeaderAuth";
import { HeaderScroll } from "./fx/HeaderScroll";
import { site } from "@/lib/content";

export function Header() {
  return (
    <header className="site-header">
      <HeaderScroll />
      <div className="container-page flex h-[4.25rem] items-center justify-between gap-3">
        <Link href="/" className="group flex items-center gap-2.5 font-display text-[1.15rem] font-semibold tracking-[-0.02em] sm:text-[1.3rem]">
          <Mosque className="size-8 text-brass transition-transform duration-500 [transition-timing-function:var(--ease-out)] group-hover:-translate-y-0.5" />
          <span className="whitespace-nowrap">{site.name}</span>
        </Link>

        <nav aria-label="Asosiy menyu" className="flex items-center gap-2 sm:gap-6">
          <Link href="/#darajalar" className="hidden text-[0.9375rem] font-medium text-muted transition-colors hover:text-porcelain md:inline">Darajalar</Link>
          <Link href="/#ariza" className="hidden text-[0.9375rem] font-medium text-muted transition-colors hover:text-porcelain md:inline">Ariza</Link>
          <HeaderAuth />
        </nav>
      </div>
    </header>
  );
}

import Link from "next/link";
import { Mosque } from "./fx/Mosque";
import { contact } from "@/lib/about";
import { site } from "@/lib/content";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-cobalt/25 bg-well text-on-navy">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass/50 to-transparent" />
      <div className="container-page flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 font-display text-[1.15rem] font-semibold tracking-[-0.02em]">
          <Mosque className="size-7 text-brass" />
          {site.name}
        </div>
        <nav aria-label="Pastki menyu" className="flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem] font-medium text-muted">
          <Link href="/biz-haqimizda" className="transition-colors hover:text-porcelain">Biz haqimizda</Link>
          <Link href="/maxfiylik" className="transition-colors hover:text-porcelain">Maxfiylik siyosati</Link>
          <Link href="/login" className="transition-colors hover:text-porcelain">Kirish</Link>
          <Link href="/#ariza" className="transition-colors hover:text-porcelain">Ariza</Link>
        </nav>
        <div className="text-sm text-muted">
          <a href={contact.phoneHref} className="block transition-colors hover:text-porcelain">{contact.phone}</a>
          <a href={contact.telegramChannel} target="_blank" rel="noopener noreferrer" className="block transition-colors hover:text-porcelain">
            {contact.telegramChannelLabel}
          </a>
          <p className="mt-1">© {site.name}</p>
        </div>
      </div>
    </footer>
  );
}

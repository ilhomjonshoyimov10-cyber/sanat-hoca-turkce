import Link from "next/link";
import { contact } from "@/lib/about";
import { site } from "@/lib/content";
import { getT } from "@/lib/i18n/server";
import { Mosque } from "./fx/Mosque";

export async function Footer() {
  const { t } = await getT();
  const col = "grid content-start gap-2.5 text-[0.9375rem] text-muted";
  const link = "transition-colors hover:text-porcelain";
  return (
    <footer className="relative mt-24 border-t border-cobalt/25 bg-well text-on-navy">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass/50 to-transparent" />
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5 font-display text-[1.15rem] font-semibold tracking-[-0.02em]">
            <Mosque className="size-7 text-brass" />
            {site.name}
          </Link>
          <p className="mt-3 max-w-[30ch] text-[0.9375rem] text-muted">{t.meta.title}</p>
        </div>

        <nav aria-label={t.nav.footer} className={col}>
          <p className="mb-1 text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-porcelain">{t.footer.learn}</p>
          <Link href="/kutubxona" className={link}>{t.nav.library}</Link>
          <Link href="/media" className={link}>{t.nav.media}</Link>
          <Link href="/games" className={link}>{t.nav.games}</Link>
          <Link href="/#darajalar" className={link}>{t.nav.levels}</Link>
        </nav>

        <div className={col}>
          <p className="mb-1 text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-porcelain">{t.footer.center}</p>
          <Link href="/biz-haqimizda" className={link}>{t.nav.about}</Link>
          <Link href="/#ariza" className={link}>{t.nav.apply}</Link>
          <Link href="/login" className={link}>{t.nav.login}</Link>
          <Link href="/maxfiylik" className={link}>{t.nav.privacy}</Link>
        </div>

        <div className={col}>
          <p className="mb-1 text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-porcelain">{t.footer.contact}</p>
          <a href={contact.phoneHref} className={link}>{contact.phone}</a>
          <a href={contact.telegramChannel} target="_blank" rel="noopener noreferrer" className={link}>{contact.telegramChannelLabel}</a>
          <a href={contact.telegramPerson} target="_blank" rel="noopener noreferrer" className={link}>{contact.telegramPersonLabel}</a>
          <span>{t.about.addressLine}</span>
        </div>
      </div>
      <div className="border-t border-cobalt/15">
        <p className="container-page py-5 text-[0.8125rem] text-muted">© {site.name} · {t.footer.rights}</p>
      </div>
    </footer>
  );
}

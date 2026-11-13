import type { Metadata } from "next";
import Link from "next/link";
import { BookCover } from "@/components/library/BookCover";
import { fmt } from "@/lib/i18n/config";
import { getT } from "@/lib/i18n/server";
import { blurbFor, BOOKS, wordCount } from "@/lib/library";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.meta.library, description: t.meta.libraryDescription };
}

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;

export default async function LibraryPage() {
  const { t, locale } = await getT();
  const L = t.library;
  return (
    <div className="relative overflow-x-clip">
      <div className="cini-field absolute inset-x-0 top-0 -z-10 h-[26rem] opacity-70 [mask-image:linear-gradient(180deg,#000,transparent)]" aria-hidden="true" />
      <div className="container-page py-12 lg:py-16">
        <header className="mb-12 max-w-3xl">
          <p className="flex items-center gap-2.5 text-sm font-medium text-brass">
            <span className="size-1.5 rotate-45 bg-brass" />
            {L.original}
          </p>
          <h1 className="mt-3 text-[clamp(2.3rem,5vw,3.6rem)]">{L.title}</h1>
          <p className="mt-4 text-lg text-muted">{L.lead}</p>
        </header>

        {LEVELS.map((lvl) => {
          const list = BOOKS.filter((b) => b.level === lvl);
          if (list.length === 0) return null;
          const name = t.home.levels.find((l) => l.code === lvl)?.name ?? "";
          return (
            <section key={lvl} aria-labelledby={`lvl-${lvl}`} className="mb-14">
              <h2 id={`lvl-${lvl}`} className="mb-6 flex items-baseline gap-3 border-b border-cobalt/25 pb-3 text-[1.5rem]">
                <span className="level-dot !size-auto !text-[1rem] text-brass">{lvl}</span>
                <span>{name}</span>
              </h2>
              <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((b) => (
                  <li key={b.slug}>
                    <Link href={`/kutubxona/${b.slug}`} className="group grid grid-cols-[7.5rem_1fr] gap-5 sm:grid-cols-[8.5rem_1fr]">
                      <span className="block transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-1.5deg]">
                        <BookCover book={b} size="sm" />
                      </span>
                      <span className="block">
                        <span lang="tr" className="block font-display text-[1.25rem] font-semibold leading-tight tracking-[-0.015em] group-hover:text-brass">
                          {b.title}
                        </span>
                        <span className="mt-2 line-clamp-4 block text-[0.9375rem] text-muted">{blurbFor(b, locale)}</span>
                        <span className="mt-3 block text-[0.8125rem] text-muted">
                          {fmt(L.chapters, { n: b.chapters.length })} · {fmt(L.words, { n: wordCount(b) })}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <div className="grid gap-px border border-cobalt/25 bg-cobalt/25 md:grid-cols-2">
          <div className="bg-ink p-7 sm:p-9">
            <h2 className="text-[1.35rem]">{L.materialsTitle}</h2>
            <p className="mt-3 text-muted">{L.materialsText}</p>
            <Link href="/kitoblar" className="btn btn-outline mt-6 inline-flex">{L.materialsLink}</Link>
          </div>
          <div className="bg-ink p-7 sm:p-9">
            <h2 className="text-[1.35rem]">{L.freeTitle}</h2>
            <p className="mt-3 text-muted">{L.freeText}</p>
            <a href="https://tr.wikisource.org/" target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-6 inline-flex">
              Vikikaynak ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

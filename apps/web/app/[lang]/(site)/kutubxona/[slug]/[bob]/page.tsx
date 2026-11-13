import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChapterReader } from "@/components/library/ChapterReader";
import { fmt } from "@/lib/i18n/config";
import { getT } from "@/lib/i18n/server";
import { BOOKS, findBook, meaning } from "@/lib/library";

export async function generateStaticParams() {
  return BOOKS.flatMap((b) => b.chapters.map((_, i) => ({ slug: b.slug, bob: String(i + 1) })));
}

function resolve(slug: string, bob: string) {
  const book = findBook(slug);
  const n = Number(bob);
  if (!book || !Number.isInteger(n) || n < 1 || n > book.chapters.length) return null;
  return { book, n, chapter: book.chapters[n - 1] };
}

export async function generateMetadata({ params }: PageProps<"/[lang]/kutubxona/[slug]/[bob]">): Promise<Metadata> {
  const { slug, bob } = await params;
  const r = resolve(slug, bob);
  return r ? { title: `${r.chapter.title} — ${r.book.title}` } : {};
}

export default async function ChapterPage({ params }: PageProps<"/[lang]/kutubxona/[slug]/[bob]">) {
  const { slug, bob } = await params;
  const r = resolve(slug, bob);
  if (!r) notFound();
  const { book, n, chapter } = r;
  const { t, locale } = await getT();
  const L = t.library;
  const last = n === book.chapters.length;

  return (
    <article className="container-page max-w-3xl py-10 lg:py-14">
      <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem] text-muted">
        <Link href="/kutubxona" className="hover:text-porcelain">{L.title}</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/kutubxona/${book.slug}`} lang="tr" className="hover:text-porcelain">{book.title}</Link>
      </nav>

      <header className="mb-8 mt-6">
        <p className="flex items-center gap-2.5 text-sm font-medium text-brass">
          <span className="size-1.5 rotate-45 bg-brass" />
          {fmt(L.chapter, { n })} · {book.level}
        </p>
        <h1 lang="tr" className="mt-3 text-[clamp(2rem,4.6vw,3rem)] leading-[1.08]">{chapter.title}</h1>
      </header>

      <ChapterReader slug={book.slug} chapter={n} paragraphs={chapter.paragraphs} glossary={chapter.glossary} />

      {/* Tushunish savollari: JavaScript'siz ham ishlaydi */}
      <section className="mt-14 border border-cobalt/25 bg-cobalt/[0.05] p-6 sm:p-7">
        <h2 className="text-[1.25rem]">{L.questions}</h2>
        <ol className="mt-4 grid gap-3">
          {chapter.questions.map((q, i) => (
            <li key={i}>
              <details className="group border-b border-cobalt/20 pb-3">
                <summary lang="tr" className="cursor-pointer list-none font-medium marker:hidden">
                  <span className="mr-2 text-brass">{i + 1}.</span>
                  {q.q}
                  <span className="ml-2 text-[0.8125rem] font-normal text-muted group-open:hidden">— {L.showAnswer}</span>
                </summary>
                <p lang="tr" className="mt-2 pl-6 text-turquoise">{q.a}</p>
              </details>
            </li>
          ))}
        </ol>
      </section>

      {/* Bob lug'ati */}
      <section className="mt-10">
        <h2 className="text-[1.25rem]">{L.glossary}</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
          {chapter.glossary.map((g) => (
            <div key={g.key} className="flex items-baseline gap-3 border-b border-cobalt/15 pb-2">
              <dt lang="tr" className="font-display font-semibold text-brass">{g.key}</dt>
              <dd className="text-[0.9375rem] text-muted">{meaning(g, locale)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {last && (
        <div className="mt-12 border border-turquoise/40 bg-turquoise/[0.07] p-6 text-center">
          <p className="font-display text-[1.5rem] font-semibold text-turquoise">{L.finished}</p>
          <p className="mx-auto mt-2 max-w-md text-muted">{L.finishedText}</p>
        </div>
      )}

      <nav className="mt-10 flex flex-wrap justify-between gap-3">
        {n > 1 ? (
          <Link href={`/kutubxona/${book.slug}/${n - 1}`} className="btn btn-outline">{L.prevChapter}</Link>
        ) : <span />}
        {!last ? (
          <Link href={`/kutubxona/${book.slug}/${n + 1}`} className="btn btn-primary">{L.nextChapter}</Link>
        ) : (
          <Link href="/kutubxona" className="btn btn-primary">{L.backToLibrary}</Link>
        )}
      </nav>
    </article>
  );
}

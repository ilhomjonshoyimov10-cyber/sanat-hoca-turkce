import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCover } from "@/components/library/BookCover";
import { BookStart, DoneMark } from "@/components/library/BookProgress";
import { fmt } from "@/lib/i18n/config";
import { getT } from "@/lib/i18n/server";
import { blurbFor, BOOKS, findBook, wordCount } from "@/lib/library";

export async function generateStaticParams() {
  return BOOKS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/kutubxona/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const book = findBook(slug);
  const { locale } = await getT();
  return book ? { title: book.title, description: blurbFor(book, locale) } : {};
}

export default async function BookPage({ params }: PageProps<"/[lang]/kutubxona/[slug]">) {
  const { slug } = await params;
  const book = findBook(slug);
  if (!book) notFound();
  const { t, locale } = await getT();
  const L = t.library;

  return (
    <div className="container-page py-10 lg:py-14">
      <Link href="/kutubxona" className="text-[0.9375rem] text-muted transition-colors hover:text-porcelain">{L.backToLibrary}</Link>
      <div className="mt-8 grid items-start gap-10 md:grid-cols-[16rem_1fr] lg:gap-16">
        <div className="mx-auto w-full max-w-[16rem]">
          <BookCover book={book} size="lg" />
        </div>
        <div>
          <span className="badge">{book.level}</span>
          <h1 lang="tr" className="mt-3 text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.05]">{book.title}</h1>
          <p className="mt-5 max-w-[56ch] text-lg text-muted">{blurbFor(book, locale)}</p>
          <p className="mt-4 text-[0.9375rem] text-muted">
            {fmt(L.chapters, { n: book.chapters.length })} · {fmt(L.words, { n: wordCount(book) })} · {L.original}
          </p>
          <div className="mt-8">
            <BookStart slug={book.slug} total={book.chapters.length} />
          </div>

          <h2 className="mt-12 text-[1.3rem]">{L.contents}</h2>
          <ol className="mt-4 grid border-t border-cobalt/25">
            {book.chapters.map((c, i) => (
              <li key={c.title} className="border-b border-cobalt/20">
                <Link href={`/kutubxona/${book.slug}/${i + 1}`} className="group flex items-center gap-4 py-3.5 transition-colors hover:text-brass">
                  <span className="t-num w-8 text-[1.3rem] text-brass">{i + 1}</span>
                  <span lang="tr" className="flex-1 font-display text-[1.15rem] font-semibold">{c.title}</span>
                  <DoneMark slug={book.slug} chapter={i + 1} />
                  <span className="text-muted transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

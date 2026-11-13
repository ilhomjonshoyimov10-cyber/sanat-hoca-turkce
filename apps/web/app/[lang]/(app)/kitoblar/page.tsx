import type { Metadata } from "next";
import { Suspense } from "react";
import { BooksPanel } from "@/components/books/BooksPanel";
import { PageLoader } from "@/components/Loader";

export const metadata: Metadata = { title: "Materiallar", robots: { index: false } };

export default function Page() {
  return (
    <div className="container-page max-w-5xl py-12">
      <h1 className="mb-2 font-display text-3xl font-bold">Materiallar</h1>
      <p className="mb-8 text-muted">Kitoblar, mashq daftarlari va ustoz qo&apos;shgan qo&apos;llanmalar.</p>
      <Suspense fallback={<PageLoader />}>
        <BooksPanel />
      </Suspense>
    </div>
  );
}

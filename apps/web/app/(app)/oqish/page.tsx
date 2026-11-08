import type { Metadata } from "next";
import { Suspense } from "react";
import { ReadingList } from "@/components/reading/ReadingList";

export const metadata: Metadata = { title: "O'qish", robots: { index: false } };

export default function Page() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="mb-2 font-display text-3xl font-bold">O&apos;qish matnlari</h1>
      <p className="mb-8 text-muted">
        Turkcha matnlarni o&apos;qing, qiyin so&apos;zlarni bosib tarjimasini ko&apos;ring, so&apos;ngra
        savollarga javob bering.
      </p>
      <Suspense fallback={<p className="text-muted" role="status">Yuklanmoqda...</p>}>
        <ReadingList />
      </Suspense>
    </div>
  );
}

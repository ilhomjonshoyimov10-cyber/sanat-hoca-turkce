import type { Metadata } from "next";
import { Suspense } from "react";
import { DictionaryPanel } from "@/components/dictionary/DictionaryPanel";
import { PageLoader } from "@/components/Loader";

export const metadata: Metadata = { title: "Lug'at", robots: { index: false } };

export default function Page() {
  return (
    <div className="container-page max-w-6xl py-12">
      <h1 className="mb-2 font-display text-3xl font-bold">Lug&apos;at</h1>
      <p className="mb-8 text-muted">
        So&apos;zlarni qo&apos;shish, tahrirlash va tasdiqlash. Faqat tasdiqlangan so&apos;zlar
        o&apos;yinlarga tushadi.
      </p>
      <Suspense fallback={<PageLoader />}>
        <DictionaryPanel />
      </Suspense>
    </div>
  );
}

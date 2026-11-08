import type { Metadata } from "next";
import { Suspense } from "react";
import { AiPanel } from "@/components/ai/AiPanel";

export const metadata: Metadata = { title: "AI yordamchi", robots: { index: false } };

export default function Page() {
  return (
    <div className="container-page max-w-5xl py-12">
      <h1 className="mb-2 font-display text-3xl font-bold">AI yordamchi</h1>
      <p className="mb-7 text-muted">
        Turkcha mashq qiling, xatolaringizni tuzatib oling, so&apos;z va qoidalarni so&apos;rang.
      </p>
      <Suspense fallback={<p className="text-muted" role="status">Yuklanmoqda...</p>}>
        <AiPanel />
      </Suspense>
    </div>
  );
}

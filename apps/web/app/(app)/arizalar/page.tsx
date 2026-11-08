import type { Metadata } from "next";
import { LeadsPanel } from "@/components/LeadsPanel";

export const metadata: Metadata = { title: "Arizalar", robots: { index: false } };

export default function Page() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="mb-6 font-display text-3xl font-bold">Bepul sinov darsiga arizalar</h1>
      <LeadsPanel />
    </div>
  );
}

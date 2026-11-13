import type { Metadata } from "next";
import { SecurityPanel } from "@/components/SecurityPanel";

export const metadata: Metadata = { title: "Xavfsizlik", robots: { index: false } };

export default function Page() {
  return (
    <div className="container-page max-w-xl py-12">
      <h1 className="mb-6 font-display text-3xl font-bold">2FA va hisob himoyasi</h1>
      <SecurityPanel />
    </div>
  );
}

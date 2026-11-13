import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { PageLoader } from "@/components/Loader";

export const metadata: Metadata = { title: "Administrator paneli", robots: { index: false } };

export default function Page() {
  return (
    <div className="container-page py-10">
      {/* useSearchParams (?tab=...) — Suspense ichida bo'lishi shart */}
      <Suspense fallback={<PageLoader />}>
        <AdminPanel />
      </Suspense>
    </div>
  );
}

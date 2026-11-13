import type { Metadata } from "next";
import { Suspense } from "react";
import { GroupDetail } from "@/components/GroupDetail";

export const metadata: Metadata = { title: "Guruh", robots: { index: false } };

export default function Page() {
  return (
    <div className="container-page max-w-4xl py-12">
      {/* useParams() so'rov vaqtida ma'lum bo'ladi, shuning uchun Suspense kerak */}
      <Suspense fallback={<p className="text-muted" role="status">Yuklanmoqda...</p>}>
        <GroupDetail />
      </Suspense>
    </div>
  );
}

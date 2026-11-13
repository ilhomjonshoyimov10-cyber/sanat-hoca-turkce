import type { Metadata } from "next";
import { Suspense } from "react";
import { GroupDetail } from "@/components/GroupDetail";
import { PageLoader } from "@/components/Loader";

export const metadata: Metadata = { title: "Guruh", robots: { index: false } };

export default function Page() {
  return (
    <div className="container-page max-w-4xl py-12">
      {/* useParams() so'rov vaqtida ma'lum bo'ladi, shuning uchun Suspense kerak */}
      <Suspense fallback={<PageLoader />}>
        <GroupDetail />
      </Suspense>
    </div>
  );
}

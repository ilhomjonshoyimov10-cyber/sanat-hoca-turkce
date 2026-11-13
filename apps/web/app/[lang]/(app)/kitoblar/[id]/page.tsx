import type { Metadata } from "next";
import { Suspense } from "react";
import { BookDetail } from "@/components/books/BookDetail";
import { PageLoader } from "@/components/Loader";

export const metadata: Metadata = { title: "Material", robots: { index: false } };

export default function Page() {
  return (
    <div className="container-page max-w-3xl py-12">
      {/* useParams() so'rov vaqtida ma'lum bo'ladi, shuning uchun Suspense kerak */}
      <Suspense fallback={<PageLoader />}>
        <BookDetail />
      </Suspense>
    </div>
  );
}

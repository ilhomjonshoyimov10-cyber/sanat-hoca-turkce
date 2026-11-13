import type { Metadata } from "next";
import { Suspense } from "react";
import { BookDetail } from "@/components/books/BookDetail";

export const metadata: Metadata = { title: "Material", robots: { index: false } };

export default function Page() {
  return (
    <div className="container-page max-w-3xl py-12">
      {/* useParams() so'rov vaqtida ma'lum bo'ladi, shuning uchun Suspense kerak */}
      <Suspense fallback={<p className="text-muted" role="status">Yuklanmoqda...</p>}>
        <BookDetail />
      </Suspense>
    </div>
  );
}

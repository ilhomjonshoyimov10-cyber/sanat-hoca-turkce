import { Suspense } from "react";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { AppBar } from "@/components/AppBar";
import { AuthProvider } from "@/lib/auth";

// Faqat kirish/ro'yxatdan o'tish/kabinet sahifalarida auth holati yuklanadi.
// Ommaviy sahifalar (bosh sahifa) statik qoladi: tez va Google uchun qulay.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* AppBar usePathname() o'qiydi — u so'rov vaqtida ma'lum, shuning uchun Suspense kerak */}
      <Suspense fallback={<div className="h-[3.25rem] border-b border-cobalt/25" />}>
        <AppBar />
      </Suspense>
      {/* Admin e'lonlari: mazmundan OLDIN, lekin uni to'smaydi */}
      <AnnouncementBar />
      {children}
    </AuthProvider>
  );
}

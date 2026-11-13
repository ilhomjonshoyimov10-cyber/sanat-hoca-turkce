import { AuthRequired } from "@/lib/auth";

// Kabinet sahifalari: kirganlik ALBATTA tekshirilsin (ommaviy sahifalarda
// esa faqat "kirgan" belgisi bo'lsa tekshiriladi — mehmon uchun so'rov yo'q).
// Sarlavha va e'lonlar endi umumiy maketda (app/[lang]/layout.tsx).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthRequired />
      {children}
    </>
  );
}

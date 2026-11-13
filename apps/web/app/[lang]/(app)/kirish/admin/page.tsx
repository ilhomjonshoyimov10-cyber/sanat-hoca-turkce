import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Administrator kirishi", robots: { index: false } };

export default function Page() {
  return (
    <AuthShell
      title="Administrator kirishi"
      lead="Foydalanuvchilar, guruhlar va tizim sozlamalari."
      word="yönetim"
      translation="boshqaruv"
      sentence="Yetki, sorumluluk demektir."
      footer={
        <>
          <p>Bu sahifa faqat markaz ma&apos;muriyati uchun.</p>
          <p className="mt-2">
            <Link href="/login" className="font-medium text-brass underline underline-offset-4">
              O&apos;quvchi kirishi
            </Link>
            {" · "}
            <Link href="/kirish/ustoz" className="font-medium text-brass underline underline-offset-4">
              Ustoz kirishi
            </Link>
          </p>
        </>
      }
    >
      <p className="alert-error mb-5" role="note">
        Administrator hisobida 2FA majburiy. Kirish urinishlari audit jurnaliga yoziladi.
      </p>
      <LoginForm />
    </AuthShell>
  );
}

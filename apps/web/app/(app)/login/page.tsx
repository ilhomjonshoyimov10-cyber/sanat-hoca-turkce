import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Kirish", robots: { index: false } };

export default function LoginPage() {
  return (
    <AuthShell
      title="Kirish"
      lead="Darslaringiz, o'yinlaringiz va guruhingiz shu yerda."
      word="hoş geldin"
      translation="xush kelibsiz"
      sentence="Tekrar hoş geldin! Bugün hangi kelimeleri tekrar edeceksin?"
      footer={
        <>
          <p>
            Hisobingiz yo&apos;qmi?{" "}
            <Link href="/register" className="font-medium text-brass underline underline-offset-4">
              Ro&apos;yxatdan o&apos;ting
            </Link>
          </p>
          <p className="mt-2 text-[0.875rem]">
            <Link href="/kirish/ustoz" className="underline underline-offset-4 hover:text-porcelain">
              Ustoz kirishi
            </Link>
            {" · "}
            <Link href="/kirish/admin" className="underline underline-offset-4 hover:text-porcelain">
              Administrator kirishi
            </Link>
          </p>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}

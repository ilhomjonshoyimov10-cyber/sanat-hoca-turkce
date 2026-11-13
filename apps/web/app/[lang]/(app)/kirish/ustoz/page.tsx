import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Ustoz kirishi", robots: { index: false } };

export default function Page() {
  return (
    <AuthShell
      title="Ustoz kirishi"
      lead="Guruhlaringiz, baholash va video darslar shu yerda."
      word="öğretmen"
      translation="ustoz"
      sentence="Bir öğretmen bir kitaptan daha çok şey öğretir."
      footer={
        <>
          <p>
            Ustoz hisobini administrator ochadi. Hisobingiz bo&apos;lmasa, markaz
            ma&apos;muriyatiga murojaat qiling.
          </p>
          <p className="mt-2">
            O&apos;quvchimisiz?{" "}
            <Link href="/login" className="font-medium text-brass underline underline-offset-4">
              O&apos;quvchi kirishi
            </Link>
          </p>
        </>
      }
    >
      <p className="alert-success mb-5" role="note">
        Ustoz hisobida ikki bosqichli tasdiqlash (2FA) majburiy — telefoningizdagi
        autentifikator ilovasi kerak bo&apos;ladi.
      </p>
      <LoginForm />
    </AuthShell>
  );
}

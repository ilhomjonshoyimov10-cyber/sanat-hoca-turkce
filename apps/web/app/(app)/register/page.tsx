import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = { title: "Ro'yxatdan o'tish", robots: { index: false } };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Ro'yxatdan o'tish"
      lead="Bir daqiqa oladi. Keyin birinchi o'yiningizni boshlaysiz."
      word="başlangıç"
      translation="boshlanish"
      sentence="Her usta bir zamanlar çıraktı. Sen de bugün başla."
      footer={
        <>
          Hisobingiz bormi?{" "}
          <Link href="/login" className="font-medium text-brass underline underline-offset-4">
            Kiring
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}

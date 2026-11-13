import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.meta.login, robots: { index: false } };
}

export default async function LoginPage() {
  const { t } = await getT();
  const a = t.auth;
  return (
    <AuthShell
      title={a.loginTitle}
      lead={a.loginLead}
      word="hoş geldin"
      translation={a.loginWord}
      sentence="Tekrar hoş geldin! Bugün hangi kelimeleri tekrar edeceksin?"
      footer={
        <>
          <p>
            {a.noAccount}{" "}
            <Link href="/register" className="font-medium text-brass underline underline-offset-4">
              {a.registerLink}
            </Link>
          </p>
          <p className="mt-2 text-[0.875rem]">
            <Link href="/kirish/ustoz" className="underline underline-offset-4 hover:text-porcelain">
              {a.teacherLogin}
            </Link>
            {" · "}
            <Link href="/kirish/admin" className="underline underline-offset-4 hover:text-porcelain">
              {a.adminLogin}
            </Link>
          </p>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/RegisterForm";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.meta.register, robots: { index: false } };
}

export default async function RegisterPage() {
  const { t } = await getT();
  const a = t.auth;
  return (
    <AuthShell
      title={a.registerTitle}
      lead={a.registerLead}
      word="başlangıç"
      translation={a.registerWord}
      sentence="Her usta bir zamanlar çıraktı. Sen de bugün başla."
      footer={
        <>
          {a.haveAccount}{" "}
          <Link href="/login" className="font-medium text-brass underline underline-offset-4">
            {a.loginLink}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}

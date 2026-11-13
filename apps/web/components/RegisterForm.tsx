"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useHydrated } from "@/lib/hydrated";
import { useI18n } from "@/lib/i18n/client";

export function RegisterForm() {
  const { t } = useI18n();
  const a = t.auth;
  const { register } = useAuth();
  const router = useRouter();
  const hydrated = useHydrated();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    const email = String(d.get("email") ?? "").trim();
    const phone = String(d.get("phone") ?? "").trim();

    if (!email && !phone) {
      setError(a.contactHelp);
      return;
    }

    setLoading(true);
    setError("");
    try {
      await register({
        firstName: String(d.get("firstName") ?? "").trim(),
        lastName: String(d.get("lastName") ?? "").trim(),
        email: email || undefined,
        phone: phone || undefined,
        password: String(d.get("password") ?? ""),
        birthDate: String(d.get("birthDate") ?? ""),
        acceptTerms: true,
      });
      form.reset(); // parol maydoni brauzer xotirasida qolmasin
      setLoading(false);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.common.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} method="post" className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="label">{a.firstName}</label>
          <input id="firstName" name="firstName" required minLength={2} maxLength={50} autoComplete="given-name" className="input" />
        </div>
        <div>
          <label htmlFor="lastName" className="label">{a.lastName}</label>
          <input id="lastName" name="lastName" required minLength={2} maxLength={50} autoComplete="family-name" className="input" />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="label">{a.email}</label>
        <input id="email" name="email" type="email" maxLength={254} autoComplete="email" className="input" />
      </div>
      <div>
        <label htmlFor="phone" className="label">{a.phone}</label>
        <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+998 90 123 45 67" className="input" />
        <p className="help">{a.contactHelp}</p>
      </div>

      <div>
        <label htmlFor="birthDate" className="label">{a.birthDate}</label>
        <input id="birthDate" name="birthDate" type="date" required autoComplete="bday" className="input" />
      </div>

      <div>
        <label htmlFor="password" className="label">{a.password}</label>
        <div className="flex gap-2">
          <input
            id="password" name="password" required minLength={10} maxLength={128}
            type={showPassword ? "text" : "password"} autoComplete="new-password" className="input"
          />
          <button type="button" onClick={() => setShowPassword((v) => !v)} className="btn btn-outline shrink-0 !px-3 text-sm" aria-pressed={showPassword}>
            {showPassword ? a.hide : a.show}
          </button>
        </div>
        <p className="help">{a.passwordHelp}</p>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="terms" required className="mt-1 size-5 shrink-0 accent-primary" />
        <span>
          <Link href="/maxfiylik" className="font-medium text-brass underline underline-offset-4">{t.nav.privacy}</Link> {a.termsA}
        </span>
      </label>

      {error && <p className="alert-error" role="alert">{error}</p>}
      <button type="submit" disabled={loading || !hydrated} className="btn btn-primary">
        {loading ? a.creating : a.create}
      </button>
    </form>
  );
}

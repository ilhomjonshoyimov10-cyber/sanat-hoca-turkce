"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useHydrated } from "@/lib/hydrated";

export function RegisterForm() {
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
      setError("Email yoki telefon raqamdan kamida bittasini kiriting");
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
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi. Qayta urinib ko'ring");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} method="post" className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="label">Ism</label>
          <input id="firstName" name="firstName" required minLength={2} maxLength={50} autoComplete="given-name" className="input" />
        </div>
        <div>
          <label htmlFor="lastName" className="label">Familiya</label>
          <input id="lastName" name="lastName" required minLength={2} maxLength={50} autoComplete="family-name" className="input" />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" maxLength={254} autoComplete="email" className="input" />
      </div>
      <div>
        <label htmlFor="phone" className="label">Telefon raqam</label>
        <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+998 90 123 45 67" className="input" />
        <p className="help">Email yoki telefon raqamdan kamida bittasini kiriting.</p>
      </div>

      <div>
        <label htmlFor="birthDate" className="label">Tug&apos;ilgan sana</label>
        <input id="birthDate" name="birthDate" type="date" required autoComplete="bday" className="input" />
      </div>

      <div>
        <label htmlFor="password" className="label">Parol</label>
        <div className="flex gap-2">
          <input
            id="password" name="password" required minLength={10} maxLength={128}
            type={showPassword ? "text" : "password"} autoComplete="new-password" className="input"
          />
          <button type="button" onClick={() => setShowPassword((v) => !v)} className="btn btn-outline shrink-0 !px-3 text-sm" aria-pressed={showPassword}>
            {showPassword ? "Yashirish" : "Ko'rsatish"}
          </button>
        </div>
        <p className="help">Kamida 10 belgi. Bir nechta so&apos;zdan iborat uzun parol eng yaxshisi.</p>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="terms" required className="mt-1 size-5 shrink-0 accent-primary" />
        <span>
          <Link href="/maxfiylik" className="font-medium text-brass underline underline-offset-4">Maxfiylik siyosati</Link> bilan tanishdim va shaxsiy ma&apos;lumotlarimni qayta ishlashga roziman.
        </span>
      </label>

      {error && <p className="alert-error" role="alert">{error}</p>}
      <button type="submit" disabled={loading || !hydrated} className="btn btn-primary">
        {loading ? "Yaratilmoqda..." : "Ro'yxatdan o'tish"}
      </button>
    </form>
  );
}

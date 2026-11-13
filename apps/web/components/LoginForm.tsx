"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useHydrated } from "@/lib/hydrated";
import { useI18n } from "@/lib/i18n/client";
// Rolga qarab o'z paneliga: admin, ustoz va o'quvchi alohida joyga tushadi
import { homeFor } from "./header/links";

export function LoginForm() {
  const { t } = useI18n();
  const a = t.auth;
  const { login, verifyTwoFactor, reloadUser } = useAuth();
  const router = useRouter();
  const hydrated = useHydrated();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<string | null>(null);

  const fail = (err: unknown) => {
    setError(err instanceof ApiError ? err.message : t.common.error);
    setLoading(false);
  };

  async function onPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setLoading(true);
    setError("");
    try {
      const res = await login(String(data.get("identifier") ?? ""), String(data.get("password") ?? ""));
      form.reset(); // parol maydoni brauzer xotirasida qolmasin
      if (res.status === "2fa") {
        setChallenge(res.challenge);
        setLoading(false);
      } else if (res.mustSetup2fa) {
        router.push("/security");
      } else {
        // Rolni bilish uchun foydalanuvchini yuklab olamiz, keyin o'z paneliga yuboramiz
        const me = await reloadUser();
        router.push(homeFor(me?.role));
      }
    } catch (err) {
      fail(err);
    }
  }

  async function onCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!challenge) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    setLoading(true);
    setError("");
    try {
      await verifyTwoFactor(challenge, String(data.get("code") ?? "").trim());
      form.reset();
      const me = await reloadUser();
      router.push(homeFor(me?.role));
    } catch (err) {
      fail(err);
    }
  }

  if (challenge) {
    return (
      <form onSubmit={onCode} method="post" className="grid gap-4">
        <p className="text-muted">{a.codeHelp}</p>
        <div>
          <label htmlFor="code" className="label">{a.code}</label>
          <input
            id="code" name="code" required autoFocus inputMode="text" autoComplete="one-time-code"
            maxLength={20} className="input tracking-widest"
          />
        </div>
        {error && <p className="alert-error" role="alert">{error}</p>}
        <button type="submit" disabled={loading || !hydrated} className="btn btn-primary">
          {loading ? a.verifying : a.verify}
        </button>
        <button type="button" onClick={() => { setChallenge(null); setError(""); }} className="text-center text-[0.9375rem] font-medium text-muted underline underline-offset-4">
          {t.common.back}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onPassword} method="post" className="grid gap-4">
      <div>
        <label htmlFor="identifier" className="label">{a.identifier}</label>
        <input id="identifier" name="identifier" required autoComplete="username" className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">{a.password}</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      {error && <p className="alert-error" role="alert">{error}</p>}
      <button type="submit" disabled={loading || !hydrated} className="btn btn-primary">
        {loading ? a.submitting : a.submit}
      </button>
    </form>
  );
}

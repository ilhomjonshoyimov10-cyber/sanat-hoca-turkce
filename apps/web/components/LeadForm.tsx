"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useHydrated } from "@/lib/hydrated";
import { useI18n } from "@/lib/i18n/client";

type Status = "idle" | "loading" | "success" | "error";

export function LeadForm() {
  const { t } = useI18n();
  const f = t.lead;
  const hydrated = useHydrated();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("loading");
    setError("");

    try {
      await api("/leads", {
        method: "POST",
        body: {
          name: String(data.get("name") ?? ""),
          phone: String(data.get("phone") ?? ""),
          level: String(data.get("level") ?? "") || undefined,
          message: String(data.get("message") ?? "") || undefined,
          website: String(data.get("website") ?? ""), // yashirin tuzoq maydon (botlar uchun)
          consent: data.get("consent") === "on",
        },
      });
      form.reset();
      setStatus("success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.common.error);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="alert-success" role="status">
        {f.success}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} method="post" className="grid gap-4" noValidate={false}>
      <div>
        <label htmlFor="lead-name" className="label">{f.name}</label>
        <input id="lead-name" name="name" required minLength={2} maxLength={80} autoComplete="name" className="input" />
      </div>

      <div>
        <label htmlFor="lead-phone" className="label">{f.phone}</label>
        <input
          id="lead-phone" name="phone" type="tel" required inputMode="tel" autoComplete="tel"
          placeholder="+998 90 123 45 67" className="input"
        />
      </div>

      <div>
        <label htmlFor="lead-level" className="label">{f.level}</label>
        <select id="lead-level" name="level" defaultValue="" className="input">
          <option value="">{f.levelUnknown}</option>
          {t.home.levels.map((l) => (
            <option key={l.code} value={l.code}>{l.code}: {l.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="lead-message" className="label">{f.message}</label>
        <textarea id="lead-message" name="message" rows={3} maxLength={500} className="input" />
      </div>

      {/* Tuzoq maydon: odamlarga ko'rinmaydi, botlar to'ldiradi */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="lead-website">Veb-sayt</label>
        <input id="lead-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" required className="mt-1 size-5 shrink-0 accent-primary" />
        <span>
          {f.consent}{" "}
          <Link href="/maxfiylik" className="font-bold underline">{t.nav.privacy}</Link>
        </span>
      </label>

      {status === "error" && <p className="alert-error" role="alert">{error}</p>}

      <button type="submit" disabled={status === "loading" || !hydrated} className="btn btn-primary">
        {status === "loading" ? f.sending : f.submit}
      </button>
    </form>
  );
}

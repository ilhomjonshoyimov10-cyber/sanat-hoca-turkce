"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useHydrated } from "@/lib/hydrated";
import { errorText } from "./groups/shared";

interface Profile {
  id: string; email: string | null; phone: string | null;
  firstName: string; lastName: string; role: string;
  bio: string | null; timezone: string;
  twoFactorEnabled: boolean; createdAt: string; lastLoginAt: string | null;
}

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "O'quvchi", TEACHER: "Ustoz", ADMIN: "Administrator", PARENT: "Ota-ona",
};

export function ProfilePanel() {
  const { user, loading, reloadUser } = useAuth();
  const router = useRouter();
  const hydrated = useHydrated();
  const [p, setP] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    api<Profile>("/users/me/profile").then(setP).catch((e) => setError(errorText(e)));
  }, [user]);

  if (loading || !user) return <p className="text-muted" role="status">Yuklanmoqda...</p>;

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError(""); setNote("");
    try {
      const updated = await api<Profile>("/users/me/profile", {
        method: "PATCH",
        body: {
          firstName: String(f.get("firstName")),
          lastName: String(f.get("lastName")),
          bio: String(f.get("bio") ?? ""),
        },
      });
      setP(updated);
      setNote("Profil saqlandi");
      await reloadUser();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true); setError(""); setNote("");
    try {
      await api("/users/me/password", {
        method: "POST",
        body: { currentPassword: String(f.get("current")), newPassword: String(f.get("next")) },
      });
      form.reset();
      // Parol o'zgarsa server barcha seanslarni uzadi — qaytadan kirish kerak
      setNote("Parol almashtirildi. Xavfsizlik uchun qaytadan kiring.");
      setTimeout(() => router.replace("/login"), 1800);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8">
      <header className="border-b border-cobalt/25 pb-6">
        <h1 className="text-[clamp(1.9rem,4vw,2.6rem)]">Profil</h1>
        <p className="mt-2 text-muted">
          {ROLE_LABEL[user.role] ?? user.role}
          {p?.createdAt && ` · ${new Date(p.createdAt).toLocaleDateString("uz-UZ")} dan beri`}
        </p>
      </header>

      {error && <p className="alert-error" role="alert">{error}</p>}
      {note && <p className="alert-success" role="status">{note}</p>}

      <section aria-labelledby="p-h" className="border border-cobalt/25 bg-cobalt/[0.04] p-6">
        <h2 id="p-h" className="mb-5 text-[1.3rem]">Shaxsiy ma&apos;lumotlar</h2>
        <form onSubmit={saveProfile} method="post" className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="p-fn" className="label">Ism</label>
            <input id="p-fn" name="firstName" defaultValue={p?.firstName ?? ""} key={`fn-${p?.id}`} required maxLength={60} className="input" />
          </div>
          <div>
            <label htmlFor="p-ln" className="label">Familiya</label>
            <input id="p-ln" name="lastName" defaultValue={p?.lastName ?? ""} key={`ln-${p?.id}`} required maxLength={60} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="p-bio" className="label">O&apos;zingiz haqingizda</label>
            <textarea id="p-bio" name="bio" defaultValue={p?.bio ?? ""} key={`bio-${p?.id}`} maxLength={300} rows={3} className="input resize-y" />
            <p className="help">Ixtiyoriy. Ustoz profilida o&apos;quvchilarga ko&apos;rinadi.</p>
          </div>
          <div className="sm:col-span-2">
            <span className="label">Kirish</span>
            <p className="text-muted">{p?.email ?? p?.phone ?? "—"}</p>
            <p className="help">Email yoki telefonni o&apos;zgartirish uchun administratorga murojaat qiling.</p>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy || !hydrated} className="btn btn-primary">Saqlash</button>
          </div>
        </form>
      </section>

      <section aria-labelledby="pw-h" className="border border-cobalt/25 bg-cobalt/[0.04] p-6">
        <h2 id="pw-h" className="mb-5 text-[1.3rem]">Parolni almashtirish</h2>
        <form onSubmit={savePassword} method="post" className="grid max-w-md gap-4">
          <div>
            <label htmlFor="pw-cur" className="label">Joriy parol</label>
            <input id="pw-cur" name="current" type="password" required autoComplete="current-password" className="input" />
          </div>
          <div>
            <label htmlFor="pw-new" className="label">Yangi parol</label>
            <input id="pw-new" name="next" type="password" required minLength={10} autoComplete="new-password" className="input" />
            <p className="help">Kamida 10 belgi. Uzun, oson eslab qoladigan ibora eng kuchli parol.</p>
          </div>
          <div>
            <button type="submit" disabled={busy || !hydrated} className="btn btn-primary">Parolni almashtirish</button>
          </div>
          <p className="help">
            Parol almashtirilgach barcha qurilmalardagi seanslar uziladi — bu hisobingiz o&apos;g&apos;irlangan bo&apos;lsa himoya qiladi.
          </p>
        </form>
      </section>
    </div>
  );
}

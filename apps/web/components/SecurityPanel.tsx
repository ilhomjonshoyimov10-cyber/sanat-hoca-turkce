"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useHydrated } from "@/lib/hydrated";

type Setup = { secret: string; otpauthUrl: string; qr: string };
const message = (e: unknown) => (e instanceof ApiError ? e.message : "Xatolik yuz berdi. Qayta urinib ko'ring");

export function SecurityPanel() {
  const { user, loading, reloadUser } = useAuth();
  const router = useRouter();
  const hydrated = useHydrated();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return <p className="text-muted" role="status">Yuklanmoqda...</p>;
  const mandatory = user.role === "TEACHER" || user.role === "ADMIN";

  async function start() {
    setBusy(true);
    setError("");
    try {
      const data = await api<{ secret: string; otpauthUrl: string }>("/auth/2fa/setup", { method: "POST" });
      const QRCode = (await import("qrcode")).default;
      const qr = await QRCode.toDataURL(data.otpauthUrl, { margin: 1, width: 224 });
      setSetup({ ...data, qr });
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }

  async function enable(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "").trim();
    setBusy(true);
    setError("");
    try {
      const res = await api<{ recoveryCodes: string[] }>("/auth/2fa/enable", { method: "POST", body: { code } });
      setCodes(res.recoveryCodes);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    await reloadUser();
    router.push("/dashboard");
  }

  async function disable(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api("/auth/2fa/disable", {
        method: "POST",
        body: { password: String(d.get("password") ?? ""), code: String(d.get("code") ?? "").trim() },
      });
      await reloadUser();
      setSetup(null);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  // 3) Tiklash kodlari (faqat bir marta ko'rsatiladi)
  if (codes) {
    return (
      <div className="card grid gap-4">
        <h2 className="text-xl font-bold">2FA yoqildi. Tiklash kodlarini saqlang</h2>
        <p className="text-muted">
          Telefoningizni yo&apos;qotsangiz, shu kodlar bilan kirasiz. Har biri <strong>bir marta</strong> ishlaydi va qayta
          ko&apos;rsatilmaydi. Xavfsiz joyda (masalan, parol menejerida) saqlang.
        </p>
        <ul className="grid grid-cols-2 gap-2 rounded-xl bg-surface-2 p-4 font-mono text-sm sm:text-base">
          {codes.map((c) => <li key={c}>{c}</li>)}
        </ul>
        <button
          type="button" className="btn btn-outline"
          onClick={async () => { await navigator.clipboard.writeText(codes.join("\n")); setCopied(true); }}
        >
          {copied ? "Nusxalandi" : "Nusxalash"}
        </button>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-1 size-5 shrink-0 accent-primary" />
          <span>Kodlarni xavfsiz joyga saqladim</span>
        </label>
        <button type="button" disabled={!saved} onClick={finish} className="btn btn-primary">Davom etish</button>
      </div>
    );
  }

  // 2) Yoqilgan holat
  if (user.twoFactorEnabled) {
    return (
      <div className="card grid gap-4">
        <h2 className="text-xl font-bold">Ikki bosqichli tasdiqlash yoqilgan</h2>
        <p className="alert-success">Hisobingiz parol va telefondagi kod bilan himoyalangan.</p>
        {mandatory ? (
          <p className="text-muted">Ustoz va administrator uchun bu himoyani o&apos;chirib bo&apos;lmaydi.</p>
        ) : (
          <form onSubmit={disable} method="post" className="grid gap-3">
            <h3 className="font-bold">O&apos;chirish</h3>
            <div>
              <label htmlFor="password" className="label">Parol</label>
              <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
            </div>
            <div>
              <label htmlFor="code" className="label">Tasdiqlash yoki tiklash kodi</label>
              <input id="code" name="code" required autoComplete="one-time-code" maxLength={20} className="input" />
            </div>
            {error && <p className="alert-error" role="alert">{error}</p>}
            <button type="submit" disabled={busy} className="btn btn-outline">2FA ni o&apos;chirish</button>
          </form>
        )}
      </div>
    );
  }

  // 1) Sozlash
  return (
    <div className="card grid gap-4">
      {mandatory && (
        <p className="alert-error" role="alert">
          Ustoz va administrator hisobi uchun ikki bosqichli tasdiqlash majburiy. Yoqmaguncha boshqa bo&apos;limlar ochilmaydi.
        </p>
      )}
      {!setup ? (
        <>
          <h2 className="text-xl font-bold">Ikki bosqichli tasdiqlashni yoqing</h2>
          <p className="text-muted">
            Parol o&apos;g&apos;irlansa ham, hisobingizga telefoningizsiz kirib bo&apos;lmaydi. Telefoningizga Google
            Authenticator, Microsoft Authenticator yoki Authy ilovasini o&apos;rnating.
          </p>
          {error && <p className="alert-error" role="alert">{error}</p>}
          <button type="button" onClick={start} disabled={busy} className="btn btn-primary">
            {busy ? "Tayyorlanmoqda..." : "Boshlash"}
          </button>
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold">1. QR kodni skanerlang</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setup.qr} alt="2FA uchun QR kod" width={224} height={224} className="mx-auto rounded-xl border border-border bg-white p-2" />
          <details className="text-sm">
            <summary className="cursor-pointer font-bold">Skaner ishlamasa, kalitni qo&apos;lda kiriting</summary>
            <p className="mt-2 break-all rounded-xl bg-surface-2 p-3 font-mono">{setup.secret.match(/.{1,4}/g)?.join(" ")}</p>
          </details>
          <form onSubmit={enable} method="post" className="grid gap-3">
            <h2 className="text-xl font-bold">2. Ilovadagi kodni kiriting</h2>
            <input
              name="code" required inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code"
              aria-label="6 xonali kod" placeholder="123456" className="input text-center text-xl tracking-[0.4em]"
            />
            {error && <p className="alert-error" role="alert">{error}</p>}
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? "Tekshirilmoqda..." : "Yoqish"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

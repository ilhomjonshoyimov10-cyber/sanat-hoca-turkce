"use client";

// Bitta foydalanuvchining kirish tarixi: qachon, qaysi qurilmadan, qaysi IP dan.
//
// PAROL BU YERDA YO'Q va bo'lishi ham mumkin emas. Parollar Argon2id bilan
// xeshlangan — ularni hech kim qaytara olmaydi. Bu kamchilik emas, himoya:
// baza sizib ketsa o'quvchilarning parollari ko'chaga chiqmaydi, va odamlar
// ko'pincha bir xil parolni Telegram va pochtada ham ishlatadi.
// Nazorat uchun kerak bo'lgani shu yerda: kim, qachon, qayerdan kirgani,
// muvaffaqiyatsiz urinishlar, hamma qurilmadan chiqarish va parolni
// majburan tiklash.

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { errorText } from "../groups/shared";

interface Session {
  id: string; userAgent: string | null; ip: string | null;
  createdAt: string; expiresAt: string; revokedAt: string | null;
}
interface Event {
  id: string; action: string; ip: string | null; createdAt: string; meta: unknown;
}
interface Data {
  user: {
    id: string; firstName: string; lastName: string; email: string | null; phone: string | null;
    role: string; isActive: boolean; twoFactorEnabled: boolean;
    createdAt: string; lastLoginAt: string | null; lockedUntil: string | null; failedLoginCount: number;
  };
  sessions: Session[];
  events: Event[];
}

/** Audit yozuvlarining o'zbekcha nomi. Ro'yxatda yo'qi o'z nomi bilan chiqadi. */
const ACTION: Record<string, string> = {
  LOGIN: "Kirdi",
  LOGIN_FAILED: "Parol xato",
  LOGOUT: "Chiqdi",
  REGISTER: "Ro'yxatdan o'tdi",
  PASSWORD_CHANGED: "Parolni almashtirdi",
  PASSWORD_CHANGE_FAILED: "Parol almashtirish urinishi (xato)",
  ACCOUNT_LOCKED: "Hisob qulflandi",
  REFRESH_REUSE_DETECTED: "Shubhali sessiya (token qayta ishlatildi)",
  TWO_FACTOR_ENABLED: "2FA yoqdi",
  TWO_FACTOR_DISABLED: "2FA o'chirdi",
  SESSIONS_REVOKED: "Barcha qurilmalardan chiqdi",
  ADMIN_SESSIONS_REVOKED: "Admin uni barcha qurilmalardan chiqardi",
  ADMIN_USER_UNLOCKED: "Admin qulfni ochdi",
  ADMIN_PASSWORD_RESET: "Admin parolni tikladi",
};

function deviceName(ua: string | null): string {
  if (!ua) return "Noma'lum qurilma";
  const browser =
    /Edg\//.test(ua) ? "Edge"
    : /OPR\//.test(ua) ? "Opera"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Safari\//.test(ua) ? "Safari"
    : "Brauzer";
  const os =
    /Android/.test(ua) ? "Android"
    : /iPhone|iPad/.test(ua) ? "iPhone/iPad"
    : /Windows/.test(ua) ? "Windows"
    : /Mac OS/.test(ua) ? "Mac"
    : /Linux/.test(ua) ? "Linux"
    : "";
  return os ? `${browser}, ${os}` : browser;
}

export function UserActivity({
  userId,
  onClose,
  onError,
}: {
  userId: string;
  onClose: () => void;
  onError: (m: string) => void;
}) {
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setData(await api<Data>(`/admin/users/${userId}/activity`));
    } catch (e) {
      onError(errorText(e));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function revoke() {
    setBusy(true);
    try {
      await api(`/admin/users/${userId}/revoke-sessions`, { method: "POST" });
      await load();
    } catch (e) {
      onError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <p className="text-muted" role="status">Yuklanmoqda...</p>;

  const active = data.sessions.filter((s) => !s.revokedAt && new Date(s.expiresAt) > new Date());

  return (
    <section aria-labelledby="ua-h" className="border border-cobalt/25 bg-cobalt/[0.04] p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 id="ua-h" className="text-[1.2rem]">
          {data.user.firstName} {data.user.lastName} — kirish tarixi
        </h3>
        <button type="button" onClick={onClose} className="btn btn-quiet !min-h-9">Yopish</button>
      </div>

      <dl className="mb-6 grid gap-x-6 gap-y-2 text-[0.95rem] sm:grid-cols-2">
        <div className="flex justify-between gap-3 border-b border-cobalt/15 pb-1">
          <dt className="text-muted">Oxirgi kirish</dt>
          <dd>{data.user.lastLoginAt ? new Date(data.user.lastLoginAt).toLocaleString("uz-UZ") : "—"}</dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-cobalt/15 pb-1">
          <dt className="text-muted">Ochiq qurilmalar</dt>
          <dd>{active.length}</dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-cobalt/15 pb-1">
          <dt className="text-muted">Xato parol urinishlari</dt>
          <dd>{data.user.failedLoginCount}</dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-cobalt/15 pb-1">
          <dt className="text-muted">Ro&apos;yxatdan o&apos;tgan</dt>
          <dd>{new Date(data.user.createdAt).toLocaleDateString("uz-UZ")}</dd>
        </div>
      </dl>

      <h4 className="mb-2 font-semibold">Qurilmalar</h4>
      {data.sessions.length === 0 ? (
        <p className="mb-5 text-muted">Yozuv yo&apos;q.</p>
      ) : (
        <ul className="mb-5 grid gap-1.5">
          {data.sessions.map((s) => {
            const live = !s.revokedAt && new Date(s.expiresAt) > new Date();
            return (
              <li
                key={s.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-[var(--r-tile)] border border-cobalt/20 px-3 py-2 text-[0.9375rem]"
              >
                <span>
                  <span className={live ? "badge badge-ok mr-2" : "badge mr-2"}>
                    {live ? "Ochiq" : "Yopilgan"}
                  </span>
                  {deviceName(s.userAgent)}
                </span>
                <span className="text-muted">
                  {new Date(s.createdAt).toLocaleString("uz-UZ")}
                  {s.ip && ` · ${s.ip}`}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" className="btn btn-outline" disabled={busy || active.length === 0} onClick={revoke}>
        Barcha qurilmalardan chiqarish
      </button>

      <h4 className="mb-2 mt-6 font-semibold">Harakatlar</h4>
      {data.events.length === 0 ? (
        <p className="text-muted">Yozuv yo&apos;q.</p>
      ) : (
        <ul className="grid gap-1 text-[0.9375rem]">
          {data.events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-cobalt/12 pb-1">
              <span>{ACTION[e.action] ?? e.action}</span>
              <span className="text-muted">
                {new Date(e.createdAt).toLocaleString("uz-UZ")}
                {e.ip && ` · ${e.ip}`}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="help mt-5">
        Parollar bu yerda ko&apos;rinmaydi va ko&apos;rinishi ham mumkin emas: ular qaytarib
        bo&apos;lmaydigan ko&apos;rinishda (Argon2id) saqlanadi. Foydalanuvchiga kirishda yordam
        kerak bo&apos;lsa, &quot;Boshqarish&quot; dan yangi parol belgilang.
      </p>
    </section>
  );
}

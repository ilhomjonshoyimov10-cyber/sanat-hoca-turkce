"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, needs2fa } from "@/lib/api";
import { errorText } from "../groups/shared";
import { UserActivity } from "./UserActivity";

interface U {
  id: string; email: string | null; phone: string | null;
  firstName: string; lastName: string; role: string;
  isActive: boolean; twoFactorEnabled: boolean;
  createdAt: string; lastLoginAt: string | null; lockedUntil: string | null;
}
interface Page { items: U[]; total: number; skip: number; take: number }

const ROLES = ["STUDENT", "TEACHER", "ADMIN", "PARENT"] as const;
const ROLE_LABEL: Record<string, string> = {
  STUDENT: "O'quvchi", TEACHER: "Ustoz", ADMIN: "Admin", PARENT: "Ota-ona",
};
const TAKE = 25;

export function UsersTable({ meId, onError }: { meId: string; onError: (m: string) => void }) {
  const router = useRouter();
  const [page, setPage] = useState<Page | null>(null);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [skip, setSkip] = useState(0);
  const [busy, setBusy] = useState(true);
  const [editing, setEditing] = useState<U | null>(null);
  const [activity, setActivity] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const params = new URLSearchParams({ skip: String(skip), take: String(TAKE) });
      if (q.trim()) params.set("q", q.trim());
      if (role) params.set("role", role);
      setPage(await api<Page>(`/admin/users?${params}`));
    } catch (e) {
      if (needs2fa(e)) { router.push("/security"); return; }
      onError(errorText(e));
    } finally {
      setBusy(false);
    }
  }, [q, role, skip, onError, router]);

  // Qidiruvda har harfda so'rov yubormaslik uchun 350 ms kutiladi
  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  async function act(path: string, body?: unknown, okMessage?: string) {
    onError("");
    setNote("");
    try {
      await api(path, { method: "POST", body });
      if (okMessage) setNote(okMessage);
      await load();
    } catch (e) {
      onError(errorText(e));
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="u-q" className="label">Qidirish</label>
          <input
            id="u-q" value={q} onChange={(e) => { setQ(e.target.value); setSkip(0); }}
            placeholder="Ism, email yoki telefon" className="input" autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="u-role" className="label">Rol</label>
          <select id="u-role" value={role} onChange={(e) => { setRole(e.target.value); setSkip(0); }} className="input w-44">
            <option value="">Hammasi</option>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </div>
        <button type="button" onClick={() => setShowCreate((s) => !s)} className="btn btn-primary">
          Yangi foydalanuvchi
        </button>
      </div>

      {note && <p className="alert-success" role="status">{note}</p>}
      {showCreate && <CreateUser onDone={() => { setShowCreate(false); void load(); }} onError={onError} />}

      <div className="overflow-x-auto border border-cobalt/25 bg-ink">
        <table className="table">
          <caption className="sr-only">Foydalanuvchilar ro&apos;yxati</caption>
          <thead>
            <tr>
              <th scope="col">Ism</th>
              <th scope="col">Kirish</th>
              <th scope="col">Rol</th>
              <th scope="col">Holat</th>
              <th scope="col">Oxirgi kirish</th>
              <th scope="col"><span className="sr-only">Amallar</span></th>
            </tr>
          </thead>
          <tbody>
            {busy && <tr><td colSpan={6}><div className="skeleton h-24" /></td></tr>}
            {!busy && page?.items.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-muted">Hech kim topilmadi</td></tr>
            )}
            {!busy && page?.items.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">
                  {u.firstName} {u.lastName}
                  {u.id === meId && <span className="badge ml-2">Siz</span>}
                </td>
                <td className="text-muted">{u.email ?? u.phone ?? "—"}</td>
                <td>{ROLE_LABEL[u.role] ?? u.role}</td>
                <td>
                  <span className={`badge ${u.isActive ? "badge-ok" : "badge-bad"}`}>
                    {u.isActive ? "Faol" : "O'chirilgan"}
                  </span>
                  {u.twoFactorEnabled && <span className="badge badge-warn ml-1.5">2FA</span>}
                  {u.lockedUntil && new Date(u.lockedUntil) > new Date() && (
                    <span className="badge badge-bad ml-1.5">Qulflangan</span>
                  )}
                </td>
                <td className="text-muted">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("uz-UZ") : "—"}
                </td>
                <td>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setEditing(u)} className="btn btn-quiet !min-h-9">
                      Boshqarish
                    </button>
                    <button type="button" onClick={() => setActivity(u.id)} className="btn btn-quiet !min-h-9">
                      Tarix
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {page && page.total > TAKE && (
        <div className="flex items-center justify-between text-[0.9375rem] text-muted">
          <span>{skip + 1}–{Math.min(skip + TAKE, page.total)} / {page.total}</span>
          <div className="flex gap-2">
            <button type="button" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - TAKE))} className="btn btn-outline !min-h-9">
              Oldingi
            </button>
            <button type="button" disabled={skip + TAKE >= page.total} onClick={() => setSkip(skip + TAKE)} className="btn btn-outline !min-h-9">
              Keyingi
            </button>
          </div>
        </div>
      )}

      {activity && (
        <UserActivity userId={activity} onClose={() => setActivity(null)} onError={onError} />
      )}

      {editing && (
        <UserEditor
          u={editing}
          isMe={editing.id === meId}
          onClose={() => setEditing(null)}
          onAct={act}
          onError={onError}
          onSaved={() => { setEditing(null); void load(); }}
        />
      )}
    </div>
  );
}

function CreateUser({ onDone, onError }: { onDone: () => void; onError: (m: string) => void }) {
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    onError("");
    try {
      await api("/admin/users", {
        method: "POST",
        body: {
          firstName: String(f.get("firstName")), lastName: String(f.get("lastName")),
          identifier: String(f.get("identifier")), password: String(f.get("password")),
          role: String(f.get("role")),
        },
      });
      onDone();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} method="post" className="grid gap-4 border border-cobalt/30 bg-cobalt/[0.06] p-5 sm:grid-cols-2">
      <div><label htmlFor="c-fn" className="label">Ism</label><input id="c-fn" name="firstName" required maxLength={60} className="input" /></div>
      <div><label htmlFor="c-ln" className="label">Familiya</label><input id="c-ln" name="lastName" required maxLength={60} className="input" /></div>
      <div><label htmlFor="c-id" className="label">Email yoki telefon</label><input id="c-id" name="identifier" required className="input" placeholder="ustoz@maktab.uz" /></div>
      <div>
        <label htmlFor="c-role" className="label">Rol</label>
        <select id="c-role" name="role" defaultValue="STUDENT" className="input">
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="c-pw" className="label">Boshlang&apos;ich parol</label>
        <input id="c-pw" name="password" type="text" required minLength={10} className="input" autoComplete="off" />
        <p className="help">Kamida 10 belgi. Foydalanuvchiga yetkazing va birinchi kirishda almashtirishni so&apos;rang.</p>
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={busy} className="btn btn-primary">Yaratish</button>
      </div>
    </form>
  );
}

function UserEditor({
  u, isMe, onClose, onAct, onError, onSaved,
}: {
  u: U; isMe: boolean; onClose: () => void;
  onAct: (p: string, b?: unknown, m?: string) => Promise<void>;
  onError: (m: string) => void; onSaved: () => void;
}) {
  const [role, setRole] = useState(u.role);
  const [isActive, setIsActive] = useState(u.isActive);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    onError("");
    try {
      await api(`/admin/users/${u.id}`, { method: "PATCH", body: { role, isActive } });
      onSaved();
    } catch (e) {
      onError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 border border-brass/40 bg-brass/[0.06] p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-[1.3rem]">{u.firstName} {u.lastName}</h2>
        <button type="button" onClick={onClose} className="btn btn-quiet !min-h-9">Yopish</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="e-role" className="label">Rol</label>
          <select id="e-role" value={role} onChange={(e) => setRole(e.target.value)} disabled={isMe} className="input">
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          {isMe && <p className="help">O&apos;z rolingizni o&apos;zgartira olmaysiz.</p>}
        </div>
        <div>
          <span className="label">Hisob holati</span>
          <label className="flex items-center gap-3 pt-1.5">
            <button
              type="button" role="switch" aria-checked={isActive} disabled={isMe}
              onClick={() => setIsActive((v) => !v)} className="switch"
            />
            <span>{isActive ? "Faol" : "O'chirilgan"}</span>
          </label>
          {isMe && <p className="help">O&apos;z hisobingizni o&apos;chira olmaysiz.</p>}
        </div>
      </div>

      <div>
        <button type="button" onClick={save} disabled={busy} className="btn btn-primary">O&apos;zgarishni saqlash</button>
      </div>

      <div className="grid gap-4 border-t border-brass/30 pt-5">
        <h3 className="text-[1.1rem]">Yordam amallari</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onAct(`/admin/users/${u.id}/unlock`, undefined, "Qulf ochildi")} className="btn btn-outline !min-h-9">
            Qulfni ochish
          </button>
          <button
            type="button"
            onClick={() => onAct(`/admin/users/${u.id}/clear-2fa`, undefined, "2FA o'chirildi — foydalanuvchi qaytadan sozlaydi")}
            className="btn btn-outline !min-h-9"
          >
            2FA ni tiklash
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[16rem] flex-1">
            <label htmlFor="e-pw" className="label">Yangi parol</label>
            <input id="e-pw" value={pw} onChange={(e) => setPw(e.target.value)} className="input" autoComplete="off" minLength={10} />
          </div>
          <button
            type="button"
            disabled={pw.length < 10}
            onClick={() => onAct(`/admin/users/${u.id}/password`, { newPassword: pw }, "Parol tiklandi va barcha seanslar uzildi")
              .then(() => setPw(""))}
            className="btn btn-outline"
          >
            Parolni tiklash
          </button>
        </div>
        <p className="help">
          Parol tiklanganda foydalanuvchining barcha seanslari uziladi va unga bildirishnoma boradi.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { errorText, fullName, type Member } from "./shared";

export function MembersSection({ groupId, canManage, members, onChanged }: { groupId: string; canManage: boolean; members: Member[]; onChanged: () => void }) {
  const [error, setError] = useState("");
  const [needConsent, setNeedConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    setBusy(true);
    setError("");
    try {
      await api(`/groups/${groupId}/members`, {
        method: "POST",
        body: { identifier: String(d.get("identifier") ?? "").trim(), confirmParentConsent: d.get("consent") === "on" },
      });
      form.reset();
      setNeedConsent(false);
      onChanged();
    } catch (err) {
      if (err instanceof ApiError && err.code === "PARENT_CONSENT_REQUIRED") setNeedConsent(true);
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(m: Member) {
    if (!window.confirm(`${fullName(m)} guruhdan chiqarilsinmi?`)) return;
    try {
      await api(`/groups/${groupId}/members/${m.id}`, { method: "DELETE" });
      onChanged();
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <div className="grid gap-5">
      {members.length === 0 ? (
        <p className="card text-muted">Guruhda hali o&apos;quvchi yo&apos;q.</p>
      ) : (
        <ul className="grid gap-3">
          {members.map((m) => (
            <li key={m.id} className="card flex flex-wrap items-center justify-between gap-3 !p-4">
              <div>
                <p className="font-extrabold">{fullName(m)}</p>
                {canManage && <p className="text-sm text-muted">{[m.email, m.phone].filter(Boolean).join(" · ")}</p>}
              </div>
              <div className="flex items-center gap-2">
                {canManage && m.isMinor && <span className="badge badge-warn">18 dan kichik</span>}
                {canManage && <button type="button" onClick={() => remove(m)} className="btn btn-outline !min-h-9 !px-3 text-sm">Chiqarish</button>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <form onSubmit={add} className="card grid gap-3">
          <h3 className="text-lg font-extrabold">O&apos;quvchi qo&apos;shish</h3>
          <div>
            <label htmlFor="m-ident" className="label">O&apos;quvchining email yoki telefon raqami</label>
            <input id="m-ident" name="identifier" required className="input" />
            <p className="help">O&apos;quvchi avval saytda ro&apos;yxatdan o&apos;tgan bo&apos;lishi kerak.</p>
          </div>
          {needConsent && (
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="consent" className="mt-1 size-5 shrink-0 accent-primary" />
              <span>Ota-ona yoki qonuniy vakil roziligi olinganini tasdiqlayman (yozib qo&apos;yiladi)</span>
            </label>
          )}
          {error && <p className="alert-error" role="alert">{error}</p>}
          <button type="submit" disabled={busy} className="btn btn-primary justify-self-start">{busy ? "Qo'shilmoqda..." : "Qo'shish"}</button>
        </form>
      )}
      {!canManage && error && <p className="alert-error" role="alert">{error}</p>}
    </div>
  );
}

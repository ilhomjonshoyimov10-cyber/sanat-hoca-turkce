"use client";

import { useState } from "react";
import { useAdminData } from "./AdminPanel";

interface Entry {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  ip: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; role: string } | null;
}

/** Xavfsizlik uchun muhim amallar ajratib ko'rsatiladi. */
const SEVERE = new Set([
  "LOGIN_FAILED", "ACCOUNT_LOCKED", "REFRESH_REUSE_DETECTED",
  "ADMIN_PASSWORD_RESET", "ADMIN_2FA_CLEARED", "PASSWORD_CHANGE_FAILED",
]);

export function AuditLog({ onError }: { onError: (m: string) => void }) {
  const [skip, setSkip] = useState(0);
  const { data, busy } = useAdminData<{ items: Entry[]; total: number }>(
    `/admin/audit?skip=${skip}&take=50`, onError,
  );

  if (busy) return <div className="skeleton h-64" />;
  if (!data) return null;

  return (
    <div className="grid gap-4">
      <p className="text-[0.9375rem] text-muted">
        Tizimdagi muhim amallar yozib boriladi. Jami {data.total} ta yozuv.
      </p>
      <div className="overflow-x-auto border border-cobalt/25 bg-ink">
        <table className="table">
          <caption className="sr-only">Audit jurnali</caption>
          <thead>
            <tr>
              <th scope="col">Vaqt</th>
              <th scope="col">Amal</th>
              <th scope="col">Kim</th>
              <th scope="col">Obyekt</th>
              <th scope="col">IP</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted">Yozuv yo&apos;q</td></tr>}
            {data.items.map((e) => (
              <tr key={e.id}>
                <td className="whitespace-nowrap text-muted">{new Date(e.createdAt).toLocaleString("uz-UZ")}</td>
                <td>
                  <span className={`badge ${SEVERE.has(e.action) ? "badge-bad" : ""}`}>{e.action}</span>
                </td>
                <td>{e.user ? `${e.user.firstName} ${e.user.lastName}` : "—"}</td>
                <td className="text-muted">{e.entity ? `${e.entity}:${e.entityId ?? ""}` : "—"}</td>
                <td className="text-muted">{e.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.total > 50 && (
        <div className="flex justify-between">
          <button type="button" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - 50))} className="btn btn-outline !min-h-9">Oldingi</button>
          <button type="button" disabled={skip + 50 >= data.total} onClick={() => setSkip(skip + 50)} className="btn btn-outline !min-h-9">Keyingi</button>
        </div>
      )}
    </div>
  );
}

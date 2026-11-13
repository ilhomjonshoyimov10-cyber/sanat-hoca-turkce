"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { errorText, fullName, tashkentToday, type Member } from "./shared";
import { PageLoader } from "@/components/Loader";
import { formatDate } from "@/lib/datetime";

type Rec = { date: string; userId: string; present: boolean };

export function AttendanceSection({ groupId, canManage, members, myId }: { groupId: string; canManage: boolean; members: Member[]; myId: string }) {
  const [records, setRecords] = useState<Rec[] | null>(null);
  const [date, setDate] = useState("");
  const [edits, setEdits] = useState<Record<string, boolean>>({});
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<{ records: Rec[] }>(`/groups/${groupId}/attendance`)
      .then((r) => {
        if (cancelled) return;
        setRecords(r.records);
        setDate((d) => d || tashkentToday());
      })
      .catch((e) => !cancelled && setError(errorText(e)));
    return () => {
      cancelled = true;
    };
  }, [groupId, reload]);

  if (error) return <p className="alert-error" role="alert">{error}</p>;
  if (!records) return <PageLoader />;

  const dates = [...new Set(records.map((r) => r.date))].sort().reverse();
  const stat = (userId: string) => {
    const mine = records.filter((r) => r.userId === userId);
    return { attended: mine.filter((r) => r.present).length, total: dates.length };
  };

  // ───── O'quvchi: faqat o'zinikini ko'radi ─────
  if (!canManage) {
    const s = stat(myId);
    const mine = records.filter((r) => r.userId === myId).sort((a, b) => b.date.localeCompare(a.date));
    return (
      <div className="grid gap-4">
        <p className="card">
          Oxirgi 60 kun: <strong>{s.attended}</strong> / {s.total} ta darsga kelgansiz
          {s.total > 0 && ` (${Math.round((s.attended / s.total) * 100)}%)`}
        </p>
        {mine.length === 0 ? <p className="text-muted">Hali davomat belgilanmagan.</p> : (
          <ul className="grid gap-2">
            {mine.map((r) => (
              <li key={r.date} className="card flex items-center justify-between !p-4">
                <span>{formatDate(`${r.date}T00:00:00`, "uz")}</span>
                <span className={`badge ${r.present ? "badge-ok" : "badge-bad"}`}>{r.present ? "Keldi" : "Kelmadi"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // ───── Ustoz: belgilash ─────
  const value = (userId: string) => edits[`${date}|${userId}`] ?? records.find((r) => r.date === date && r.userId === userId)?.present ?? true;

  async function save() {
    setBusy(true);
    setError("");
    setSaved("");
    try {
      await api(`/groups/${groupId}/attendance`, {
        method: "PUT",
        body: { date, records: members.map((m) => ({ userId: m.id, present: value(m.id) })) },
      });
      setEdits({});
      setReload((n) => n + 1);
      setSaved("Davomat saqlandi");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="card grid gap-4">
        <div className="max-w-xs">
          <label htmlFor="a-date" className="label">Dars sanasi</label>
          <input id="a-date" type="date" value={date} max={tashkentToday()} onChange={(e) => { setDate(e.target.value); setSaved(""); }} className="input" />
        </div>
        {members.length === 0 ? <p className="text-muted">Avval guruhga o&apos;quvchi qo&apos;shing.</p> : (
          <ul className="grid gap-2">
            {members.map((m) => (
              <li key={m.id}>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-4 py-3">
                  <span className="font-bold">{fullName(m)}</span>
                  <span className="flex items-center gap-2 text-sm">
                    <span className={value(m.id) ? "text-success" : "text-danger"}>{value(m.id) ? "Keldi" : "Kelmadi"}</span>
                    <input
                      type="checkbox" checked={value(m.id)} className="size-5 accent-primary" aria-label={`${fullName(m)}: keldi`}
                      onChange={(e) => setEdits((p) => ({ ...p, [`${date}|${m.id}`]: e.target.checked }))}
                    />
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {saved && <p className="alert-success" role="status">{saved}</p>}
        <button type="button" onClick={save} disabled={busy || !date || members.length === 0} className="btn btn-primary justify-self-start">
          {busy ? "Saqlanmoqda..." : "Davomatni saqlash"}
        </button>
      </div>

      {dates.length > 0 && (
        <div className="card">
          <h3 className="mb-3 text-lg font-extrabold">Oxirgi 60 kun xulosasi ({dates.length} ta dars)</h3>
          <ul className="grid gap-2 text-sm">
            {members.map((m) => {
              const s = stat(m.id);
              const pct = s.total ? Math.round((s.attended / s.total) * 100) : 0;
              return (
                <li key={m.id} className="flex items-center justify-between gap-3">
                  <span>{fullName(m)}</span>
                  <span className={`badge ${pct >= 80 ? "badge-ok" : pct >= 50 ? "badge-warn" : "badge-bad"}`}>{s.attended}/{s.total} · {pct}%</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

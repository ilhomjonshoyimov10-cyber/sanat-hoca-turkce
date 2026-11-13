"use client";

// Guruh a'zolari. Ustoz o'quvchini ikki yo'l bilan qo'shadi:
//  1) Qidiruv: ism, familiya, telefon yoki email bo'yicha — topilganini bir tugmada.
//  2) Qo'shilish kodi: 6 belgili kod, o'quvchi "Guruhlar" sahifasida o'zi kiritadi.
// Aloqa ma'lumoti qidiruvda YASHIRIB ko'rsatiladi (di***@mail.uz) — ustoz
// boshqa ustozning o'quvchisi bilan shaxsan bog'lanish uchun foydalana olmasin.

import { useEffect, useRef, useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { errorText, fullName, type Member } from "./shared";

interface Candidate {
  id: string; name: string; avatarUrl: string | null; contact: string;
  inGroup: boolean; groups: string[]; needsConsent: boolean;
}

export function MembersSection({
  groupId, canManage, members, onChanged, joinCode,
}: {
  groupId: string; canManage: boolean; members: Member[]; onChanged: () => void; joinCode?: string | null;
}) {
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [needConsent, setNeedConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Candidate[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [consentFor, setConsentFor] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(joinCode ?? null);
  const [copied, setCopied] = useState(false);
  const seq = useRef(0);

  // Yozish to'xtagach 300 ms o'tib qidiradi; eski javob yangisining ustiga yozilmaydi
  useEffect(() => {
    if (!canManage) return;
    const term = q.trim();
    if (term.length < 2) { setFound(null); return; }
    const my = ++seq.current;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const rows = await api<Candidate[]>(`/groups/${groupId}/candidates?q=${encodeURIComponent(term)}`);
        if (my === seq.current) setFound(rows);
      } catch (e) {
        if (my === seq.current) setError(errorText(e));
      } finally {
        if (my === seq.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, groupId, canManage]);

  async function addById(c: Candidate, consent = false) {
    setError(""); setNote("");
    try {
      await api(`/groups/${groupId}/members/by-id`, { method: "POST", body: { userId: c.id, confirmParentConsent: consent || undefined } });
      setFound((list) => list?.map((x) => (x.id === c.id ? { ...x, inGroup: true } : x)) ?? null);
      setConsentFor(null);
      setNote(`${c.name} guruhga qo'shildi`);
      onChanged();
    } catch (err) {
      if (err instanceof ApiError && err.code === "PARENT_CONSENT_REQUIRED") { setConsentFor(c.id); return; }
      setError(errorText(err));
    }
  }

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    setBusy(true);
    setError(""); setNote("");
    try {
      await api(`/groups/${groupId}/members`, {
        method: "POST",
        body: { identifier: String(d.get("identifier") ?? "").trim(), confirmParentConsent: d.get("consent") === "on" },
      });
      form.reset();
      setNeedConsent(false);
      setNote("O'quvchi qo'shildi");
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

  async function newCode() {
    setError("");
    try {
      const r = await api<{ joinCode: string }>(`/groups/${groupId}/join-code`, { method: "POST" });
      setCode(r.joinCode);
    } catch (err) {
      setError(errorText(err));
    }
  }
  async function stopCode() {
    if (!window.confirm("Kod o'chirilsinmi? Endi u bilan hech kim qo'shila olmaydi.")) return;
    try {
      await api(`/groups/${groupId}/join-code`, { method: "DELETE" });
      setCode(null);
    } catch (err) {
      setError(errorText(err));
    }
  }
  async function copyCode() {
    if (!code) return;
    const text = `Sanat Hoca Türkçe guruhiga qo'shilish kodi: ${code}\nSaytga kiring → Guruhlar → "Kod bilan qo'shilish".`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Nusxa oling:", text);
    }
  }

  return (
    <div className="grid gap-5">
      {note && <p className="alert-success" role="status">{note}</p>}
      {error && <p className="alert-error" role="alert">{error}</p>}

      {canManage && (
        <section aria-labelledby="find-h" className="card grid gap-4">
          <div>
            <h3 id="find-h" className="text-lg font-extrabold">O&apos;quvchini topib qo&apos;shish</h3>
            <p className="help">Ism, familiya, telefon raqami yoki email. Saytda ro&apos;yxatdan o&apos;tgan o&apos;quvchilar chiqadi.</p>
          </div>
          <div className="relative">
            <label htmlFor="m-q" className="sr-only">Qidirish</label>
            <input
              id="m-q" value={q} onChange={(e) => setQ(e.target.value)} maxLength={60} autoComplete="off"
              className="input pl-10" placeholder="Masalan: Dilnoza yoki 90 123"
            />
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" strokeLinecap="round" />
            </svg>
          </div>
          {searching && <p className="text-[0.875rem] text-muted" role="status">Qidirilmoqda...</p>}
          {found && !searching && found.length === 0 && (
            <p className="text-[0.9375rem] text-muted">
              Topilmadi. O&apos;quvchi hali ro&apos;yxatdan o&apos;tmagan bo&apos;lsa — unga pastdagi qo&apos;shilish kodini yuboring.
            </p>
          )}
          {found && found.length > 0 && (
            <ul className="grid gap-2">
              {found.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-[var(--r-tile)] border border-cobalt/20 px-3 py-2.5">
                  <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-cobalt/20 font-semibold">
                    {/* eslint-disable-next-line @next/next/no-img-element -- avatar o'z omborimizdan, o'lchami kichik */}
                    {c.avatarUrl ? <img src={c.avatarUrl} alt="" className="size-full object-cover" /> : c.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{c.name}</span>
                    <span className="block text-[0.8125rem] text-muted">
                      {c.contact}
                      {c.groups.length > 0 && ` · ${c.groups.join(", ")}`}
                    </span>
                  </span>
                  {c.inGroup ? (
                    <span className="badge badge-ok">Guruhda</span>
                  ) : consentFor === c.id ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[0.8125rem] text-brass">18 yoshgacha: ota-ona roziligi olinganmi?</span>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => void addById(c, true)}>Ha, qo&apos;shish</button>
                      <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConsentFor(null)}>Bekor</button>
                    </span>
                  ) : (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => void addById(c)}>Qo&apos;shish</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {canManage && (
        <section aria-labelledby="code-h" className="card grid gap-3">
          <h3 id="code-h" className="text-lg font-extrabold">Qo&apos;shilish kodi</h3>
          {code ? (
            <>
              <p className="t-num select-all text-[2.2rem] tracking-[0.25em] text-brass" aria-label={`Kod: ${code.split("").join(" ")}`}>{code}</p>
              <p className="help">O&apos;quvchi saytga kiradi → &quot;Guruhlar&quot; → &quot;Kod bilan qo&apos;shilish&quot;. Kod tarqalib ketsa — yangisini yarating.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => void copyCode()}>{copied ? "Nusxalandi ✓" : "Nusxalash"}</button>
                <a
                  className="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer"
                  href={`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/groups`)}&text=${encodeURIComponent(`Guruhga qo'shilish kodi: ${code}`)}`}
                >
                  Telegramda yuborish
                </a>
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => void newCode()}>Yangi kod</button>
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => void stopCode()}>O&apos;chirish</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[0.9375rem] text-muted">Kod yarating va o&apos;quvchilarga yuboring — ular o&apos;zlari qo&apos;shiladi. 18 yoshgacha o&apos;quvchini esa siz rozilik bilan qo&apos;shasiz.</p>
              <button type="button" className="btn btn-outline justify-self-start" onClick={() => void newCode()}>Kod yaratish</button>
            </>
          )}
        </section>
      )}

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
        <details className="card">
          <summary className="cursor-pointer font-semibold">Aniq email yoki telefon bilan qo&apos;shish</summary>
          <form onSubmit={add} className="mt-4 grid gap-3">
            <div>
              <label htmlFor="m-ident" className="label">O&apos;quvchining email yoki telefon raqami</label>
              <input id="m-ident" name="identifier" required className="input" />
            </div>
            {needConsent && (
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" name="consent" className="mt-1 size-5 shrink-0 accent-primary" />
                <span>Ota-ona yoki qonuniy vakil roziligi olinganini tasdiqlayman (yozib qo&apos;yiladi)</span>
              </label>
            )}
            <button type="submit" disabled={busy} className="btn btn-primary justify-self-start">{busy ? "Qo'shilmoqda..." : "Qo'shish"}</button>
          </form>
        </details>
      )}
    </div>
  );
}

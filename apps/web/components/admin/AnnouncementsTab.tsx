"use client";

// E'lon va reklamalarni boshqarish. Faqat admin ko'radi.

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useHydrated } from "@/lib/hydrated";
import { errorText } from "../groups/shared";

interface Row {
  id: string; kind: string; audience: string; title: string; body: string;
  imageUrl: string | null; linkUrl: string | null; linkLabel: string | null;
  dismissible: boolean; pinned: boolean; isActive: boolean;
  startsAt: string; endsAt: string | null;
  dismissedBy: number; author: string; createdAt: string;
}

const KINDS = [
  { value: "INFO", label: "Xabar" },
  { value: "PROMO", label: "Reklama / taklif" },
  { value: "EVENT", label: "Tadbir" },
  { value: "WARNING", label: "Muhim ogohlantirish" },
];
const AUDIENCES = [
  { value: "ALL", label: "Hammaga" },
  { value: "STUDENTS", label: "O'quvchilarga" },
  { value: "PARENTS", label: "Ota-onalarga" },
  { value: "TEACHERS", label: "Ustozlarga" },
];

export function AnnouncementsTab({ onError }: { onError: (m: string) => void }) {
  const hydrated = useHydrated();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  // Yuklangan reklama rasmi. Fayl API dan o'tmaydi — brauzer uni
  // to'g'ridan-to'g'ri omborga yuklaydi, bu yerda faqat manzil qoladi.
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setRows(await api<Row[]>("/announcements/manage"));
    } catch (e) {
      onError(errorText(e));
    }
  }, [onError]);

  useEffect(() => { void load(); }, [load]);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true); onError(""); setNote("");
    try {
      const endsAt = String(f.get("endsAt") ?? "").trim();
      await api("/announcements", {
        method: "POST",
        body: {
          kind: String(f.get("kind")),
          audience: String(f.get("audience")),
          title: String(f.get("title")),
          body: String(f.get("body")),
          imageUrl: imageUrl ?? undefined,
          linkUrl: String(f.get("linkUrl") ?? "").trim() || undefined,
          linkLabel: String(f.get("linkLabel") ?? "").trim() || undefined,
          dismissible: f.get("dismissible") === "on",
          pinned: f.get("pinned") === "on",
          // datetime-local mahalliy vaqtni beradi; ISO ga o'tkazamiz
          endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        },
      });
      form.reset();
      setImageUrl(null);
      setNote("E'lon joylashtirildi — barcha foydalanuvchilar ekranida ko'rinadi.");
      await load();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function pickImage(file: File) {
    onError("");
    if (file.size > 5 * 1024 * 1024) {
      onError("Rasm juda katta. Eng ko'pi 5 MB");
      return;
    }
    setUploading(true);
    try {
      const { token, pathname } = await api<{ token: string; pathname: string }>(
        "/announcements/image-token",
        { method: "POST", body: { fileName: file.name, contentType: file.type, size: file.size } },
      );
      const { put } = await import("@vercel/blob");
      const blob = await put(pathname, file, { access: "public", token, contentType: file.type });
      setImageUrl(blob.url);
    } catch (e) {
      onError(errorText(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function toggle(row: Row) {
    onError("");
    try {
      await api(`/announcements/${row.id}`, { method: "PATCH", body: { isActive: !row.isActive } });
      await load();
    } catch (e) {
      onError(errorText(e));
    }
  }

  async function remove(row: Row) {
    onError("");
    try {
      await api(`/announcements/${row.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      onError(errorText(e));
    }
  }

  return (
    <div className="grid gap-6">
      {note && <p className="alert-success" role="status">{note}</p>}

      <section aria-labelledby="ann-new" className="border border-cobalt/25 bg-cobalt/[0.04] p-6">
        <h2 id="ann-new" className="mb-1 text-[1.3rem]">Yangi e&apos;lon</h2>
        <p className="mb-5 text-muted">
          E&apos;lon tanlangan auditoriyaning har bir sahifasida ko&apos;rinadi.
        </p>

        <form onSubmit={create} method="post" className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="a-kind" className="label">Turi</label>
              <select id="a-kind" name="kind" defaultValue="INFO" className="input">
                {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="a-aud" className="label">Kimga</label>
              <select id="a-aud" name="audience" defaultValue="ALL" className="input">
                {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="a-title" className="label">Sarlavha</label>
            <input id="a-title" name="title" required minLength={3} maxLength={120} className="input" />
          </div>

          <div>
            <label htmlFor="a-body" className="label">Matn</label>
            <textarea id="a-body" name="body" required maxLength={2000} rows={3} className="input resize-y" />
          </div>

          <div>
            <span className="label">Reklama rasmi (ixtiyoriy)</span>
            <div className="flex flex-wrap items-center gap-3">
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt="Yuklangan reklama rasmi"
                  width={96}
                  height={96}
                  className="h-20 w-20 rounded-[var(--r-tile)] border border-cobalt/30 object-cover"
                />
              )}
              <button
                type="button"
                className="btn btn-outline"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? "Yuklanmoqda..." : imageUrl ? "Rasmni almashtirish" : "Rasm yuklash"}
              </button>
              {imageUrl && (
                <button type="button" className="btn btn-quiet" onClick={() => setImageUrl(null)}>
                  Olib tashlash
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void pickImage(f);
                }}
              />
            </div>
            <p className="help">
              PNG, JPEG yoki WebP, eng ko&apos;pi 5 MB. Rasm saytning o&apos;z omboriga yuklanadi —
              begona saytdagi rasm foydalanuvchilarning IP manzilini o&apos;sha saytga beradi.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="a-link" className="label">Havola (ixtiyoriy)</label>
              <input id="a-link" name="linkUrl" maxLength={500} className="input"
                placeholder="/kurslar yoki https://t.me/turkcem_tr" />
              <p className="help">
                Sayt ichidagi yo&apos;l (&quot;/kurslar&quot;) yoki https havola. Boshqa shakl qabul qilinmaydi.
              </p>
            </div>
            <div>
              <label htmlFor="a-linklabel" className="label">Tugma matni</label>
              <input id="a-linklabel" name="linkLabel" maxLength={40} className="input" placeholder="Batafsil" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="a-ends" className="label">Qachon yo&apos;qolsin (ixtiyoriy)</label>
              <input id="a-ends" name="endsAt" type="datetime-local" className="input" />
            </div>
            <div className="grid content-end gap-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="dismissible" defaultChecked /> Foydalanuvchi yopa olsin
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="pinned" /> Yuqorida tursin
              </label>
            </div>
          </div>

          <div>
            <button type="submit" disabled={busy || !hydrated} className="btn btn-primary">
              Joylashtirish
            </button>
          </div>
        </form>
      </section>

      <section aria-labelledby="ann-list">
        <h2 id="ann-list" className="mb-4 text-[1.3rem]">Joylashtirilgan e&apos;lonlar</h2>
        {rows.length === 0 ? (
          <p className="text-muted">Hozircha e&apos;lon yo&apos;q.</p>
        ) : (
          <ul className="grid gap-2">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-[var(--r-tile)] border border-cobalt/20 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className={r.isActive ? "badge badge-ok" : "badge badge-warn"}>
                      {r.isActive ? "Faol" : "O'chirilgan"}
                    </span>
                    <span className="badge">{KINDS.find((k) => k.value === r.kind)?.label ?? r.kind}</span>
                    <span className="badge">{AUDIENCES.find((a) => a.value === r.audience)?.label ?? r.audience}</span>
                    <strong>{r.title}</strong>
                  </div>
                  <p className="text-sm text-muted">
                    {new Date(r.createdAt).toLocaleDateString("uz-UZ")} · {r.author} ·{" "}
                    {r.dismissedBy} kishi yopgan
                    {r.endsAt && ` · ${new Date(r.endsAt).toLocaleDateString("uz-UZ")} gacha`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" className="btn btn-outline" onClick={() => void toggle(r)}>
                    {r.isActive ? "O'chirish" : "Yoqish"}
                  </button>
                  <button type="button" className="btn btn-quiet" onClick={() => void remove(r)}>
                    Butunlay o&apos;chirish
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

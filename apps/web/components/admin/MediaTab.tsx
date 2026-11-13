"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { MEDIA_KINDS, watchUrl, type MediaItem, type MediaKind } from "@/lib/media";
import { errorText } from "../groups/shared";
import { useAdminData } from "./AdminPanel";

type Row = MediaItem & { published: boolean; position: number; checkNote: string | null; checkedAt: string | null };

const KIND_LABEL: Record<MediaKind, string> = {
  SERIES: "Serial",
  FILM: "Kino",
  MUSIC: "Qo'shiq",
  KIDS: "Bolalar uchun",
  LESSON: "Video dars",
};

const NOTE: Record<string, string> = {
  not_found: "YouTube'da topilmadi yoki yopilgan — saytda ko'rinmaydi",
  not_embeddable: "Egasi boshqa saytda ko'rsatishni taqiqlagan — saytda ko'rinmaydi",
};

/**
 * Kino, serial va musiqa: admin YouTube havolasini qo'yadi.
 *
 * Server havolani YouTube'ning o'zidan tekshiradi: video mavjudmi va
 * boshqa saytda ko'rsatishga ruxsat bormi. Kanal nomi ham YouTube'dan
 * olinadi — shu bo'yicha rasmiy kanal ekanini ko'rish mumkin.
 */
export function MediaTab({ onError }: { onError: (m: string) => void }) {
  const { data, busy, reload } = useAdminData<Row[]>("/media/manage", onError);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState("");

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    setSaving(true);
    setOk("");
    onError("");
    try {
      const created = await api<MediaItem>("/media", {
        method: "POST",
        body: {
          url: String(d.get("url") ?? "").trim(),
          kind: String(d.get("kind")),
          title: String(d.get("title") ?? "").trim() || undefined,
          description: String(d.get("description") ?? "").trim() || undefined,
          level: String(d.get("level") ?? "") || null,
        },
      });
      form.reset();
      setOk(`Qo'shildi: ${created.title}${created.channel ? ` (kanal: ${created.channel})` : ""}`);
      await reload();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function patch(id: string, body: Partial<Pick<Row, "published" | "position" | "level" | "kind">>) {
    try {
      await api(`/media/${id}`, { method: "PATCH", body });
      await reload();
    } catch (err) {
      onError(errorText(err));
    }
  }

  async function recheck(id: string) {
    try {
      await api(`/media/${id}/recheck`, { method: "POST" });
      await reload();
    } catch (err) {
      onError(errorText(err));
    }
  }

  async function remove(row: Row) {
    if (!window.confirm(`"${row.title}" o'chirilsinmi?`)) return;
    try {
      await api(`/media/${row.id}`, { method: "DELETE" });
      await reload();
    } catch (err) {
      onError(errorText(err));
    }
  }

  return (
    <div className="grid gap-8">
      <form onSubmit={onAdd} method="post" className="grid gap-4 border border-cobalt/30 bg-cobalt/[0.05] p-5 sm:p-6">
        <h2 className="text-[1.3rem]">YouTube'dan qo&apos;shish</h2>
        <p className="text-[0.9375rem] text-muted">
          Faqat <strong className="text-porcelain">rasmiy kanal</strong> (serial kanali, kinostudiya, ijrochining o&apos;z kanali)
          videolarini qo&apos;shing. Server havolani YouTube&apos;dan tekshiradi: video yo&apos;q yoki boshqa saytda ko&apos;rsatish
          taqiqlangan bo&apos;lsa — qo&apos;shilmaydi. Video bizda saqlanmaydi, faqat havola.
        </p>
        <div>
          <label htmlFor="m-url" className="label">YouTube havolasi</label>
          <input id="m-url" name="url" required minLength={10} maxLength={400} className="input" placeholder="https://www.youtube.com/watch?v=… yoki /playlist?list=…" />
          <p className="help">Pleylist havolasi qo&apos;yilsa — serialning barcha qismlari bitta pleyerda ketma-ket chiqadi.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="m-kind" className="label">Turi</label>
            <select id="m-kind" name="kind" defaultValue="SERIES" className="input">
              {MEDIA_KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="m-level" className="label">Daraja</label>
            <select id="m-level" name="level" defaultValue="" className="input">
              <option value="">Ko&apos;rsatilmagan</option>
              {["A1", "A2", "B1", "B2", "C1"].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="m-title" className="label">Nomi (ixtiyoriy)</label>
            <input id="m-title" name="title" maxLength={160} className="input" placeholder="Bo'sh — YouTube'dagi nom" />
          </div>
        </div>
        <div>
          <label htmlFor="m-desc" className="label">Qisqa tavsif (ixtiyoriy)</label>
          <textarea id="m-desc" name="description" rows={2} maxLength={600} className="input" placeholder="Nima haqida, qaysi daraja uchun foydali" />
        </div>
        {ok && <p className="alert-success" role="status">{ok}</p>}
        <button type="submit" disabled={saving} className="btn btn-primary justify-self-start">
          {saving ? "Tekshirilmoqda..." : "Qo'shish"}
        </button>
      </form>

      <section>
        <h2 className="mb-4 text-[1.3rem]">Ro&apos;yxat {data ? `(${data.length})` : ""}</h2>
        {busy && !data && <p className="text-muted" role="status">Yuklanmoqda...</p>}
        {data && data.length === 0 && <p className="text-muted">Hozircha bo&apos;sh.</p>}
        <ul className="grid gap-3">
          {data?.map((r) => (
            <li key={r.id} className={`flex flex-wrap items-start gap-4 border p-3.5 ${r.checkNote ? "border-danger/45 bg-danger/[0.06]" : "border-cobalt/25"}`}>
              <span className="relative block aspect-video w-36 shrink-0 overflow-hidden bg-well">
                {r.thumbnail && <Image src={r.thumbnail} alt="" fill sizes="144px" className="object-cover" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{r.title}</p>
                <p className="text-[0.8125rem] text-muted">
                  {KIND_LABEL[r.kind]} · {r.level ?? "daraja yo'q"} · kanal: {r.channel ?? "hali tekshirilmagan"}
                  {r.playlistId ? " · pleylist" : ""}
                </p>
                {r.checkNote && <p className="mt-1 text-[0.8125rem] text-danger">{NOTE[r.checkNote] ?? r.checkNote}</p>}
                <a href={watchUrl(r)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[0.8125rem] text-brass underline underline-offset-4">
                  YouTube&apos;da ko&apos;rish ↗
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-[0.875rem]">
                  <input type="checkbox" checked={r.published} onChange={(e) => patch(r.id, { published: e.target.checked })} className="size-4 accent-cobalt" />
                  Saytda
                </label>
                <input
                  type="number"
                  defaultValue={r.position}
                  min={0}
                  aria-label="Tartib raqami"
                  title="Tartib raqami: kichigi oldinda"
                  onBlur={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isInteger(n) && n !== r.position) void patch(r.id, { position: n });
                  }}
                  className="input !min-h-9 w-20 !py-1"
                />
                <button type="button" onClick={() => recheck(r.id)} className="btn btn-quiet !min-h-9 !px-3 !py-1 text-sm">Tekshirish</button>
                <button type="button" onClick={() => remove(r)} className="btn btn-quiet !min-h-9 !px-3 !py-1 text-sm text-danger">O&apos;chirish</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

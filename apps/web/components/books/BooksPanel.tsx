"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Book = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  level: string;
  kind: string;
  visibility: string;
  pageCount: number | null;
  fileName: string | null;
  fileSize: number | null;
  isMine: boolean;
  groupId: string | null;
  progress: { lastPage: number; finished: boolean } | null;
};

type ShelfItem = { id: string; title: string; level: string; lastPage: number; percent: number | null; finished: boolean };
type Group = { id: string; name: string; level: string };

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;

const KINDS: Record<string, string> = {
  TEXTBOOK: "Darslik",
  READER: "O'qish kitobi",
  WORKBOOK: "Mashq daftari",
  GRAMMAR: "Grammatika",
  EXAM_PREP: "Imtihonga tayyorlov",
  OTHER: "Boshqa",
};

const VISIBILITY: Record<string, string> = {
  PRIVATE: "Faqat men",
  GROUP: "Guruhga",
  LEVEL: "Daraja bo'yicha",
  PUBLIC: "Hammaga",
};

/** Bayt -> odam o'qiydigan ko'rinish */
function size(bytes: number | null): string {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export function BooksPanel() {
  const { user } = useAuth();
  const canEdit = user?.role === "TEACHER" || user?.role === "ADMIN";

  const [books, setBooks] = useState<Book[]>([]);
  const [shelf, setShelf] = useState<ShelfItem[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [level, setLevel] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (level) qs.set("level", level);
      if (query.trim()) qs.set("q", query.trim());
      const [list, mine] = await Promise.all([
        api<Book[]>(`/books${qs.toString() ? `?${qs}` : ""}`),
        api<ShelfItem[]>("/books/shelf").catch(() => [] as ShelfItem[]),
      ]);
      setBooks(list);
      setShelf(mine);
      setError("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ro'yxatni olib bo'lmadi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  useEffect(() => {
    if (canEdit) void api<Group[]>("/groups").then(setGroups).catch(() => {});
  }, [canEdit]);

  return (
    <div className="grid gap-10">
      {/* Davom etish */}
      {shelf.length > 0 && (
        <section>
          <h2 className="mb-4 text-[1.3rem]">Davom etish</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shelf.slice(0, 6).map((s) => (
              <li key={s.id}>
                <Link href={`/kitoblar/${s.id}`} className="raise block border border-cobalt/25 bg-tile p-4 hover:bg-tile-2">
                  <p className="font-medium">{s.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {s.level} · {s.finished ? "tugatildi" : `${s.lastPage}-sahifa`}
                  </p>
                  {s.percent !== null && (
                    <div className="mt-3 h-1.5 bg-well" role="progressbar" aria-valuenow={s.percent} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full bg-turquoise" style={{ width: `${s.percent}%` }} />
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Filtrlar */}
      <section>
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <div className="segment flex gap-1" role="tablist" aria-label="Daraja">
            <button type="button" role="tab" aria-selected={level === ""} onClick={() => setLevel("")} className="min-h-10 px-3 text-sm">
              Hammasi
            </button>
            {LEVELS.map((l) => (
              <button key={l} type="button" role="tab" aria-selected={level === l} onClick={() => setLevel(l)} className="min-h-10 px-3 text-sm">
                {l}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void load();
            }}
            method="post"
            className="flex items-end gap-2"
          >
            <div>
              <label htmlFor="book-q" className="label">
                Qidirish
              </label>
              <input id="book-q" value={query} onChange={(e) => setQuery(e.target.value)} className="input !min-h-10 w-48" />
            </div>
            <button type="submit" className="btn btn-outline !min-h-10 !px-4">
              Topish
            </button>
          </form>
          {canEdit && (
            <button type="button" onClick={() => setShowForm((v) => !v)} className="btn btn-primary !min-h-10 !px-4 sm:ml-auto">
              {showForm ? "Yopish" : "Material qo'shish"}
            </button>
          )}
        </div>

        {canEdit && showForm && (
          <AddBookForm
            groups={groups}
            isAdmin={user?.role === "ADMIN"}
            onDone={() => {
              setShowForm(false);
              void load();
            }}
          />
        )}

        {error && (
          <p className="mb-4 text-bole" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="skeleton h-28" />
            ))}
          </ul>
        ) : books.length === 0 ? (
          <p className="text-muted">
            Hozircha material yo&apos;q.
            {canEdit ? " «Material qo'shish» tugmasi bilan boshlang." : " Ustozingiz qo'shganda shu yerda ko'rinadi."}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {books.map((b) => (
              <li key={b.id}>
                <Link href={`/kitoblar/${b.id}`} className="raise flex h-full flex-col border border-cobalt/25 bg-tile p-5 hover:bg-tile-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[1.1rem] leading-snug">{b.title}</h3>
                    <span className="shrink-0 border border-cobalt/40 px-2 py-0.5 text-xs text-muted">{b.level}</span>
                  </div>
                  {b.author && <p className="mt-1 text-sm text-muted">{b.author}</p>}
                  {b.description && <p className="mt-2 line-clamp-2 text-[0.9375rem] text-muted">{b.description}</p>}
                  <p className="mt-auto pt-3 text-xs text-muted">
                    {KINDS[b.kind] ?? b.kind}
                    {b.fileSize ? ` · ${size(b.fileSize)}` : ""}
                    {b.isMine ? ` · ${VISIBILITY[b.visibility] ?? b.visibility}` : ""}
                    {b.progress && !b.progress.finished ? ` · ${b.progress.lastPage}-sahifada` : ""}
                    {b.progress?.finished ? " · tugatildi" : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ───────────────────────── Material qo'shish ─────────────────────────

function AddBookForm({ groups, isAdmin, onDone }: { groups: Group[]; isAdmin: boolean; onDone: () => void }) {
  const [visibility, setVisibility] = useState("PRIVATE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uploadNote, setUploadNote] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);

    try {
      let fileUrl = String(form.get("fileUrl") ?? "").trim() || undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let mimeType: string | undefined;

      // Fayl tanlangan bo'lsa: avval serverdan token olamiz, keyin faylni
      // TO'G'RIDAN-TO'G'RI saqlagichga yuboramiz. API orqali o'tkazmaymiz,
      // chunki Vercel funksiyasiga 4.5 MB dan katta so'rov sig'maydi.
      if (file) {
        setUploadNote("Fayl yuklanmoqda...");
        const { token } = await api<{ token: string }>("/books/upload-token", {
          method: "POST",
          body: { fileName: file.name, contentType: file.type || "application/octet-stream", size: file.size },
        });
        const { put } = await import("@vercel/blob");
        const blob = await put(`kitoblar/${file.name}`, file, {
          access: "public",
          token,
          contentType: file.type || "application/octet-stream",
        });
        fileUrl = blob.url;
        fileName = file.name;
        fileSize = file.size;
        mimeType = file.type || undefined;
        setUploadNote("");
      }

      const pageCountRaw = String(form.get("pageCount") ?? "").trim();
      await api("/books", {
        method: "POST",
        body: {
          title: String(form.get("title") ?? ""),
          author: String(form.get("author") ?? "").trim() || undefined,
          description: String(form.get("description") ?? "").trim() || undefined,
          level: String(form.get("level") ?? "A1"),
          kind: String(form.get("kind") ?? "OTHER"),
          visibility,
          groupId: visibility === "GROUP" ? String(form.get("groupId") ?? "") : undefined,
          fileUrl,
          fileName,
          fileSize,
          mimeType,
          pageCount: pageCountRaw ? Number(pageCountRaw) : undefined,
        },
      });
      onDone();
    } catch (err) {
      setUploadNote("");
      setError(err instanceof ApiError ? err.message : "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} method="post" className="mb-7 grid gap-4 border border-cobalt/30 bg-well p-5 sm:p-6">
      <p className="text-[0.9375rem] text-muted">
        Faqat <strong>o&apos;zingiz yozgan</strong> yoki tarqatishga huquqingiz bor materialni
        qo&apos;ying. Boshqa nashriyotning darsligini yuklash mualliflik huquqini buzadi.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="b-title" className="label">
            Nomi
          </label>
          <input id="b-title" name="title" required minLength={2} maxLength={200} className="input" />
        </div>
        <div>
          <label htmlFor="b-author" className="label">
            Muallif (ixtiyoriy)
          </label>
          <input id="b-author" name="author" maxLength={120} className="input" />
        </div>
        <div>
          <label htmlFor="b-level" className="label">
            Daraja
          </label>
          <select id="b-level" name="level" className="input" defaultValue="A1">
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="b-kind" className="label">
            Turi
          </label>
          <select id="b-kind" name="kind" className="input" defaultValue="OTHER">
            {Object.entries(KINDS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="b-desc" className="label">
          Izoh (ixtiyoriy)
        </label>
        <textarea id="b-desc" name="description" rows={2} maxLength={2000} className="input" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="b-vis" className="label">
            Kim ko&apos;radi
          </label>
          <select id="b-vis" name="visibility" value={visibility} onChange={(e) => setVisibility(e.target.value)} className="input">
            <option value="PRIVATE">Faqat men</option>
            <option value="GROUP">Bitta guruhim</option>
            <option value="LEVEL">Shu darajadagi hamma o&apos;quvchi</option>
            {isAdmin && <option value="PUBLIC">Kirgan har kim</option>}
          </select>
        </div>
        {visibility === "GROUP" && (
          <div>
            <label htmlFor="b-group" className="label">
              Guruh
            </label>
            <select id="b-group" name="groupId" required className="input">
              <option value="">Tanlang</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.level})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <fieldset className="grid gap-4 border border-cobalt/25 p-4">
        <legend className="px-2 text-sm text-muted">Material</legend>
        <div>
          <label htmlFor="b-file" className="label">
            Fayl (PDF, EPUB, rasm yoki audio — 60 MB gacha)
          </label>
          <input
            id="b-file"
            type="file"
            accept=".pdf,.epub,image/*,audio/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="b-url" className="label">
            Yoki tashqi havola (https)
          </label>
          <input id="b-url" name="fileUrl" type="url" placeholder="https://..." maxLength={1000} className="input" />
        </div>
        <div>
          <label htmlFor="b-pages" className="label">
            Sahifa soni (ixtiyoriy — jarayonni ko&apos;rsatish uchun)
          </label>
          <input id="b-pages" name="pageCount" type="number" min={1} className="input !w-32" />
        </div>
      </fieldset>

      {uploadNote && (
        <p className="text-[0.9375rem] text-turquoise" role="status">
          {uploadNote}
        </p>
      )}
      {error && (
        <p className="text-[0.9375rem] text-bole" role="alert">
          {error}
        </p>
      )}

      <div>
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </div>
    </form>
  );
}

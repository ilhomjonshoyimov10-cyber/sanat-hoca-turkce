"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Word = {
  id: string;
  turkish: string;
  uzbek: string;
  russian: string | null;
  level: string;
  category: string | null;
  exampleTr: string | null;
  exampleUz: string | null;
  partOfSpeech: string | null;
  pronunciation: string | null;
  tags: string[];
  frequency: number | null;
  verified: boolean;
  notes: string | null;
};

type Stats = {
  total: number;
  verified: number;
  unverified: number;
  byLevel: { level: string; count: number }[];
  categories: string[];
};

type WordSet = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: string | null;
  wordCount: number;
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;

const PARTS: Record<string, string> = {
  NOUN: "ot",
  VERB: "fe'l",
  ADJECTIVE: "sifat",
  ADVERB: "ravish",
  PRONOUN: "olmosh",
  NUMBER: "son",
  CONJUNCTION: "bog'lovchi",
  POSTPOSITION: "ko'makchi",
  INTERJECTION: "undov",
  PHRASE: "ibora",
};

const PAGE = 25;

export function DictionaryPanel() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [stats, setStats] = useState<Stats | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [level, setLevel] = useState("");
  const [verified, setVerified] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Word | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [sets, setSets] = useState<WordSet[]>([]);

  const load = useCallback(
    async (nextSkip = skip) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ take: String(PAGE), skip: String(nextSkip) });
        if (level) qs.set("level", level);
        if (verified) qs.set("verified", verified);
        if (query.trim()) qs.set("q", query.trim());
        const r = await api<{ rows: Word[]; total: number }>(`/dictionary?${qs}`);
        setWords(r.rows);
        setTotal(r.total);
        setSkip(nextSkip);
        setError("");
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Lug'atni olib bo'lmadi");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [level, verified, query],
  );

  const refreshStats = useCallback(() => {
    void api<Stats>("/dictionary/stats").then(setStats).catch(() => {});
    void api<WordSet[]>("/dictionary/sets").then(setSets).catch(() => {});
  }, []);

  useEffect(() => {
    void load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, verified]);

  useEffect(refreshStats, [refreshStats]);

  async function saveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      turkish: String(form.get("turkish") ?? ""),
      uzbek: String(form.get("uzbek") ?? ""),
      level: String(form.get("level") ?? ""),
      verified: form.get("verified") === "on",
    };
    for (const key of ["russian", "category", "exampleTr", "exampleUz", "pronunciation", "notes"]) {
      const v = String(form.get(key) ?? "").trim();
      if (v) body[key] = v;
    }
    const part = String(form.get("partOfSpeech") ?? "");
    if (part) body.partOfSpeech = part;
    const tags = String(form.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length) body.tags = tags;

    try {
      await api(`/dictionary/${editing.id}`, { method: "PATCH", body });
      setEditing(null);
      await load();
      refreshStats();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlab bo'lmadi");
    }
  }

  async function remove(id: string) {
    try {
      await api(`/dictionary/${id}`, { method: "DELETE" });
      await load();
      refreshStats();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "O'chirib bo'lmadi");
    }
  }

  const pages = Math.ceil(total / PAGE);
  const page = Math.floor(skip / PAGE) + 1;

  return (
    <div className="grid gap-9">
      {/* Holat */}
      {stats && (
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="raise border border-cobalt/25 bg-tile p-4">
            <p className="t-num text-2xl">{stats.total}</p>
            <p className="text-sm text-muted">so&apos;z lug&apos;atda</p>
          </div>
          <div className="raise border border-cobalt/25 bg-tile p-4">
            <p className="t-num text-2xl text-turquoise">{stats.verified}</p>
            <p className="text-sm text-muted">tasdiqlangan (o&apos;yinlarga tushadi)</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setVerified("0");
              setQuery("");
            }}
            className="raise border border-cobalt/25 bg-tile p-4 text-left hover:bg-tile-2"
          >
            <p className={`t-num text-2xl ${stats.unverified > 0 ? "text-brass" : ""}`}>{stats.unverified}</p>
            <p className="text-sm text-muted">
              tekshirilmagan {stats.unverified > 0 ? "— bosib ko'rish" : ""}
            </p>
          </button>
        </section>
      )}

      {/* Filtrlar */}
      <section>
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <div className="segment flex flex-wrap gap-1" role="tablist" aria-label="Daraja">
            <button type="button" role="tab" aria-selected={level === ""} onClick={() => setLevel("")} className="min-h-10 px-3 text-sm">
              Hammasi
            </button>
            {LEVELS.map((l) => (
              <button key={l} type="button" role="tab" aria-selected={level === l} onClick={() => setLevel(l)} className="min-h-10 px-3 text-sm">
                {l}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="d-verified" className="label">
              Holat
            </label>
            <select id="d-verified" value={verified} onChange={(e) => setVerified(e.target.value)} className="input !min-h-10">
              <option value="">Hammasi</option>
              <option value="1">Tasdiqlangan</option>
              <option value="0">Tekshirilmagan</option>
            </select>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void load(0);
            }}
            method="post"
            className="flex items-end gap-2"
          >
            <div>
              <label htmlFor="d-q" className="label">
                Qidirish
              </label>
              <input id="d-q" value={query} onChange={(e) => setQuery(e.target.value)} className="input !min-h-10 w-44" />
            </div>
            <button type="submit" className="btn btn-outline !min-h-10 !px-4">
              Topish
            </button>
          </form>

          <button type="button" onClick={() => setShowAdd((v) => !v)} className="btn btn-primary !min-h-10 !px-4 sm:ml-auto">
            {showAdd ? "Yopish" : "So'z qo'shish"}
          </button>
        </div>

        {showAdd && (
          <AddWordForm
            categories={stats?.categories ?? []}
            onDone={() => {
              setShowAdd(false);
              void load(0);
              refreshStats();
            }}
          />
        )}

        {error && (
          <p className="mb-4 text-bole" role="alert">
            {error}
          </p>
        )}

        {/* Jadval */}
        {loading ? (
          <div className="grid gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-12" />
            ))}
          </div>
        ) : words.length === 0 ? (
          <p className="text-muted">So&apos;z topilmadi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] border-collapse text-[0.9375rem]">
              <thead>
                <tr>
                  <th className="text-left">Turkcha</th>
                  <th className="text-left">O&apos;zbekcha</th>
                  <th className="text-left">Daraja</th>
                  <th className="text-left">Turkum</th>
                  <th className="text-left">Holat</th>
                  <th className="text-right">Amal</th>
                </tr>
              </thead>
              <tbody>
                {words.map((w) => (
                  <tr key={w.id}>
                    <td lang="tr" className="font-medium">
                      {w.turkish}
                      {w.exampleTr && <span className="block text-xs text-muted">{w.exampleTr}</span>}
                    </td>
                    <td>{w.uzbek}</td>
                    <td>{w.level}</td>
                    <td className="text-muted">{w.partOfSpeech ? PARTS[w.partOfSpeech] : "—"}</td>
                    <td>
                      {w.verified ? (
                        <span className="text-turquoise">tasdiq</span>
                      ) : (
                        <span className="text-brass">tekshirilsin</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button type="button" onClick={() => setEditing(w)} className="text-turquoise hover:underline">
                        Tahrir
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => void remove(w.id)}
                          className="ml-3 text-muted hover:text-bole"
                        >
                          O&apos;chirish
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sahifalash */}
        {pages > 1 && (
          <div className="mt-5 flex items-center justify-between gap-4">
            <button
              type="button"
              disabled={skip === 0}
              onClick={() => void load(Math.max(0, skip - PAGE))}
              className="btn btn-outline !min-h-10 !px-4 text-sm"
            >
              Oldingi
            </button>
            <span className="text-sm text-muted">
              {page} / {pages} ({total} so&apos;z)
            </span>
            <button
              type="button"
              disabled={skip + PAGE >= total}
              onClick={() => void load(skip + PAGE)}
              className="btn btn-outline !min-h-10 !px-4 text-sm"
            >
              Keyingi
            </button>
          </div>
        )}
      </section>

      {/* Tahrirlash */}
      {editing && (
        <section className="border border-brass/40 bg-well p-5 sm:p-6">
          <h2 className="mb-4 text-[1.2rem]">
            Tahrirlash: <span lang="tr">{editing.turkish}</span>
          </h2>
          <form onSubmit={saveEdit} method="post" className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="e-tr" className="label">
                  Turkcha
                </label>
                <input id="e-tr" name="turkish" lang="tr" defaultValue={editing.turkish} required className="input" />
              </div>
              <div>
                <label htmlFor="e-uz" className="label">
                  O&apos;zbekcha
                </label>
                <input id="e-uz" name="uzbek" defaultValue={editing.uzbek} required className="input" />
              </div>
              <div>
                <label htmlFor="e-ru" className="label">
                  Ruscha (ixtiyoriy)
                </label>
                <input id="e-ru" name="russian" defaultValue={editing.russian ?? ""} className="input" />
              </div>
              <div>
                <label htmlFor="e-level" className="label">
                  Daraja
                </label>
                <select id="e-level" name="level" defaultValue={editing.level} className="input">
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="e-part" className="label">
                  So&apos;z turkumi
                </label>
                <select id="e-part" name="partOfSpeech" defaultValue={editing.partOfSpeech ?? ""} className="input">
                  <option value="">—</option>
                  {Object.entries(PARTS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="e-cat" className="label">
                  Mavzu
                </label>
                <input id="e-cat" name="category" defaultValue={editing.category ?? ""} list="cats" className="input" />
                <datalist id="cats">
                  {(stats?.categories ?? []).map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="e-extr" className="label">
                  Misol (turkcha)
                </label>
                <input id="e-extr" name="exampleTr" lang="tr" defaultValue={editing.exampleTr ?? ""} className="input" />
              </div>
              <div>
                <label htmlFor="e-exuz" className="label">
                  Misol (o&apos;zbekcha)
                </label>
                <input id="e-exuz" name="exampleUz" defaultValue={editing.exampleUz ?? ""} className="input" />
              </div>
              <div>
                <label htmlFor="e-pron" className="label">
                  Talaffuz izohi
                </label>
                <input id="e-pron" name="pronunciation" defaultValue={editing.pronunciation ?? ""} className="input" />
              </div>
              <div>
                <label htmlFor="e-tags" className="label">
                  Teglar (vergul bilan)
                </label>
                <input id="e-tags" name="tags" defaultValue={editing.tags.join(", ")} className="input" />
              </div>
            </div>

            <div>
              <label htmlFor="e-notes" className="label">
                Ichki izoh (o&apos;quvchi ko&apos;rmaydi)
              </label>
              <textarea id="e-notes" name="notes" rows={2} defaultValue={editing.notes ?? ""} className="input" />
            </div>

            <label className="flex items-center gap-3">
              <input type="checkbox" name="verified" defaultChecked={editing.verified} className="size-5 accent-primary" />
              <span>Tasdiqlangan — o&apos;yinlarga tushadi</span>
            </label>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn btn-primary">
                Saqlash
              </button>
              <button type="button" onClick={() => setEditing(null)} className="btn btn-outline">
                Bekor qilish
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Mavzuli to'plamlar */}
      <section>
        <h2 className="mb-4 text-[1.3rem]">Mavzuli to&apos;plamlar</h2>
        <p className="mb-4 text-[0.9375rem] text-muted">
          To&apos;plam — bitta mavzudagi so&apos;zlar ro&apos;yxati (masalan &laquo;Restoranda&raquo;).
          Guruhga aynan shu to&apos;plamni berish uchun qulay.
        </p>
        <NewSetForm onDone={refreshStats} />
        {sets.length === 0 ? (
          <p className="text-muted">Hali to&apos;plam yo&apos;q.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {sets.map((s) => (
              <li key={s.id} className="border border-cobalt/25 bg-tile p-4">
                <p className="font-medium">{s.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {s.level ?? "daraja yo'q"} · {s.wordCount} so&apos;z
                </p>
                {s.description && <p className="mt-2 text-[0.9375rem] text-muted">{s.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ───────────────────────── Yangi so'z ─────────────────────────

function AddWordForm({ categories, onDone }: { categories: string[]; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      turkish: String(form.get("turkish") ?? ""),
      uzbek: String(form.get("uzbek") ?? ""),
      level: String(form.get("level") ?? "A1"),
    };
    for (const key of ["russian", "category", "exampleTr", "exampleUz", "pronunciation"]) {
      const v = String(form.get(key) ?? "").trim();
      if (v) body[key] = v;
    }
    const part = String(form.get("partOfSpeech") ?? "");
    if (part) body.partOfSpeech = part;

    try {
      await api("/dictionary", { method: "POST", body });
      (e.target as HTMLFormElement).reset();
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} method="post" className="mb-6 grid gap-4 border border-cobalt/30 bg-well p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="n-tr" className="label">
            Turkcha
          </label>
          <input id="n-tr" name="turkish" lang="tr" required maxLength={80} className="input" />
        </div>
        <div>
          <label htmlFor="n-uz" className="label">
            O&apos;zbekcha
          </label>
          <input id="n-uz" name="uzbek" required maxLength={120} className="input" />
        </div>
        <div>
          <label htmlFor="n-level" className="label">
            Daraja
          </label>
          <select id="n-level" name="level" className="input" defaultValue="A1">
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="n-part" className="label">
            So&apos;z turkumi
          </label>
          <select id="n-part" name="partOfSpeech" className="input" defaultValue="">
            <option value="">—</option>
            {Object.entries(PARTS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="n-cat" className="label">
            Mavzu
          </label>
          <input id="n-cat" name="category" list="cats-new" maxLength={60} className="input" />
          <datalist id="cats-new">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="n-pron" className="label">
            Talaffuz izohi
          </label>
          <input id="n-pron" name="pronunciation" maxLength={120} className="input" />
        </div>
        <div>
          <label htmlFor="n-extr" className="label">
            Misol (turkcha)
          </label>
          <input id="n-extr" name="exampleTr" lang="tr" maxLength={300} className="input" />
        </div>
        <div>
          <label htmlFor="n-exuz" className="label">
            Misol (o&apos;zbekcha)
          </label>
          <input id="n-exuz" name="exampleUz" maxLength={300} className="input" />
        </div>
      </div>

      {error && (
        <p className="text-bole" role="alert">
          {error}
        </p>
      )}
      <div>
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? "Saqlanmoqda..." : "Qo'shish"}
        </button>
      </div>
    </form>
  );
}

function NewSetForm({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await api("/dictionary/sets", {
        method: "POST",
        body: {
          title: String(form.get("title") ?? ""),
          description: String(form.get("description") ?? "").trim() || undefined,
          level: String(form.get("level") ?? "") || undefined,
        },
      });
      setOpen(false);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-outline !min-h-10 !px-4 mb-5 text-sm">
        To&apos;plam yaratish
      </button>
    );
  }

  return (
    <form onSubmit={submit} method="post" className="mb-5 grid gap-4 border border-cobalt/30 bg-well p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="s-title" className="label">
            Nomi
          </label>
          <input id="s-title" name="title" required minLength={2} maxLength={120} className="input" />
        </div>
        <div>
          <label htmlFor="s-level" className="label">
            Daraja (ixtiyoriy)
          </label>
          <select id="s-level" name="level" className="input" defaultValue="">
            <option value="">—</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="s-desc" className="label">
            Izoh
          </label>
          <input id="s-desc" name="description" maxLength={500} className="input" />
        </div>
      </div>
      {error && (
        <p className="text-bole" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className="btn btn-primary">
          Yaratish
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-outline">
          Bekor
        </button>
      </div>
    </form>
  );
}

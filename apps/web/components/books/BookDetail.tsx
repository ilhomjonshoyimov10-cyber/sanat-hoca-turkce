"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Chapter = { id: string; title: string; position: number; startPage: number | null };

type Book = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  level: string;
  kind: string;
  visibility: string;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  pageCount: number | null;
  isMine: boolean;
  uploadedBy: { firstName: string; lastName: string } | null;
  chapters: Chapter[];
  progress: { lastPage: number; finished: boolean } | null;
};

// pdf.js og'ir — faqat PDF ochilganda yuklanadi
const PdfReader = dynamic(() => import("./PdfReader").then((m) => m.PdfReader), {
  ssr: false,
  loading: () => <p className="text-muted" role="status">PDF o&apos;quvchi yuklanmoqda...</p>,
});

/** Sayt ichida o'qiladimi: faqat o'z omborimizdagi PDF (begona sayt CORS ga ruxsat bermasligi mumkin). */
function isOwnPdf(b: { fileUrl: string | null; mimeType: string | null; fileName: string | null }): boolean {
  if (!b.fileUrl) return false;
  const pdf = b.mimeType === "application/pdf" || /\.pdf$/i.test(b.fileName ?? "") || /\.pdf(\?|$)/i.test(b.fileUrl);
  try {
    return pdf && new URL(b.fileUrl).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/** Havola qaysi saytga olib borishini ko'rsatamiz — foydalanuvchi bosishdan
 *  oldin bilsin (ustoz qo'ygan tashqi havola har qanday joyga ketishi mumkin). */
function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "tashqi sayt";
  }
}

export function BookDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params?.id) return;
    void api<Book>(`/books/${params.id}`)
      .then((b) => {
        setBook(b);
        setPage(b.progress?.lastPage ?? 1);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Kitob topilmadi"));
  }, [params?.id]);

  async function saveProgress(finished?: boolean, at: number = page) {
    if (!book) return;
    try {
      const r = await api<{ lastPage: number; finished: boolean }>(`/books/${book.id}/progress`, {
        method: "PUT",
        body: { lastPage: at, ...(finished === undefined ? {} : { finished }) },
      });
      setBook({ ...book, progress: r });
      setSaved("Saqlandi");
      setTimeout(() => setSaved(""), 2000);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Saqlab bo'lmadi");
    }
  }

  // PDF varaqlanganda — qayerda qolgani 1.5 soniyadan keyin avtomatik saqlanadi
  const timer = useRef<number | undefined>(undefined);
  const bookId = book?.id;
  const onPdfPage = useCallback((n: number) => {
    setPage(n);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (!bookId) return;
      void api(`/books/${bookId}/progress`, { method: "PUT", body: { lastPage: n } }).catch(() => undefined);
    }, 1500);
  }, [bookId]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function remove() {
    if (!book) return;
    try {
      await api(`/books/${book.id}`, { method: "DELETE" });
      router.push("/kitoblar");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "O'chirib bo'lmadi");
    }
  }

  if (error) {
    return (
      <div>
        <p className="text-bole" role="alert">
          {error}
        </p>
        <Link href="/kitoblar" className="mt-4 inline-block text-turquoise hover:underline">
          ← Materiallarga qaytish
        </Link>
      </div>
    );
  }
  if (!book) return <p className="text-muted" role="status">Yuklanmoqda...</p>;

  const canEdit = book.isMine || user?.role === "ADMIN";

  return (
    <div>
      <Link href="/kitoblar" className="mb-5 inline-block text-sm text-turquoise hover:underline">
        ← Materiallar
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[2rem] font-bold leading-tight">{book.title}</h1>
          <p className="mt-2 text-muted">
            {book.author ? `${book.author} · ` : ""}
            {book.level}
            {book.uploadedBy ? ` · ${book.uploadedBy.firstName} ${book.uploadedBy.lastName} qo'shgan` : ""}
          </p>
        </div>
        {canEdit && (
          <button type="button" onClick={() => void remove()} className="btn btn-outline !min-h-10 !px-4 text-sm">
            O&apos;chirish
          </button>
        )}
      </div>

      {book.description && <p className="mt-5 whitespace-pre-wrap text-[1.0625rem]">{book.description}</p>}

      {/* Sayt ichida o'qish */}
      {isOwnPdf(book) && (
        <section className="mt-7">
          <PdfReader url={book.fileUrl!} initialPage={book.progress?.lastPage ?? 1} onPage={onPdfPage} />
        </section>
      )}

      {/* Faylni ochish */}
      {book.fileUrl ? (
        <div className="raise mt-7 border border-cobalt/30 bg-tile p-5">
          <a href={book.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Materialni ochish
          </a>
          <p className="mt-3 text-sm text-muted">
            Yangi oynada ochiladi: {hostOf(book.fileUrl)}
            {book.fileName ? ` · ${book.fileName}` : ""}
          </p>
        </div>
      ) : (
        <p className="mt-7 text-muted">Bu yozuvga hali fayl yoki havola qo&apos;shilmagan.</p>
      )}

      {/* Boblar */}
      {book.chapters.length > 0 && (
        <section className="mt-9">
          <h2 className="mb-3 text-[1.2rem]">Mundarija</h2>
          <ol className="grid gap-1.5">
            {book.chapters.map((c) => (
              <li key={c.id} className="flex items-baseline justify-between gap-4 border-b border-cobalt/20 py-2">
                <span>{c.title}</span>
                {c.startPage && <span className="shrink-0 text-sm text-muted">{c.startPage}-bet</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Qayerda qolganim */}
      <section className="mt-9 border border-cobalt/25 bg-well p-5">
        <h2 className="text-[1.2rem]">Qayerda qoldim</h2>
        <p className="mt-1 text-sm text-muted">
          Belgilab qo&apos;ysangiz, boshqa qurilmada ham shu sahifadan davom etasiz.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="page" className="label">
              Sahifa
            </label>
            <input
              id="page"
              type="number"
              min={1}
              max={book.pageCount ?? undefined}
              value={page}
              onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))}
              className="input !w-28"
            />
          </div>
          <button type="button" onClick={() => void saveProgress()} className="btn btn-outline !min-h-11 !px-4">
            Saqlash
          </button>
          <button
            type="button"
            onClick={() => void saveProgress(!book.progress?.finished)}
            className="btn btn-outline !min-h-11 !px-4"
          >
            {book.progress?.finished ? "Tugatilmagan deb belgilash" : "Tugatdim"}
          </button>
          {saved && (
            <span className="text-sm text-turquoise" role="status">
              {saved}
            </span>
          )}
        </div>
        {book.pageCount && (
          <p className="mt-3 text-sm text-muted">
            Jami {book.pageCount} sahifa
            {book.progress ? ` · ${Math.round((book.progress.lastPage / book.pageCount) * 100)}% o'qildi` : ""}
          </p>
        )}
      </section>
    </div>
  );
}

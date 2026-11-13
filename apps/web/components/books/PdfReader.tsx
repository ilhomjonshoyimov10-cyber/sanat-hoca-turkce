"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

/**
 * PDF ni SAYT ICHIDA o'qish (pdf.js).
 *
 * Nega brauzerning o'z PDF ko'rgichi emas: Android'dagi Chrome iframe
 * ichida PDF ko'rsatmaydi — faqat "yuklab olish" tugmasini chiqaradi.
 * pdf.js esa har qanday telefonda bir xil ishlaydi.
 *
 * Kutubxona (~1 MB) faqat shu komponent ochilganda yuklanadi.
 */
export function PdfReader({
  url,
  initialPage,
  onPage,
  onPageCount,
}: {
  url: string;
  initialPage: number;
  onPage: (page: number) => void;
  onPageCount?: (n: number) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const task = useRef<RenderTask | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(Math.max(1, initialPage));
  const [zoom, setZoom] = useState(1); // 1 = kenglikka moslash
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [width, setWidth] = useState(0);

  // Hujjatni yuklash
  useEffect(() => {
    let alive = true;
    let loaded: PDFDocumentProxy | null = null;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
        loaded = await pdfjs.getDocument({ url, withCredentials: false }).promise;
        if (!alive) return;
        setDoc(loaded);
        onPageCount?.(loaded.numPages);
        setPage((p) => Math.min(p, loaded!.numPages));
        setState("ready");
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => {
      alive = false;
      void loaded?.destroy();
    };
    // onPageCount ataylab kiritilmagan: hujjat faqat url o'zgarsa qayta yuklanadi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Konteyner kengligi (telefonni burganda ham)
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Sahifani chizish
  useEffect(() => {
    if (!doc || !canvas.current || width === 0) return;
    let cancelled = false;
    (async () => {
      const p = await doc.getPage(page);
      if (cancelled) return;
      const base = p.getViewport({ scale: 1 });
      const scale = (width / base.width) * zoom;
      const viewport = p.getViewport({ scale });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const c = canvas.current!;
      c.width = Math.floor(viewport.width * dpr);
      c.height = Math.floor(viewport.height * dpr);
      c.style.width = `${Math.floor(viewport.width)}px`;
      c.style.height = `${Math.floor(viewport.height)}px`;
      task.current?.cancel();
      task.current = p.render({
        canvas: c,
        viewport,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
      });
      await task.current.promise.catch(() => undefined);
    })();
    return () => {
      cancelled = true;
      task.current?.cancel();
    };
  }, [doc, page, zoom, width]);

  const go = useCallback(
    (n: number) => {
      if (!doc) return;
      const next = Math.max(1, Math.min(doc.numPages, n));
      setPage(next);
      onPage(next);
      wrap.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    },
    [doc, onPage],
  );

  // Klaviatura: ← → bilan varaqlash
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") go(page + 1);
      if (e.key === "ArrowLeft") go(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, page]);

  if (state === "error") {
    return (
      <div className="alert-error">
        PDF ni sayt ichida ochib bo&apos;lmadi.{" "}
        <a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Yangi oynada ochish</a>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="sticky top-[4.25rem] z-10 flex flex-wrap items-center gap-2 border border-cobalt/30 bg-tile/95 p-2 backdrop-blur">
        <button type="button" onClick={() => go(page - 1)} disabled={!doc || page <= 1} className="btn btn-outline !min-h-9 !px-3 !py-1 text-sm">←</button>
        <label className="flex items-center gap-1.5 text-sm">
          <span className="sr-only">Sahifa</span>
          <input
            type="number"
            min={1}
            max={doc?.numPages}
            value={page}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isInteger(n)) go(n);
            }}
            className="input !min-h-9 w-20 !py-1 text-center"
          />
          <span className="text-muted">/ {doc?.numPages ?? "…"}</span>
        </label>
        <button type="button" onClick={() => go(page + 1)} disabled={!doc || page >= doc.numPages} className="btn btn-outline !min-h-9 !px-3 !py-1 text-sm">→</button>
        <span className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))} className="btn btn-quiet !min-h-9 !px-3 !py-1 text-sm" aria-label="Kichiklashtirish">−</button>
          <span className="w-12 text-center text-sm text-muted">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(2.4, +(z + 0.2).toFixed(1)))} className="btn btn-quiet !min-h-9 !px-3 !py-1 text-sm" aria-label="Kattalashtirish">+</button>
        </span>
      </div>
      <div ref={wrap} className="scroll-mt-32 overflow-x-auto border border-cobalt/25 bg-[#e9ecf3]">
        {state === "loading" && <p className="p-8 text-center text-[#425079]" role="status">PDF yuklanmoqda...</p>}
        <canvas ref={canvas} className="mx-auto block" />
      </div>
    </div>
  );
}

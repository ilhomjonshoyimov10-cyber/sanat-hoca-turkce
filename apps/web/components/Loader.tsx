"use client";

// Yuklanish belgisi. Asos: Uiverse.io, andrew-manzyk (MIT litsenziyasi) —
// "linza" effekti: so'z 9 ta tilimga bo'linadi, o'rtasi kattaroq, chetlari
// kichik va xira, matn shu "shisha" orqali suzib o'tadi.
// Moslashtirildi: brend so'zi, çini ranglari (tungi/kunduzgi rejim),
// o'lcham variantlari, ekran o'quvchi uchun matn, kamroq harakat rejimi.

import { useI18n } from "@/lib/i18n/client";

const WORD = "Sanat Hoca";

export function Loader({ size = "md", label }: { size?: "sm" | "md" | "lg"; label?: string }) {
  const { t } = useI18n();
  return (
    <div role="status" className={`sh-loader-wrap sh-loader-${size}`}>
      <div className="sh-loader" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="text">
            <span>{WORD}</span>
          </div>
        ))}
        <div className="line" />
      </div>
      <span className="sr-only">{label ?? t.common.loading}</span>
    </div>
  );
}

/** Sahifa yoki bo'lim yuklanayotganda: markazda, yetarli balandlikda. */
export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="grid min-h-[40vh] place-items-center py-10">
      <Loader size="md" label={label} />
    </div>
  );
}

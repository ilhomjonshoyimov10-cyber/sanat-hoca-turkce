import type { LibraryBook, Tone } from "@/lib/library";

// Muqova rasm emas — CSS: har bir kitobga o'z rangi va çini naqshi.
// Rasm yuklanmaydi, sahifa tez ochiladi, va hech kimning rasmi ishlatilmaydi.
const TONE: Record<Tone, { bg: string; ink: string; line: string }> = {
  cobalt: { bg: "linear-gradient(160deg,#1d3a8f,#0a1638 70%)", ink: "#eef2fd", line: "rgba(227,174,91,.7)" },
  turquoise: { bg: "linear-gradient(160deg,#0f6d6c,#062628 70%)", ink: "#eafffd", line: "rgba(238,242,253,.55)" },
  brass: { bg: "linear-gradient(160deg,#8a5b1c,#2a1a08 70%)", ink: "#fff6e6", line: "rgba(255,230,190,.6)" },
  bole: { bg: "linear-gradient(160deg,#8f2a22,#2c0b09 70%)", ink: "#fff1ef", line: "rgba(227,174,91,.65)" },
};

export function BookCover({ book, size = "md" }: { book: Pick<LibraryBook, "title" | "level" | "tone">; size?: "sm" | "md" | "lg" }) {
  const t = TONE[book.tone];
  const title = size === "lg" ? "text-[1.9rem]" : size === "sm" ? "text-[1.05rem]" : "text-[1.4rem]";
  return (
    <div
      className="relative isolate flex aspect-[3/4] w-full flex-col justify-between overflow-hidden rounded-[4px] p-[9%] shadow-[0_24px_50px_-28px_rgba(0,0,0,.9),inset_0_1px_0_rgba(255,255,255,.12)]"
      style={{ background: t.bg, color: t.ink }}
    >
      {/* Çini naqshi */}
      <svg className="absolute inset-0 -z-10 size-full opacity-[0.13]" aria-hidden="true">
        <defs>
          <pattern id={`p-${book.tone}`} width="34" height="34" patternUnits="userSpaceOnUse">
            <rect x="9" y="9" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" />
            <rect x="9" y="9" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(45 17 17)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#p-${book.tone})`} />
      </svg>
      {/* Kitob umurtqasi */}
      <span className="absolute inset-y-0 left-0 w-[6%] bg-black/25" aria-hidden="true" />
      <span className="absolute inset-[5%] left-[9%] border" style={{ borderColor: t.line }} aria-hidden="true" />

      <span className="relative self-end rounded-full border px-2 py-0.5 text-[0.7rem] font-bold tracking-wider" style={{ borderColor: t.line }}>
        {book.level}
      </span>
      <p lang="tr" className={`relative font-display font-semibold leading-[1.05] tracking-[-0.02em] ${title}`}>{book.title}</p>
      <span className="relative h-px w-1/3" style={{ background: t.line }} aria-hidden="true" />
    </div>
  );
}

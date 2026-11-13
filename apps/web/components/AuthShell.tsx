import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { Mosque } from "./fx/Mosque";

/** Kirish va ro'yxatdan o'tish sahifalarining ramkasi.
 *  Chapda çini panel (bitta turkcha so'z — mahsulot shu), o'ngda forma. */
export async function AuthShell({
  title,
  lead,
  word,
  translation,
  sentence,
  footer,
  children,
}: {
  title: string;
  lead: string;
  word: string;
  translation: string;
  sentence: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = await getT();
  return (
    <div className="container-page py-10 sm:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden border border-cobalt/30 lg:grid-cols-[1fr_1fr]">
        {/* Çini panel */}
        <aside className="relative hidden flex-col justify-between bg-[linear-gradient(165deg,#101c42,#060c1e)] p-10 lg:flex">
          <div className="cini-field absolute inset-0 opacity-70 [mask-image:none]" aria-hidden="true" />
          <div className="relative flex items-center gap-2.5 font-display text-[1.15rem] font-semibold tracking-[-0.02em]">
            <Mosque className="size-7 text-brass" />
            Sanat Hoca Türkçe
          </div>

          <div className="relative">
            <p lang="tr" className="t-word text-[clamp(3rem,5vw,4rem)] text-porcelain">{word}</p>
            <p className="mt-2 text-lg text-brass">{translation}</p>
            <div className="rule my-7 max-w-[14rem]" />
            <p lang="tr" className="text-[1.0625rem] text-muted">{sentence}</p>
          </div>

          <p className="relative text-[0.875rem] text-muted">
            {t.auth.dailyWord}
          </p>
        </aside>

        {/* Forma */}
        <div className="bg-ink p-7 sm:p-10 lg:p-12">
          <Link href="/" className="mb-8 inline-flex items-center gap-2.5 font-display text-[1.1rem] font-semibold tracking-[-0.02em] lg:hidden">
            <Mosque className="size-6 text-brass" />
            Sanat Hoca Türkçe
          </Link>
          <h1 className="text-[2.1rem] sm:text-[2.5rem]">{title}</h1>
          <p className="mt-3 text-muted">{lead}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-7 text-[0.9375rem] text-muted">{footer}</div>
        </div>
      </div>
    </div>
  );
}

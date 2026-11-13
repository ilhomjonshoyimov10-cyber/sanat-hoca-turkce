import Link from "next/link";
import { FlipCard } from "@/components/fx/FlipCard";
import { HeroVisual } from "@/components/fx/HeroVisual";
import { Reveal } from "@/components/fx/Reveal";
import { QuoteBanner } from "@/components/home/QuoteBanner";
import { WordOfDay } from "@/components/home/WordOfDay";
import { LeadForm } from "@/components/LeadForm";
import { marqueeWords } from "@/lib/content";
import { getT } from "@/lib/i18n/server";

/* Çini motifi: sakkiz burchakli yulduz. Bo'lim boshlarida kichik belgi. */
const Star = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`size-6 ${className}`} fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
    <rect x="5" y="5" width="14" height="14" />
    <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
    <circle cx="12" cy="12" r="2.2" />
  </svg>
);

const Check = () => (
  <svg viewBox="0 0 24 24" className="size-[1.1em] shrink-0 text-turquoise" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12 4 4 10-10" />
  </svg>
);

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export default async function HomePage() {
  const { t, locale } = await getT();
  const h = t.home;
  const features = h.features;
  return (
    <>
      {/* ═════ Hero ═════
          Yagona uyushtirilgan moment: matn, ravoq va yorliqlar ketma-ket yonadi. */}
      <section className="relative overflow-x-clip">
        <div className="cini-field absolute inset-0 -z-10" aria-hidden="true" />

        <div className="container-page grid items-center gap-y-14 pb-20 pt-12 lg:grid-cols-[1fr_28rem] lg:gap-x-16 lg:pb-28 lg:pt-20">
          <div>
            <p className="lamp flex items-center gap-2.5 text-sm font-medium text-turquoise" style={{ "--d": "0ms" } as React.CSSProperties}>
              <span className="size-1.5 rotate-45 bg-turquoise" />
              {h.eyebrow}
            </p>

            {/* Sarlavha: bitta so'zni bo'yash yo'q — butun satr bir xil vaznda. */}
            <h1 className="t-hero lamp mt-5 text-[clamp(2.9rem,7vw,5.4rem)]" style={{ "--d": "80ms" } as React.CSSProperties}>
              {h.title}
            </h1>

            <p className="lamp mt-7 max-w-[46ch] text-lg text-muted" style={{ "--d": "180ms" } as React.CSSProperties}>
              {h.text}
            </p>

            <div className="lamp mt-9 flex flex-col gap-3 sm:flex-row" style={{ "--d": "260ms" } as React.CSSProperties}>
              <Link href="#ariza" className="btn btn-primary">{h.primary}</Link>
              <Link href="#darajalar" className="btn btn-outline">{h.secondary}</Link>
            </div>

            <ul className="lamp mt-10 flex flex-wrap gap-x-7 gap-y-2.5 text-[0.9375rem] text-muted" style={{ "--d": "340ms" } as React.CSSProperties}>
              {h.trust.map((x) => (
                <li key={x} className="flex items-center gap-2"><Check />{x}</li>
              ))}
            </ul>
          </div>

          <div className="lamp-glow" style={{ "--d": "300ms" } as React.CSSProperties}>
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ═════ So'zlar lentasi ═════
          Mahsulot — so'z. Shuning uchun so'zlar display shriftda, katta. */}
      <div className="marquee border-y border-cobalt/25 py-5" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {marqueeWords.map((tr, i) => (
                <span key={`${copy}-${tr}`} className="flex items-baseline gap-3 px-7">
                  <span lang="tr" className="t-word text-[1.6rem] text-porcelain">{tr}</span>
                  <span className="text-[0.9375rem] text-muted">{h.marquee[i]}</span>
                  <span className="ml-4 size-1 rotate-45 self-center bg-brass" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ═════ Til haqida: Atatürk so'zi ═════ */}
      <QuoteBanner t={t} locale={locale} />

      {/* ═════ Nima o'rgatamiz ═════ */}
      <section className="container-page py-24 lg:py-32">
        <div className="grid gap-6 border-t border-cobalt/25 pt-8 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <div>
            <Star className="mb-5 text-cobalt" />
            <h2 className="text-[clamp(2.2rem,4.6vw,3.6rem)]">{h.sectionTitle}</h2>
          </div>
          <p className="text-lg text-muted lg:pt-14">{h.sectionText}</p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden border border-cobalt/25 bg-cobalt/25 md:grid-cols-3 md:grid-rows-2">
          {/* Katta koshin: o'yinlar — interaktiv namuna bilan */}
          <article className="grid gap-10 bg-ink p-8 sm:p-10 md:col-span-2 md:row-span-2 lg:grid-cols-[1fr_17rem] lg:items-start">
            <div className="lg:self-center">
              <span className="mb-5 inline-grid size-9 place-items-center border border-brass/40 text-brass">
                <Icon><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></Icon>
              </span>
              <h3 className="text-[1.9rem] sm:text-[2.3rem]">{features[1].title}</h3>
              <p className="mt-4 text-[1.0625rem] text-muted">{features[1].text}</p>
              <p className="mt-5 text-[0.9375rem] text-muted">{h.flipHint}</p>
            </div>
            <FlipCard />
          </article>

          <article className="bg-ink p-8">
            <span className="mb-5 inline-grid size-9 place-items-center border border-bole/40 text-bole">
              <Icon><rect x="3" y="6" width="13" height="12" rx="1" /><path d="m16 10 5-3v10l-5-3z" /></Icon>
            </span>
            <h3 className="text-[1.3rem]">{features[0].title}</h3>
            <p className="mt-3 text-[1rem] text-muted">{features[0].text}</p>
          </article>

          <article className="bg-ink p-8">
            <span className="mb-5 inline-grid size-9 place-items-center border border-turquoise/40 text-turquoise">
              <Icon><circle cx="9" cy="8" r="3.2" /><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><circle cx="17.5" cy="9" r="2.4" /><path d="M17 14c2.5 0 4.5 1.7 4.5 4.5" /></Icon>
            </span>
            <h3 className="text-[1.3rem]">{features[2].title}</h3>
            <p className="mt-3 text-[1rem] text-muted">{features[2].text}</p>
          </article>
        </div>
      </section>


      {/* ═════ Raqamlar ═════
          Faqat haqiqiy raqamlar: lug'at hajmi, darajalar, o'yinlar soni. */}
      <section className="relative overflow-hidden border-y border-cobalt/25 bg-[linear-gradient(180deg,rgba(59,108,225,0.12),transparent)]">
        <div className="cini-field absolute inset-0 opacity-60 [mask-image:linear-gradient(180deg,#000,transparent)]" aria-hidden="true" />
        <div className="relative container-page grid gap-px sm:grid-cols-2 lg:grid-cols-4">
          {h.stats.map(({ n, label, note }) => (
            <div key={label} className="py-10 lg:py-14 lg:pr-8">
              <p className="t-num text-[clamp(2.8rem,5vw,4rem)] leading-none text-porcelain">{n}</p>
              <p className="mt-4 text-[1.15rem] font-medium text-brass">{label}</p>
              <p className="mt-1.5 text-[0.9375rem] text-muted">{note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═════ Darsdan tashqari: kutubxona, kino, kun so'zi ═════ */}
      <section className="container-page py-24 lg:py-32">
        <div className="grid gap-6 border-t border-cobalt/25 pt-8 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <div>
            <Star className="mb-5 text-cobalt" />
            <h2 className="text-[clamp(2.2rem,4.6vw,3.6rem)]">{h.exploreTitle}</h2>
          </div>
          <p className="text-lg text-muted lg:pt-14">{h.exploreText}</p>
        </div>

        <div className="mt-14 grid gap-px border border-cobalt/25 bg-cobalt/25 md:grid-cols-2">
          <Link href="/kutubxona" className="group relative overflow-hidden bg-ink p-8 transition-colors hover:bg-cobalt/10 sm:p-10">
            <span className="mb-5 inline-grid size-9 place-items-center border border-brass/40 text-brass">
              <Icon><path d="M4 5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 0-2 2z" /><path d="M20 5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2z" /></Icon>
            </span>
            <h3 className="text-[1.6rem]">{h.explore[0].title}</h3>
            <p className="mt-3 max-w-[40ch] text-[1.0625rem] text-muted">{h.explore[0].text}</p>
            <span className="mt-6 inline-flex items-center gap-2 font-semibold text-brass transition-transform group-hover:translate-x-1">{t.nav.library} →</span>
          </Link>
          <Link href="/media" className="group relative overflow-hidden bg-ink p-8 transition-colors hover:bg-cobalt/10 sm:p-10">
            <span className="mb-5 inline-grid size-9 place-items-center border border-bole/40 text-bole">
              <Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10 9 5 3-5 3z" /></Icon>
            </span>
            <h3 className="text-[1.6rem]">{h.explore[1].title}</h3>
            <p className="mt-3 max-w-[40ch] text-[1.0625rem] text-muted">{h.explore[1].text}</p>
            <span className="mt-6 inline-flex items-center gap-2 font-semibold text-bole transition-transform group-hover:translate-x-1">{t.nav.media} →</span>
          </Link>
        </div>

        <div className="-mt-px">
          <WordOfDay />
        </div>
      </section>

      {/* ═════ Darajalar ═════
          Bu haqiqiy ketma-ketlik, shuning uchun chiziqli yo'l o'rinli. */}
      <section id="darajalar" className="relative border-y border-cobalt/25 bg-cobalt/[0.04] py-24 lg:py-32">
        <div className="container-page">
          <div className="grid gap-6 border-t border-cobalt/25 pt-8 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
            <div>
              <Star className="mb-5 text-cobalt" />
              <h2 className="text-[clamp(2.2rem,4.6vw,3.6rem)]">{h.levelsTitle}</h2>
            </div>
            <p className="text-lg text-muted lg:pt-14">{h.levelsText}</p>
          </div>

          <Reveal className="relative mt-16">
            <div className="path-line max-lg:hidden" aria-hidden="true"><div className="path-fill" /></div>
            <ol className="grid gap-9 lg:grid-cols-5 lg:gap-6">
              {h.levels.map((l) => (
                <li key={l.code} className="flex gap-5 lg:block">
                  <span className="level-dot text-brass">{l.code}</span>
                  <div className="lg:mt-7">
                    <h3 className="text-[1.2rem]">{l.name}</h3>
                    <p className="mt-2.5 text-[0.9375rem] text-muted">{l.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* ═════ Qanday boshlanadi ═════
          Ketma-ketlik, shuning uchun raqamlar bor — lekin bezak sifatida emas. */}
      <section className="container-page py-24 lg:py-32">
        <div className="grid gap-6 border-t border-cobalt/25 pt-8 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <div>
            <Star className="mb-5 text-cobalt" />
            <h2 className="text-[clamp(2.2rem,4.6vw,3.6rem)]">{h.stepsTitle}</h2>
          </div>
          <p className="text-lg text-muted lg:pt-14">{h.stepsText}</p>
        </div>
        <ol className="mt-14 grid gap-px border border-cobalt/25 bg-cobalt/25 md:grid-cols-3">
          {h.steps.map((s, i) => (
            <li key={s.title} className="flex flex-col bg-ink p-8 sm:p-9">
              <div className="flex items-center gap-4">
                <span className="t-num text-[3.4rem] leading-none text-brass">{i + 1}</span>
                <span className="h-px flex-1 bg-cobalt/30" aria-hidden="true" />
              </div>
              <h3 className="mt-7 text-[1.35rem]">{s.title}</h3>
              <p className="mt-3 text-[1rem] text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ═════ Ariza ═════ */}
      <section id="ariza" className="container-page pb-20">
        <div className="relative grid items-start gap-12 overflow-hidden border border-cobalt/25 bg-cobalt/[0.05] p-7 sm:p-10 lg:grid-cols-[1fr_26rem] lg:gap-16 lg:p-14">
          <div className="cini-field absolute inset-0 opacity-70 [mask-image:radial-gradient(70%_90%_at_15%_0%,#000,transparent)]" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-[clamp(2.2rem,4.6vw,3.3rem)]">{h.applyTitle}</h2>
            <p className="mt-5 max-w-[42ch] text-lg text-muted">{h.applyText}</p>
            <ul className="mt-9 grid gap-3.5">
              {h.benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[1.0625rem]"><span className="mt-1.5"><Check /></span>{b}</li>
              ))}
            </ul>
          </div>

          <div className="relative border border-cobalt/30 bg-well p-6 sm:p-7">
            <LeadForm />
          </div>
        </div>
      </section>
    </>
  );
}

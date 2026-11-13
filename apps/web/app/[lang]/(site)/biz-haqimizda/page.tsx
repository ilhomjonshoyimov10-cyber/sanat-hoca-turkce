import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { certificates, contact, facts, mapQuery, teacher } from "@/lib/about";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.meta.about, description: t.meta.aboutDescription };
}

/* Çini motifi: bo'lim boshlaridagi kichik belgi (bosh sahifa bilan bir xil) */
const Star = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`size-6 ${className}`} fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
    <rect x="5" y="5" width="14" height="14" />
    <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
    <circle cx="12" cy="12" r="2.2" />
  </svg>
);

export default async function AboutPage() {
  const { t } = await getT();
  const a = t.about;
  return (
    <>
      {/* ═════ Ustoz ═════ */}
      <section className="relative overflow-x-clip">
        <div className="cini-field absolute inset-0 -z-10" aria-hidden="true" />
        <div className="container-page grid items-center gap-10 pb-16 pt-12 lg:grid-cols-[22rem_1fr] lg:gap-16 lg:pb-24 lg:pt-20">
          <div className="relative mx-auto w-full max-w-[22rem]">
            <div className="absolute -inset-3 -z-10 bg-cobalt/10" aria-hidden="true" />
            <Image
              src={teacher.photo}
              alt={`${teacher.name} — ${a.teacherRole}`}
              width={640}
              height={642}
              priority
              className="w-full border border-cobalt/30 object-cover"
            />
          </div>

          <div>
            <p className="flex items-center gap-2.5 text-sm font-medium text-turquoise">
              <span className="size-1.5 rotate-45 bg-turquoise" />
              {a.teacherRole}
            </p>
            <h1 className="mt-3 text-[clamp(2.1rem,5vw,3.2rem)] leading-[1.1]">{teacher.name}</h1>
            <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-muted">{a.intro}</p>

            <dl className="mt-8 grid max-w-lg grid-cols-3 gap-4">
              {facts.map((f, i) => (
                <div key={f.value} className="border border-cobalt/25 bg-cobalt/[0.05] p-4 text-center">
                  <dt className="sr-only">{a.facts[i]}</dt>
                  <dd>
                    <span className="block font-display text-[1.75rem] font-semibold text-brass">{f.value}</span>
                    <span className="mt-1 block text-[0.8125rem] leading-snug text-muted">{a.facts[i]}</span>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/#ariza" className="btn btn-primary">{a.apply}</Link>
              <a href={contact.telegramPerson} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                {a.writeTeacher}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═════ Aloqa ═════ */}
      <section aria-labelledby="aloqa-h" className="container-page py-16">
        <Star className="mb-4 text-brass" />
        <h2 id="aloqa-h" className="text-[clamp(1.6rem,3.5vw,2.2rem)]">{a.contactTitle}</h2>
        <p className="mt-2 max-w-2xl text-muted">
          {a.contactText}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a href={contact.phoneHref} className="group border border-cobalt/25 bg-cobalt/[0.05] p-5 transition-colors hover:border-cobalt/60">
            <span className="block text-sm text-muted">{a.phone}</span>
            <span className="mt-1 block font-display text-[1.15rem] font-semibold">{contact.phone}</span>
          </a>

          <a href={contact.telegramChannel} target="_blank" rel="noopener noreferrer"
             className="group border border-cobalt/25 bg-cobalt/[0.05] p-5 transition-colors hover:border-cobalt/60">
            <span className="block text-sm text-muted">{a.channel}</span>
            <span className="mt-1 block font-display text-[1.15rem] font-semibold">{contact.telegramChannelLabel}</span>
            <span className="mt-1 block text-[0.8125rem] text-muted">{a.channelNote}</span>
          </a>

          <a href={contact.telegramPerson} target="_blank" rel="noopener noreferrer"
             className="group border border-cobalt/25 bg-cobalt/[0.05] p-5 transition-colors hover:border-cobalt/60">
            <span className="block text-sm text-muted">{a.personal}</span>
            <span className="mt-1 block font-display text-[1.15rem] font-semibold">{contact.telegramPersonLabel}</span>
            <span className="mt-1 block text-[0.8125rem] text-muted">{a.personalNote}</span>
          </a>

          <div className="border border-cobalt/25 bg-cobalt/[0.05] p-5">
            <span className="block text-sm text-muted">{a.address}</span>
            <span className="mt-1 block font-display text-[1.15rem] font-semibold">{a.place}</span>
            <span className="mt-1 block text-[0.8125rem] text-muted">{a.city}</span>
          </div>
        </div>
      </section>

      {/* ═════ Xarita ═════ */}
      <section aria-labelledby="xarita-h" className="container-page pb-16">
        <Star className="mb-4 text-brass" />
        <h2 id="xarita-h" className="text-[clamp(1.6rem,3.5vw,2.2rem)]">{a.whereTitle}</h2>
        <p className="mt-2 text-muted">{a.addressLine}</p>

        <div className="mt-6 overflow-hidden border border-cobalt/25">
          <iframe
            title={`${a.place} — ${a.onMap}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-[clamp(18rem,45vh,28rem)] w-full border-0"
          />
        </div>

        <a
          href={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline mt-4 inline-flex"
        >
          {a.openMap}
        </a>
      </section>

      {/* ═════ Sertifikatlar ═════
          Ro'yxat bo'sh bo'lsa butunlay ko'rinmaydi: bo'sh ramkaga
          "tez orada" deb yozgandan ko'ra hech narsa ko'rsatmagan yaxshi. */}
      {certificates.length > 0 && (
        <section aria-labelledby="sert-h" className="container-page pb-20">
          <Star className="mb-4 text-brass" />
          <h2 id="sert-h" className="text-[clamp(1.6rem,3.5vw,2.2rem)]">{a.certificates}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((c) => (
              <li key={c.src} className="border border-cobalt/25 bg-cobalt/[0.05] p-3">
                <Image src={c.src} alt={c.alt} width={800} height={1100} className="h-auto w-full object-contain" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

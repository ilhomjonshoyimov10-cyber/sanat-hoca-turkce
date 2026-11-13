import Image from "next/image";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "../fx/Reveal";

/** Asl so'z — rasmda ham shu matn. Atatürk vafoti: 1938 — matn jamoat mulki. */
const QUOTE_TR = "Türk dili, dillerin en zenginlerindendir; yeter ki bu dil şuurla işlensin.";

/**
 * Bosh sahifadagi shior: Atatürkning turk tili haqidagi so'zi.
 *
 * Rasm och rangda, sayt esa tungi — shuning uchun rasm "muzey ramkasi"ga
 * olingan: to'q paspartu, jez ingichka chiziq va burchak bezaklari.
 * Shunda och rasm sahifadan "tushib qolmaydi", balki ataylab qo'yilgan
 * asar kabi ko'rinadi.
 *
 * Telefonda rasm kichrayadi va undagi yozuv o'qilmay qoladi — shuning
 * uchun so'z pastda HAQIQIY MATN sifatida ham beriladi (ekran o'quvchilar
 * va qidiruv tizimlari uchun ham foydali).
 */
export function QuoteBanner({ t, locale }: { t: Dict; locale: Locale }) {
  return (
    <section aria-labelledby="til-shiori" className="container-page py-20 lg:py-28">
      <Reveal>
        <figure>
          <div className="quote-frame">
            <span className="quote-corner left-2 top-2" aria-hidden="true" />
            <span className="quote-corner right-2 top-2" aria-hidden="true" />
            <span className="quote-corner bottom-2 left-2" aria-hidden="true" />
            <span className="quote-corner bottom-2 right-2" aria-hidden="true" />
            <div className="quote-image">
              <Image
                src="/banner/ataturk-turk-dili.webp"
                alt={t.banner.alt}
                width={1875}
                height={639}
                sizes="(min-width: 1200px) 1140px, calc(100vw - 3.5rem)"
                className="h-auto w-full"
              />
            </div>
          </div>

          <figcaption className="mt-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
            <div>
              <p id="til-shiori" className="flex items-center gap-2.5 text-sm font-medium text-turquoise">
                <span className="size-1.5 rotate-45 bg-turquoise" />
                {t.banner.eyebrow}
              </p>
              {/* Telefonda rasmdagi yozuv mayda — asl matnni katta qilib beramiz */}
              <blockquote lang="tr" className="t-word mt-4 text-[1.55rem] leading-snug text-porcelain sm:hidden">
                &ldquo;{QUOTE_TR}&rdquo;
              </blockquote>
              {locale !== "tr" && (
                <p className="mt-3 max-w-[52ch] font-display text-[clamp(1.15rem,2vw,1.45rem)] italic leading-snug text-muted sm:mt-4 sm:text-porcelain/85">
                  {t.banner.translation}
                </p>
              )}
            </div>
            <p className="flex items-center gap-3 text-[1.0625rem] font-medium text-brass">
              <span className="h-px w-10 bg-brass/60" aria-hidden="true" />
              {t.banner.author}
            </p>
          </figcaption>
        </figure>
      </Reveal>
    </section>
  );
}

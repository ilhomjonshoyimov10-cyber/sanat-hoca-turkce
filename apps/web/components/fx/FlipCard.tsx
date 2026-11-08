"use client";

import { useState } from "react";

/** Bosilganda aylanadigan so'z kartasi — o'yinning kichik namunasi.
 *  So'zning o'zi asosiy vizual element, shuning uchun display shriftda, katta. */
export function FlipCard() {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="flip mx-auto w-full max-w-[15rem]" data-flipped={flipped}>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        className="block w-full cursor-pointer text-left transition-transform duration-150 [-webkit-tap-highlight-color:transparent] active:scale-[0.98]"
      >
        <div className="flip-inner flip-hint aspect-[3/4] w-full">
          <div aria-hidden={flipped} className="flip-face border border-cobalt/40 bg-[linear-gradient(180deg,#132046,#080e22)]">
            <div className="px-5 text-center">
              <p lang="tr" className="t-word text-[2.6rem] text-porcelain">Güzel</p>
              <p className="mt-4 text-[0.8125rem] text-muted">Tarjimani ko&apos;rish uchun bosing</p>
            </div>
          </div>
          <div aria-hidden={!flipped} className="flip-face flip-back border border-brass/45 bg-[linear-gradient(180deg,#1d1631,#0b0917)]">
            <div className="px-5 text-center">
              <p className="t-word text-[2.3rem] text-brass">chiroyli</p>
              <p lang="tr" className="mt-4 text-[0.9375rem] text-muted">Çok güzel bir gün!</p>
              <p className="mt-1 text-[0.8125rem] text-muted">Juda chiroyli kun!</p>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

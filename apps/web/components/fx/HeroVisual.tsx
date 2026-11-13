"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { MosqueArt } from "./MosqueArt";

// three.js (og'ir kutubxona) faqat kerak bo'lganda, alohida fayl sifatida yuklanadi
const MosqueScene = dynamic(() => import("./MosqueScene"), { ssr: false });

type NavExtra = Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };

/** 3D masjid + suzuvchi kartochkalar. Zaif qurilmada, "kamroq harakat" yoki trafik tejash rejimida
 *  3D yuklanmaydi: o'rniga yengil SVG masjid ko'rsatiladi. */
export function HeroVisual() {
  const { t } = useI18n();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mount3d, setMount3d] = useState(false);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  // 3D ishlamasa (WebGL yo'q yoki sekin): yengil zaxira rasm qaytadan ko'rinadi
  const onError = useCallback(() => {
    setMount3d(false);
    setReady(false);
  }, []);

  // 3D ni yuklash kerakmi?
  useEffect(() => {
    const nav = navigator as NavExtra;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Yadrolar soni ishonchsiz signal (arzon telefonlarda ham 8 ta yadro bor), shuning uchun xotira va trafik tejashga qaraymiz.
    // Qolganini MosqueScene ichidagi jonli tezlik tekshiruvi hal qiladi.
    const weak = nav.connection?.saveData === true || (nav.deviceMemory ?? 8) <= 2 || (nav.hardwareConcurrency ?? 8) < 2;
    if (reduce || weak) return;
    const run = () => setMount3d(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(run, 700);
    return () => clearTimeout(id);
  }, []);

  // Sichqoncha bilan parallaks (CSS o'zgaruvchilari orqali, React qayta render qilmaydi)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reduce) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--px", ((e.clientX / window.innerWidth - 0.5) * 2).toFixed(3));
        el.style.setProperty("--py", ((e.clientY / window.innerHeight - 0.5) * 2).toFixed(3));
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <div ref={wrapRef} className="hero-visual" aria-hidden="true">
      {/* Usmonli o'tkir ravog'i (ogee). Sahifaning yagona jasur shakli. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <clipPath id="ogee" clipPathUnits="objectBoundingBox">
            <path d="M0,1 L0,0.60 C0,0.40 0.07,0.22 0.25,0.13 C0.39,0.07 0.47,0.04 0.5,0 C0.53,0.04 0.61,0.07 0.75,0.13 C0.93,0.22 1,0.40 1,0.60 L1,1 Z" />
          </clipPath>
        </defs>
      </svg>

      <div className="mihrab">
        <div className="mihrab-inner">
          <span className="mihrab-floor" aria-hidden="true" />
          <div className="hero-fallback" style={{ opacity: ready ? 0 : 1 }}>
            <MosqueArt className="w-[66%] drop-shadow-[0_0_44px_rgba(59,108,225,0.5)]" />
          </div>
          {mount3d && (
            <div className="hero-canvas" style={{ opacity: ready ? 1 : 0 }}>
              <MosqueScene onReady={onReady} onError={onError} />
            </div>
          )}
        </div>
        <span className="mihrab-edge" />
      </div>

      {/* Yorliqlar ramka ichida qoladi: chetga chiqib kesilmaydi. */}
      <div className="orbit left-0 top-[4%]" style={{ "--depth": 22 } as React.CSSProperties}>
        <div className="orbit-inner">
          <div className="glass-chip">
            <span className="grid size-8 place-items-center bg-cobalt/25 font-display text-base text-cobalt">C</span>
            <span>
              <span lang="tr" className="block font-medium leading-tight">cami</span>
              <span className="block text-xs text-muted">{t.home.chips.mosque}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="orbit right-0 top-[17%]" style={{ "--depth": 32 } as React.CSSProperties}>
        <div className="orbit-inner" style={{ "--fd": "-3s" } as React.CSSProperties}>
          <div className="glass-chip">
            <span className="grid size-8 place-items-center bg-brass/25 font-display text-base text-brass">T</span>
            <span>
              <span lang="tr" className="block font-medium leading-tight">teşekkürler</span>
              <span className="block text-xs text-muted">{t.home.chips.thanks}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="orbit bottom-[1%] left-0" style={{ "--depth": 16 } as React.CSSProperties}>
        <div className="orbit-inner" style={{ "--fd": "-5s" } as React.CSSProperties}>
          <div className="glass-chip">
            <svg viewBox="0 0 24 24" className="size-5 text-brass" fill="currentColor" aria-hidden="true">
              <path d="M12 2c1 3.5 4.5 5.5 4.5 10a4.5 4.5 0 1 1-9 0c0-1.6.6-2.8 1.4-3.8.2 1.2.9 2 1.7 2.3C10.2 7.2 10.6 4.4 12 2z" />
            </svg>
            <span className="font-medium">{t.home.chips.streak}</span>
          </div>
        </div>
      </div>

      <div className="orbit bottom-[11%] right-0" style={{ "--depth": 26 } as React.CSSProperties}>
        <div className="orbit-inner" style={{ "--fd": "-1.5s" } as React.CSSProperties}>
          <div className="glass-chip">
            <span className="font-display text-base text-turquoise">+10 XP</span>
            <span className="text-xs text-muted">{t.home.chips.correct}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

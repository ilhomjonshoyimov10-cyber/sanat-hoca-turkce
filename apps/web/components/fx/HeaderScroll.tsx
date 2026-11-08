"use client";

import { useEffect } from "react";

/** Sahifa pastga siljiganda sarlavhaga shisha effekti beradi (html[data-scrolled]). */
export function HeaderScroll() {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      root.dataset.scrolled = window.scrollY > 8 ? "true" : "false";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return null;
}

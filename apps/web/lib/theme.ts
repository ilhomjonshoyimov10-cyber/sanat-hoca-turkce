// Kunduzgi / tungi rejim.
//
// Tanlov brauzerda (localStorage) saqlanadi — hisobga bog'liq emas, kirmagan
// mehmon uchun ham ishlaydi. Standart: tungi (brendning asosiy ko'rinishi).
// Sahifa "yonib-o'chmasligi" uchun mavzu <head> dagi kichik skript bilan
// HTML chizilishidan OLDIN qo'yiladi.

export type Theme = "dark" | "light";
export const THEME_KEY = "sh-theme";
export const THEME_EVENT = "sh-theme-change";
export const THEME_COLORS: Record<Theme, string> = { dark: "#070d1f", light: "#f6f2ea" };

/** <head> ga qo'yiladigan skript (React'dan oldin ishlaydi). */
export const themeBootScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}})();`;

export function readTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function applyTheme(next: Theme) {
  const root = document.documentElement;
  // Ranglar bir lahza yumshoq o'tadi, keyin animatsiya olib tashlanadi
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) {
    root.classList.add("theme-anim");
    window.setTimeout(() => root.classList.remove("theme-anim"), 420);
  }
  root.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* maxfiy rejim: shu sahifa uchun ishlayveradi */
  }
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", THEME_COLORS[next]));
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function subscribeTheme(cb: () => void) {
  window.addEventListener(THEME_EVENT, cb);
  window.addEventListener("storage", cb); // boshqa tabda almashtirilsa
  return () => {
    window.removeEventListener(THEME_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

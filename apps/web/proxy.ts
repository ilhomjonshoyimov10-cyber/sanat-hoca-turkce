// TIL BO'YICHA YO'NALTIRISH.
//
// Foydalanuvchi /games ni ochadi — ichkarida /ru/games ko'rsatiladi
// (rewrite). Manzil satri o'zgarmaydi, ichki havolalarni o'zgartirish
// shart emas. Til "lang" cookie'sidan olinadi; bo'lmasa o'zbekcha.
//
// /ru, /en/biz-haqimizda kabi prefiksli havola ham ishlaydi: til
// cookie'ga yoziladi va prefikssiz manzilga qaytariladi. Bu tilni
// havola bilan ulashish uchun (masalan, rus tilidagi reklamada /ru).

import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, LANG_COOKIE } from "./lib/i18n/config";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (isLocale(first)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(first.length + 1) || "/";
    url.search = search;
    const res = NextResponse.redirect(url);
    res.cookies.set(LANG_COOKIE, first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }

  const saved = request.cookies.get(LANG_COOKIE)?.value;
  const locale = isLocale(saved) ? saved : DEFAULT_LOCALE;
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // API (o'z proksimiz), Next ichki fayllari va nuqtali fayllar (rasm,
  // icon.svg, robots.txt) tegilmaydi
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

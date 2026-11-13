"use client";

import { usePathname } from "next/navigation";
import { LOCALES } from "./i18n/config";

const PREFIX = new RegExp(`^/(${LOCALES.join("|")})(?=/|$)`);

/**
 * Brauzerdagi manzil, til prefiksisiz.
 *
 * proxy.ts so'rovni ichkarida /ru/games ga yo'naltiradi; ba'zi holatlarda
 * (server render) usePathname() shu ichki manzilni qaytaradi. Faol menyu
 * bandini to'g'ri belgilash uchun prefiksni olib tashlaymiz.
 */
export function useCleanPathname(): string {
  const p = usePathname() ?? "/";
  return p.replace(PREFIX, "") || "/";
}

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

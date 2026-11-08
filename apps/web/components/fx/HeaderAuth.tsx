"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

// "sh_in=1" faqat ko'rinish uchun belgi (Kirish yoki Kabinet tugmasi). Xavfsizlik bunga tayanmaydi:
// haqiqiy kirish HttpOnly cookie va serverda tekshiriladi.
const EVENT = "sh-auth-change";
const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
};
const snapshot = () => document.cookie.split("; ").includes("sh_in=1");

export function setAuthHint(on: boolean) {
  document.cookie = on ? "sh_in=1; path=/; max-age=2592000; SameSite=Lax" : "sh_in=; path=/; max-age=0; SameSite=Lax";
  window.dispatchEvent(new Event(EVENT));
}

export function HeaderAuth() {
  const loggedIn = useSyncExternalStore(subscribe, snapshot, () => false);
  return loggedIn ? (
    <Link href="/dashboard" className="btn btn-primary !min-h-10 !px-4 !py-1.5 text-sm">Kabinet</Link>
  ) : (
    <>
      <Link href="/login" className="btn btn-outline !min-h-10 !px-4 !py-1.5 text-sm">Kirish</Link>
      <Link href="/#ariza" className="btn btn-primary !min-h-10 !px-4 !py-1.5 text-sm max-sm:hidden">Bepul dars</Link>
    </>
  );
}

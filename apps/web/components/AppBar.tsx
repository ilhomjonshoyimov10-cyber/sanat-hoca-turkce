"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { NotificationBell } from "./NotificationBell";

/** Rolga qarab ko'rinadigan bo'limlar. Bu faqat KO'RINISH uchun —
 *  haqiqiy ruxsat har doim serverda tekshiriladi. */
function linksFor(role: string): { href: string; label: string }[] {
  if (role === "ADMIN") {
    return [
      { href: "/admin", label: "Boshqaruv" },
      { href: "/groups", label: "Guruhlar" },
      { href: "/kitoblar", label: "Materiallar" },
      { href: "/oqish", label: "O'qish" },
      { href: "/arizalar", label: "Arizalar" },
    ];
  }
  if (role === "TEACHER") {
    return [
      { href: "/ustoz", label: "Panel" },
      { href: "/groups", label: "Guruhlar" },
      { href: "/kitoblar", label: "Materiallar" },
      { href: "/oqish", label: "O'qish" },
      { href: "/ai", label: "AI" },
      { href: "/arizalar", label: "Arizalar" },
    ];
  }
  return [
    { href: "/dashboard", label: "Kabinet" },
    { href: "/games", label: "O'yinlar" },
    { href: "/oqish", label: "O'qish" },
    { href: "/kitoblar", label: "Materiallar" },
    { href: "/ai", label: "AI" },
    { href: "/groups", label: "Guruhlarim" },
  ];
}

export function AppBar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Kirish va ro'yxatdan o'tish sahifalarida panel menyusi keraksiz
  const hidden = !user || loading
    || pathname === "/login" || pathname === "/register" || pathname.startsWith("/kirish");
  if (hidden) return null;

  const links = linksFor(user.role);

  return (
    <div className="border-b border-cobalt/25 bg-cobalt/[0.05]">
      <div className="container-page flex items-center gap-2 py-2">
        {/* Menyu o'zi siljiydi; o'ng tomondagi tugmalar joyida qoladi.
            Shu tufayli tor ekranda sahifa gorizontal siljimaydi. */}
        <nav aria-label="Panel menyusi" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className="nav-item whitespace-nowrap"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <NotificationBell />
          <Link
            href="/profil"
            aria-current={pathname === "/profil" ? "page" : undefined}
            className="nav-item whitespace-nowrap"
          >
            {user.firstName}
          </Link>
        </div>
      </div>
    </div>
  );
}

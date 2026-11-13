import type { Dict } from "@/lib/i18n";

type NavKey = keyof Dict["nav"];
export type NavLinkDef = { href: string; key: NavKey };

/** Hamma uchun ochiq sahifalar — sarlavhada. */
export const PUBLIC_LINKS: NavLinkDef[] = [
  { href: "/", key: "home" },
  { href: "/kutubxona", key: "library" },
  { href: "/media", key: "media" },
  { href: "/biz-haqimizda", key: "about" },
];

/** Rolga qarab bo'lim menyusi. Bu faqat KO'RINISH — ruxsat har doim serverda tekshiriladi. */
export function sectionLinks(role: string): NavLinkDef[] {
  if (role === "ADMIN") {
    return [
      { href: "/admin", key: "admin" },
      { href: "/groups", key: "groups" },
      { href: "/kitoblar", key: "materials" },
      { href: "/lugat", key: "dictionary" },
      { href: "/arizalar", key: "applications" },
      { href: "/jonli", key: "live" },
      { href: "/media", key: "media" },
    ];
  }
  if (role === "TEACHER") {
    return [
      { href: "/ustoz", key: "teacher" },
      { href: "/groups", key: "groups" },
      { href: "/kitoblar", key: "materials" },
      { href: "/oqish", key: "reading" },
      { href: "/lugat", key: "dictionary" },
      { href: "/ai", key: "ai" },
      { href: "/jonli", key: "live" },
      { href: "/arizalar", key: "applications" },
    ];
  }
  return [
    { href: "/dashboard", key: "cabinet" },
    { href: "/games", key: "games" },
    { href: "/oqish", key: "reading" },
    { href: "/kutubxona", key: "library" },
    { href: "/media", key: "media" },
    { href: "/kitoblar", key: "materials" },
    { href: "/ai", key: "ai" },
    { href: "/jonli", key: "live" },
    { href: "/bepul-dars", key: "freeLesson" },
    { href: "/groups", key: "myGroups" },
  ];
}

/** Kirgandan keyin har bir rol o'z bosh paneliga tushadi. */
export function homeFor(role: string | undefined): string {
  if (role === "ADMIN") return "/admin";
  if (role === "TEACHER") return "/ustoz";
  return "/dashboard";
}

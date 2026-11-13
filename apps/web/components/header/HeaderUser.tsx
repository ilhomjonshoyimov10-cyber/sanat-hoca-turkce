"use client";

import Link from "next/link";
import { useAuth, useAuthHint } from "@/lib/auth";
import { useI18n } from "@/lib/i18n/client";
import { NotificationBell } from "../NotificationBell";
import { UserMenu } from "./UserMenu";

/**
 * Sarlavhaning o'ng tomoni: kirgan bo'lsa — qo'ng'iroqcha va avatar,
 * kirmagan bo'lsa — "Kirish" va "Bepul dars".
 *
 * "Kirgan" belgisi bor, lekin tekshiruv hali tugamagan bo'lsa — avatar
 * o'rnida bo'sh doira. Aks holda kirgan odam bir lahza "Kirish" tugmasini
 * ko'rib, keyin avatar paydo bo'lardi (sakrash).
 */
export function HeaderUser() {
  const { t } = useI18n();
  const { user, checked } = useAuth();
  const hinted = useAuthHint();

  if (user) {
    return (
      <>
        <NotificationBell />
        <UserMenu user={user} />
      </>
    );
  }

  if (hinted && !checked) {
    return <span className="size-[42px] animate-pulse rounded-full bg-cobalt/20" aria-hidden="true" />;
  }

  return (
    <>
      <Link href="/login" className="btn btn-outline !min-h-10 !px-4 !py-1.5 text-sm">{t.nav.login}</Link>
      <Link href="/#ariza" className="btn btn-primary !min-h-10 !px-4 !py-1.5 text-sm max-sm:hidden">{t.nav.freeLessonCta}</Link>
    </>
  );
}

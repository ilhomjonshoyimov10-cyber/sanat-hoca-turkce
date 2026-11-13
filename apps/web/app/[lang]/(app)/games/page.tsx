import type { Metadata } from "next";
import { GamesPanel } from "@/components/GamesPanel";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.meta.games, robots: { index: false } };
}

export default async function Page() {
  const { t } = await getT();
  return (
    <div className="container-page max-w-5xl py-12">
      <h1 className="mb-6 font-display text-3xl font-bold">{t.meta.games}</h1>
      <GamesPanel />
    </div>
  );
}

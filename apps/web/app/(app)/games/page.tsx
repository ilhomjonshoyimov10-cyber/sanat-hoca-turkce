import type { Metadata } from "next";
import { GamesPanel } from "@/components/GamesPanel";

export const metadata: Metadata = { title: "O'yinlar", robots: { index: false } };

export default function Page() {
  return (
    <div className="container-page max-w-5xl py-12">
      <h1 className="mb-6 font-display text-3xl font-bold">O&apos;yinlar</h1>
      <GamesPanel />
    </div>
  );
}

import type { Metadata } from "next";
import { GroupsPanel } from "@/components/GroupsPanel";

export const metadata: Metadata = { title: "Guruhlar", robots: { index: false } };

export default function Page() {
  return (
    <div className="container-page max-w-4xl py-12">
      <h1 className="mb-6 font-display text-3xl font-bold">Guruhlar</h1>
      <GroupsPanel />
    </div>
  );
}

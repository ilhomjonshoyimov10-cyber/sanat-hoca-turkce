import type { Metadata } from "next";
import { Dashboard } from "@/components/Dashboard";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.meta.dashboard, robots: { index: false } };
}

export default function DashboardPage() {
  return (
    <div className="container-page py-12">
      <Dashboard />
    </div>
  );
}

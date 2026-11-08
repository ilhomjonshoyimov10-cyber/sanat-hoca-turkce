import type { Metadata } from "next";
import { Dashboard } from "@/components/Dashboard";

export const metadata: Metadata = { title: "Kabinet", robots: { index: false } };

export default function DashboardPage() {
  return (
    <div className="container-page py-12">
      <Dashboard />
    </div>
  );
}

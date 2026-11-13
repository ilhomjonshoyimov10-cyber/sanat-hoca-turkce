import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const metadata: Metadata = { title: "Administrator paneli", robots: { index: false } };

export default function Page() {
  return <div className="container-page py-10">{<AdminPanel />}</div>;
}

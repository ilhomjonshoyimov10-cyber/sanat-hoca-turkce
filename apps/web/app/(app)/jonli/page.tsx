import type { Metadata } from "next";
import { LivePanel } from "@/components/live/LivePanel";

export const metadata: Metadata = { title: "Jonli darslar", robots: { index: false } };

export default function Page() {
  return <div className="container-page max-w-4xl py-10"><LivePanel /></div>;
}

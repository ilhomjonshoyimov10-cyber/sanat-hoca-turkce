import type { Metadata } from "next";
import { SupportPanel } from "@/components/support/SupportPanel";

export const metadata: Metadata = { title: "Administratorga murojaat", robots: { index: false } };

export default function Page() {
  return <div className="container-page max-w-3xl py-10"><SupportPanel /></div>;
}

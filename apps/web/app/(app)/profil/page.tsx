import type { Metadata } from "next";
import { ProfilePanel } from "@/components/ProfilePanel";

export const metadata: Metadata = { title: "Profil", robots: { index: false } };

export default function Page() {
  return <div className="container-page max-w-3xl py-10">{<ProfilePanel />}</div>;
}

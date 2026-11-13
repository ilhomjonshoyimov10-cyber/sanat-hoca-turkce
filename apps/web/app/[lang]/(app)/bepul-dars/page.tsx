import type { Metadata } from "next";
import { FreeLessonPanel } from "@/components/freelesson/FreeLessonPanel";

export const metadata: Metadata = { title: "Bepul dars", robots: { index: false } };

export default function Page() {
  return <div className="container-page max-w-3xl py-10"><FreeLessonPanel /></div>;
}

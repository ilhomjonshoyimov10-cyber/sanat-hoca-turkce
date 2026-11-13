import type { Metadata } from "next";
import { TeacherPanel } from "@/components/teacher/TeacherPanel";

export const metadata: Metadata = { title: "Ustoz paneli", robots: { index: false } };

export default function Page() {
  return <div className="container-page py-10">{<TeacherPanel />}</div>;
}

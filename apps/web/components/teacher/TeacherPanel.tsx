"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, needs2fa } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { errorText, type GroupInfo } from "../groups/shared";
import { FreeLessonTab } from "../admin/FreeLessonTab";

interface Row extends GroupInfo {
  memberCount: number;
  teacherName: string;
}
interface Pending {
  homeworkId: string;
  homeworkTitle: string;
  groupId: string;
  groupName: string;
  count: number;
}

const LEVELS: Record<string, string> = { A1: "A1", A2: "A2", B1: "B1", B2: "B2", C1: "C1" };

export function TeacherPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Row[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    // O'quvchi ustoz panelida ishi yo'q
    if (user.role === "STUDENT" || user.role === "PARENT") router.replace("/dashboard");
  }, [loading, user, router]);

  const load = useCallback(async () => {
    try {
      const gs = await api<Row[]>("/groups");
      setGroups(gs);

      // Har guruhning baholanmagan ishlarini yig'amiz
      const lists = await Promise.all(
        gs.map(async (g) => {
          const hw = await api<{ id: string; title: string; submittedCount?: number; gradedCount?: number }[]>(
            `/groups/${g.id}/homework`,
          ).catch(() => []);
          return hw
            .map((h) => ({
              homeworkId: h.id,
              homeworkTitle: h.title,
              groupId: g.id,
              groupName: g.name,
              count: (h.submittedCount ?? 0) - (h.gradedCount ?? 0),
            }))
            .filter((x) => x.count > 0);
        }),
      );
      setPending(lists.flat());
    } catch (e) {
      if (needs2fa(e)) { router.push("/security"); return; }
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }, [router]);

  useEffect(() => {
    if (user && user.role !== "STUDENT" && user.role !== "PARENT") void load();
  }, [user, load]);

  if (loading || !user) return <p className="text-muted" role="status">Yuklanmoqda...</p>;
  if (user.role === "STUDENT" || user.role === "PARENT") return null;

  const totalStudents = groups.reduce((n, g) => n + g.memberCount, 0);
  const toGrade = pending.reduce((n, p) => n + p.count, 0);

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-cobalt/25 pb-6">
        <div>
          <h1 className="text-[clamp(1.9rem,4vw,2.6rem)]">Ustoz paneli</h1>
          <p className="mt-2 text-muted">Salom, {user.firstName}. Guruhlaringiz va ishlaringiz shu yerda.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/jonli" className="btn btn-outline">Jonli efir</Link>
          <Link href="/groups" className="btn btn-primary">Guruh yaratish</Link>
        </div>
      </header>

      {error && <p className="alert-error" role="alert">{error}</p>}

      <section className="grid gap-px border border-cobalt/25 bg-cobalt/25 sm:grid-cols-3">
        <div className="bg-ink p-6 raise">
          <p className="t-num text-[2.4rem] leading-none text-cobalt">{groups.length}</p>
          <p className="mt-3 font-medium">Guruh</p>
        </div>
        <div className="bg-ink p-6 raise">
          <p className="t-num text-[2.4rem] leading-none text-brass">{totalStudents}</p>
          <p className="mt-3 font-medium">O&apos;quvchi</p>
        </div>
        <div className="bg-ink p-6 raise">
          <p className={`t-num text-[2.4rem] leading-none ${toGrade ? "text-bole" : "text-turquoise"}`}>{toGrade}</p>
          <p className="mt-3 font-medium">Baholanmagan ish</p>
        </div>
      </section>

      {toGrade > 0 && (
        <section aria-labelledby="grade-h">
          <h2 id="grade-h" className="mb-4 text-[1.4rem]">Baholashni kutmoqda</h2>
          <ul className="grid gap-px border border-cobalt/25 bg-cobalt/25">
            {pending.map((p) => (
              <li key={p.homeworkId} className="flex flex-wrap items-center gap-3 bg-ink p-4">
                <div className="min-w-[12rem] flex-1">
                  <p className="font-medium">{p.homeworkTitle}</p>
                  <p className="text-[0.875rem] text-muted">{p.groupName}</p>
                </div>
                <span className="badge badge-warn">{p.count} ta ish</span>
                <Link href={`/groups/${p.groupId}`} className="btn btn-outline !min-h-9">Baholash</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Bepul darsga arizalar: ustoz video biriktiradi va arizachi bilan
          yozishadi. Admin paneldagi bilan bir xil komponent — video
          kutubxonasini faqat admin tahrirlaydi (isAdmin=false). */}
      <section aria-labelledby="free-h">
        <h2 id="free-h" className="mb-4 text-[1.4rem]">Bepul dars arizalari</h2>
        <FreeLessonTab onError={setError} isAdmin={false} />
      </section>

      <section aria-labelledby="groups-h">
        <h2 id="groups-h" className="mb-4 text-[1.4rem]">Guruhlarim</h2>
        {busy && <div className="skeleton h-28" />}
        {!busy && groups.length === 0 && (
          <p className="border border-cobalt/25 bg-ink p-6 text-muted">
            Hali guruhingiz yo&apos;q. <Link href="/groups" className="text-brass underline underline-offset-4">Birinchi guruhni yarating</Link>.
          </p>
        )}
        <div className="grid gap-px border border-cobalt/25 bg-cobalt/25 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Link key={g.id} href={`/groups/${g.id}`} className="block bg-ink p-6 transition-colors hover:bg-cobalt/10">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[1.2rem]">{g.name}</h3>
                <span className="badge">{LEVELS[g.level] ?? g.level}</span>
              </div>
              <p className="mt-2 text-[0.9375rem] text-muted">{g.memberCount} o&apos;quvchi</p>
              {g.schedule && <p className="mt-1 text-[0.875rem] text-muted">{g.schedule}</p>}
              {!g.isActive && <span className="badge badge-bad mt-3">Nofaol</span>}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

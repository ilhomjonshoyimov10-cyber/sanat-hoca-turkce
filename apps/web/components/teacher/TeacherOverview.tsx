"use client";

// Ustoz paneli — umumiy ko'rinish: 3D faollik xaritasi, e'tibor talab
// qiladigan o'quvchilar, muddati yaqin vazifalar, rejadagi darslar va
// o'quvchilar jadvali (qidiruv va saralash bilan).

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { formatDateTime, untilText } from "@/lib/datetime";
import { compact, Sparkline } from "../charts/charts";
import { errorText } from "../groups/shared";
import { Activity3D } from "./Activity3D";

interface Overview {
  days: string[];
  groups: { id: string; name: string; level: string; schedule: string | null; members: number; activity: number[]; active7: number; attendance: number | null; ungraded: number }[];
  students: { id: string; name: string; avatarUrl: string | null; groups: string[]; xp7: number; streak: number; lastSeenAt: string | null; inactiveDays: number | null }[];
  dueSoon: { id: string; title: string; groupId: string; groupName: string; dueAt: string; submitted: number; members: number }[];
  upcoming: { id: string; title: string; startsAt: string; status: string; groupName: string | null }[];
  totals: { students: number; active7: number; plays7: number; ungraded: number };
}

type Sort = "xp7" | "streak" | "seen" | "name";

function seenText(days: number | null): string {
  if (days === null) return "hali kirmagan";
  if (days === 0) return "bugun";
  if (days === 1) return "kecha";
  return `${days} kun oldin`;
}

export function TeacherOverview({ onError }: { onError: (m: string) => void }) {
  const [data, setData] = useState<Overview | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("xp7");

  const load = useCallback(async () => {
    try {
      setData(await api<Overview>("/teacher/overview"));
    } catch (e) {
      onError(errorText(e));
    }
  }, [onError]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) void load(); }, 120_000);
    return () => clearInterval(t);
  }, [load]);

  const students = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLocaleLowerCase("tr");
    const list = data.students.filter((s) => !term || s.name.toLocaleLowerCase("tr").includes(term) || s.groups.some((g) => g.toLocaleLowerCase("tr").includes(term)));
    const seen = (s: Overview["students"][number]) => (s.inactiveDays === null ? 1e9 : s.inactiveDays);
    return [...list].sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name, "uz")
        : sort === "streak" ? b.streak - a.streak
          : sort === "seen" ? seen(b) - seen(a)
            : b.xp7 - a.xp7,
    );
  }, [data, q, sort]);

  if (!data) return <div className="grid gap-4"><div className="skeleton h-28" /><div className="skeleton h-80" /></div>;

  const quiet = data.students.filter((s) => s.inactiveDays === null || s.inactiveDays >= 5).sort((a, b) => (b.inactiveDays ?? 999) - (a.inactiveDays ?? 999));
  const weekly = data.days.map((_, i) => data.groups.reduce((n, g) => n + g.activity[i], 0));

  return (
    <div className="grid grid-cols-1 gap-8">
      {/* Asosiy raqamlar */}
      <section className="grid gap-px border border-cobalt/25 bg-cobalt/25 sm:grid-cols-2 lg:grid-cols-4" aria-label="Asosiy ko'rsatkichlar">
        <div className="grid gap-1 bg-ink p-5">
          <p className="text-[0.8125rem] text-muted">Faol o&apos;quvchilar · 7 kun</p>
          <p className="t-num text-[2.2rem] leading-none text-turquoise">{data.totals.active7}<span className="text-[1.1rem] text-muted"> / {data.totals.students}</span></p>
          <div className="mt-2 h-1.5 rounded-full bg-cobalt/15">
            <div className="h-full rounded-full bg-turquoise" style={{ width: `${data.totals.students ? (data.totals.active7 / data.totals.students) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="grid gap-1 bg-ink p-5">
          <p className="text-[0.8125rem] text-muted">To&apos;g&apos;ri javoblar · 7 kun</p>
          <p className="t-num text-[2.2rem] leading-none text-porcelain">{compact(data.totals.plays7)}</p>
          <Sparkline values={weekly} />
        </div>
        <div className="grid gap-1 bg-ink p-5">
          <p className="text-[0.8125rem] text-muted">Baholanmagan ish</p>
          <p className={`t-num text-[2.2rem] leading-none ${data.totals.ungraded ? "text-bole" : "text-turquoise"}`}>{data.totals.ungraded}</p>
          <p className="text-[0.8125rem] text-muted">{data.totals.ungraded ? "pastda ro'yxati bor" : "hammasi baholangan"}</p>
        </div>
        <div className="grid gap-1 bg-ink p-5">
          <p className="text-[0.8125rem] text-muted">Keyingi dars</p>
          {data.upcoming[0] ? (
            <>
              <p className="truncate font-semibold text-porcelain">{data.upcoming[0].title}</p>
              <p className="text-[0.875rem] text-brass">{data.upcoming[0].status === "LIVE" ? "hozir efirda" : untilText(data.upcoming[0].startsAt) || formatDateTime(data.upcoming[0].startsAt, "uz", { weekday: false })}</p>
            </>
          ) : (
            <Link href="/jonli" className="text-[0.9375rem] text-porcelain underline decoration-cobalt/50 underline-offset-4">Jonli dars rejalash →</Link>
          )}
        </div>
      </section>

      {/* 3D xarita */}
      <section aria-labelledby="g3d-h" className="relative overflow-hidden border border-cobalt/25 bg-[radial-gradient(120%_90%_at_50%_0%,color-mix(in_oklab,var(--cobalt)_12%,transparent),transparent_70%)] p-5">
        <h2 id="g3d-h" className="text-[1.3rem]">Guruhlar faolligi — 3D</h2>
        <p className="mb-3 text-[0.875rem] text-muted">Oxirgi 14 kun. Qaysi guruh qaysi kuni sustlashganini bir qarashda ko&apos;rasiz.</p>
        <Activity3D days={data.days} rows={data.groups} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* E'tibor kerak */}
        <section aria-labelledby="quiet-h" className="border border-cobalt/25 bg-ink p-5">
          <h2 id="quiet-h" className="text-[1.125rem]">Sustlashganlar</h2>
          <p className="mb-3 text-[0.8125rem] text-muted">5 kundan beri faol emas — bir og&apos;iz xabar ko&apos;pincha yetadi</p>
          {quiet.length === 0 ? (
            <p className="text-[0.9375rem] text-turquoise">Hamma faol — zo&apos;r!</p>
          ) : (
            <ul className="grid gap-2">
              {quiet.slice(0, 7).map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-cobalt/20 text-[0.8125rem] font-semibold">
                    {/* eslint-disable-next-line @next/next/no-img-element -- avatar o'z omborimizdan */}
                    {s.avatarUrl ? <img src={s.avatarUrl} alt="" className="size-full object-cover" /> : s.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.9375rem]">{s.name}</span>
                    <span className="block truncate text-[0.75rem] text-muted">{s.groups.join(", ")}</span>
                  </span>
                  <span className="badge badge-warn shrink-0">{seenText(s.inactiveDays)}</span>
                </li>
              ))}
              {quiet.length > 7 && <li className="text-[0.8125rem] text-muted">yana {quiet.length - 7} kishi — pastdagi jadvalda</li>}
            </ul>
          )}
        </section>

        {/* Muddati yaqin */}
        <section aria-labelledby="due-h" className="border border-cobalt/25 bg-ink p-5">
          <h2 id="due-h" className="text-[1.125rem]">Muddati yaqin vazifalar</h2>
          <p className="mb-3 text-[0.8125rem] text-muted">7 kun ichida</p>
          {data.dueSoon.length === 0 ? (
            <p className="text-[0.9375rem] text-muted">Yaqin muddatli vazifa yo&apos;q.</p>
          ) : (
            <ul className="grid gap-3">
              {data.dueSoon.map((h) => (
                <li key={h.id} className="grid gap-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <Link href={`/groups/${h.groupId}`} className="min-w-0 truncate text-[0.9375rem] hover:underline">{h.title}</Link>
                    <span className="t-num shrink-0 text-[0.875rem]">{h.submitted}/{h.members}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-cobalt/15">
                    <div className="h-full rounded-full bg-cobalt" style={{ width: `${h.members ? Math.min(100, (h.submitted / h.members) * 100) : 0}%` }} />
                  </div>
                  <p className="text-[0.75rem] text-muted">{h.groupName} · {untilText(h.dueAt) || "muddati o'tdi"}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Darslar va tezkor amallar */}
        <section aria-labelledby="up-h" className="border border-cobalt/25 bg-ink p-5">
          <h2 id="up-h" className="text-[1.125rem]">Rejadagi darslar</h2>
          <p className="mb-3 text-[0.8125rem] text-muted">Jonli efirlar</p>
          {data.upcoming.length === 0 ? (
            <p className="text-[0.9375rem] text-muted">Rejada dars yo&apos;q.</p>
          ) : (
            <ul className="grid gap-2">
              {data.upcoming.map((l) => (
                <li key={l.id} className="flex items-start gap-3">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${l.status === "LIVE" ? "animate-pulse bg-bole" : "bg-brass"}`} aria-hidden="true" />
                  <span className="min-w-0">
                    <Link href="/jonli" className="block truncate text-[0.9375rem] hover:underline">{l.title}</Link>
                    <span className="block text-[0.75rem] text-muted">
                      {l.status === "LIVE" ? "hozir efirda" : formatDateTime(l.startsAt, "uz", { weekday: true })}{l.groupName ? ` · ${l.groupName}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-cobalt/20 pt-4">
            <Link href="/jonli" className="btn btn-outline btn-sm">Jonli dars</Link>
            <Link href="/groups" className="btn btn-outline btn-sm">Guruh yaratish</Link>
            {data.groups[0] && <Link href={`/groups/${data.groups[0].id}`} className="btn btn-outline btn-sm">Vazifa berish</Link>}
            <Link href="/kutubxona" className="btn btn-outline btn-sm">Kutubxona</Link>
          </div>
        </section>
      </div>

      {/* Guruhlar kesimida */}
      {data.groups.length > 0 && (
        <section aria-labelledby="gstat-h">
          <h2 id="gstat-h" className="mb-4 text-[1.3rem]">Guruhlar kesimida</h2>
          <div className="grid gap-px border border-cobalt/25 bg-cobalt/25 sm:grid-cols-2 lg:grid-cols-3">
            {data.groups.map((g) => (
              <Link key={g.id} href={`/groups/${g.id}`} className="group grid gap-2 bg-ink p-5 transition-colors hover:bg-cobalt/[0.07]">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[1.1rem]">{g.name}</h3>
                  <span className="badge">{g.level}</span>
                </div>
                <dl className="grid grid-cols-3 gap-2 text-[0.8125rem]">
                  <div><dt className="text-muted">Faol</dt><dd className="t-num text-[1.1rem] text-porcelain">{g.active7}/{g.members}</dd></div>
                  <div><dt className="text-muted">Davomat</dt><dd className="t-num text-[1.1rem] text-porcelain">{g.attendance === null ? "—" : `${g.attendance}%`}</dd></div>
                  <div><dt className="text-muted">Baholash</dt><dd className={`t-num text-[1.1rem] ${g.ungraded ? "text-bole" : "text-porcelain"}`}>{g.ungraded}</dd></div>
                </dl>
                <Sparkline values={g.activity} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* O'quvchilar jadvali */}
      {data.students.length > 0 && (
        <section aria-labelledby="st-h" className="grid gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="st-h" className="text-[1.3rem]">O&apos;quvchilarim <span className="text-muted">({data.students.length})</span></h2>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="st-q" className="sr-only">Qidirish</label>
              <input id="st-q" value={q} onChange={(e) => setQ(e.target.value)} className="input !min-h-10 w-56" placeholder="Ism yoki guruh" />
              <label htmlFor="st-sort" className="sr-only">Saralash</label>
              <select id="st-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input !min-h-10 w-auto">
                <option value="xp7">Haftalik XP</option>
                <option value="streak">Seriya</option>
                <option value="seen">Uzoq kirmaganlar</option>
                <option value="name">Ism</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto border border-cobalt/25">
            <table className="table">
              <thead>
                <tr><th>O&apos;quvchi</th><th>Guruh</th><th className="text-right">XP · 7 kun</th><th className="text-right">Seriya</th><th>Oxirgi faollik</th></tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.name}</td>
                    <td className="text-[0.875rem] text-muted">{s.groups.join(", ")}</td>
                    <td className="t-num text-right text-brass">{s.xp7}</td>
                    <td className="t-num text-right">{s.streak > 0 ? `${s.streak} kun` : "—"}</td>
                    <td className={`text-[0.875rem] ${s.inactiveDays === null || s.inactiveDays >= 5 ? "text-bole" : "text-muted"}`}>{seenText(s.inactiveDays)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

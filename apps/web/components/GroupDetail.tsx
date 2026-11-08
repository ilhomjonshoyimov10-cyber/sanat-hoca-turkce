"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError, needs2fa } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AttendanceSection } from "./groups/AttendanceSection";
import { ChatSection } from "./groups/ChatSection";
import { LessonsSection } from "./groups/LessonsSection";
import { HomeworkSection } from "./groups/HomeworkSection";
import { MembersSection } from "./groups/MembersSection";
import { errorText, type Detail } from "./groups/shared";

type Tab = "hw" | "members" | "att" | "chat" | "lessons";

export function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("hw");
  const [ver, setVer] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;
    api<Detail>(`/groups/${id}`)
      .then((d) => !cancelled && setDetail(d))
      .catch((e) => {
        if (cancelled) return;
        if (needs2fa(e)) router.push("/security");
        else setError(e instanceof ApiError && e.status === 404 ? "Guruh topilmadi yoki sizda unga kirish huquqi yo'q" : errorText(e));
      });
    return () => {
      cancelled = true;
    };
  }, [user, id, router, ver]);

  if (loading || !user) return <p className="text-muted" role="status">Yuklanmoqda...</p>;
  if (error) {
    return (
      <div className="grid gap-4">
        <p className="alert-error" role="alert">{error}</p>
        <Link href="/groups" className="btn btn-outline justify-self-start">Guruhlarga qaytish</Link>
      </div>
    );
  }
  if (!detail) return <p className="text-muted" role="status">Yuklanmoqda...</p>;

  const { group, canManage } = detail;
  const tabs: [Tab, string][] = [
    ["hw", "Vazifalar"],
    ["chat", "Chat"],
    ["lessons", "Video darslar"],
    [ "members", canManage ? "O'quvchilar" : "Guruhdoshlar"],
    ["att", canManage ? "Davomat" : "Mening davomatim"],
  ];
  const safeUrl = group.meetingUrl?.startsWith("https://") ? group.meetingUrl : null;

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/groups" className="text-sm font-bold text-muted hover:text-foreground">← Guruhlar</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{group.name}</h1>
          <span className="badge badge-warn">{group.level}</span>
          {!group.isActive && <span className="badge badge-bad">Faol emas</span>}
        </div>
        <p className="mt-2 text-muted">
          {[group.schedule, `Ustoz: ${detail.teacherName}`].filter(Boolean).join(" · ")}
        </p>
        {safeUrl && (
          <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-4">Onlayn darsga qo&apos;shilish</a>
        )}
      </div>

      <div role="tablist" aria-label="Guruh bo'limlari" className="flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <button key={key} type="button" role="tab" id={`tab-${key}`} aria-selected={tab === key} aria-controls="tabpanel" className="tab" onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "hw" && <HomeworkSection groupId={group.id} canManage={canManage} />}
        {tab === "chat" && <ChatSection groupId={group.id} canModerate={canManage} />}
        {tab === "lessons" && <LessonsSection groupId={group.id} canManage={canManage} />}
        {tab === "members" && <MembersSection groupId={group.id} canManage={canManage} members={detail.members} onChanged={() => setVer((n) => n + 1)} />}
        {tab === "att" && <AttendanceSection groupId={group.id} canManage={canManage} members={detail.members} myId={user.id} />}
      </div>
    </div>
  );
}

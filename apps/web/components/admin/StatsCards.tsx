"use client";

import { useAdminData } from "./AdminPanel";

interface Stats {
  users: number;
  roles: Record<string, number>;
  groups: number;
  activeGroups: number;
  leads: number;
  newLeads: number;
  words: number;
  submissions: number;
  ungraded: number;
  lessons: number;
}

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "O'quvchi", TEACHER: "Ustoz", ADMIN: "Admin", PARENT: "Ota-ona",
};

function Card({ value, label, note, tone = "text-porcelain" }: { value: number | string; label: string; note?: string; tone?: string }) {
  return (
    <div className="bg-ink p-6 raise">
      <p className={`t-num text-[2.4rem] leading-none ${tone}`}>{value}</p>
      <p className="mt-3 font-medium">{label}</p>
      {note && <p className="mt-1 text-[0.875rem] text-muted">{note}</p>}
    </div>
  );
}

export function StatsCards({ onError }: { onError: (m: string) => void }) {
  const { data, busy } = useAdminData<Stats>("/admin/stats", onError);

  if (busy) return <div className="grid gap-px border border-cobalt/25 bg-cobalt/25 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton h-32" />)}</div>;
  if (!data) return null;

  return (
    <div className="grid gap-8">
      <div className="grid gap-px border border-cobalt/25 bg-cobalt/25 sm:grid-cols-2 lg:grid-cols-4">
        <Card value={data.users} label="Foydalanuvchi" note="Jami ro'yxatdan o'tganlar" tone="text-brass" />
        <Card value={data.activeGroups} label="Faol guruh" note={`Jami ${data.groups} ta`} tone="text-cobalt" />
        <Card value={data.newLeads} label="Yangi ariza" note={`Jami ${data.leads} ta`} tone="text-bole" />
        <Card value={data.ungraded} label="Baholanmagan ish" note={`Jami ${data.submissions} ta topshiriq`} tone="text-turquoise" />
      </div>

      <div>
        <h2 className="mb-4 text-[1.3rem]">Rollar bo&apos;yicha</h2>
        <div className="grid gap-px border border-cobalt/25 bg-cobalt/25 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(ROLE_LABEL).map(([key, label]) => (
            <Card key={key} value={data.roles[key] ?? 0} label={label} />
          ))}
        </div>
      </div>

      <div className="grid gap-px border border-cobalt/25 bg-cobalt/25 sm:grid-cols-2">
        <Card value={data.words} label="Lug'atdagi so'z" />
        <Card value={data.lessons} label="Video dars" />
      </div>
    </div>
  );
}

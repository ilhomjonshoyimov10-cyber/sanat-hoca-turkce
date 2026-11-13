import { ApiError } from "@/lib/api";

export type Member = {
  id: string; firstName: string; lastName: string;
  email?: string | null; phone?: string | null; isMinor?: boolean; parentConsent?: boolean;
};
export type GroupInfo = { id: string; name: string; level: string; schedule: string | null; meetingUrl: string | null; isActive: boolean; joinCode?: string | null };
export type Detail = { group: GroupInfo; teacherName: string; canManage: boolean; members: Member[] };
export type Sub = { id: string; text: string | null; status: "SUBMITTED" | "GRADED" | "RETURNED"; score: number | null; feedback: string | null };
export type Homework = {
  id: string; title: string; description: string; dueAt: string | null; maxScore: number;
  submittedCount?: number; gradedCount?: number; mySubmission?: Sub | null;
};

export const errorText = (e: unknown) => (e instanceof ApiError ? e.message : "Xatolik yuz berdi. Qayta urinib ko'ring");

/** Toshkent vaqti bo'yicha bugungi sana (YYYY-MM-DD) */
export const tashkentToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(new Date());

export const fullName = (m: { firstName: string; lastName: string }) => `${m.firstName} ${m.lastName}`;

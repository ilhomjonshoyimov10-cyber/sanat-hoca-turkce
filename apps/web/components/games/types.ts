import { ApiError } from "@/lib/api";

export type Stats = {
  xp: number; level: number; streak: number; longestStreak: number;
  learnedWords: number; masteredWords: number; dueWords: number; leaderboardOptIn: boolean;
};

/** Har bir o'yin shu props bilan ishlaydi: statistikani yangilaydi, xatoni markazga uzatadi. */
export type GameProps = { onStats: (s: Stats) => void; onFail: (e: unknown) => void; onExit: () => void; level: string };

export const LEVELS = ["A1", "A2", "B1", "B2"] as const;
/** Daraja tanlangan bo'lsa so'rovga qo'shiladigan qism (masalan "&level=B1"); bo'sh = hamma daraja */
export const levelParam = (level: string) => (level ? `&level=${level}` : "");

export const errorText = (e: unknown) => (e instanceof ApiError ? e.message : "Xatolik yuz berdi. Qayta urinib ko'ring");

export const TURKISH_LETTERS = ["ç", "ğ", "ı", "ö", "ş", "ü"] as const;

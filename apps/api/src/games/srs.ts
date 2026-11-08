// Oraliqli takrorlash (Leitner qutilari): bilgan so'z kam, bilmagan so'z tez-tez qaytadi.
// Bu fayl sof funksiyalardan iborat, shuning uchun osongina testlanadi.

export const MAX_BOX = 5;
export const XP_PER_CORRECT = 10;
const WRONG_RETRY_MS = 10 * 60 * 1000; // xato javobdan 10 daqiqa keyin yana so'raladi
const DAY_MS = 24 * 60 * 60 * 1000;
/** Qutiga tushgandan keyin keyingi takrorlashgacha kunlar (quti raqami bo'yicha) */
const DAYS_BY_BOX: Record<number, number> = { 2: 1, 3: 3, 4: 7, 5: 21 };

export function nextState(box: number, correct: boolean, now: Date) {
  if (!correct) return { box: 1, nextReviewAt: new Date(now.getTime() + WRONG_RETRY_MS) };
  const newBox = Math.min(box + 1, MAX_BOX);
  return { box: newBox, nextReviewAt: new Date(now.getTime() + DAYS_BY_BOX[newBox] * DAY_MS) };
}

/** Kun chegarasi O'zbekiston vaqti (UTC+5) bo'yicha: yarim tunda seriya yangilanadi. */
export const tashkentDay = (now: Date) => new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const dayBefore = (day: string) => new Date(Date.parse(`${day}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);

/** Ketma-ket kunlar seriyasi (streak). */
export function nextStreak(lastDay: string | null, today: string, current: number): number {
  if (lastDay === today) return Math.max(current, 1);
  if (lastDay === dayBefore(today)) return current + 1;
  return 1;
}

export const levelFromXp = (xp: number) => Math.floor(xp / 100) + 1;

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

import { describe, expect, it } from 'vitest';
import { levelFromXp, nextState, nextStreak, shuffle, tashkentDay } from './srs.js';

const now = new Date('2026-10-16T10:00:00Z');
const DAY = 86_400_000;

describe('oraliqli takrorlash', () => {
  it("noto'g'ri javob: 1-qutiga qaytadi, 10 daqiqadan keyin so'raladi", () => {
    const s = nextState(4, false, now);
    expect(s.box).toBe(1);
    expect(s.nextReviewAt.getTime() - now.getTime()).toBe(10 * 60_000);
  });
  it("to'g'ri javob: quti oshadi, oraliq uzayadi (1, 3, 7, 21 kun)", () => {
    const days = [1, 2, 3, 4].map((box) => (nextState(box, true, now).nextReviewAt.getTime() - now.getTime()) / DAY);
    expect(days).toEqual([1, 3, 7, 21]);
  });
  it("5-qutidan oshmaydi", () => {
    expect(nextState(5, true, now).box).toBe(5);
  });
});

describe('kun va seriya (Toshkent vaqti)', () => {
  it('UTC+5: UTC 19:30 allaqachon ertangi kun', () => {
    expect(tashkentDay(new Date('2026-10-16T18:59:00Z'))).toBe('2026-10-16');
    expect(tashkentDay(new Date('2026-10-16T19:00:00Z'))).toBe('2026-10-17');
  });
  it('seriya: bir kunda ikki marta oshmaydi, ketma-ket kunda oshadi, uzilsa 1', () => {
    expect(nextStreak('2026-10-16', '2026-10-16', 3)).toBe(3);
    expect(nextStreak('2026-10-15', '2026-10-16', 3)).toBe(4);
    expect(nextStreak('2026-10-13', '2026-10-16', 7)).toBe(1);
    expect(nextStreak(null, '2026-10-16', 0)).toBe(1);
  });
  it("oy chegarasida ham to'g'ri", () => {
    expect(nextStreak('2026-09-30', '2026-10-01', 5)).toBe(6);
  });
});

describe('daraja va aralashtirish', () => {
  it('har 100 XP = 1 daraja', () => {
    expect([0, 99, 100, 250].map(levelFromXp)).toEqual([1, 1, 2, 3]);
  });
  it("aralashtirish elementlarni yo'qotmaydi va asl massivni o'zgartirmaydi", () => {
    const a = [1, 2, 3, 4, 5, 6];
    const b = shuffle(a);
    expect([...b].sort()).toEqual(a);
    expect(a).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

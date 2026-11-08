import { createHash, randomBytes } from 'crypto';

/** Tokenlar bazada faqat shu xesh ko'rinishida saqlanadi. */
export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/** Kriptografik tasodifiy token (refresh token uchun). */
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');

export const normalizeEmail = (v: string) => v.trim().toLowerCase();

/** O'zbekiston raqami: 901234567, 998901234567, +998 90 123-45-67 → +998901234567 */
export function normalizePhone(v: string): string | null {
  const cleaned = v.replace(/[\s\-()]/g, '');
  const m = cleaned.match(/^(?:\+?998)?(\d{9})$/);
  return m ? `+998${m[1]}` : null;
}

export function calcAge(birth: Date, now = new Date()): number {
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const m = now.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

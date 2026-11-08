// NIST tavsiyasi: uzunlik va "oddiy parollar" tekshiruvi muhim, majburiy
// "bitta katta harf + belgi" qoidalari esa foydali emas.
// Keyingi bosqichda: Have I Been Pwned (k-anonymity) yoki zxcvbn qo'shiladi.

const COMMON = new Set([
  'password', 'parol', 'qwerty', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm', 'iloveyou', 'admin',
  'uzbekistan', 'toshkent', 'turkiye', 'turkce', 'sanathoca', 'sanathocaturkce',
  '12345678', '123456789', '1234567890', '0123456789', '987654321', '1q2w3e4r5t', '1234512345', '00000000', '11111111',
]);

export interface PasswordContext {
  firstName?: string;
  lastName?: string;
  email?: string;
}

/** Xato bo'lsa xabar matnini, yaroqli bo'lsa null qaytaradi. */
export function checkPassword(password: string, ctx: PasswordContext = {}): string | null {
  if (password.length < 10) return "Parol kamida 10 belgidan iborat bo'lsin";
  if (password.length > 128) return 'Parol 128 belgidan oshmasin';

  const lower = password.toLowerCase();
  const base = lower.replace(/[\d\p{P}\p{S}_]+$/u, ''); // oxiridagi raqam va belgilarni olib tashlaymiz

  if (COMMON.has(lower) || COMMON.has(base)) {
    return 'Bu parol juda oddiy. Boshqa, uzunroq parol tanlang';
  }
  if (/^(.)\1+$/u.test(password)) return "Parol bir xil belgilardan iborat bo'lmasin";

  const chars = [...lower];
  const step = (d: number) =>
    chars.every((c, i) => i === 0 || c.charCodeAt(0) - chars[i - 1].charCodeAt(0) === d);
  if (step(1) || step(-1)) return "Parol ketma-ket belgilardan iborat bo'lmasin";

  const personal = [ctx.firstName, ctx.lastName, ctx.email?.split('@')[0]]
    .filter((x): x is string => !!x && x.length >= 4)
    .map((x) => x.toLowerCase());
  if (personal.some((p) => lower.includes(p))) {
    return "Parolda ism, familiya yoki email bo'lmasin";
  }
  return null;
}

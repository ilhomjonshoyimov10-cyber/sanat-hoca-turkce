import { describe, expect, it } from 'vitest';
import { hashPassword, needsRehash, verifyPassword } from './argon.js';
import { calcAge, normalizeEmail, normalizePhone, randomToken, sha256 } from './auth.utils.js';
import { checkPassword } from './password.policy.js';

describe('parol siyosati', () => {
  it.each([
    ['qisqa parol', 'abc12345'],
    ['oddiy parol', 'password123456'],
    ['oxirida raqam bilan oddiy so\'z', 'SanatHoca2024!!'],
    ['1234567890', '1234567890'],
    ['bir xil belgilar', 'aaaaaaaaaaaa'],
    ['ketma-ket belgilar', 'abcdefghijkl'],
    ['129 belgi', 'x1'.repeat(65)],
  ])('rad etiladi: %s', (_name, pw) => {
    expect(checkPassword(pw)).toBeTruthy();
  });

  it('ism bor parol rad etiladi', () => {
    expect(checkPassword('Aziza-2010-xx!', { firstName: 'Aziza' })).toBeTruthy();
  });

  it.each(['olma-daraxti-sakkiz-kuz', 'güzel-Türkçe-öğren-ışık'])('qabul qilinadi: %s', (pw) => {
    expect(checkPassword(pw)).toBeNull();
  });
});

describe('telefon va email', () => {
  it.each(['+998 90 123-45-67', '901234567', '998901234567'])('normallashadi: %s', (v) => {
    expect(normalizePhone(v)).toBe('+998901234567');
  });
  it("noto'g'ri raqam null qaytaradi", () => {
    expect(normalizePhone('12345')).toBeNull();
    expect(normalizePhone('+7 900 123 45 67')).toBeNull();
  });
  it('email kichik harfga o\'tadi', () => {
    expect(normalizeEmail('  Aziza@Mail.UZ ')).toBe('aziza@mail.uz');
  });
});

describe('yosh hisobi', () => {
  const now = new Date('2026-10-15');
  it('to\'g\'ri hisoblaydi', () => {
    expect(calcAge(new Date('2010-06-15'), now)).toBe(16);
    expect(calcAge(new Date('2008-10-16'), now)).toBe(17); // tug'ilgan kuniga 1 kun qolgan
    expect(calcAge(new Date('2008-10-15'), now)).toBe(18);
  });
});

describe('tokenlar va xeshlash', () => {
  it('tokenlar noyob, xesh barqaror', () => {
    expect(randomToken()).not.toBe(randomToken());
    expect(sha256('x')).toBe(sha256('x'));
    expect(sha256('x')).toHaveLength(64);
  });

  it('argon2id xesh va tekshiruv', async () => {
    const hash = await hashPassword('olma-daraxti-sakkiz-kuz');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await verifyPassword(hash, 'olma-daraxti-sakkiz-kuz')).toBe(true);
    expect(await verifyPassword(hash, 'xato-parol-1234')).toBe(false);
    expect(await verifyPassword('yaroqsiz-xesh', 'x')).toBe(false);
    expect(needsRehash(hash)).toBe(false);
  });
});

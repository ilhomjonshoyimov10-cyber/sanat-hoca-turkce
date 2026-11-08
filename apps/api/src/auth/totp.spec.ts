import { describe, expect, it } from 'vitest';
import { decrypt, encrypt } from './crypto.js';
import {
  base32Decode, base32Encode, generateRecoveryCode, normalizeRecoveryCode, totpAt, verifyTotp,
} from './totp.js';

// RFC 6238, Appendix B: kalit ASCII "12345678901234567890" (SHA-1)
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890'));

describe('TOTP (RFC 6238 rasmiy test vektorlari)', () => {
  it.each([
    [59, '94287082'],
    [1111111109, '07081804'],
    [1111111111, '14050471'],
    [1234567890, '89005924'],
    [2000000000, '69279037'],
  ])('vaqt %i s => 8 xonali kod %s', (t, expected) => {
    expect(totpAt(RFC_SECRET, t * 1000, 8)).toBe(expected);
  });

  it('6 xonali kod 8 xonaliining oxirgi 6 raqami', () => {
    expect(totpAt(RFC_SECRET, 59_000)).toBe('287082');
    expect(totpAt(RFC_SECRET, 1234567890_000)).toBe('005924'); // boshidagi nollar saqlanadi
  });
});

describe('base32', () => {
  it('kodlash va qaytarish bir xil natija beradi', () => {
    for (const len of [1, 5, 10, 20, 33]) {
      const buf = Buffer.from(Array.from({ length: len }, (_, i) => (i * 37 + 11) % 256));
      expect(base32Decode(base32Encode(buf)).equals(buf)).toBe(true);
    }
  });
  it("noto'g'ri belgi xato beradi", () => {
    expect(() => base32Decode('ABC1')).toThrow();
  });
});

describe('verifyTotp', () => {
  const now = 1_700_000_000_000;
  const code = totpAt(RFC_SECRET, now);

  it("to'g'ri kod qadamni qaytaradi", () => {
    expect(verifyTotp(RFC_SECRET, code, now)).toBe(Math.floor(now / 30000));
  });
  it('±1 qadam (30 soniya) farq qabul qilinadi, 2 qadam rad etiladi', () => {
    expect(verifyTotp(RFC_SECRET, code, now + 30_000)).not.toBeNull();
    expect(verifyTotp(RFC_SECRET, code, now - 30_000)).not.toBeNull();
    expect(verifyTotp(RFC_SECRET, code, now + 90_000)).toBeNull();
  });
  it('bir kod ikki marta ishlamaydi (replay himoyasi)', () => {
    const step = verifyTotp(RFC_SECRET, code, now)!;
    expect(verifyTotp(RFC_SECRET, code, now, step)).toBeNull();
  });
  it("noto'g'ri formatlar rad etiladi", () => {
    for (const bad of ['', '12345', '1234567', 'abcdef', '12 3456']) expect(verifyTotp(RFC_SECRET, bad, now)).toBeNull();
  });
});

describe('tiklash kodlari', () => {
  it('format XXXXX-XXXXX va tasodifiy', () => {
    const a = generateRecoveryCode();
    expect(a).toMatch(/^[A-Z2-7]{5}-[A-Z2-7]{5}$/);
    expect(a).not.toBe(generateRecoveryCode());
  });
  it("kiritish normallashadi: kichik harf, bo'shliq, chiziqcha", () => {
    expect(normalizeRecoveryCode(' abcde-fghij ')).toBe('ABCDEFGHIJ');
  });
});

describe('AES-GCM shifrlash', () => {
  const secret = 'x'.repeat(40);
  it('shifrlab-ochish bir xil matn beradi', () => {
    expect(decrypt(encrypt('salom', secret, 'a'), secret, 'a')).toBe('salom');
  });
  it("boshqa kalit, boshqa maqsad, o'zgartirilgan matn: null", () => {
    const t = encrypt('salom', secret, 'a');
    expect(decrypt(t, 'y'.repeat(40), 'a')).toBeNull();
    expect(decrypt(t, secret, 'b')).toBeNull();
    const parts = t.split('.');
    parts[2] = Buffer.from('hacked').toString('base64url');
    expect(decrypt(parts.join('.'), secret, 'a')).toBeNull();
    expect(decrypt('chala', secret, 'a')).toBeNull();
  });
  it('har safar turlicha natija (tasodifiy IV)', () => {
    expect(encrypt('x', secret, 'a')).not.toBe(encrypt('x', secret, 'a'));
  });
});

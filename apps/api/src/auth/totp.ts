import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

// TOTP (RFC 6238): Google Authenticator, Authy, Microsoft Authenticator bilan mos.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of input.replace(/=+$/, '').toUpperCase()) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error('Noto\'g\'ri base32 belgi');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export const generateSecret = () => base32Encode(randomBytes(20));

function hotp(secret: Buffer, counter: number, digits: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac('sha1', secret).update(msg).digest();
  const off = h[19] & 0xf;
  const bin = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(bin % 10 ** digits).padStart(digits, '0');
}

export const totpStep = (timeMs: number, period = 30) => Math.floor(timeMs / 1000 / period);

export function totpAt(secretBase32: string, timeMs: number, digits = 6, period = 30): string {
  return hotp(base32Decode(secretBase32), totpStep(timeMs, period), digits);
}

/**
 * Kodni tekshiradi (±1 qadam: soat farqi uchun). To'g'ri bo'lsa mos qadamni qaytaradi.
 * lastStep berilsa, undan eski yoki teng qadamlar rad etiladi: bir kod ikki marta ishlamaydi.
 */
export function verifyTotp(
  secretBase32: string,
  code: string,
  nowMs: number,
  lastStep: number | null = null,
): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const secret = base32Decode(secretBase32);
  const current = totpStep(nowMs);
  for (const delta of [0, -1, 1]) {
    const step = current + delta;
    if (lastStep !== null && step <= lastStep) continue;
    const expected = Buffer.from(hotp(secret, step, 6));
    if (timingSafeEqual(expected, Buffer.from(code))) return step;
  }
  return null;
}

/** Tiklash kodi: XXXXX-XXXXX (50 bit tasodifiylik) */
export function generateRecoveryCode(): string {
  const raw = base32Encode(randomBytes(7)).slice(0, 10);
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}

export const normalizeRecoveryCode = (v: string) => v.replace(/[\s-]/g, '').toUpperCase();

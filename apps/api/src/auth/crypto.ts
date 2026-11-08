import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

// AES-256-GCM: shifrlaydi VA o'zgartirilganini aniqlaydi.
// "purpose" har xil maqsad uchun alohida kalit hosil qiladi (2FA siri, o'yin savollari).
const deriveKey = (secret: string, purpose: string) =>
  createHash('sha256').update(`${purpose}:${secret}`).digest();

export function encrypt(plain: string, secret: string, purpose: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(secret, purpose), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64url')).join('.');
}

/** Buzilgan yoki soxta bo'lsa null qaytaradi (xato tashlamaydi). */
export function decrypt(token: string, secret: string, purpose: string): string | null {
  try {
    const [iv, tag, data] = token.split('.').map((p) => Buffer.from(p, 'base64url'));
    if (!iv || !tag || !data || iv.length !== 12 || tag.length !== 16) return null;
    const decipher = createDecipheriv('aes-256-gcm', deriveKey(secret, purpose), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

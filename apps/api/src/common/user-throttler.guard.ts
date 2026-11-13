import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { ACCESS_COOKIE } from '../auth/cookies.js';

/**
 * So'rovlar chegarasi — IP bo'yicha emas, FOYDALANUVCHI bo'yicha.
 *
 * Muammo: o'quv markazida 30 o'quvchi bitta Wi-Fi'dan kiradi, ya'ni
 * hammasining IP manzili bir xil. IP bo'yicha "daqiqasiga 120 so'rov"
 * butun sinf uchun umumiy bo'lib qolardi va darsda sayt "So'rovlar juda
 * ko'p" deb to'xtab qolardi.
 *
 * Yechim: kirgan foydalanuvchi o'z hisobi bo'yicha sanaladi. Kalit —
 * IMZOSI TEKSHIRILGAN access token ichidagi foydalanuvchi ID. Tasodifiy
 * cookie bilan cheklovni aylanib o'tib bo'lmaydi: imzo noto'g'ri bo'lsa,
 * IP bo'yicha sanaladi (kirish sahifasidagi parol tanlashga qarshi himoya
 * shu bilan saqlanadi).
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const cookies = req.cookies as Record<string, string> | undefined;
    const sub = verifiedSubject(cookies?.[ACCESS_COOKIE]);
    return sub ? `u:${sub}` : `ip:${String(req.ip ?? '')}`;
  }
}

function b64url(buf: Buffer) {
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/** HS256 JWT ni tekshiradi; to'g'ri va muddati o'tmagan bo'lsa — `sub`. */
export function verifiedSubject(token: string | undefined, secret = process.env.JWT_ACCESS_SECRET ?? ''): string | null {
  if (!token || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  try {
    const header = JSON.parse(Buffer.from(h, 'base64url').toString('utf8')) as { alg?: string };
    if (header.alg !== 'HS256') return null;
    const expected = b64url(createHmac('sha256', secret).update(`${h}.${p}`).digest());
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8')) as { sub?: string; exp?: number };
    if (!payload.sub || (payload.exp && payload.exp * 1000 < Date.now())) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

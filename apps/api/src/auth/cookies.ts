import type { CookieOptions } from 'express';

export const ACCESS_COOKIE = 'sh_at';
export const REFRESH_COOKIE = 'sh_rt';
export const ACCESS_TTL_S = 15 * 60; // 15 daqiqa
/**
 * Sessiya muddati — 1 kun, lekin SURILADIGAN.
 *
 * Qanday ishlaydi: har safar access token yangilanganda (har 15 daqiqada,
 * sayt ochiq bo'lsa avtomatik) refresh token ham almashadi va muddati
 * yana 1 kundan boshlanadi. Natija:
 *   • saytni kunda bir marta ochadigan odam hech qachon qayta kirmaydi —
 *     hisobida davom etaveradi;
 *   • 1 kun ichida umuman kirmagan odamdan login va parol so'raladi.
 *
 * Nega 30 kun emas: umumiy kompyuterda (maktab, internet-kafe) unutilgan
 * sessiya bir oy ochiq qolardi.
 */
export const REFRESH_TTL_MS = 24 * 60 * 60 * 1000; // 1 kun

// Refresh cookie faqat /auth yo'llariga yuboriladi (boshqa so'rovlarda ko'rinmaydi).
// Agar keyinroq API ni nginx orqali /api prefiksi ostiga qo'ysangiz, shu yerni o'zgartiring.
export const REFRESH_PATH = '/auth';

export function accessCookie(): CookieOptions {
  return {
    httpOnly: true, // JavaScript o'qiy olmaydi (XSS'dan himoya)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TTL_S * 1000,
  };
}

export function refreshCookie(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: REFRESH_PATH,
    maxAge: REFRESH_TTL_MS,
  };
}

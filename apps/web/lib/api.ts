// API bilan aloqa: cookie (HttpOnly) yuboriladi, CSRF sarlavhasi qo'shiladi,
// 401 bo'lsa token BIR MARTA avtomatik yangilanadi.

// Har doim o'z domenimiz. next.config.ts dagi rewrite "/api/*" ni haqiqiy
// NestJS serveriga uzatadi, shuning uchun brauzer boshqa domenni ko'rmaydi:
// CORS kerak emas, cookie'lar SameSite=Lax bilan ishonchli ishlaydi.
const BASE = "/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string, // masalan "2FA_SETUP_REQUIRED"
    /** Server javobining to'liq tanasi (masalan AI xatosida conversationId) */
    public data?: unknown,
  ) {
    super(message);
  }
}

/** Ustoz/admin 2FA ni yoqmagan: server shu xatoni qaytaradi, foydalanuvchi /security ga yo'naltiriladi. */
export const needs2fa = (e: unknown) => e instanceof ApiError && e.code === "2FA_SETUP_REQUIRED";

type Options = { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown };

async function rawFetch(path: string, { method = "GET", body }: Options) {
  return fetch(`${BASE}${path}`, {
    method,
    credentials: "include", // cookie yuborish uchun
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest", // serverdagi CSRF himoyasi talab qiladi
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

// Refresh token har safar almashadi, shuning uchun bir vaqtdagi so'rovlar
// bitta refresh'ni kutadi (aks holda server "o'g'irlangan token" deb seansni yopadi).
//
// Bir nechta TAB ham bir-birini kutadi (navigator.locks): ikkita tab bir
// vaqtda yangilasa, ikkinchisi "Unauthorized" olardi. Endi ikkinchi tab
// navbatini kutadi va avval tekshiradi — birinchi tab yangilab bo'lgan
// bo'lsa (cookie umumiy), qayta yangilashning hojati yo'q.
let refreshing: Promise<boolean> | null = null;
async function doRefresh(): Promise<boolean> {
  const probe = await rawFetch("/auth/me", {}).catch(() => null);
  if (probe?.ok) return true;
  const r = await rawFetch("/auth/refresh", { method: "POST" }).catch(() => null);
  if (r?.ok) return true;
  // Yutqazgan poyga: boshqa so'rov endigina yangilagan bo'lishi mumkin
  const again = await rawFetch("/auth/me", {}).catch(() => null);
  return !!again?.ok;
}
function refreshOnce(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
      return locks ? await locks.request("sh-auth-refresh", doRefresh) : await doRefresh();
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/** Sessiya butunlay tugadi: sarlavhadagi "kirgan" belgisi o'chadi. */
const SESSION_EXPIRED = "Sessiya muddati tugadi. Iltimos, qayta kiring";

function messageFrom(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "message" in data) {
    const m = (data as { message: unknown }).message;
    if (Array.isArray(m) && m.length) return String(m[0]);
    if (typeof m === "string" && m) return m;
  }
  return fallback;
}

export async function api<T = unknown>(path: string, options: Options = {}, canRetry = true): Promise<T> {
  let res: Response;
  try {
    res = await rawFetch(path, options);
  } catch {
    throw new ApiError("Serverga ulanib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring", 0);
  }

  const isAuthCall = path === "/auth/login" || path === "/auth/register" || path === "/auth/refresh";
  if (res.status === 401 && canRetry && !isAuthCall && (await refreshOnce())) {
    return api<T>(path, options, false);
  }

  const data: unknown = await res.json().catch(() => null);
  if (res.status === 401 && !isAuthCall) {
    const m = messageFrom(data, "");
    // Nest'ning inglizcha "Unauthorized" so'zi = himoya qatlami rad etdi
    // (sessiya yo'q). O'z matni bor 401 (masalan "parol noto'g'ri") — boshqa gap.
    if (!m || m === "Unauthorized") {
      if (typeof window !== "undefined") window.dispatchEvent(new Event("sh-session-expired"));
      throw new ApiError(SESSION_EXPIRED, 401, "SESSION_EXPIRED");
    }
    throw new ApiError(m, 401);
  }
  if (!res.ok) {
    const fallback =
      res.status === 429 ? "So'rovlar juda ko'p. Birozdan keyin urinib ko'ring" : "Xatolik yuz berdi. Qayta urinib ko'ring";
    const code = data && typeof data === "object" && "code" in data ? String((data as { code: unknown }).code) : undefined;
    throw new ApiError(messageFrom(data, fallback), res.status, code, data);
  }
  return data as T;
}

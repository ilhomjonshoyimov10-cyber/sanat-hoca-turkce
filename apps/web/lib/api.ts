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
let refreshing: Promise<boolean> | null = null;
function refreshOnce(): Promise<boolean> {
  refreshing ??= rawFetch("/auth/refresh", { method: "POST" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

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
  if (!res.ok) {
    const fallback =
      res.status === 429 ? "So'rovlar juda ko'p. Birozdan keyin urinib ko'ring" : "Xatolik yuz berdi. Qayta urinib ko'ring";
    const code = data && typeof data === "object" && "code" in data ? String((data as { code: unknown }).code) : undefined;
    throw new ApiError(messageFrom(data, fallback), res.status, code);
  }
  return data as T;
}

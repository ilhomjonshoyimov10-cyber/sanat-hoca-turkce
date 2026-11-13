"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode,
} from "react";
import { api, ApiError } from "./api";

// ───────────── "Kirgan" belgisi ─────────────
//
// "sh_in=1" faqat KO'RINISH uchun: sarlavhada "Kirish" yoki avatar
// ko'rsatishni tezda bilish uchun. Xavfsizlik bunga TAYANMAYDI — haqiqiy
// kirish HttpOnly cookie bilan serverda tekshiriladi.
//
// Undan yana bir foyda: ommaviy sahifalarda (bosh sahifa, kutubxona)
// kirmagan mehmon uchun /auth/me so'rovi umuman yuborilmaydi.
const HINT_EVENT = "sh-auth-change";
const subscribeHint = (cb: () => void) => {
  window.addEventListener(HINT_EVENT, cb);
  return () => window.removeEventListener(HINT_EVENT, cb);
};
const readHint = () => document.cookie.split("; ").includes("sh_in=1");

export function setAuthHint(on: boolean) {
  document.cookie = on ? "sh_in=1; path=/; max-age=2592000; SameSite=Lax" : "sh_in=; path=/; max-age=0; SameSite=Lax";
  window.dispatchEvent(new Event(HINT_EVENT));
}

/** Sarlavha uchun: brauzerda "kirgan" belgisi bormi (server render'da — yo'q). */
export function useAuthHint(): boolean {
  return useSyncExternalStore(subscribeHint, readHint, () => false);
}

export type User = {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: "STUDENT" | "TEACHER" | "ADMIN" | "PARENT";
  locale: string;
  avatarUrl: string | null;
  twoFactorEnabled: boolean;
};

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password: string;
  birthDate: string;
  acceptTerms: true;
};

export type LoginResult = { status: "ok"; mustSetup2fa: boolean } | { status: "2fa"; challenge: string };

type AuthState = {
  user: User | null;
  /** Server bilan tekshiruv hali tugamagan (yoki hali boshlanmagan) */
  loading: boolean;
  /** Tekshiruv tugadi: `user` endi aniq */
  checked: boolean;
  /** Kabinet sahifalari chaqiradi: kirganmi-yo'qmi, albatta tekshirilsin */
  require: () => void;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  verifyTwoFactor: (challenge: string, code: string) => Promise<void>;
  /** Foydalanuvchini serverdan qayta yuklaydi va qaytaradi (rolga qarab yo'naltirish uchun). */
  reloadUser: () => Promise<User | null>;
  register: (input: RegisterInput) => Promise<{ needsParentConsent: boolean }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const started = useRef(false);

  const check = useCallback(() => {
    if (started.current) return;
    started.current = true;
    setStatus("loading");
    api<User>("/auth/me")
      .then((u) => {
        setUser(u);
        setAuthHint(true);
      })
      .catch((e) => {
        if (!(e instanceof ApiError && e.status === 401)) console.error(e);
        setUser(null);
        setAuthHint(false);
      })
      .finally(() => setStatus("done"));
  }, []);

  // Sahifa ochilganda: "kirgan" belgisi bo'lsa — darhol tekshiramiz.
  // Belgi yo'q bo'lsa va sahifa ommaviy bo'lsa — so'rov yuborilmaydi.
  // Kabinet sahifalari require() ni chaqiradi (AuthRequired).
  useEffect(() => {
    if (readHint()) check();
  }, [check]);

  // Sessiya tugadi (boshqa qurilmada chiqildi, token eskirdi): sarlavha
  // "Kirish" ga qaytadi, bildirishnoma so'rovlari to'xtaydi.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setAuthHint(false);
    };
    window.addEventListener("sh-session-expired", onExpired);
    return () => window.removeEventListener("sh-session-expired", onExpired);
  }, []);

  const login = useCallback(async (identifier: string, password: string): Promise<LoginResult> => {
    const res = await api<{ twoFactorRequired?: boolean; challenge?: string; user?: User; mustSetup2fa?: boolean }>(
      "/auth/login",
      { method: "POST", body: { identifier, password } },
    );
    if (res.twoFactorRequired && res.challenge) return { status: "2fa", challenge: res.challenge };
    setUser(res.user ?? null);
    setAuthHint(true);
    started.current = true;
    setStatus("done");
    return { status: "ok", mustSetup2fa: !!res.mustSetup2fa };
  }, []);

  const verifyTwoFactor = useCallback(async (challenge: string, code: string) => {
    const res = await api<{ user: User }>("/auth/2fa/login", { method: "POST", body: { challenge, code } });
    setUser(res.user);
    setAuthHint(true);
    started.current = true;
    setStatus("done");
  }, []);

  const reloadUser = useCallback(async () => {
    const me = await api<User>("/auth/me").catch(() => null);
    setUser(me);
    started.current = true;
    setStatus("done");
    return me;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await api<{ user: User; needsParentConsent: boolean }>("/auth/register", {
      method: "POST",
      body: input,
    });
    setUser(res.user);
    setAuthHint(true);
    started.current = true;
    setStatus("done");
    return { needsParentConsent: res.needsParentConsent };
  }, []);

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    setAuthHint(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading: status !== "done",
      checked: status === "done",
      require: check,
      login, verifyTwoFactor, reloadUser, register, logout,
    }),
    [user, status, check, login, verifyTwoFactor, reloadUser, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth faqat AuthProvider ichida ishlaydi");
  return ctx;
}

/**
 * Kabinet sahifalari uchun: kirganlikni ALBATTA tekshiradi.
 *
 * Nega alohida: ommaviy sahifalarda tekshiruv faqat "kirgan" belgisi
 * bo'lsa boshlanadi. Kabinetda esa belgi bo'lmasa ham (masalan cookie
 * tozalangan) aniq javob kerak, aks holda "loading" abadiy qoladi.
 */
export function AuthRequired() {
  const { require } = useAuth();
  useEffect(() => {
    require();
  }, [require]);
  return null;
}

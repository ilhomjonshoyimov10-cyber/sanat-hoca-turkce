"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setAuthHint } from "@/components/fx/HeaderAuth";
import { api, ApiError } from "./api";

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
  loading: boolean;
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
  const [loading, setLoading] = useState(true);

  // Sahifa ochilganda: kirgan foydalanuvchi bormi?
  useEffect(() => {
    let cancelled = false;
    api<User>("/auth/me")
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setAuthHint(true);
      })
      .catch((e) => {
        if (!(e instanceof ApiError && e.status === 401)) console.error(e);
        if (!cancelled) {
          setUser(null);
          setAuthHint(false);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string): Promise<LoginResult> => {
    const res = await api<{ twoFactorRequired?: boolean; challenge?: string; user?: User; mustSetup2fa?: boolean }>(
      "/auth/login",
      { method: "POST", body: { identifier, password } },
    );
    if (res.twoFactorRequired && res.challenge) return { status: "2fa", challenge: res.challenge };
    setUser(res.user ?? null);
    setAuthHint(true);
    return { status: "ok", mustSetup2fa: !!res.mustSetup2fa };
  }, []);

  const verifyTwoFactor = useCallback(async (challenge: string, code: string) => {
    const res = await api<{ user: User }>("/auth/2fa/login", { method: "POST", body: { challenge, code } });
    setUser(res.user);
    setAuthHint(true);
  }, []);

  const reloadUser = useCallback(async () => {
    const me = await api<User>("/auth/me").catch(() => null);
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await api<{ user: User; needsParentConsent: boolean }>("/auth/register", {
      method: "POST",
      body: input,
    });
    setUser(res.user);
    setAuthHint(true);
    return { needsParentConsent: res.needsParentConsent };
  }, []);

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    setAuthHint(false);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, verifyTwoFactor, reloadUser, register, logout }),
    [user, loading, login, verifyTwoFactor, reloadUser, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth faqat AuthProvider ichida ishlaydi");
  return ctx;
}

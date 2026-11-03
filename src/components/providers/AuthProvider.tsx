"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore } from "@/lib/api";

export interface User { id: number; name: string; email: string; phone: string | null; role: string }
interface Ctx {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (d: { name: string; email: string; phone?: string; password: string; password_confirmation: string }) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) { setUser(null); setReady(true); return; }
    try { setUser((await api<{ user: User }>("/auth/me")).user); }
    catch { tokenStore.set(null); setUser(null); }
    setReady(true);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const value = useMemo<Ctx>(() => ({
    user, ready, refresh,
    login: async (email, password) => {
      const r = await api<{ token: string; user: User }>("/auth/login", { body: { email, password }, token: null });
      tokenStore.set(r.token); setUser(r.user); return r.user;
    },
    register: async (d) => {
      const r = await api<{ token: string; user: User }>("/auth/register", { body: d, token: null });
      tokenStore.set(r.token); setUser(r.user); return r.user;
    },
    logout: async () => {
      try { await api("/auth/logout", { method: "POST" }); } catch {}
      tokenStore.set(null); setUser(null);
    },
  }), [user, ready, refresh]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}

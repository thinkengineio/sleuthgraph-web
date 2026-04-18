"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { apiFetch, apiLogin, UserMe } from "@/lib/api";

interface AuthState {
  user: UserMe | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch("/users/me");
      if (res.ok) {
        const user: UserMe = await res.json();
        setState({ user, loading: false });
      } else {
        setState({ user: null, loading: false });
      }
    } catch {
      setState({ user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    // One-shot data fetch on mount; setState inside async effect is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiLogin(email, password);
      if (res.ok || res.status === 204) {
        await refresh();
        return { ok: true };
      }
      let errorMessage = "Login failed";
      try {
        const body = await res.json();
        errorMessage = body?.detail ?? errorMessage;
      } catch {
        // ignore parse errors
      }
      return { ok: false, error: errorMessage };
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors on logout
    }
    setState({ user: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  isLoggedIn,
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  initializeWithAuthToken,
  getStoredUser,
  AuthError,
  UnverifiedError,
} from "@/lib/sharepool";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthUser {
  email: string | null;
  isAdmin: boolean;
}

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: "unverified" | "invalid" | "error"; message?: string };

export type RegisterResult = { ok: boolean; message?: string };

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  expired: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (email: string, password: string) => Promise<RegisterResult>;
  loginWithAuthToken: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() =>
    isLoggedIn() ? "loading" : "anonymous"
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [expired, setExpired] = useState(false);

  // Hydrate "who am I?" from a stored token on first mount.
  useEffect(() => {
    if (!isLoggedIn()) return;
    let cancelled = false;
    fetchMe()
      .then((me) => {
        if (cancelled) return;
        setUser({ email: me.email, isAdmin: me.isAdmin });
        setStatus("authenticated");
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof AuthError) setExpired(true);
        apiLogout();
        setUser(null);
        setStatus("anonymous");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const ok = await apiLogin(email, password);
      if (!ok) return { ok: false, reason: "invalid" };
      const stored = getStoredUser();
      setUser({ email: stored.email, isAdmin: stored.isAdmin });
      setExpired(false);
      setStatus("authenticated");
      return { ok: true };
    } catch (e) {
      if (e instanceof UnverifiedError) return { ok: false, reason: "unverified" };
      return { ok: false, reason: "error", message: e instanceof Error ? e.message : "Login failed" };
    }
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<RegisterResult> => {
    try {
      await apiRegister(email, password);
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Registration failed" };
    }
  }, []);

  const loginWithAuthToken = useCallback(async (token: string): Promise<boolean> => {
    const ok = await initializeWithAuthToken(token);
    if (ok) {
      setUser({ email: null, isAdmin: true });
      setExpired(false);
      setStatus("authenticated");
    }
    return ok;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setExpired(false);
    setStatus("anonymous");
  }, []);

  const value: AuthContextValue = {
    status, user, expired, login, register, loginWithAuthToken, logout,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

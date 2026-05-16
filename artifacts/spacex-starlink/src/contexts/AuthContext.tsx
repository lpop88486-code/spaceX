import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<{ name: string; phone: string; address: string; password: string; newPassword: string }>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "starlink_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (tok: string) => {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${tok}` },
    });
    if (!res.ok) throw new Error("Invalid session");
    return res.json() as Promise<AuthUser>;
  }, []);

  useEffect(() => {
    const tok = localStorage.getItem(TOKEN_KEY);
    if (!tok) {
      setLoading(false);
      return;
    }
    fetchMe(tok)
      .then((u) => { setUser(u); setToken(tok); })
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setToken(null); })
      .finally(() => setLoading(false));
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem("orbit_email", data.user.email);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem("orbit_email", data.user.email);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: Partial<{ name: string; phone: string; address: string; password: string; newPassword: string }>) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Update failed");
    setUser(json);
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const u = await fetchMe(token);
      setUser(u);
    } catch {}
  }, [token, fetchMe]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export type MallUser = {
  id: number;
  email: string;
  name: string;
  phone?: string;
  grade?: string;
  totalSpent?: number;
  emailNotification?: boolean;
  smsNotification?: boolean;
  marketingEmail?: boolean;
  marketingSms?: boolean;
};

type MallAuthContextValue = {
  user: MallUser | null;
  isAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const MallAuthContext = createContext<MallAuthContextValue | null>(null);

export function MallAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MallUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/mall/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsAdmin(Boolean(data.isAdmin));
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    } catch {
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser, pathname]);

  const logout = async () => {
    try {
      await fetch("/api/mall/auth/logout", { method: "POST" });
      setUser(null);
      setIsAdmin(false);
      router.refresh();
      router.replace("/mall");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <MallAuthContext.Provider value={{ user, isAdmin, loading, refresh: fetchUser, logout }}>
      {children}
    </MallAuthContext.Provider>
  );
}

export function useMallAuth() {
  const ctx = useContext(MallAuthContext);
  if (!ctx) throw new Error("useMallAuth must be used within MallAuthProvider");
  return ctx;
}

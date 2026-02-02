"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMallAuth } from "@/components/mall/auth/MallAuthProvider";

export type MallCartItem = {
  productId: string;
  quantity: number;
  nameSnapshot: string;
  priceSnapshot: number;
  imageSnapshot?: string;
  skuSnapshot?: string;
};

type MallCartContextValue = {
  items: MallCartItem[];
  addItem: (item: Omit<MallCartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalQuantity: number;
  subtotal: number;
};

const MallCartContext = createContext<MallCartContextValue | null>(null);

function getStorageKey(userId?: number) {
  return userId ? `kproject_mall_cart_user_${userId}` : "kproject_mall_cart_guest";
}

function clampInt(n: number, min: number, max: number) {
  const v = Math.floor(Number.isFinite(n) ? n : 0);
  return Math.min(max, Math.max(min, v));
}

export function MallCartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useMallAuth();
  const [items, setItems] = useState<MallCartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 사용자별 장바구니 로드
  useEffect(() => {
    const storageKey = getStorageKey(user?.id);
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setItems([]);
        setIsInitialized(true);
        return;
      }
      const parsed = JSON.parse(raw) as MallCartItem[];
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {
      setItems([]);
    } finally {
      setIsInitialized(true);
    }
  }, [user?.id]);

  // 사용자별 장바구니 저장
  useEffect(() => {
    if (!isInitialized) return;
    const storageKey = getStorageKey(user?.id);
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, user?.id, isInitialized]);

  const value = useMemo<MallCartContextValue>(() => {
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0);

    return {
      items,
      totalQuantity,
      subtotal,
      addItem: (item, quantity = 1) => {
        const q = clampInt(quantity, 1, 999);
        setItems((prev) => {
          const idx = prev.findIndex((p) => p.productId === item.productId);
          if (idx === -1) return [...prev, { ...item, quantity: q }];
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: clampInt(next[idx].quantity + q, 1, 999) };
          return next;
        });
      },
      removeItem: (productId) => {
        setItems((prev) => prev.filter((p) => p.productId !== productId));
      },
      setQuantity: (productId, quantity) => {
        const q = clampInt(quantity, 1, 999);
        setItems((prev) => prev.map((p) => (p.productId === productId ? { ...p, quantity: q } : p)));
      },
      clear: () => setItems([]),
    };
  }, [items]);

  return <MallCartContext.Provider value={value}>{children}</MallCartContext.Provider>;
}

export function useMallCart() {
  const ctx = useContext(MallCartContext);
  if (!ctx) throw new Error("useMallCart must be used within MallCartProvider");
  return ctx;
}

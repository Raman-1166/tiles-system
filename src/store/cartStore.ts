"use client";

import { create } from "zustand";

type CartState = {
  count: number;
  totalCents: number;
  hydrated: boolean;
  setFromResponse: (data: { count: number; totalCents: number }) => void;
  refresh: () => Promise<void>;
};

export const useCartStore = create<CartState>((set) => ({
  count: 0,
  totalCents: 0,
  hydrated: false,
  setFromResponse: (data) => set({ count: data.count, totalCents: data.totalCents, hydrated: true }),
  refresh: async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      const data = await res.json();
      set({ count: data.count ?? 0, totalCents: data.totalCents ?? 0, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));

"use client";

import { create } from "zustand";

export type CartLineProduct = {
  id: number;
  name: string;
  slug: string;
  priceCents: number;
  unit: string;
  imageUrl?: string | null;
  category?: { name: string; slug: string } | null;
};

export type CartLineItem = {
  id: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  variant: string | null;
  meta?: Record<string, unknown> | null;
  product: CartLineProduct;
};

export type ToastMessage = {
  id: string;
  message: string;
  type: "success" | "info" | "error";
};

type CartState = {
  count: number;
  totalCents: number;
  lines: CartLineItem[];
  hydrated: boolean;
  isOpen: boolean;
  toast: ToastMessage | null;
  openMiniCart: () => void;
  closeMiniCart: () => void;
  toggleMiniCart: () => void;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  hideToast: () => void;
  setFromResponse: (data: { count: number; totalCents: number; lines?: CartLineItem[] }) => void;
  refresh: () => Promise<void>;
  updateQuantity: (lineId: number, quantity: number) => Promise<void>;
  removeItem: (lineId: number) => Promise<void>;
};

let toastTimeout: NodeJS.Timeout | null = null;

export const useCartStore = create<CartState>((set, get) => ({
  count: 0,
  totalCents: 0,
  lines: [],
  hydrated: false,
  isOpen: false,
  toast: null,

  openMiniCart: () => {
    // If opening and lines haven't been fetched yet, refresh
    if (get().lines.length === 0 && get().count > 0) {
      get().refresh();
    }
    set({ isOpen: true });
  },

  closeMiniCart: () => set({ isOpen: false }),

  toggleMiniCart: () => {
    const next = !get().isOpen;
    if (next && get().lines.length === 0 && get().count > 0) {
      get().refresh();
    }
    set({ isOpen: next });
  },

  showToast: (message, type = "success") => {
    if (toastTimeout) clearTimeout(toastTimeout);
    const id = `toast_${Date.now()}`;
    set({ toast: { id, message, type } });
    toastTimeout = setTimeout(() => {
      set({ toast: null });
    }, 3500);
  },

  hideToast: () => {
    if (toastTimeout) clearTimeout(toastTimeout);
    set({ toast: null });
  },

  setFromResponse: (data) =>
    set((state) => ({
      count: data.count,
      totalCents: data.totalCents,
      lines: data.lines ?? state.lines,
      hydrated: true,
    })),

  refresh: async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      const data = await res.json();
      set({
        count: data.count ?? 0,
        totalCents: data.totalCents ?? 0,
        lines: Array.isArray(data.lines) ? data.lines : [],
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  updateQuantity: async (lineId, quantity) => {
    try {
      const res = await fetch(`/api/cart/${lineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (data.ok) {
        await get().refresh();
      }
    } catch (err) {
      console.error("Failed to update cart line quantity:", err);
    }
  },

  removeItem: async (lineId) => {
    try {
      const res = await fetch(`/api/cart/${lineId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        await get().refresh();
        get().showToast("Item removed from cart", "info");
      }
    } catch (err) {
      console.error("Failed to remove cart line:", err);
    }
  },
}));

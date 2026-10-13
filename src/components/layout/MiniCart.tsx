"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { formatMoney } from "@/lib/money";
import { SAMPLE_SWATCH_PRICE_CENTS } from "@/config/commerce";

export function MiniCart() {
  const { isOpen, closeMiniCart, lines, count, totalCents, updateQuantity, removeItem } =
    useCartStore();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on ESC key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        closeMiniCart();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeMiniCart]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart Drawer"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeMiniCart}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-md border-l border-stone-200 bg-[#faf7f0] shadow-2xl flex flex-col justify-between"
        >
          {/* Header */}
          <div className="border-b border-stone-200 bg-[#f4efe4] px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="font-serif text-lg font-medium text-stone-900">Shopping Bag</h2>
              <span className="rounded-full bg-stone-900 px-2 py-0.5 text-xs font-semibold text-white">
                {count} {count === 1 ? "item" : "items"}
              </span>
            </div>
            <button
              onClick={closeMiniCart}
              aria-label="Close cart drawer"
              className="rounded-full p-2 text-stone-500 hover:bg-stone-200/60 hover:text-stone-900 transition-colors"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-stone-200">
            {lines.length === 0 ? (
              <div className="py-20 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-200 text-stone-600">
                  <svg
                    aria-hidden="true"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 font-serif text-lg font-medium text-stone-900">
                  Your bag is empty
                </h3>
                <p className="mt-1 text-xs text-stone-500 max-w-xs mx-auto">
                  Explore our handcrafted architectural tiles and 3D room visualizer to start your
                  project.
                </p>
                <Link
                  href="/shop"
                  onClick={closeMiniCart}
                  className="mt-6 inline-block rounded-full bg-stone-900 px-6 py-2.5 text-xs font-semibold text-white hover:bg-stone-700 transition"
                >
                  Explore Collection
                </Link>
              </div>
            ) : (
              lines.map((line) => {
                const isSample = Boolean(
                  line.meta && (line.meta as Record<string, unknown>).isSample
                );
                const unitPriceCents = isSample
                  ? SAMPLE_SWATCH_PRICE_CENTS
                  : line.product.priceCents;

                return (
                  <div key={line.id} className="py-4 flex gap-4 items-start">
                    {/* Thumbnail / Product info */}
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white p-1 shadow-2xs">
                      <span className="font-serif text-xs font-bold text-stone-400">
                        {line.product.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/shop`}
                          onClick={closeMiniCart}
                          className="truncate text-sm font-semibold text-stone-900 hover:underline"
                        >
                          {line.product.name}
                        </Link>
                        <button
                          onClick={() => removeItem(line.id)}
                          aria-label={`Remove ${line.product.name}`}
                          className="text-stone-400 hover:text-red-600 transition-colors text-xs"
                        >
                          ✕
                        </button>
                      </div>

                      {isSample ? (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                            Sample Swatch (10×10 cm)
                          </span>
                        </div>
                      ) : (
                        line.variant && (
                          <p className="mt-0.5 text-xs text-stone-500">
                            Finish / Shade:{" "}
                            <span className="font-medium text-stone-700">{line.variant}</span>
                          </p>
                        )
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        {/* Quantity Controls */}
                        <div className="flex items-center rounded-md border border-stone-300 bg-white shadow-2xs">
                          <button
                            onClick={() => updateQuantity(line.id, Math.max(1, line.quantity - 1))}
                            disabled={line.quantity <= 1}
                            aria-label="Decrease quantity"
                            className="px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-100 disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="px-2 text-xs font-medium text-stone-900">
                            {line.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(line.id, line.quantity + 1)}
                            aria-label="Increase quantity"
                            className="px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-100"
                          >
                            +
                          </button>
                        </div>

                        {/* Line Price */}
                        <span className="text-sm font-semibold text-stone-900">
                          {formatMoney(line.quantity * unitPriceCents)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {lines.length > 0 && (
            <div className="border-t border-stone-200 bg-[#f4efe4] p-6 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Subtotal
                </span>
                <span className="font-serif text-2xl font-semibold text-stone-900">
                  {formatMoney(totalCents)}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 leading-tight">
                Pallet freight, wastage allowance, and local taxes calculated at checkout.
              </p>

              {lines.some((l) =>
                Boolean(l.meta && (l.meta as Record<string, unknown>).isSample)
              ) && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-[11px] text-amber-900 flex items-center gap-2">
                  <span>✨</span>
                  <span>
                    Each sample includes <strong>$25 studio credit</strong> toward your future tile
                    crate order.
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={closeMiniCart}
                  className="block w-full rounded-full bg-stone-900 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-stone-700 transition"
                >
                  Checkout Now →
                </Link>
                <Link
                  href="/cart"
                  onClick={closeMiniCart}
                  className="block w-full rounded-full border border-stone-300 bg-white py-2.5 text-center text-xs font-semibold text-stone-800 shadow-2xs hover:bg-stone-50 transition"
                >
                  View Full Cart &amp; Wastage Math
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

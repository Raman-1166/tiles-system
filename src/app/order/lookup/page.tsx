"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OrderLookupPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/order/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Order lookup failed");
      }

      // Forward to secure token-bearing order page
      router.push(`/order/${data.order.orderNumber}?token=${encodeURIComponent(data.token)}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 py-16 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-8 shadow-md">
        <h1 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-100 mb-2">
          Track Your Order
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
          Enter your Clay & Co. order number and the email address used during checkout.
        </p>

        {error && (
          <div className="p-4 mb-6 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
              Order Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CLAY-28491ABC"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 dark:bg-amber-600 dark:hover:bg-amber-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center shadow-sm"
          >
            {loading ? "Searching..." : "Look Up Order"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-700 text-center">
          <Link
            href="/shop"
            className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
          >
            ← Return to Store
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function MockPayPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = (params?.orderNumber as string) || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulatePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dev/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Payment simulation failed");
      }

      // Redirect to secure order confirmation page
      router.push(data.redirectUrl || `/order/${orderNumber}?token=${data.token}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-xl p-8 shadow-2xl">
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 mb-4 border border-amber-500/30">
          Developer Mock Payment Gateway
        </div>

        <h1 className="text-2xl font-serif text-stone-100 mb-2">Simulate Checkout Payment</h1>
        <p className="text-sm text-stone-400 mb-6">
          Order Number: <strong className="text-stone-200">{orderNumber}</strong>
        </p>

        {error && (
          <div className="p-4 mb-6 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleSimulatePayment}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center shadow-lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processing Payment...
              </span>
            ) : (
              "Simulate Successful Payment (Authorize & Capture)"
            )}
          </button>

          <Link
            href="/checkout"
            className="block text-center w-full py-3 px-4 bg-stone-700/50 hover:bg-stone-700 text-stone-300 rounded-lg text-sm transition-colors"
          >
            Cancel and Return to Checkout
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-stone-700/50 text-xs text-stone-500 space-y-1">
          <p>• Only active in development (`PAYMENT_PROVIDER=mock`).</p>
          <p>• Triggers atomic stock decrement, payment capture, and order events.</p>
        </div>
      </div>
    </div>
  );
}

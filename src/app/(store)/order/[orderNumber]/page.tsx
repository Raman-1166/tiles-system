"use client";

import React, { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/money";

interface OrderPageProps {
  params: Promise<{ orderNumber: string }>;
}

export default function OrderPage({ params }: OrderPageProps) {
  const resolvedParams = use(params);
  const orderNumber = resolvedParams.orderNumber;
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!token) {
      setError(
        "No access token provided. Please use the secure link from your email or lookup your order."
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/order/${orderNumber}?token=${encodeURIComponent(token)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to load order");
      }

      setOrder(data.order);
      setItems(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderNumber, token]);

  // Auto-refresh while payment is pending
  useEffect(() => {
    if (!order || order.paymentStatus !== "pending") return;

    const interval = setInterval(() => {
      fetchOrder();
    }, 3000);

    return () => clearInterval(interval);
  }, [order?.paymentStatus, orderNumber, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-stone-600 dark:text-stone-300">
          <svg className="animate-spin h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24">
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
          <span className="font-medium">Loading your order details...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-8 text-center shadow-lg">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            ✕
          </div>
          <h1 className="text-xl font-serif text-stone-900 dark:text-stone-100 mb-2">
            Order Not Available
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">{error}</p>
          <Link
            href="/order/lookup"
            className="inline-block px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Look up with Order # & Email
          </Link>
        </div>
      </div>
    );
  }

  const shipping = order.shippingAddress;
  const isPaid = order.paymentStatus === "paid";
  const isPending = order.paymentStatus === "pending";

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Order Header */}
        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-700">
            <div>
              <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                Order Confirmation
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 dark:text-stone-100 font-medium mt-1">
                {order.orderNumber}
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })}
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  isPaid
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                }`}
              >
                {isPaid ? "✓ Payment Confirmed" : "⏳ Payment Processing..."}
              </span>
              <span className="text-xs text-stone-500">
                Fulfillment: <strong className="capitalize">{order.fulfillmentStatus}</strong>
              </span>
            </div>
          </div>

          {isPending && (
            <div className="mt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center gap-3 text-amber-800 dark:text-amber-200 text-sm">
              <svg
                className="animate-spin h-5 w-5 text-amber-600 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
              >
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
              <span>
                We are awaiting payment confirmation from your payment provider. This page will
                update automatically.
              </span>
            </div>
          )}

          {/* Items Summary */}
          <div className="mt-8 space-y-4">
            <h2 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
              Ordered Items
            </h2>
            <div className="divide-y divide-stone-100 dark:divide-stone-700/50 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50 dark:bg-stone-800/50"
                >
                  <div>
                    <h3 className="font-medium text-stone-900 dark:text-stone-100">{item.name}</h3>
                    <p className="text-xs text-stone-500">
                      SKU: {item.sku} • Qty: {item.quantity}
                    </p>
                    {item.meta && (
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-stone-500 dark:text-stone-400">
                        {item.meta.layout && (
                          <span>
                            Layout: <strong>{String(item.meta.layout)}</strong>
                          </span>
                        )}
                        {item.meta.grout && (
                          <span>
                            Grout: <strong>{String(item.meta.grout)}</strong>
                          </span>
                        )}
                        {item.meta.area && (
                          <span>
                            Area: <strong>{String(item.meta.area)} m²</strong>
                          </span>
                        )}
                        {item.meta.room && (
                          <span>
                            Room: <strong>{String(item.meta.room)}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-stone-900 dark:text-stone-100">
                      {formatMoney(item.unitPriceCents * item.quantity, order.currency)}
                    </span>
                    <p className="text-xs text-stone-400">
                      {formatMoney(item.unitPriceCents, order.currency)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Delivery Address */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-stone-200 dark:border-stone-700">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Delivery Address
              </h3>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                {shipping?.name}
              </p>
              <p className="text-sm text-stone-600 dark:text-stone-400">{shipping?.line1}</p>
              {shipping?.line2 && (
                <p className="text-sm text-stone-600 dark:text-stone-400">{shipping.line2}</p>
              )}
              <p className="text-sm text-stone-600 dark:text-stone-400">
                {shipping?.city}, {shipping?.region} {shipping?.postalCode}
              </p>
              <p className="text-sm text-stone-600 dark:text-stone-400">{shipping?.country}</p>
              <p className="text-xs text-stone-400 mt-2">
                Shipping: {order.shippingMethod} delivery
              </p>
            </div>

            <div className="space-y-2 bg-stone-50 dark:bg-stone-900/40 p-4 rounded-lg border border-stone-200 dark:border-stone-700/50">
              <div className="flex justify-between text-sm text-stone-600 dark:text-stone-400">
                <span>Subtotal</span>
                <span>{formatMoney(order.subtotalCents, order.currency)}</span>
              </div>
              <div className="flex justify-between text-sm text-stone-600 dark:text-stone-400">
                <span>Shipping</span>
                <span>
                  {order.shippingCents === 0
                    ? "Free"
                    : formatMoney(order.shippingCents, order.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-stone-600 dark:text-stone-400">
                <span>Estimated Sales Tax</span>
                <span>{formatMoney(order.taxCents, order.currency)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-stone-900 dark:text-stone-100 pt-2 border-t border-stone-200 dark:border-stone-700">
                <span>Total</span>
                <span>{formatMoney(order.totalCents, order.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/shop"
            className="text-sm text-amber-700 dark:text-amber-400 hover:underline font-medium"
          >
            ← Return to Clay & Co. Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}

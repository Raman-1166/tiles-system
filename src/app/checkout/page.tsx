"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TileImage } from "@/components/tiles/TileImage";
import { FurnitureImage } from "@/components/furniture/FurnitureImage";
import type { Product } from "@/db/schema";

type CartLine = {
  id: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  variant: string | null;
  meta?: Record<string, any> | null;
  product: Product;
};

interface OrderResult {
  orderNumber: string;
  totalCents: number;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  itemCount: number;
  createdAt: string;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function CheckoutPage() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  // Initialize idempotency key once per page session
  useEffect(() => {
    setIdempotencyKey(
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    );
  }, []);

  // Form fields
  const [form, setForm] = useState({
    firstName: "Alex",
    lastName: "Taylor",
    email: "alex.taylor@example.com",
    phone: "+1 (555) 234-5678",
    line1: "742 Evergreen Terrace",
    line2: "Apt 4B",
    city: "San Francisco",
    region: "CA",
    postalCode: "94107",
    country: "US",
    shippingMethod: "standard", // "standard" | "express"
    cardNumber: "•••• •••• •••• 4242",
    cardExp: "12/28",
    cardCvc: "888",
  });

  useEffect(() => {
    async function fetchCart() {
      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        const data = await res.json();
        setLines(data.lines || []);
      } catch {
        setLines([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCart();
  }, []);

  const subtotalCents = lines.reduce((acc, l) => acc + l.quantity * l.product.priceCents, 0);
  const shippingCents = form.shippingMethod === "express" ? 2500 : 0;
  const taxCents = Math.round(subtotalCents * 0.08);
  const totalCents = subtotalCents + shippingCents + taxCents;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // Prevent double submit
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          phone: form.phone,
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          region: form.region,
          postalCode: form.postalCode,
          country: form.country,
          shippingMethod: form.shippingMethod,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
        if (data.orderNumber) {
          window.location.href = `/order/${data.orderNumber}?token=${encodeURIComponent(data.token || "")}`;
          return;
        }
      } else {
        setErrorMessage(data?.error?.message || "Unable to complete order.");
        setSubmitting(false);
      }
    } catch {
      setErrorMessage("Something went wrong communicating with checkout. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#E4E8E3] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-800 border-t-transparent" />
          <p className="text-stone-600 text-sm font-medium">Preparing checkout…</p>
        </div>
      </main>
    );
  }

  // Empty cart view
  if (lines.length === 0) {
    return (
      <main className="min-h-screen bg-[#E4E8E3] flex items-center justify-center p-6">
        <div className="rounded-3xl bg-[#F6F4EE] p-12 text-center shadow-sm max-w-md border border-stone-200">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-200/80 text-stone-600">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#14262B] mb-2">Your cart is empty</h1>
          <p className="text-stone-500 text-sm mb-6">
            Add items from our tile or furniture collections before checking out.
          </p>
          <Link
            href="/shop"
            className="inline-block rounded-full bg-[#14262B] px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700 transition"
          >
            Browse Products →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#E4E8E3] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <nav className="mb-2 flex items-center gap-2 text-xs font-medium text-stone-500">
              <Link href="/cart" className="hover:text-stone-900 transition">
                ← Back to Cart
              </Link>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#14262B] tracking-tight">
              Express Checkout
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-stone-900/5 px-3 py-1.5 text-xs text-stone-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            256-bit Encrypted Checkout
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Left Form Column (7 cols) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
            {errorMessage && (
              <div className="rounded-xl bg-red-100 border border-red-300 p-4 text-sm text-red-800 font-medium">
                {errorMessage}
              </div>
            )}
            {/* Contact Details */}
            <div className="rounded-2xl bg-[#F6F4EE] p-6 sm:p-7 shadow-sm border border-stone-200/80">
              <h2 className="text-lg font-bold text-[#14262B] mb-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#14262B] text-white text-xs font-bold">
                  1
                </span>
                Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-[#14262B] shadow-sm focus:border-[#0F6B6B] focus:outline-none focus:ring-1 focus:ring-[#0F6B6B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-[#14262B] shadow-sm focus:border-[#0F6B6B] focus:outline-none focus:ring-1 focus:ring-[#0F6B6B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-[#14262B] shadow-sm focus:border-[#0F6B6B] focus:outline-none focus:ring-1 focus:ring-[#0F6B6B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-[#14262B] shadow-sm focus:border-[#0F6B6B] focus:outline-none focus:ring-1 focus:ring-[#0F6B6B]"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="rounded-2xl bg-[#F6F4EE] p-6 sm:p-7 shadow-sm border border-stone-200/80">
              <h2 className="text-lg font-bold text-[#14262B] mb-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#14262B] text-white text-xs font-bold">
                  2
                </span>
                Shipping Address
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    value={form.line1}
                    onChange={(e) => setForm({ ...form, line1: e.target.value })}
                    placeholder="123 Main St"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-[#14262B] shadow-sm focus:border-[#0F6B6B] focus:outline-none focus:ring-1 focus:ring-[#0F6B6B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Apartment, Suite, Unit (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.line2}
                    onChange={(e) => setForm({ ...form, line2: e.target.value })}
                    placeholder="Apt 4B"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-[#14262B] shadow-sm focus:border-[#0F6B6B] focus:outline-none focus:ring-1 focus:ring-[#0F6B6B]"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-[#14262B] shadow-sm focus:border-[#0F6B6B] focus:outline-none focus:ring-1 focus:ring-[#0F6B6B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      State / Province
                    </label>
                    <input
                      type="text"
                      required
                      value={form.region}
                      onChange={(e) => setForm({ ...form, region: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-[#14262B] shadow-sm focus:border-[#0F6B6B] focus:outline-none focus:ring-1 focus:ring-[#0F6B6B]"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      required
                      value={form.postalCode}
                      onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-[#14262B] shadow-sm focus:border-[#0F6B6B] focus:outline-none focus:ring-1 focus:ring-[#0F6B6B]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Method */}
            <div className="rounded-2xl bg-[#F6F4EE] p-6 sm:p-7 shadow-sm border border-stone-200/80">
              <h2 className="text-lg font-bold text-[#14262B] mb-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#14262B] text-white text-xs font-bold">
                  3
                </span>
                Delivery Method
              </h2>
              <div className="space-y-3">
                <label
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                    form.shippingMethod === "standard"
                      ? "border-[#14262B] bg-white ring-1 ring-[#14262B]"
                      : "border-stone-300 bg-white/60 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={form.shippingMethod === "standard"}
                      onChange={() => setForm({ ...form, shippingMethod: "standard" })}
                      className="accent-[#14262B]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#14262B]">
                        Standard Fragile Freight
                      </p>
                      <p className="text-xs text-stone-500">
                        Delivered carefully in 3–5 business days
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">FREE</span>
                </label>

                <label
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                    form.shippingMethod === "express"
                      ? "border-[#14262B] bg-white ring-1 ring-[#14262B]"
                      : "border-stone-300 bg-white/60 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={form.shippingMethod === "express"}
                      onChange={() => setForm({ ...form, shippingMethod: "express" })}
                      className="accent-[#14262B]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#14262B]">
                        Express Architectural Priority
                      </p>
                      <p className="text-xs text-stone-500">
                        Scheduled 1–2 business day liftgate delivery
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-stone-800">$25.00</span>
                </label>
              </div>
            </div>

            {/* Payment Details */}
            <div className="rounded-2xl bg-[#F6F4EE] p-6 sm:p-7 shadow-sm border border-stone-200/80">
              <h2 className="text-lg font-bold text-[#14262B] mb-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#14262B] text-white text-xs font-bold">
                  4
                </span>
                Payment
              </h2>
              <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    required
                    value={form.cardNumber}
                    onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-[#14262B] focus:border-[#0F6B6B] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      Expiration Date
                    </label>
                    <input
                      type="text"
                      required
                      value={form.cardExp}
                      onChange={(e) => setForm({ ...form, cardExp: e.target.value })}
                      placeholder="MM/YY"
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-[#14262B] focus:border-[#0F6B6B] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      Security Code (CVC)
                    </label>
                    <input
                      type="text"
                      required
                      value={form.cardCvc}
                      onChange={(e) => setForm({ ...form, cardCvc: e.target.value })}
                      placeholder="CVC"
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-[#14262B] focus:border-[#0F6B6B] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#14262B] py-4 text-base font-semibold text-white shadow-md transition hover:bg-[#0F6B6B] hover:shadow-lg disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Processing Secure Order…</span>
                  </>
                ) : (
                  <>
                    <span>Place Order · {formatCurrency(totalCents)}</span>
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right Summary Column (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
            <div className="rounded-2xl bg-[#F6F4EE] p-6 sm:p-7 shadow-sm border border-stone-200/80">
              <h2 className="text-lg font-bold text-[#14262B] mb-4">
                Order Summary ({lines.length} {lines.length === 1 ? "item" : "items"})
              </h2>

              {/* Items List */}
              <div className="divide-y divide-stone-200/80 max-h-[380px] overflow-y-auto pr-1 space-y-3">
                {lines.map((line) => {
                  const isTile = Boolean(
                    line.product.tileSizeCm ||
                    line.product.visualizerColor ||
                    line.product.pattern ||
                    line.product.tileType ||
                    line.product.groutColor ||
                    line.product.tileLayout
                  );

                  return (
                    <div key={line.id} className="pt-3 first:pt-0 flex gap-3.5 items-start">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white border border-stone-200 shadow-xs">
                        {isTile ? (
                          <TileImage
                            product={line.product}
                            variant="closeup"
                            size={64}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FurnitureImage
                            product={line.product}
                            colour={line.variant || undefined}
                            size={64}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#14262B] leading-tight truncate">
                          {line.product.name}
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Qty: {line.quantity} · {formatCurrency(line.product.priceCents)} ea
                        </p>

                        {/* Visualizer customization chips */}
                        {line.meta && (
                          <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                            {line.meta.room && (
                              <span className="rounded bg-[#E4E8E3] px-1.5 py-0.5 text-[#14262B] capitalize">
                                {String(line.meta.room)}
                              </span>
                            )}
                            {line.meta.layout && (
                              <span className="rounded bg-[#E4E8E3] px-1.5 py-0.5 text-[#14262B] capitalize">
                                {String(line.meta.layout)}
                              </span>
                            )}
                            {line.meta.grout && (
                              <span className="inline-flex items-center gap-1 rounded bg-[#E4E8E3] px-1.5 py-0.5 text-[#14262B]">
                                <span
                                  className="h-2 w-2 rounded-full border border-black/20"
                                  style={{ backgroundColor: String(line.meta.grout) }}
                                />
                                Grout
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right font-medium text-sm text-[#14262B] shrink-0">
                        {formatCurrency(line.quantity * line.product.priceCents)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="mt-6 border-t border-stone-200 pt-4 space-y-2 text-sm text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#14262B]">
                    {formatCurrency(subtotalCents)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium text-[#14262B]">
                    {shippingCents === 0 ? "FREE" : formatCurrency(shippingCents)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span className="font-medium text-[#14262B]">{formatCurrency(taxCents)}</span>
                </div>
                <div className="border-t border-stone-200 pt-3 flex justify-between text-base font-bold text-[#14262B]">
                  <span>Total</span>
                  <span>{formatCurrency(totalCents)}</span>
                </div>
              </div>
            </div>

            {/* Satisfaction Guarantee card */}
            <div className="rounded-2xl border border-stone-200 bg-white/70 p-4 text-xs text-stone-600 space-y-1.5 backdrop-blur-sm">
              <p className="font-semibold text-[#14262B]">🏺 Clay &amp; Co. Guarantee</p>
              <p>
                Every ceramic batch is kiln-inspected and cushioned in 100% recyclable molded fiber.
                Free 30-day returns on all catalog finishes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

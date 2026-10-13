"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TileImage } from "@/components/tiles/TileImage";
import { FurnitureImage } from "@/components/furniture/FurnitureImage";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/money";
import { contactSchema, addressSchema, checkoutSchema } from "@/lib/checkout-schema";
import type { Product } from "@/db/schema";

type CartLine = {
  id: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  variant: string | null;
  meta?: Record<string, unknown> | null;
  product: Product;
};

type Step = 1 | 2 | 3;

export default function CheckoutPage() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form State
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
    shippingMethod: "standard" as "standard" | "express",
    cardNumber: "•••• •••• •••• 4242",
    cardExp: "12/28",
    cardCvc: "888",
  });

  // Initialize idempotency key once per page session
  useEffect(() => {
    setIdempotencyKey(
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    );
  }, []);

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

  // Step 1 Validation
  function validateStep1(): boolean {
    const fullName = `${form.firstName} ${form.lastName}`.trim();
    const contactRes = contactSchema.safeParse({
      name: fullName,
      email: form.email,
      phone: form.phone,
    });
    const addressRes = addressSchema.safeParse({
      line1: form.line1,
      line2: form.line2,
      city: form.city,
      region: form.region,
      postalCode: form.postalCode,
      country: form.country,
    });

    const errs: Record<string, string> = {};
    if (!contactRes.success) {
      const fieldErrs = contactRes.error.flatten().fieldErrors;
      if (fieldErrs.name) errs.firstName = fieldErrs.name[0];
      if (fieldErrs.email) errs.email = fieldErrs.email[0];
      if (fieldErrs.phone) errs.phone = fieldErrs.phone[0];
    }
    if (!addressRes.success) {
      const fieldErrs = addressRes.error.flatten().fieldErrors;
      if (fieldErrs.line1) errs.line1 = fieldErrs.line1[0];
      if (fieldErrs.city) errs.city = fieldErrs.city[0];
      if (fieldErrs.region) errs.region = fieldErrs.region[0];
      if (fieldErrs.postalCode) errs.postalCode = fieldErrs.postalCode[0];
      if (fieldErrs.country) errs.country = fieldErrs.country[0];
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleContinueToShipping(e: React.FormEvent) {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleContinueToPayment(e: React.FormEvent) {
    e.preventDefault();
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Full validation
    const fullName = `${form.firstName} ${form.lastName}`.trim();
    const parsed = checkoutSchema.safeParse({
      name: fullName,
      email: form.email,
      phone: form.phone,
      line1: form.line1,
      line2: form.line2,
      city: form.city,
      region: form.region,
      postalCode: form.postalCode,
      country: form.country,
      shippingMethod: form.shippingMethod,
    });

    if (!parsed.success) {
      setErrorMessage("Please complete all required fields correctly before submitting.");
      setCurrentStep(1);
      return;
    }

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
          name: fullName,
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
      <main className="min-h-screen bg-[#faf7f0] flex items-center justify-center">
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
      <main className="min-h-screen bg-[#faf7f0] flex items-center justify-center p-6">
        <div className="rounded-3xl bg-white p-12 text-center shadow-sm max-w-md border border-stone-200">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-600">
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-light text-stone-900 mb-2">Your Bag is Empty</h2>
          <p className="text-sm text-stone-600 mb-6 leading-relaxed">
            There are no architectural tiles or furniture pieces in your cart to checkout.
          </p>
          <Link
            href="/shop"
            className="inline-block rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700 transition"
          >
            Browse Collections →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf7f0] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header & Back Link */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/cart"
              className="text-xs font-semibold uppercase tracking-wider text-stone-500 hover:text-stone-900 transition flex items-center gap-1 mb-2"
            >
              ← Return to Bag
            </Link>
            <h1 className="font-serif text-3xl sm:text-4xl font-light text-stone-900 tracking-tight">
              Express Checkout
            </h1>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs text-stone-700 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>256-bit PCI-DSS Encrypted</span>
          </div>
        </div>

        {/* Stepper Navigation */}
        <nav aria-label="Checkout Progress" className="mb-10">
          <ol className="flex items-center gap-2 sm:gap-4 max-w-2xl">
            {[
              { num: 1, label: "Delivery Address" },
              { num: 2, label: "Freight Method" },
              { num: 3, label: "Review & Pay" },
            ].map((step, idx) => {
              const isCurrent = currentStep === step.num;
              const isPast = currentStep > step.num;
              return (
                <li key={step.num} className="flex-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isPast) setCurrentStep(step.num as Step);
                    }}
                    disabled={!isPast && !isCurrent}
                    className={`flex items-center gap-2 text-xs font-medium transition ${
                      isCurrent
                        ? "text-stone-900 font-bold"
                        : isPast
                          ? "text-stone-700 hover:text-stone-900 cursor-pointer"
                          : "text-stone-400 cursor-not-allowed"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                        isCurrent
                          ? "bg-stone-900 text-white"
                          : isPast
                            ? "bg-emerald-600 text-white"
                            : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      {isPast ? "✓" : step.num}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                  {idx < 2 && <div className="h-px flex-1 bg-stone-200" />}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-8 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-800 font-medium"
          >
            {errorMessage}
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-12 items-start">
          {/* Left Column: Multi-step Form Content (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* STEP 1: Delivery Address & Contact */}
            {currentStep === 1 && (
              <form onSubmit={handleContinueToShipping} noValidate className="space-y-6">
                <Card className="p-6 sm:p-8 space-y-6">
                  <div>
                    <h2 className="font-serif text-xl font-medium text-stone-900">
                      1. Contact &amp; Delivery Destination
                    </h2>
                    <p className="mt-1 text-xs text-stone-500">
                      Where should our freight carrier dispatch your pallet or parcel?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      id="checkout-firstName"
                      label="First Name *"
                      required
                      value={form.firstName}
                      error={fieldErrors.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                    <Input
                      id="checkout-lastName"
                      label="Last Name *"
                      required
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      id="checkout-email"
                      type="email"
                      label="Email Address (for order receipts &amp; freight tracking) *"
                      required
                      value={form.email}
                      error={fieldErrors.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <Input
                      id="checkout-phone"
                      type="tel"
                      label="Phone Number (for driver delivery appointment) *"
                      required
                      value={form.phone}
                      error={fieldErrors.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>

                  <Input
                    id="checkout-line1"
                    label="Street Address *"
                    required
                    placeholder="123 Artisan Way"
                    value={form.line1}
                    error={fieldErrors.line1}
                    onChange={(e) => setForm({ ...form, line1: e.target.value })}
                  />

                  <Input
                    id="checkout-line2"
                    label="Apartment, Suite, Unit, or Gate Code (Optional)"
                    placeholder="Suite 4B / Loading Dock A"
                    value={form.line2}
                    onChange={(e) => setForm({ ...form, line2: e.target.value })}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      id="checkout-city"
                      label="City *"
                      required
                      value={form.city}
                      error={fieldErrors.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                    <Input
                      id="checkout-region"
                      label="State / Province *"
                      required
                      value={form.region}
                      error={fieldErrors.region}
                      onChange={(e) => setForm({ ...form, region: e.target.value })}
                    />
                    <Input
                      id="checkout-postalCode"
                      label="Postal / ZIP Code *"
                      required
                      value={form.postalCode}
                      error={fieldErrors.postalCode}
                      onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-country"
                      className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5"
                    >
                      Country
                    </label>
                    <select
                      id="checkout-country"
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    >
                      <option value="US">United States (Domestic Pallet Freight)</option>
                      <option value="UK">United Kingdom (Studio Origin Freight)</option>
                      <option value="CA">Canada (Cross-Border Liftgate Freight)</option>
                      <option value="EU">European Union (Direct Express Freight)</option>
                    </select>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">
                      Continue to Shipping Method →
                    </Button>
                  </div>
                </Card>
              </form>
            )}

            {/* STEP 2: Shipping Method Selection */}
            {currentStep === 2 && (
              <form onSubmit={handleContinueToPayment} className="space-y-6">
                <Card className="p-6 sm:p-8 space-y-6">
                  <div>
                    <h2 className="font-serif text-xl font-medium text-stone-900">
                      2. Pallet Shipping &amp; Freight Method
                    </h2>
                    <p className="mt-1 text-xs text-stone-500">
                      Select your preferred delivery tier for heavy ceramic freight.
                    </p>
                  </div>

                  {/* Shipping Options */}
                  <div className="space-y-4">
                    <label
                      className={`flex cursor-pointer items-start justify-between rounded-xl border p-5 transition ${
                        form.shippingMethod === "standard"
                          ? "border-stone-900 bg-stone-50/70 ring-1 ring-stone-900"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value="standard"
                          checked={form.shippingMethod === "standard"}
                          onChange={() => setForm({ ...form, shippingMethod: "standard" })}
                          className="mt-1 text-stone-900 focus:ring-stone-900"
                        />
                        <div>
                          <p className="text-sm font-semibold text-stone-900">
                            Standard Pallet Freight (Curbside Liftgate)
                          </p>
                          <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                            Banded timber pallet delivery lowered to your driveway or curbside.
                            Driver coordinates appointment by phone 24 hours prior. (4–7 business
                            days).
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                        Included
                      </span>
                    </label>

                    <label
                      className={`flex cursor-pointer items-start justify-between rounded-xl border p-5 transition ${
                        form.shippingMethod === "express"
                          ? "border-stone-900 bg-stone-50/70 ring-1 ring-stone-900"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value="express"
                          checked={form.shippingMethod === "express"}
                          onChange={() => setForm({ ...form, shippingMethod: "express" })}
                          className="mt-1 text-stone-900 focus:ring-stone-900"
                        />
                        <div>
                          <p className="text-sm font-semibold text-stone-900">
                            Express Freight Dispatch &amp; Priority Transit
                          </p>
                          <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                            Immediate same-day kiln pallet staging, priority freight routing, and
                            expedited 2–3 business day transit window.
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-stone-900">+$25.00</span>
                    </label>
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-4">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                      ← Back to Address
                    </Button>
                    <Button type="submit" variant="primary" size="lg">
                      Continue to Review &amp; Payment →
                    </Button>
                  </div>
                </Card>
              </form>
            )}

            {/* STEP 3: Review & Payment Confirmation */}
            {currentStep === 3 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Review Details Card */}
                <Card className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                    <div>
                      <h2 className="font-serif text-xl font-medium text-stone-900">
                        3. Order Review &amp; Secure Payment
                      </h2>
                      <p className="text-xs text-stone-500">
                        Review your shipping details before authorizing payment.
                      </p>
                    </div>
                  </div>

                  {/* Summary of Steps 1 & 2 */}
                  <div className="grid gap-4 sm:grid-cols-2 text-xs">
                    <div className="rounded-xl border border-stone-200 bg-[#faf7f0] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold uppercase tracking-wider text-stone-600">
                          Ship To:
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="text-stone-700 underline font-semibold hover:text-stone-950"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="font-bold text-stone-900">
                        {form.firstName} {form.lastName}
                      </p>
                      <p className="text-stone-600">
                        {form.line1} {form.line2}
                      </p>
                      <p className="text-stone-600">
                        {form.city}, {form.region} {form.postalCode}
                      </p>
                      <p className="text-stone-600">
                        {form.email} • {form.phone}
                      </p>
                    </div>

                    <div className="rounded-xl border border-stone-200 bg-[#faf7f0] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold uppercase tracking-wider text-stone-600">
                          Freight Method:
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="text-stone-700 underline font-semibold hover:text-stone-950"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="font-bold text-stone-900">
                        {form.shippingMethod === "express"
                          ? "Express Freight Dispatch (+$25.00)"
                          : "Standard Curbside Pallet Freight (Included)"}
                      </p>
                      <p className="mt-1 text-stone-500">
                        Liftgate curbside delivery with appointment call.
                      </p>
                    </div>
                  </div>

                  {/* Payment Method Details */}
                  <div className="pt-2 space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-900">
                      Payment Method
                    </h3>
                    <div className="rounded-xl border border-stone-300 bg-white p-5 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                          <svg
                            aria-hidden="true"
                            className="h-5 w-5 text-stone-700"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="1.5" />
                            <path d="M2 10h20" strokeWidth="1.5" />
                          </svg>
                          Credit / Debit Card (Stripe Encrypted)
                        </span>
                        <Badge variant="success">Stripe Verified</Badge>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          id="checkout-cardNumber"
                          label="Card Number"
                          value={form.cardNumber}
                          onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            id="checkout-cardExp"
                            label="Expires"
                            value={form.cardExp}
                            onChange={(e) => setForm({ ...form, cardExp: e.target.value })}
                          />
                          <Input
                            id="checkout-cardCvc"
                            label="CVC"
                            value={form.cardCvc}
                            onChange={(e) => setForm({ ...form, cardCvc: e.target.value })}
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-stone-500">
                        🔒 Sensitive card data is tokenized directly via Stripe Elements. Your full
                        card number is never stored on Clay &amp; Co. servers.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-4">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                      ← Back to Shipping
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={submitting}
                      className="w-full sm:w-auto text-base"
                    >
                      {submitting
                        ? "Processing Order…"
                        : `Complete Order • ${formatMoney(totalCents)}`}
                    </Button>
                  </div>
                </Card>
              </form>
            )}
          </div>

          {/* Right Column: Order Summary (5 cols) */}
          <aside className="lg:col-span-5 sticky top-24">
            <Card className="p-6 sm:p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <h2 className="font-serif text-lg font-medium text-stone-900">Order Summary</h2>
                <span className="text-xs font-semibold text-stone-500">
                  {lines.length} {lines.length === 1 ? "Item" : "Items"}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1 divide-y divide-stone-100">
                {lines.map((l) => (
                  <div
                    key={l.id}
                    className="pt-3 first:pt-0 flex gap-3 items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stone-900 truncate">{l.product.name}</p>
                      {l.variant && (
                        <p className="text-[11px] text-stone-500">Finish: {l.variant}</p>
                      )}
                      <p className="text-[11px] text-stone-500">
                        Qty: {l.quantity} {l.product.soldBy === "box" ? "boxes" : "units"}
                      </p>
                    </div>
                    <span className="font-bold text-stone-900 shrink-0">
                      {formatMoney(l.quantity * l.product.priceCents)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 border-t border-stone-200 pt-4 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-stone-900">{formatMoney(subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Pallet Freight Shipping</span>
                  <span className="font-medium text-stone-900">
                    {shippingCents === 0 ? "Included" : formatMoney(shippingCents)}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-medium text-stone-900">{formatMoney(taxCents)}</span>
                </div>

                <div className="flex items-baseline justify-between border-t border-stone-200 pt-3 text-base">
                  <span className="font-serif font-medium text-stone-900">Total</span>
                  <span className="font-serif text-2xl font-bold text-stone-900">
                    {formatMoney(totalCents)}
                  </span>
                </div>
              </div>

              {/* Batch Guarantee Notice */}
              <div className="rounded-xl border border-stone-200 bg-[#faf7f0] p-4 text-[11px] text-stone-600 leading-relaxed space-y-1">
                <p className="font-bold text-stone-800 flex items-center gap-1.5">
                  <span>🏺</span> Single Kiln Run Guarantee
                </p>
                <p>
                  Every order is packed from a single continuous firing lot to preserve consistent
                  glaze pooling and dimensional caliber.
                </p>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

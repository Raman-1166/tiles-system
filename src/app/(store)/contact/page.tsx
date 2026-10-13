"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("samples");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Please enter your name.";
    if (!email.trim() || !email.includes("@")) {
      errs.email = "Please provide a valid email address.";
    }
    if (!message.trim() || message.trim().length < 10) {
      errs.message = "Please include a message of at least 10 characters.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate inquiry submission with realistic latency
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  }

  return (
    <div className="min-h-screen bg-[#faf7f0] text-stone-900">
      {/* Header */}
      <section className="border-b border-stone-200 bg-[#f4efe4] px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase">
            Customer Concierge &amp; Studio Support
          </p>
          <h1 className="mt-3 font-serif text-4xl font-light tracking-tight text-stone-900 sm:text-5xl">
            Get in Touch
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-stone-600">
            Whether you need assistance calculating tile square footage, ordering custom glaze
            swatches, or tracking a freight pallet, our ceramic specialists are here to help.
          </p>
        </div>
      </section>

      {/* Main Grid: Form + Studio Details */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
              {submitted ? (
                <div className="py-8 text-center" role="status" aria-live="polite">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <svg
                      aria-hidden="true"
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="mt-5 font-serif text-2xl font-medium text-stone-900">
                    Message Received
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
                    Thank you, {name}. A ceramic specialist has received your inquiry and will reply
                    to <span className="font-semibold text-stone-900">{email}</span> within 1
                    business day.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setName("");
                      setEmail("");
                      setMessage("");
                      setOrderNumber("");
                    }}
                    className="mt-6 text-sm font-medium text-stone-700 underline underline-offset-4 hover:text-stone-950"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  <div>
                    <h2 className="font-serif text-2xl font-light text-stone-900">
                      Send an Inquiry
                    </h2>
                    <p className="mt-1 text-xs text-stone-500">
                      All fields marked with an asterisk (*) are required.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      id="contact-name"
                      label="Your Name *"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      error={errors.name}
                      placeholder="e.g. Elena Rostova"
                      required
                    />
                    <Input
                      id="contact-email"
                      type="email"
                      label="Email Address *"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={errors.email}
                      placeholder="elena@example.com"
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="contact-topic"
                        className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5"
                      >
                        Inquiry Topic
                      </label>
                      <select
                        id="contact-topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                      >
                        <option value="samples">Tile Samples &amp; Swatches</option>
                        <option value="trade">Trade &amp; Architecture Partnership</option>
                        <option value="order">Order Tracking &amp; Freight Status</option>
                        <option value="technical">Wastage Calculation &amp; Installation</option>
                        <option value="custom">Custom Glaze &amp; Bespoke Commission</option>
                      </select>
                    </div>

                    <Input
                      id="contact-order-number"
                      label="Order Number (Optional)"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="e.g. CLAY-20261013-..."
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5"
                    >
                      Message *
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about your room dimensions, preferred tiles, project timeline, or specific questions..."
                      className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 ${
                        errors.message ? "border-red-500" : "border-stone-300"
                      }`}
                    />
                    {errors.message && (
                      <p className="mt-1 text-xs text-red-600" role="alert">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      Send Inquiry
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Studio Details & Help Cards */}
          <div className="space-y-6 lg:col-span-5">
            {/* Quick Order Lookup Banner */}
            <div className="rounded-2xl border border-stone-200 bg-[#f4efe4] p-6">
              <h3 className="font-serif text-lg font-medium text-stone-900">
                Checking an Existing Order?
              </h3>
              <p className="mt-2 text-xs text-stone-600 leading-relaxed">
                You can look up real-time pallet freight tracking, fulfillment status, and order
                receipts instantly without waiting for customer support.
              </p>
              <div className="mt-4">
                <Link
                  href="/order/lookup"
                  className="inline-flex items-center text-xs font-semibold text-stone-900 underline underline-offset-4 hover:text-stone-700"
                >
                  Go to Order Lookup →
                </Link>
              </div>
            </div>

            {/* Studio Hours & Contact Info */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="font-serif text-lg font-medium text-stone-900">
                Studio Showroom &amp; Headquarters
              </h3>
              <div className="mt-4 space-y-4 text-xs text-stone-600">
                <div>
                  <p className="font-semibold text-stone-900">Flagship Studio</p>
                  <p className="mt-0.5">142 Artisan Row, Ceramic Quarter</p>
                  <p>Stoke-on-Trent, ST1 4DY, United Kingdom</p>
                </div>
                <div>
                  <p className="font-semibold text-stone-900">Opening Hours</p>
                  <p className="mt-0.5">Monday – Friday: 9:00 AM – 6:00 PM GMT</p>
                  <p>Saturday: 10:00 AM – 4:00 PM GMT</p>
                  <p>Sunday: Closed for studio kiln maintenance</p>
                </div>
                <div>
                  <p className="font-semibold text-stone-900">Direct Inquiries</p>
                  <p className="mt-0.5">General Concierge: concierge@clayandco.com</p>
                  <p>Trade &amp; Architecture: trade@clayandco.com</p>
                  <p>Telephone: +44 (0) 20 7946 0192</p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="font-serif text-lg font-medium text-stone-900">Helpful Resources</h3>
              <ul className="mt-4 space-y-2.5 text-xs text-stone-700">
                <li>
                  <Link href="/faq" className="hover:underline">
                    • Frequently Asked Questions (Wastage, Grout, Samples)
                  </Link>
                </li>
                <li>
                  <Link href="/shipping-returns" className="hover:underline">
                    • Freight Delivery &amp; 30-Day Return Policy
                  </Link>
                </li>
                <li>
                  <Link href="/visualizer" className="hover:underline">
                    • Interactive 3D Room Visualizer
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

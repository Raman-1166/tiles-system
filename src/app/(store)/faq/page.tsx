"use client";

import { useState } from "react";
import Link from "next/link";

interface FAQItem {
  id: string;
  category: "samples" | "wastage" | "shipping" | "care" | "returns";
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: "samples-how",
    category: "samples",
    question: "How do tile samples work, and can I see true glaze color?",
    answer:
      "We strongly encourage ordering physical tile swatches before placing a full crate order. Our sample tiles are individual cut swatches packed in recyclable craft cartons. Because ceramic and terracotta glazes react to natural daylight, morning sun, and indoor warm lamps, viewing a sample in your actual room is the best way to confirm color tone and surface luster.",
  },
  {
    id: "samples-credit",
    category: "samples",
    question: "Are sample costs credited toward full room tile orders?",
    answer:
      "Yes! When you order sample swatches, you receive a promotional voucher code via email that credits up to $25 / £20 of your sample purchase toward any subsequent full tile order exceeding 15 square meters (or 160 sq ft).",
  },
  {
    id: "wastage-why",
    category: "wastage",
    question: "Why do you recommend adding 10% to 15% wastage to room measurements?",
    answer:
      "Every tile installation requires cutting tiles to fit perimeter walls, electrical outlets, plumbing valves, and door thresholds. When cutting, tiles are cut diagonally or trimmed, and edge cuts often cannot be reused. Additionally, keeping an extra box of tiles from the same production lot ensures you have exact shade-matched spares for future plumbing access or repairs. For straight grid layouts, 10% is recommended. For herringbone, chevron, or diagonal patterns, we strongly recommend 15%.",
  },
  {
    id: "wastage-calc",
    category: "wastage",
    question: "How does Clay & Co. calculate boxes needed from square footage?",
    answer:
      "Tiles are sold in full manufacturer boxes to protect glaze surfaces during transit. Our system takes your exact room square meters or square feet, multiplies by (1 + wastage percentage), and rounds UP to the nearest full box. You will never receive half-opened boxes with compromised packing.",
  },
  {
    id: "shipping-freight",
    category: "shipping",
    question: "How is a full order of tiles delivered?",
    answer:
      "Tile shipments are heavy architectural freight. Full orders are packed in reinforced, steel-banded wooden crates on pallets and delivered via dedicated freight trucks equipped with hydraulic liftgates. The driver will lower the pallet curbside to your driveway or street-level entrance. Please ensure the delivery location has hard, level paved ground capable of supporting a pallet jack.",
  },
  {
    id: "shipping-damaged",
    category: "shipping",
    question: "What if a tile arrives cracked or broken in transit?",
    answer:
      "Industry standard allows 1–2% natural transit breakage on ceramic freight (these broken pieces can typically be used by installers for edge cuts). However, if your shipment suffers freight crate damage, simply photograph the pallet and damaged boxes before signing the Bill of Lading (or within 48 hours of drop-off) and contact us. We will dispatch replacement boxes immediately at zero cost.",
  },
  {
    id: "care-variation",
    category: "care",
    question: "Why do handmade tiles have shade variation (V1 to V4)?",
    answer:
      "Natural ceramic clay contains rich mineral deposits that fluctuate during high-heat kiln firing. Tile industry standard assigns a shade variation scale: V1 (Uniform), V2 (Slight), V3 (Moderate), and V4 (Substantial). We embrace V2–V4 variations on our artisan collections, as the subtle gradations create the living, luminous depth that separates genuine craftsmanship from mass-produced vinyl prints.",
  },
  {
    id: "care-sealing",
    category: "care",
    question: "Do terracotta and handmade ceramic tiles need to be sealed?",
    answer:
      "Glazed porcelain and vitreous glazed ceramics do NOT require surface sealing. However, unglazed terracotta, raw zellige edges, and crackle glaze tiles require a penetrating sealer applied prior to grouting to prevent grout pigment from penetrating microscopic capillary pores. Full sealing guidelines are included in your crate documentation.",
  },
  {
    id: "returns-policy",
    category: "returns",
    question: "Can I return unopened leftover boxes of tiles?",
    answer:
      "We accept returns of full, unopened boxes within 30 days of delivery. Because tiles are heavy freight and subject to batch lot matching, returned boxes must be in original manufacturer packaging and are subject to customer-arranged freight or a standardized return transit fee. Loose sample tiles and custom bespoke glazes are non-returnable. Please read our full Shipping & Returns page for full step-by-step instructions.",
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>("wastage-why");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCat = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#faf7f0] text-stone-900">
      {/* Header */}
      <section className="border-b border-stone-200 bg-[#f4efe4] px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase">
            Knowledge Base &amp; Technical Guidance
          </p>
          <h1 className="mt-3 font-serif text-4xl font-light tracking-tight text-stone-900 sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-stone-600">
            Everything you need to know about tile coverage math, freight deliveries, sample kits,
            and natural glaze characteristics.
          </p>

          {/* Search Bar */}
          <div className="mx-auto mt-8 max-w-md">
            <label htmlFor="faq-search" className="sr-only">
              Search FAQs
            </label>
            <div className="relative">
              <input
                id="faq-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions (e.g. wastage, sealant, freight)..."
                className="w-full rounded-full border border-stone-300 bg-white px-5 py-3 pr-10 text-sm text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 text-sm"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 pb-10 border-b border-stone-200">
          {[
            { id: "all", label: "All Questions" },
            { id: "wastage", label: "Tile Math & Wastage" },
            { id: "samples", label: "Samples & Swatches" },
            { id: "shipping", label: "Freight & Delivery" },
            { id: "care", label: "Care & Sealing" },
            { id: "returns", label: "Returns & Exchanges" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                activeCategory === cat.id
                  ? "bg-stone-900 text-white"
                  : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="mt-8 space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 p-12 text-center text-stone-500">
              <p className="text-sm">No questions found matching your search.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="mt-3 text-xs font-semibold text-stone-900 underline underline-offset-4"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between p-6 text-left hover:bg-stone-50/50 transition-colors"
                  >
                    <span className="font-medium text-base text-stone-900 pr-4">
                      {faq.question}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-transform ${
                        isOpen ? "rotate-180 bg-stone-900 text-white border-stone-900" : ""
                      }`}
                    >
                      ↓
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-stone-100 px-6 pb-6 pt-3 text-sm leading-relaxed text-stone-600">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Assistance Card */}
        <div className="mt-16 rounded-2xl border border-stone-200 bg-[#f4efe4] p-8 text-center">
          <h2 className="font-serif text-2xl font-light text-stone-900">
            Have a project-specific question?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-stone-600 leading-relaxed">
            Send us your architectural blueprints or room dimensions. Our ceramic specialists will
            calculate exact coverage and prepare custom glaze swatches.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="rounded-full bg-stone-900 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-stone-700"
            >
              Contact Ceramic Specialist
            </Link>
            <Link
              href="/shipping-returns"
              className="rounded-full border border-stone-300 bg-white px-6 py-2.5 text-xs font-semibold text-stone-800 transition hover:bg-stone-50"
            >
              Shipping &amp; Returns Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

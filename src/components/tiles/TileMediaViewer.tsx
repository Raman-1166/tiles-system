"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TileImage, type TileImageVariant, type TileProductData } from "./TileImage";

interface Props {
  product: TileProductData;
}

type TabId = "closeup" | "slab" | "alt" | "scale" | "room";

interface TabItem {
  id: TabId;
  label: string;
  variant?: TileImageVariant;
}

export function TileMediaViewer({ product }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("closeup");

  // Determine initial finish
  const initialFinish =
    product.finish?.toLowerCase() === "gloss" ||
    product.tileType?.toLowerCase() === "gloss" ||
    (Array.isArray(product.productVariants) &&
      product.productVariants.some((v) => v.finish?.toLowerCase() === "gloss"))
      ? "Gloss"
      : "Matte";

  const [activeFinish, setActiveFinish] = useState<"Gloss" | "Matte">(initialFinish);
  const [lifestyleLoaded, setLifestyleLoaded] = useState(false);

  // Optional lifestyle image check
  const lifestyleUrl = (product as any).lifestyleImage as string | undefined;

  useEffect(() => {
    if (!lifestyleUrl) return;
    const img = new Image();
    img.src = lifestyleUrl;
    img.onload = () => setLifestyleLoaded(true);
    img.onerror = () => setLifestyleLoaded(false);
  }, [lifestyleUrl]);

  // Listen for live finish updates from ProductVariantSelector
  useEffect(() => {
    const handleFinishChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ finish?: string }>;
      const newFinish = customEvent.detail?.finish;
      if (newFinish === "Gloss" || newFinish === "Matte") {
        setActiveFinish(newFinish);
      }
    };

    window.addEventListener("clay-finish-change", handleFinishChange);
    return () => {
      window.removeEventListener("clay-finish-change", handleFinishChange);
    };
  }, []);

  const tabs: TabItem[] = [
    { id: "closeup", label: "Close-up", variant: "closeup" },
    { id: "slab", label: "3D slab", variant: "slab" },
    { id: "alt", label: "Alternate layout", variant: "alt" },
    { id: "scale", label: "Scale", variant: "scale" },
  ];

  if (lifestyleUrl && lifestyleLoaded) {
    tabs.push({ id: "room", label: "In a room" });
  }

  return (
    <div className="space-y-4">
      {/* ── Main Viewer (square, 8px radius like rounded-lg) ── */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/5">
        {activeTab === "room" && lifestyleUrl ? (
          <img
            src={lifestyleUrl}
            alt={`${product.name ?? "Tile"} in a room`}
            className="h-full w-full object-cover"
          />
        ) : (
          <TileImage
            product={product}
            variant={activeTab as TileImageVariant}
            finish={activeFinish}
            size={960}
            interactive={activeTab === "slab"}
            className="h-full w-full"
          />
        )}
      </div>

      {/* ── Thumbnail Row (4 buttons, aria-pressed, keyboard accessible) ── */}
      <div
        className="grid grid-cols-4 gap-3 sm:gap-4"
        role="group"
        aria-label="Tile image views"
      >
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex flex-col items-center gap-1.5 rounded-lg border-2 p-1.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B6B] ${
                isSelected
                  ? "border-[#0F6B6B] bg-white shadow-md"
                  : "border-transparent bg-[#F6F4EE] hover:border-stone-300"
              }`}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded bg-stone-100">
                {tab.id === "room" && lifestyleUrl ? (
                  <img
                    src={lifestyleUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <TileImage
                    product={product}
                    variant={tab.variant}
                    finish={activeFinish}
                    size={96}
                    interactive={false}
                    className="h-full w-full pointer-events-none"
                  />
                )}
              </div>
              <span
                className={`text-[11px] sm:text-xs font-medium leading-tight line-clamp-1 text-center ${
                  isSelected ? "font-semibold text-[#0F6B6B]" : "text-stone-600 group-hover:text-stone-900"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── View in 3D room Button ── */}
      <div className="pt-2">
        <Link
          href={`/visualizer?tile=${product.slug}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-transparent bg-[#14262B] px-6 py-3.5 text-sm font-semibold tracking-wide text-white shadow-sm transition hover:bg-[#0F6B6B] hover:shadow-md active:scale-[0.99]"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <span>View in 3D room</span>
        </Link>
      </div>
    </div>
  );
}

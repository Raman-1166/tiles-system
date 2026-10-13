"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import {
  sqmToSqft,
  sqftToSqm,
  calculateGrossAreaSqm,
  calculateBoxesNeeded,
  getWastageRate,
  type TileLayoutType,
} from "@/lib/tile-math";
import { calculateAccessories } from "@/config/accessories";
import { useCartStore } from "@/store/cartStore";
import type { ProductWithDetails } from "@/db/queries";

interface Props {
  tiles: ProductWithDetails[];
  initialProductSlug?: string;
  initialArea?: string;
  initialLayout?: string;
  initialUnit?: string;
}

const LAYOUT_OPTIONS: Array<{
  id: TileLayoutType;
  label: string;
  wastagePercent: number;
  description: string;
}> = [
  {
    id: "straight",
    label: "Straight / Stacked Bond",
    wastagePercent: 10,
    description: "Standard orthogonal grid. Lowest cut wastage.",
  },
  {
    id: "brick",
    label: "Running / Subway Bond",
    wastagePercent: 10,
    description: "Classic 50% brick offset pattern.",
  },
  {
    id: "herringbone",
    label: "Herringbone (45° or 90°)",
    wastagePercent: 15,
    description: "Angled interlocking blocks requiring edge trimming.",
  },
  {
    id: "diagonal",
    label: "Diagonal Grid (45°)",
    wastagePercent: 15,
    description: "Diamond pattern with perimeter triangle cuts.",
  },
  {
    id: "chevron",
    label: "Chevron (V-Joint)",
    wastagePercent: 15,
    description: "Parallelogram mitered points with angled boundaries.",
  },
];

const ROOM_PRESETS = [
  { label: "Powder Room", sqm: 2.8 },
  { label: "Full Bathroom", sqm: 6.5 },
  { label: "Kitchen Floor", sqm: 12.0 },
  { label: "Open Living Area", sqm: 28.0 },
];

export function TileCalculatorClient({
  tiles,
  initialProductSlug,
  initialArea,
  initialLayout,
  initialUnit,
}: Props) {
  // Tile selection
  const [selectedSlug, setSelectedSlug] = useState<string>(() => {
    if (initialProductSlug && tiles.some((t) => t.slug === initialProductSlug)) {
      return initialProductSlug;
    }
    return tiles[0]?.slug ?? "";
  });

  // Unit system
  const [unit, setUnit] = useState<"metric" | "imperial">(
    initialUnit === "imperial" ? "imperial" : "metric"
  );

  // Input mode: length & width vs direct area
  const [inputMode, setInputMode] = useState<"dimensions" | "area">("dimensions");

  // Dimensions
  const [lengthInput, setLengthInput] = useState<string>("3.5");
  const [widthInput, setWidthInput] = useState<string>("2.8");
  const [directAreaInput, setDirectAreaInput] = useState<string>(() => initialArea ?? "9.8");

  // Layout pattern
  const [layout, setLayout] = useState<TileLayoutType>(() => {
    const valid = LAYOUT_OPTIONS.find((l) => l.id === initialLayout);
    return valid ? valid.id : "straight";
  });

  // Include accessories toggle
  const [includeAccessories, setIncludeAccessories] = useState<boolean>(true);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  const selectedTile = useMemo(() => {
    return tiles.find((t) => t.slug === selectedSlug) ?? tiles[0];
  }, [tiles, selectedSlug]);

  // Derive net area in SQM
  const netAreaSqm = useMemo(() => {
    if (inputMode === "dimensions") {
      const l = parseFloat(lengthInput) || 0;
      const w = parseFloat(widthInput) || 0;
      if (unit === "metric") {
        return Math.max(0, l * w);
      } else {
        const sqft = l * w;
        return Math.max(0, sqftToSqm(sqft));
      }
    } else {
      const raw = parseFloat(directAreaInput) || 0;
      if (unit === "metric") {
        return Math.max(0, raw);
      } else {
        return Math.max(0, sqftToSqm(raw));
      }
    }
  }, [inputMode, lengthInput, widthInput, directAreaInput, unit]);

  // Wastage and Gross Calculations
  const wastageRate = getWastageRate(layout);
  const coveragePerBox = parseFloat(selectedTile?.coveragePerBoxSqm || "1.2") || 1.2;
  const boxResult = useMemo(() => {
    return calculateBoxesNeeded(netAreaSqm, coveragePerBox, layout);
  }, [netAreaSqm, coveragePerBox, layout]);

  const { grossAreaSqm, boxesNeeded, totalDeliveredAreaSqm: deliveredAreaSqm } = boxResult;

  // Pricing
  const pricePerBoxCents = selectedTile?.priceCents ?? 0;
  const tileTotalCents = boxesNeeded * pricePerBoxCents;

  // Accessories
  const accessories = useMemo(() => {
    return calculateAccessories(grossAreaSqm);
  }, [grossAreaSqm]);

  const accessoriesTotalCents = useMemo(() => {
    if (!includeAccessories) return 0;
    return accessories.reduce((sum, a) => sum + a.totalPriceCents, 0);
  }, [accessories, includeAccessories]);

  const grandTotalCents = tileTotalCents + accessoriesTotalCents;

  // Cart actions
  const handleAddToCart = async (withAccessories: boolean) => {
    if (!selectedTile || boxesNeeded <= 0) return;

    setIsAdding(true);
    const { setFromResponse, showToast, openMiniCart } = useCartStore.getState();

    try {
      // 1. Add Tile Boxes
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedTile.id,
          quantity: boxesNeeded,
          meta: {
            areaSqm: Number(netAreaSqm.toFixed(2)),
            grossAreaSqm: Number(grossAreaSqm.toFixed(2)),
            layout,
            boxesNeeded,
            coveragePerBox,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message || "Failed to add tile boxes");
      }

      let latestData = data;

      // 2. Add companion accessories if selected
      if (withAccessories && accessories.length > 0) {
        for (const item of accessories) {
          const accRes = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.recommendedQuantity,
              meta: {
                companionFor: selectedTile.name,
                specification: item.specification,
              },
            }),
          });
          if (accRes.ok) {
            latestData = await accRes.json();
          }
        }
      }

      setFromResponse(latestData);
      showToast(
        withAccessories
          ? `Added ${boxesNeeded} boxes + installation supplies to your bag`
          : `Added ${boxesNeeded} boxes of ${selectedTile.name} to your bag`,
        "success"
      );
      openMiniCart();
    } catch (err: unknown) {
      console.error("Calculator add to cart error:", err);
      const msg = err instanceof Error ? err.message : "Failed to add to bag.";
      showToast(msg, "error");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Form & Inputs */}
      <div className="lg:col-span-7 space-y-6">
        {/* Step 1: Select Tile */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <label
            htmlFor="tile-selector"
            className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2"
          >
            1. Select Artisanal Tile
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tiles.map((tile) => {
              const isSelected = tile.slug === selectedSlug;
              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => setSelectedSlug(tile.slug)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? "border-stone-900 bg-stone-900/5 ring-1 ring-stone-900"
                      : "border-stone-200 hover:border-stone-400 bg-white"
                  }`}
                >
                  <div
                    className="h-10 w-10 shrink-0 rounded-lg border border-black/10 shadow-2xs"
                    style={{ backgroundColor: tile.visualizerColor || tile.colorHex || "#d8cfc4" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-stone-900">{tile.name}</p>
                    <p className="text-[11px] text-stone-500">
                      {formatMoney(tile.priceCents)} / box ({tile.coveragePerBoxSqm || 1.2} m²)
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Surface Area Inputs */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              2. Room Dimensions &amp; Surface Area
            </span>
            {/* Metric / Imperial toggle */}
            <div className="inline-flex rounded-lg border border-stone-200 bg-stone-100 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setUnit("metric")}
                className={`rounded-md px-2.5 py-1 font-medium transition ${
                  unit === "metric" ? "bg-white text-stone-900 shadow-2xs" : "text-stone-500"
                }`}
              >
                Metric (m / m²)
              </button>
              <button
                type="button"
                onClick={() => setUnit("imperial")}
                className={`rounded-md px-2.5 py-1 font-medium transition ${
                  unit === "imperial" ? "bg-white text-stone-900 shadow-2xs" : "text-stone-500"
                }`}
              >
                Imperial (ft / sq ft)
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <p className="text-xs text-stone-500 mb-1.5">Quick Project Presets:</p>
            <div className="flex flex-wrap gap-2">
              {ROOM_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setInputMode("area");
                    if (unit === "metric") {
                      setDirectAreaInput(preset.sqm.toString());
                    } else {
                      setDirectAreaInput(sqmToSqft(preset.sqm).toFixed(1));
                    }
                  }}
                  className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-700 hover:border-stone-400 hover:bg-stone-100 transition"
                >
                  {preset.label} (
                  {unit === "metric"
                    ? `${preset.sqm} m²`
                    : `${sqmToSqft(preset.sqm).toFixed(0)} sq ft`}
                  )
                </button>
              ))}
            </div>
          </div>

          {/* Mode Switch: Dimensions vs Total Area */}
          <div className="flex items-center gap-4 text-xs font-medium text-stone-700 pt-2 border-t border-stone-100">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="inputMode"
                checked={inputMode === "dimensions"}
                onChange={() => setInputMode("dimensions")}
                className="text-stone-900 focus:ring-stone-900"
              />
              <span>Length × Width</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="inputMode"
                checked={inputMode === "area"}
                onChange={() => setInputMode("area")}
                className="text-stone-900 focus:ring-stone-900"
              />
              <span>Direct Total Area</span>
            </label>
          </div>

          {inputMode === "dimensions" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="dim-length"
                  className="block text-xs font-medium text-stone-600 mb-1"
                >
                  Length ({unit === "metric" ? "metres" : "feet"})
                </label>
                <input
                  id="dim-length"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={lengthInput}
                  onChange={(e) => setLengthInput(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="dim-width"
                  className="block text-xs font-medium text-stone-600 mb-1"
                >
                  Width ({unit === "metric" ? "metres" : "feet"})
                </label>
                <input
                  id="dim-width"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={widthInput}
                  onChange={(e) => setWidthInput(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div>
              <label
                htmlFor="direct-area"
                className="block text-xs font-medium text-stone-600 mb-1"
              >
                Total Net Surface Area ({unit === "metric" ? "m²" : "sq ft"})
              </label>
              <input
                id="direct-area"
                type="number"
                min="0.1"
                step="0.1"
                value={directAreaInput}
                onChange={(e) => setDirectAreaInput(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Step 3: Layout Pattern Selection */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              3. Installation Pattern &amp; Wastage
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
              +{Math.round(wastageRate * 100)}% Wastage Buffer
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {LAYOUT_OPTIONS.map((opt) => {
              const isSelected = layout === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLayout(opt.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    isSelected
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 hover:border-stone-400 bg-white text-stone-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{opt.label}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isSelected ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      +{opt.wastagePercent}%
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-[11px] leading-tight ${isSelected ? "text-stone-300" : "text-stone-500"}`}
                  >
                    {opt.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4: Installation Accessories Recommendation */}
        {accessories.length > 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  4. Recommended Installation Essentials
                </span>
                <p className="text-xs text-stone-600 mt-0.5">
                  Pro-grade adhesives, grout &amp; anti-lippage leveling clips calibrated for your{" "}
                  {grossAreaSqm.toFixed(1)} m² area.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAccessories}
                  onChange={(e) => setIncludeAccessories(e.target.checked)}
                  className="rounded text-stone-900 focus:ring-stone-900 h-4 w-4"
                />
                <span className="text-xs font-semibold text-stone-800">Bundle All Essentials</span>
              </label>
            </div>

            <div className="space-y-2.5">
              {accessories.map((acc) => (
                <div
                  key={acc.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition ${
                    includeAccessories
                      ? "border-stone-200 bg-[#FAFBF9]"
                      : "border-stone-100 bg-stone-50/50 opacity-60"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900">{acc.name}</span>
                      <span className="rounded bg-stone-200 px-1.5 py-0.2 text-[10px] font-semibold text-stone-700">
                        {acc.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">{acc.coverageFormulaLabel}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-stone-900">
                      {acc.recommendedQuantity} × {formatMoney(acc.unitPriceCents)}
                    </p>
                    <p className="text-[11px] font-semibold text-stone-600">
                      = {formatMoney(acc.totalPriceCents)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Project Estimate Summary Box */}
      <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
        <div className="rounded-2xl border border-stone-200 bg-[#f4efe4] p-6 shadow-sm space-y-5">
          <div className="border-b border-stone-300 pb-4">
            <h2 className="font-serif text-xl font-bold text-stone-900">Project Estimate</h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Exact material requirements for {selectedTile?.name}
            </p>
          </div>

          {/* Area & Coverage Breakdown */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-stone-200">
              <span className="text-stone-600">Net Room Area:</span>
              <span className="font-semibold text-stone-900">
                {netAreaSqm.toFixed(2)} m² ({sqmToSqft(netAreaSqm).toFixed(1)} sq ft)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-200">
              <span className="text-stone-600">Layout Pattern:</span>
              <span className="font-semibold text-stone-900 capitalize">{layout}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-200">
              <span className="text-stone-600">Wastage Buffer:</span>
              <span className="font-semibold text-amber-800">
                +{Math.round(wastageRate * 100)}% ({(grossAreaSqm - netAreaSqm).toFixed(2)} m²)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-200">
              <span className="text-stone-600">Total Gross Coverage Needed:</span>
              <span className="font-bold text-stone-900">{grossAreaSqm.toFixed(2)} m²</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-200">
              <span className="text-stone-600">Coverage per Box:</span>
              <span className="font-semibold text-stone-900">{coveragePerBox} m²</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-200">
              <span className="text-stone-600">Total Boxes Needed:</span>
              <span className="font-bold text-lg text-stone-900">{boxesNeeded} boxes</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-600">Actual Delivered Surface:</span>
              <span className="font-semibold text-stone-900">
                {deliveredAreaSqm.toFixed(2)} m² (safety excess:{" "}
                {(deliveredAreaSqm - grossAreaSqm).toFixed(2)} m²)
              </span>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="rounded-xl bg-white p-4 space-y-2 border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between text-xs text-stone-700">
              <span>
                Tile Boxes ({boxesNeeded} × {formatMoney(pricePerBoxCents)}):
              </span>
              <span className="font-semibold text-stone-900">{formatMoney(tileTotalCents)}</span>
            </div>

            {includeAccessories && accessoriesTotalCents > 0 && (
              <div className="flex justify-between text-xs text-stone-700">
                <span>Installation Essentials Bundle:</span>
                <span className="font-semibold text-stone-900">
                  {formatMoney(accessoriesTotalCents)}
                </span>
              </div>
            )}

            <div className="flex items-baseline justify-between pt-2 border-t border-stone-200">
              <span className="font-serif text-sm font-bold text-stone-900">Estimated Total:</span>
              <span className="font-serif text-2xl font-bold text-stone-900">
                {formatMoney(grandTotalCents)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => handleAddToCart(includeAccessories)}
              disabled={isAdding || boxesNeeded <= 0}
              className="w-full cursor-pointer rounded-full bg-stone-900 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-stone-700 disabled:opacity-50 transition"
            >
              {isAdding
                ? "Adding to Bag…"
                : includeAccessories
                  ? "Add Tiles & Essentials to Bag"
                  : "Add Tiles to Bag"}
            </button>

            {/* Cross-Tool Links */}
            <div className="flex gap-2">
              <Link
                href={`/visualizer?tile=${selectedTile?.slug}&layout=${layout}`}
                className="flex-1 rounded-full border border-stone-300 bg-white py-2 text-center text-xs font-medium text-stone-800 hover:bg-stone-50 transition"
              >
                🏛️ Preview in 3D
              </Link>
              <Link
                href={`/shop/tile/${selectedTile?.slug}`}
                className="flex-1 rounded-full border border-stone-300 bg-white py-2 text-center text-xs font-medium text-stone-800 hover:bg-stone-50 transition"
              >
                🔍 View Spec Sheet
              </Link>
            </div>
          </div>

          {/* Guarantee Badge */}
          <p className="text-[11px] text-stone-500 text-center leading-tight">
            🛡️ 100% Wastage Protection: We guarantee sufficient tiles for your project cuts when
            ordering with recommended pattern allowances.
          </p>
        </div>
      </div>
    </div>
  );
}

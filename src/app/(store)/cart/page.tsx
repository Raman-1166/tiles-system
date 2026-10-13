"use client";

import { useEffect, useState, useRef, useId } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { formatMoney } from "@/lib/money";
import { SAMPLE_SWATCH_PRICE_CENTS } from "@/config/commerce";
import type { Product } from "@/db/schema";

export type CartLine = {
  id: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  variant: string | null;
  meta?: Record<string, unknown> | null;
  product: Product;
};

export type SavedCartItem = {
  id: string; // unique saved id
  productId: number;
  variantId: number | null;
  quantity: number;
  variant: string | null;
  meta?: Record<string, unknown> | null;
  product: Product;
  savedAt: number;
};

// ── Currency Formatter ────────────────────────────────────────────────────────
export function formatRupees(cents: number): string {
  return formatMoney(cents);
}

export function formatRawRupees(cents: number): string {
  return formatMoney(cents);
}

// ── Helper to detect tile products ───────────────────────────────────────────
function isTileProduct(product: Product): boolean {
  if (product.soldBy === "box") return true;
  if (product.coveragePerBoxSqm != null) return true;
  if (product.tileSizeCm != null) return true;
  if (product.visualizerColor != null) return true;
  if (product.groutColor != null) return true;
  if (product.tileLayout != null) return true;
  if (product.unit?.toLowerCase().includes("box") || product.unit?.toLowerCase().includes("tile")) {
    return true;
  }
  return false;
}

// ── Tile Swatch Component (Glossy Grid with Grout Lines) ─────────────────────
function TileGridSwatch({
  color = "#ded6c9",
  groutColor = "#c8c1b4",
  gloss = true,
  size = 96,
}: {
  color?: string;
  groutColor?: string;
  gloss?: boolean;
  size?: number;
}) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[10px] select-none border border-black/10 dark:border-white/10"
      style={{
        width: size,
        height: size,
        backgroundColor: groutColor || "#c8c1b4",
        padding: "3px",
      }}
      aria-label="Tile glossy grid swatch with grout lines"
    >
      {/* 3x3 Tile Grid with Grout Gaps */}
      <div className="grid grid-cols-3 grid-rows-3 gap-[2.5px] h-full w-full">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="relative rounded-[2px] overflow-hidden"
            style={{
              backgroundColor: color || "#ded6c9",
              boxShadow:
                "inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 1.5px rgba(0,0,0,0.18)",
            }}
          />
        ))}
      </div>

      {/* Glossy Reflection Sheen (Diagonal Glass Shine) */}
      {gloss && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.25) 32%, rgba(255,255,255,0.03) 54%, transparent 68%)",
          }}
        />
      )}

      {/* Soft Specular Highlights */}
      <div
        className="pointer-events-none absolute -top-3 -left-3 w-10 h-10 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

// ── Furniture Swatch Component ───────────────────────────────────────────────
function FurnitureSwatch({
  imageUrl,
  alt,
  size = 96,
}: {
  imageUrl?: string;
  alt: string;
  size?: number;
}) {
  const [hasError, setHasError] = useState(false);
  const src = !hasError && imageUrl ? imageUrl : "/images/placeholder.svg";

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[10px] bg-stone-100 dark:bg-stone-800/80 border border-[#CFDCD4] dark:border-[#223832] flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

// ── Spec Grid Component (Options: Room, Surfaces, Layout, Grout) ─────────────
function SpecGrid({
  isTile,
  meta,
  product,
  variant,
}: {
  isTile: boolean;
  meta?: Record<string, unknown> | null;
  product: Product;
  variant?: string | null;
}) {
  if (isTile) {
    const isWallTile =
      product.slug?.toLowerCase().includes("wall") || product.name?.toLowerCase().includes("wall");
    const room =
      (meta?.room as string) ||
      (meta?.roomType as string) ||
      (isWallTile ? "Bathroom / Wall" : "Living & Floor");
    const surfaces =
      (meta?.surfaces as string) || (meta?.surface as string) || (isWallTile ? "Wall" : "Floor");
    const layout = (meta?.layout as string) || product.tileLayout || "Straight grid";
    const rawGrout =
      (meta?.grout as string) || (meta?.groutColor as string) || product.groutColor || "#dedad2";

    // Clean grout name representation
    const groutName =
      rawGrout.toLowerCase() === "#dedad2" || rawGrout.toLowerCase() === "#ded6c9"
        ? "Warm Grey"
        : rawGrout.toLowerCase() === "#1a2840"
          ? "Deep Charcoal"
          : rawGrout.toLowerCase() === "#ffffff"
            ? "Pure White"
            : rawGrout.startsWith("#")
              ? rawGrout.toUpperCase()
              : rawGrout;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 my-3 border-y border-[#CFDCD4]/70 dark:border-[#223832]">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-stone-500 dark:text-stone-400 uppercase block">
            Room
          </span>
          <span className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 capitalize">
            {room}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-stone-500 dark:text-stone-400 uppercase block">
            Surfaces
          </span>
          <span className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 capitalize">
            {surfaces}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-stone-500 dark:text-stone-400 uppercase block">
            Layout
          </span>
          <span className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 capitalize">
            {layout}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-stone-500 dark:text-stone-400 uppercase block">
            Grout
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="h-3 w-3 rounded-full border border-black/25 dark:border-white/30 shrink-0 shadow-xs"
              style={{ backgroundColor: rawGrout }}
              title={groutName}
            />
            <span className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
              {groutName}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Furniture options
  const room = (meta?.room as string) || "Living & Studio";
  const material = product.material || "Solid Wood";
  const dimensions = product.dimensions
    ? `${product.dimensions.width}×${product.dimensions.depth}×${product.dimensions.height} cm`
    : "Standard";
  const finish = variant || "Natural Finish";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 my-3 border-y border-[#CFDCD4]/70 dark:border-[#223832]">
      <div>
        <span className="text-[11px] font-semibold tracking-wider text-stone-500 dark:text-stone-400 uppercase block">
          Room
        </span>
        <span className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 capitalize">
          {room}
        </span>
      </div>
      <div>
        <span className="text-[11px] font-semibold tracking-wider text-stone-500 dark:text-stone-400 uppercase block">
          Material
        </span>
        <span className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 capitalize">
          {material}
        </span>
      </div>
      <div>
        <span className="text-[11px] font-semibold tracking-wider text-stone-500 dark:text-stone-400 uppercase block">
          Dimensions
        </span>
        <span className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200">
          {dimensions}
        </span>
      </div>
      <div>
        <span className="text-[11px] font-semibold tracking-wider text-stone-500 dark:text-stone-400 uppercase block">
          Finish / Colour
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className="h-3 w-3 rounded-full border border-black/25 dark:border-white/30 shrink-0 shadow-xs"
            style={{ backgroundColor: product.colorHex || "#a67c52" }}
          />
          <span className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
            {finish}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Tile Coverage Box Component with Progress Bar ────────────────────────────
function TileCoverageBox({
  line,
  onAddBoxes,
  isUpdating,
}: {
  line: CartLine;
  onAddBoxes: (newQty: number) => void;
  isUpdating: boolean;
}) {
  const coveragePerBox = Number(line.product.coveragePerBoxSqm) || 1.2;

  // Derive target room area: from meta if passed, or calculated baseline
  const [customArea, setCustomArea] = useState<number>(() => {
    if (line.meta?.area != null) return Number(line.meta.area);
    if (line.meta?.areaM2 != null) return Number(line.meta.areaM2);
    // Baseline area derived from current quantity
    return Number(((line.quantity * coveragePerBox) / 1.1).toFixed(1));
  });

  const [isEditingArea, setIsEditingArea] = useState(false);
  const [areaInput, setAreaInput] = useState(customArea.toString());

  const area = Math.max(0.1, customArea);
  // Formula: Boxes needed = ceil(area x 1.1 / coverage per box)
  const boxesNeeded = Math.ceil((area * 1.1) / coveragePerBox);
  const currentCoverage = Number((line.quantity * coveragePerBox).toFixed(2));
  const isEnough = line.quantity >= boxesNeeded;
  const shortBy = Math.max(0, boxesNeeded - line.quantity);

  // Progress percentage (capped at 100%)
  const progressPercent = Math.min(100, Math.round((line.quantity / boxesNeeded) * 100));

  const handleSaveArea = () => {
    const val = parseFloat(areaInput);
    if (!isNaN(val) && val > 0) {
      setCustomArea(Number(val.toFixed(1)));
    } else {
      setAreaInput(customArea.toString());
    }
    setIsEditingArea(false);
  };

  return (
    <div
      className={`rounded-[10px] p-3.5 my-3 border transition-colors ${
        isEnough
          ? "bg-[#EBF2EE] dark:bg-[#132822] border-[#C3D7CA] dark:border-[#1E4339]"
          : "bg-[#FFF6ED] dark:bg-[#2A1D13] border-[#FED7AA] dark:border-[#52331C]"
      }`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
              isEnough
                ? "bg-[#0D4D47]/15 text-[#0D4D47] dark:bg-[#2DD4BF]/20 dark:text-[#2DD4BF]"
                : "bg-amber-600/15 text-amber-800 dark:bg-amber-400/20 dark:text-amber-300"
            }`}
          >
            {isEnough ? "Coverage Optimal" : "Coverage Low"}
          </span>

          {/* Area display with quick edit */}
          <div className="text-xs text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
            <span>Room area:</span>
            {isEditingArea ? (
              <span className="inline-flex items-center gap-1">
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveArea();
                    if (e.key === "Escape") setIsEditingArea(false);
                  }}
                  className="w-16 px-1.5 py-0.5 text-xs rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveArea}
                  className="text-xs font-semibold text-[#0D4D47] dark:text-[#2DD4BF] hover:underline"
                >
                  OK
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAreaInput(area.toString());
                  setIsEditingArea(true);
                }}
                className="font-medium text-stone-800 dark:text-stone-100 underline decoration-dotted underline-offset-2 hover:text-[#0D4D47] dark:hover:text-[#2DD4BF] transition"
                title="Click to change target room area"
              >
                {area} m² ✎
              </button>
            )}
          </div>
        </div>

        <span className="text-xs text-stone-500 dark:text-stone-400">
          Box coverage: {coveragePerBox} m²
        </span>
      </div>

      {/* Progress Bar Container */}
      <div
        className="w-full h-2 rounded-full overflow-hidden bg-black/10 dark:bg-white/10 my-2"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full transition-all duration-300 ease-out ${
            isEnough ? "bg-[#0D4D47] dark:bg-[#2DD4BF]" : "bg-amber-600 dark:bg-amber-400"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Coverage Status Message & Add N Button */}
      <div className="flex items-center justify-between gap-3 mt-1.5 flex-wrap">
        {isEnough ? (
          <p className="text-xs sm:text-sm font-medium text-[#0D4D47] dark:text-[#2DD4BF] flex items-center gap-1.5">
            <span className="inline-block">✓</span>
            Covers {area} m² plus 10% for cuts ({line.quantity} boxes = {currentCoverage} m²)
          </p>
        ) : (
          <div className="flex items-center justify-between gap-3 w-full flex-wrap">
            <p className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-200">
              ⚠️ Short by {shortBy} {shortBy === 1 ? "box" : "boxes"} to cover {area} m² (needs{" "}
              {boxesNeeded} boxes incl. 10% cuts)
            </p>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onAddBoxes(boxesNeeded)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[#0D4D47] hover:bg-[#083834] active:scale-[0.98] text-white text-xs font-semibold shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4D47] focus-visible:ring-offset-1 dark:focus-visible:ring-[#2DD4BF] transition disabled:opacity-50"
            >
              Add {shortBy} {shortBy === 1 ? "box" : "boxes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Quantity Stepper Component ───────────────────────────────────────────────
function QuantityStepper({
  line,
  isTile,
  isUpdating,
  onUpdateQty,
}: {
  line: CartLine;
  isTile: boolean;
  isUpdating: boolean;
  onUpdateQty: (newQty: number) => Promise<void>;
}) {
  const [typedQty, setTypedQty] = useState(line.quantity.toString());
  const minusBtnRef = useRef<HTMLButtonElement>(null);
  const plusBtnRef = useRef<HTMLButtonElement>(null);

  // Sync if quantity changed externally
  useEffect(() => {
    setTypedQty(line.quantity.toString());
  }, [line.quantity]);

  const handleStep = async (
    e: React.MouseEvent<HTMLButtonElement>,
    diff: number,
    buttonRef: React.RefObject<HTMLButtonElement | null>
  ) => {
    const nextVal = Math.max(1, line.quantity + diff);
    // Keep focus on the button immediately and after click
    buttonRef.current?.focus();
    await onUpdateQty(nextVal);
    // Re-ensure focus stays on the button
    buttonRef.current?.focus();
  };

  const handleInputBlur = () => {
    const parsed = parseInt(typedQty, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      if (parsed !== line.quantity) {
        void onUpdateQty(parsed);
      }
    } else {
      setTypedQty(line.quantity.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  // Unit price
  const isSample = Boolean(line.meta && (line.meta as Record<string, unknown>).isSample);
  const unitPriceCents = isSample ? SAMPLE_SWATCH_PRICE_CENTS : line.product.priceCents;
  const unitPriceFormatted = formatRupees(unitPriceCents);
  const unitPriceLabel = isSample
    ? `${unitPriceFormatted} per swatch`
    : isTile
      ? `${unitPriceFormatted} per box`
      : `${unitPriceFormatted} each`;

  return (
    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
      {/* Stepper Controls: − input + */}
      <div
        className="inline-flex items-center rounded-[10px] border border-[#CFDCD4] dark:border-[#223832] bg-white dark:bg-stone-900 p-0.5 shadow-xs"
        role="group"
        aria-label="Quantity selector"
      >
        <button
          ref={minusBtnRef}
          type="button"
          disabled={isUpdating || line.quantity <= 1}
          onClick={(e) => handleStep(e, -1, minusBtnRef)}
          aria-label="Decrease quantity"
          className="h-8 w-8 rounded-[8px] flex items-center justify-center text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:hover:bg-transparent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4D47] dark:focus-visible:ring-[#2DD4BF]"
        >
          −
        </button>

        <input
          type="number"
          min="1"
          step="1"
          value={typedQty}
          onChange={(e) => setTypedQty(e.target.value)}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          aria-label={
            isSample ? "Quantity of sample swatches" : isTile ? "Quantity in boxes" : "Quantity"
          }
          className="w-12 text-center text-sm font-semibold font-heading text-stone-900 dark:text-stone-100 bg-transparent border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4D47] dark:focus-visible:ring-[#2DD4BF] rounded-[4px] [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
        />

        <button
          ref={plusBtnRef}
          type="button"
          disabled={isUpdating}
          onClick={(e) => handleStep(e, 1, plusBtnRef)}
          aria-label="Increase quantity"
          className="h-8 w-8 rounded-[8px] flex items-center justify-center text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:hover:bg-transparent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4D47] dark:focus-visible:ring-[#2DD4BF]"
        >
          +
        </button>
      </div>

      {/* Unit Price Next to Stepper */}
      <span className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400">
        {unitPriceLabel}
      </span>
    </div>
  );
}

// ── Toast Undo Component ─────────────────────────────────────────────────────
function UndoToast({
  item,
  onUndo,
  onDismiss,
}: {
  item: { line: CartLine; secondsLeft: number };
  onUndo: () => void;
  onDismiss: () => void;
}) {
  return (
    <aside
      aria-label="Notification"
      className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] rounded-[14px] bg-stone-900 text-white shadow-xl p-4 border border-stone-800 flex flex-col gap-2.5 motion-reduce:transition-none"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-stone-200">
          Removed <span className="font-semibold text-white">{item.line.product.name}</span>
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onUndo}
            className="px-3 py-1 rounded-[8px] bg-[#0D4D47] hover:bg-[#12635B] text-white text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition"
          >
            Undo ({item.secondsLeft}s)
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="text-stone-400 hover:text-white p-1 text-base leading-none transition"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 6-second countdown progress bar */}
      <div className="w-full h-1 bg-stone-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#2DD4BF] transition-all duration-1000 ease-linear"
          style={{ width: `${(item.secondsLeft / 6) * 100}%` }}
        />
      </div>
    </aside>
  );
}

// ── Empty Cart State Component ───────────────────────────────────────────────
function EmptyCartState() {
  return (
    <div className="rounded-[14px] bg-[#FAFBF9] dark:bg-[#14221F] border border-[#CFDCD4] dark:border-[#223832] p-12 sm:p-16 text-center shadow-xs">
      {/* Decorative Ceramic Tile Art Icon */}
      <div className="mx-auto w-16 h-16 rounded-[14px] bg-[#E8EFEA] dark:bg-[#1A2C28] border border-[#CFDCD4] dark:border-[#223832] flex items-center justify-center mb-6">
        <div className="grid grid-cols-2 gap-1.5 w-8 h-8">
          <div className="rounded-[2px] bg-[#0D4D47] dark:bg-[#2DD4BF]" />
          <div className="rounded-[2px] bg-[#0D4D47]/40 dark:bg-[#2DD4BF]/40" />
          <div className="rounded-[2px] bg-[#0D4D47]/40 dark:bg-[#2DD4BF]/40" />
          <div className="rounded-[2px] bg-[#0D4D47] dark:bg-[#2DD4BF]" />
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold font-heading text-stone-900 dark:text-stone-100 mb-2">
        Your cart is empty
      </h2>
      <p className="text-sm sm:text-base text-stone-500 dark:text-stone-400 max-w-md mx-auto mb-8">
        Explore our handcrafted porcelain tiles and considered furniture to begin curating your
        space.
      </p>

      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Link
          href="/shop"
          className="inline-flex items-center justify-center rounded-[12px] bg-[#0D4D47] px-6 py-3 text-sm font-semibold text-white hover:bg-[#093D38] dark:bg-[#12635B] dark:hover:bg-[#0F554E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4D47] transition shadow-xs"
        >
          Browse Tiles & Furniture →
        </Link>
        <Link
          href="/visualizer"
          className="inline-flex items-center justify-center rounded-[12px] border border-[#CFDCD4] dark:border-[#223832] bg-white dark:bg-stone-900 px-6 py-3 text-sm font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4D47] transition"
        >
          Open 3D Visualizer
        </Link>
      </div>
    </div>
  );
}

// ── Main Cart Page Redesign ──────────────────────────────────────────────────
export default function CartPage() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const { setFromResponse } = useCartStore();
  const [refreshTick, setRefreshTick] = useState(0);

  // Discount code state
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    percent: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState("");

  // Toast with 6-second undo state
  const [undoToast, setUndoToast] = useState<{
    line: CartLine;
    secondsLeft: number;
  } | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Saved for later state (persisted to localStorage)
  const [savedItems, setSavedItems] = useState<SavedCartItem[]>([]);

  // Load saved items from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("clay_saved_cart_items");
      if (raw) {
        setSavedItems(JSON.parse(raw));
      }
    } catch {
      // ignore JSON error
    }
  }, []);

  const saveToSavedItems = (newItems: SavedCartItem[]) => {
    setSavedItems(newItems);
    try {
      localStorage.setItem("clay_saved_cart_items", JSON.stringify(newItems));
    } catch {
      // storage quota or disabled
    }
  };

  // Load Cart from API
  const loadCart = async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      const data = await res.json();
      setLines(data.lines ?? []);
      setFromResponse({ count: data.count ?? 0, totalCents: data.totalCents ?? 0 });
    } catch {
      setLines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTick]);

  // Update item quantity
  const updateQty = async (id: number, qty: number) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/cart/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      });
      const data = await res.json();
      setFromResponse({ count: data.count ?? 0, totalCents: data.totalCents ?? 0 });
      setRefreshTick((t) => t + 1);
    } finally {
      setUpdating(null);
    }
  };

  // Remove item and start 6-second Undo toast
  const removeLine = async (line: CartLine) => {
    setUpdating(line.id);
    try {
      const res = await fetch(`/api/cart/${line.id}`, { method: "DELETE" });
      const data = await res.json();
      setFromResponse({ count: data.count ?? 0, totalCents: data.totalCents ?? 0 });
      setRefreshTick((t) => t + 1);

      // Trigger 6-second undo toast
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
      setUndoToast({ line, secondsLeft: 6 });

      undoTimerRef.current = setInterval(() => {
        setUndoToast((prev) => {
          if (!prev || prev.secondsLeft <= 1) {
            if (undoTimerRef.current) clearInterval(undoTimerRef.current);
            return null;
          }
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        });
      }, 1000);
    } finally {
      setUpdating(null);
    }
  };

  // Handle Undo click
  const handleUndo = async () => {
    if (!undoToast) return;
    const { line } = undoToast;
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    setUndoToast(null);

    // Re-add product back to cart
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: line.productId,
          variantId: line.variantId,
          quantity: line.quantity,
          variant: line.variant,
          meta: line.meta,
        }),
      });
      const data = await res.json();
      setFromResponse({ count: data.count ?? 0, totalCents: data.totalCents ?? 0 });
      setRefreshTick((t) => t + 1);
    } catch (e) {
      console.error("Failed to restore cart line", e);
    }
  };

  // Save for later
  const saveForLater = async (line: CartLine) => {
    // Add to saved items
    const newSaved: SavedCartItem = {
      id: `${line.id}-${Date.now()}`,
      productId: line.productId,
      variantId: line.variantId,
      quantity: line.quantity,
      variant: line.variant,
      meta: line.meta,
      product: line.product,
      savedAt: Date.now(),
    };
    saveToSavedItems([newSaved, ...savedItems]);

    // Remove from active cart
    await removeLine(line);
  };

  // Move saved item back to cart
  const moveSavedToCart = async (saved: SavedCartItem) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: saved.productId,
          variantId: saved.variantId,
          quantity: saved.quantity,
          variant: saved.variant,
          meta: saved.meta,
        }),
      });
      const data = await res.json();
      setFromResponse({ count: data.count ?? 0, totalCents: data.totalCents ?? 0 });

      // Remove from saved items list
      const updated = savedItems.filter((item) => item.id !== saved.id);
      saveToSavedItems(updated);

      setRefreshTick((t) => t + 1);
    } catch (e) {
      console.error("Failed to move saved item to cart", e);
    }
  };

  // Remove saved item permanently
  const removeSavedItem = (id: string) => {
    const updated = savedItems.filter((item) => item.id !== id);
    saveToSavedItems(updated);
  };

  // Apply discount code
  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError("");
    const clean = discountCode.trim().toUpperCase();

    if (!clean) {
      setDiscountError("Please enter a discount code.");
      return;
    }

    if (clean === "CLAY10" || clean === "WELCOME10") {
      setAppliedDiscount({ code: clean, percent: 10 });
      setDiscountCode("");
    } else if (clean === "STUDIO15") {
      setAppliedDiscount({ code: clean, percent: 15 });
      setDiscountCode("");
    } else if (clean === "TILES20" || clean === "TRADE20") {
      setAppliedDiscount({ code: clean, percent: 20 });
      setDiscountCode("");
    } else {
      setDiscountError(`Discount code "${clean}" is invalid or expired.`);
    }
  };

  // Calculation of Subtotal & Discount
  const rawSubtotalCents = lines.reduce((sum, l) => {
    const isSample = Boolean(l.meta && (l.meta as Record<string, unknown>).isSample);
    const price = isSample ? SAMPLE_SWATCH_PRICE_CENTS : l.product.priceCents;
    return sum + l.quantity * price;
  }, 0);
  const rawSubtotalRupees = rawSubtotalCents;

  const discountAmountRupees = appliedDiscount
    ? Math.round(rawSubtotalCents * (appliedDiscount.percent / 100))
    : 0;

  const totalRupees = Math.max(0, rawSubtotalCents - discountAmountRupees);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#E5ECE7] dark:bg-[#0D1513] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#0D4D47] border-t-transparent rounded-full animate-spin" />
          <p className="text-stone-600 dark:text-stone-400 font-medium text-sm font-heading">
            Loading your cart…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#E5ECE7] dark:bg-[#0D1513] text-stone-900 dark:text-stone-100 font-body py-10 px-4 sm:px-6 transition-colors duration-200">
      <div className="mx-auto max-w-6xl">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-stone-900 dark:text-stone-50 tracking-tight">
              Your Cart
            </h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              {lines.length === 0
                ? "Review items and plan your tile project"
                : `${lines.length} ${lines.length === 1 ? "item" : "items"} selected`}
            </p>
          </div>

          <Link
            href="/shop"
            className="text-xs sm:text-sm font-semibold text-[#0D4D47] dark:text-[#2DD4BF] hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4D47] rounded-[6px] px-2 py-1"
          >
            ← Continue shopping
          </Link>
        </div>

        {lines.length === 0 ? (
          <div>
            <EmptyCartState />

            {/* Saved for Later list when cart is empty */}
            {savedItems.length > 0 && (
              <section className="mt-12" aria-labelledby="saved-for-later-empty-heading">
                <h2
                  id="saved-for-later-empty-heading"
                  className="text-xl font-bold font-heading text-stone-900 dark:text-stone-100 mb-4"
                >
                  Saved for later ({savedItems.length})
                </h2>
                <div className="space-y-4">
                  {savedItems.map((saved) => (
                    <div
                      key={saved.id}
                      className="flex items-center justify-between gap-4 rounded-[14px] bg-[#FAFBF9] dark:bg-[#14221F] border border-[#CFDCD4] dark:border-[#223832] p-4 shadow-xs flex-wrap"
                    >
                      <div className="flex items-center gap-4">
                        {isTileProduct(saved.product) ? (
                          <TileGridSwatch
                            color={saved.product.visualizerColor || saved.product.colorHex}
                            groutColor={saved.product.groutColor || undefined}
                            size={64}
                          />
                        ) : (
                          <FurnitureSwatch
                            imageUrl={saved.product.images?.[0]}
                            alt={saved.product.name}
                            size={64}
                          />
                        )}
                        <div>
                          <h3 className="font-semibold font-heading text-stone-900 dark:text-stone-100 text-sm">
                            {saved.product.name}
                          </h3>
                          <p className="text-xs text-stone-500 dark:text-stone-400">
                            {formatRupees(saved.product.priceCents)}{" "}
                            {isTileProduct(saved.product) ? "per box" : "each"} × {saved.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => moveSavedToCart(saved)}
                          className="px-3 py-1.5 rounded-[8px] bg-[#0D4D47] hover:bg-[#083834] text-white text-xs font-semibold shadow-xs transition"
                        >
                          Move to cart
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSavedItem(saved.id)}
                          className="text-xs text-stone-500 hover:text-red-600 dark:hover:text-red-400 underline underline-offset-4"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          /* 2 Columns on desktop: Cart Items left, Sticky Order Summary right ~340px */
          <div className="grid gap-8 lg:grid-cols-[1fr_340px] items-start">
            {/* Left Column: Cart Items List */}
            <div className="space-y-4">
              {lines.map((line) => {
                const isTile = isTileProduct(line.product);
                const isBusy = updating === line.id;
                const isSample = Boolean(
                  line.meta && (line.meta as Record<string, unknown>).isSample
                );
                const unitPriceCents = isSample
                  ? SAMPLE_SWATCH_PRICE_CENTS
                  : line.product.priceCents;
                const lineTotalRupees = line.quantity * unitPriceCents;

                return (
                  <article
                    key={line.id}
                    className={`rounded-[14px] bg-[#FAFBF9] dark:bg-[#14221F] border border-[#CFDCD4] dark:border-[#223832] p-4 sm:p-5 shadow-xs transition duration-150 ${
                      isBusy ? "opacity-60 pointer-events-none" : ""
                    }`}
                  >
                    {/* Header: Swatch + Title/Desc + Line Total */}
                    <div className="flex gap-4 items-start">
                      {/* Swatch on the Left */}
                      {isTile ? (
                        <TileGridSwatch
                          color={line.product.visualizerColor || line.product.colorHex}
                          groutColor={
                            (line.meta?.grout as string) ||
                            (line.meta?.groutColor as string) ||
                            line.product.groutColor ||
                            undefined
                          }
                          size={96}
                        />
                      ) : (
                        <FurnitureSwatch
                          imageUrl={line.product.images?.[0]}
                          alt={line.product.name}
                          size={96}
                        />
                      )}

                      {/* Product Name, Tagline & Line Total */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <h2 className="text-base sm:text-lg font-bold font-heading text-stone-900 dark:text-stone-50 leading-snug">
                              {line.product.name}
                            </h2>
                            {isSample ? (
                              <div className="mt-1 flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 rounded bg-amber-100 dark:bg-amber-950/40 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                                  Cut Sample Swatch (10×10 cm)
                                </span>
                                <span className="text-xs text-stone-500 dark:text-stone-400">
                                  • Includes $25 studio credit on checkout
                                </span>
                              </div>
                            ) : (
                              line.product.tagline && (
                                <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                                  {line.product.tagline}
                                </p>
                              )
                            )}
                          </div>

                          {/* Line total on the right (Indian currency grouping) */}
                          <div className="text-right shrink-0">
                            <span className="text-base sm:text-lg font-extrabold font-heading text-[#0D4D47] dark:text-[#2DD4BF] whitespace-nowrap">
                              {formatRawRupees(lineTotalRupees)}
                            </span>
                          </div>
                        </div>

                        {/* Architectural Spec Grid (Room, Surfaces, Layout, Grout) */}
                        {!isSample && (
                          <SpecGrid
                            isTile={isTile}
                            meta={line.meta}
                            product={line.product}
                            variant={line.variant}
                          />
                        )}

                        {/* Tile Coverage Box (Tiles Only, non-samples) */}
                        {isTile && !isSample && (
                          <TileCoverageBox
                            line={line}
                            onAddBoxes={(newQty) => updateQty(line.id, newQty)}
                            isUpdating={isBusy}
                          />
                        )}

                        {/* Footer: Stepper + Quiet text buttons */}
                        <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
                          {/* Stepper (− input +) with Unit Price */}
                          <QuantityStepper
                            line={line}
                            isTile={isTile}
                            isUpdating={isBusy}
                            onUpdateQty={(qty) => updateQty(line.id, qty)}
                          />

                          {/* Quiet Action Buttons */}
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => saveForLater(line)}
                              disabled={isBusy}
                              className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-[#0D4D47] dark:hover:text-[#2DD4BF] underline-offset-4 hover:underline transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0D4D47]"
                            >
                              Save for later
                            </button>
                            <span className="text-stone-300 dark:text-stone-700">·</span>
                            <button
                              type="button"
                              onClick={() => removeLine(line)}
                              disabled={isBusy}
                              className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 underline-offset-4 hover:underline transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {/* Saved for Later Section Below Cart Items */}
              {savedItems.length > 0 && (
                <section className="pt-6" aria-labelledby="saved-for-later-heading">
                  <h2
                    id="saved-for-later-heading"
                    className="text-lg font-bold font-heading text-stone-900 dark:text-stone-100 mb-3"
                  >
                    Saved for later ({savedItems.length})
                  </h2>
                  <div className="space-y-3">
                    {savedItems.map((saved) => (
                      <div
                        key={saved.id}
                        className="flex items-center justify-between gap-4 rounded-[14px] bg-[#FAFBF9] dark:bg-[#14221F] border border-[#CFDCD4] dark:border-[#223832] p-4 shadow-xs flex-wrap"
                      >
                        <div className="flex items-center gap-3.5">
                          {isTileProduct(saved.product) ? (
                            <TileGridSwatch
                              color={saved.product.visualizerColor || saved.product.colorHex}
                              groutColor={saved.product.groutColor || undefined}
                              size={56}
                            />
                          ) : (
                            <FurnitureSwatch
                              imageUrl={saved.product.images?.[0]}
                              alt={saved.product.name}
                              size={56}
                            />
                          )}
                          <div>
                            <h3 className="font-semibold font-heading text-stone-900 dark:text-stone-100 text-sm">
                              {saved.product.name}
                            </h3>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                              {formatRupees(saved.product.priceCents)}{" "}
                              {isTileProduct(saved.product) ? "per box" : "each"} · Qty:{" "}
                              {saved.quantity}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => moveSavedToCart(saved)}
                            className="px-3.5 py-1.5 rounded-[8px] bg-[#0D4D47] hover:bg-[#083834] text-white text-xs font-semibold shadow-xs transition"
                          >
                            Move to cart
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSavedItem(saved.id)}
                            className="text-xs text-stone-500 hover:text-red-600 dark:hover:text-red-400 underline underline-offset-4"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column: Sticky Order Summary (~340px) */}
            <aside className="w-full lg:sticky lg:top-24">
              <div className="rounded-[14px] bg-[#FAFBF9] dark:bg-[#14221F] border border-[#CFDCD4] dark:border-[#223832] p-5 sm:p-6 shadow-xs">
                <h2 className="text-lg font-bold font-heading text-stone-900 dark:text-stone-50 mb-4 pb-2 border-b border-[#CFDCD4]/70 dark:border-[#223832]">
                  Order summary
                </h2>

                {/* Full Product Names (No Truncation) with Quantity and Amount */}
                <div className="space-y-3 mb-5 max-h-60 overflow-y-auto pr-1">
                  {lines.map((l) => {
                    const lineTotalRupees = l.quantity * l.product.priceCents;
                    const isTile = isTileProduct(l.product);
                    const qtyLabel = isTile
                      ? `${l.quantity} ${l.quantity === 1 ? "box" : "boxes"}`
                      : `${l.quantity}`;

                    return (
                      <div
                        key={l.id}
                        className="flex justify-between items-start gap-3 text-xs sm:text-sm"
                      >
                        <span className="font-medium text-stone-700 dark:text-stone-300 leading-snug">
                          {l.product.name} × {qtyLabel}
                        </span>
                        <span className="font-bold font-heading text-stone-900 dark:text-stone-100 shrink-0">
                          {formatRawRupees(lineTotalRupees)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal */}
                <div className="pt-3 border-t border-[#CFDCD4]/70 dark:border-[#223832] space-y-2 text-sm">
                  <div className="flex justify-between text-stone-600 dark:text-stone-300">
                    <span>Subtotal</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 font-heading">
                      {formatRawRupees(rawSubtotalRupees)}
                    </span>
                  </div>

                  {/* Applied Discount Line */}
                  {appliedDiscount && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                      <span className="flex items-center gap-1.5">
                        Discount ({appliedDiscount.code} · {appliedDiscount.percent}%)
                        <button
                          type="button"
                          onClick={() => setAppliedDiscount(null)}
                          className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs"
                          title="Remove discount"
                        >
                          ✕
                        </button>
                      </span>
                      <span className="font-semibold font-heading">
                        -{formatRawRupees(discountAmountRupees)}
                      </span>
                    </div>
                  )}

                  {/* Delivery & Tax Notice */}
                  <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 pt-1">
                    <span>Delivery and tax:</span>
                    <span className="italic">at checkout</span>
                  </div>
                </div>

                {/* Discount Code Input */}
                <form
                  onSubmit={handleApplyDiscount}
                  className="mt-4 pt-3 border-t border-[#CFDCD4]/70 dark:border-[#223832]"
                >
                  <label
                    htmlFor="cart-discount-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5"
                  >
                    Discount code
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="cart-discount-input"
                      type="text"
                      placeholder="e.g. CLAY10"
                      value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value);
                        if (discountError) setDiscountError("");
                      }}
                      className="flex-1 rounded-[10px] border border-[#CFDCD4] dark:border-[#223832] bg-white dark:bg-stone-900 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4D47] dark:focus-visible:ring-[#2DD4BF]"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-[10px] bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4D47] transition shrink-0"
                    >
                      Apply
                    </button>
                  </div>

                  {discountError && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                      {discountError}
                    </p>
                  )}
                  {appliedDiscount && (
                    <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Promo code {appliedDiscount.code} applied!
                    </p>
                  )}
                </form>

                {/* Total So Far */}
                <div className="mt-5 pt-4 border-t border-[#CFDCD4] dark:border-[#223832] flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-semibold text-stone-700 dark:text-stone-300 block">
                      Total so far
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Excludes shipping calculation
                    </span>
                  </div>
                  <span className="text-2xl font-black font-heading text-[#0D4D47] dark:text-[#2DD4BF]">
                    {formatRawRupees(totalRupees)}
                  </span>
                </div>

                {/* Continue to Checkout Button */}
                <Link
                  href="/checkout"
                  className="mt-6 block w-full rounded-[12px] bg-[#0D4D47] hover:bg-[#083834] active:scale-[0.99] py-3.5 text-center text-sm font-bold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4D47] focus-visible:ring-offset-2 dark:focus-visible:ring-[#2DD4BF] transition"
                >
                  Continue to checkout →
                </Link>

                {/* Keep Shopping Link */}
                <Link
                  href="/shop"
                  className="mt-3 block text-center text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition"
                >
                  ← Keep shopping
                </Link>

                {/* Single Batch Matching Shade Notice */}
                <div className="mt-6 rounded-[10px] bg-[#E8EFEA]/80 dark:bg-[#132822]/60 border border-[#CFDCD4] dark:border-[#1E4339] p-3 text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                  <p className="font-semibold text-stone-800 dark:text-stone-200 mb-1 flex items-center gap-1">
                    <span>💡</span> Kiln Batch Shade Note
                  </p>
                  Ceramic tiles naturally experience subtle tone variations between kiln firings. We
                  recommend ordering all required boxes together in a single order to guarantee an
                  exact shade and glaze match.
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Floating Undo Toast (6 seconds) */}
      {undoToast && (
        <UndoToast
          item={undoToast}
          onUndo={handleUndo}
          onDismiss={() => {
            if (undoTimerRef.current) clearInterval(undoTimerRef.current);
            setUndoToast(null);
          }}
        />
      )}
    </main>
  );
}

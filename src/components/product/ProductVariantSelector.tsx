"use client";

import { useState, useEffect } from "react";
import type { ProductWithDetails, ProductVariant } from "@/db/schema";

type Props = {
  product: ProductWithDetails;
  variants: ProductVariant[];
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ProductVariantSelector({ product, variants }: Props) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    variants.length > 0 ? variants[0].id : null
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  // Sync with furniture viewer
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ colour?: string; hex?: string }>;
      if (custom.detail?.colour) {
        const v = variants.find(
          (item) => item.colour?.toLowerCase() === custom.detail?.colour?.toLowerCase()
        );
        if (v) setSelectedVariantId(v.id);
      }
    };
    window.addEventListener("clay-furniture-colour-change", handler);
    return () => window.removeEventListener("clay-furniture-colour-change", handler);
  }, [variants]);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const price = selectedVariant?.priceCents || product.priceCents;
  const salePrice = selectedVariant?.salePriceCents;
  const stock = selectedVariant?.stockQuantity || 0;
  const sku = selectedVariant?.sku || "";

  // Group variants by type for display
  const colours = [...new Set(variants.map((v) => v.colour).filter(Boolean))];
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
  const finishes = [...new Set(variants.map((v) => v.finish).filter(Boolean))];

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    
    setIsAdding(true);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant.id,
          quantity,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }

      setQuantity(1);
      // TODO: Show success toast
    } catch (error) {
      console.error("Failed to add to cart:", error);
      // TODO: Show error toast
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Price */}
      <div>
        {salePrice ? (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#E8A81C]">
              {formatPrice(salePrice)}
            </span>
            <span className="text-xl text-[#14262B]/50 line-through">
              {formatPrice(price)}
            </span>
            <span className="rounded bg-[#E8A81C] px-2 py-1 text-xs font-medium text-white">
              SALE
            </span>
          </div>
        ) : (
          <div className="text-3xl font-bold text-[#14262B]">
            {formatPrice(price)}
          </div>
        )}
        {sku && (
          <p className="mt-1 text-sm text-[#14262B]/70">SKU: {sku}</p>
        )}
      </div>

      {/* Colour Selector */}
      {colours.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-[#14262B]">
            Colour
          </label>
          <div className="flex flex-wrap gap-2">
            {colours.map((colour) => {
              const variant = variants.find((v) => v.colour === colour);
              const isSelected = selectedVariantId === variant?.id;
              return (
                <button
                  key={colour}
                  onClick={() => {
                    if (variant) {
                      setSelectedVariantId(variant.id);
                      window.dispatchEvent(
                        new CustomEvent("clay-furniture-colour-change", {
                          detail: { colour: variant.colour, hex: (variant as any)?.colorHex },
                        })
                      );
                    }
                  }}
                  className={`rounded border px-4 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-[#0F6B6B] bg-[#0F6B6B] text-white"
                      : "border-[#14262B]/20 bg-white text-[#14262B] hover:border-[#0F6B6B]"
                  }`}
                >
                  {colour}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selector */}
      {sizes.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-[#14262B]">
            Size
          </label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const variant = variants.find((v) => v.size === size);
              const isSelected = selectedVariantId === variant?.id;
              return (
                <button
                  key={size}
                  onClick={() => variant && setSelectedVariantId(variant.id)}
                  className={`rounded border px-4 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-[#0F6B6B] bg-[#0F6B6B] text-white"
                      : "border-[#14262B]/20 bg-white text-[#14262B] hover:border-[#0F6B6B]"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Finish Selector */}
      {finishes.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-[#14262B]">
            Finish
          </label>
          <div className="flex flex-wrap gap-2">
            {finishes.map((finish) => {
              const variant = variants.find((v) => v.finish === finish);
              const isSelected = selectedVariantId === variant?.id;
              return (
                <button
                  key={finish}
                  onClick={() => {
                    if (variant) {
                      setSelectedVariantId(variant.id);
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(
                          new CustomEvent("clay-finish-change", {
                            detail: { finish: variant.finish, colour: variant.colour },
                          })
                        );
                      }
                    }
                  }}
                  className={`rounded border px-4 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-[#0F6B6B] bg-[#0F6B6B] text-white"
                      : "border-[#14262B]/20 bg-white text-[#14262B] hover:border-[#0F6B6B]"
                  }`}
                >
                  {finish}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock Status */}
      <div>
        {stock > 0 ? (
          <p className="text-sm text-[#0F6B6B]">
            {stock} in stock
            {stock <= 10 && <span className="ml-1 text-[#E8A81C]">(Low stock)</span>}
          </p>
        ) : (
          <p className="text-sm font-medium text-[#14262B]">Out of stock</p>
        )}
      </div>

      {/* Quantity and Add to Cart */}
      {stock > 0 && (
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="quantity" className="text-sm font-medium text-[#14262B]">
              Qty:
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              max={stock}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(stock, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-20 rounded border border-[#14262B]/20 px-3 py-2 text-[#14262B]"
            />
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={isAdding || !selectedVariant}
            className="flex-1 rounded bg-[#0F6B6B] px-6 py-3 font-medium text-white hover:bg-[#0F6B6B]/90 disabled:bg-[#14262B]/20 disabled:text-[#14262B]/50"
          >
            {isAdding ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      )}
    </div>
  );
}

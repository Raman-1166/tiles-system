"use client";

import React, { useState, useMemo } from "react";
import { FurnitureCard } from "./FurnitureCard";
import {
  REFERENCE_FABRICS,
  REFERENCE_FINISHES,
  getFurnitureMeta,
  formatPrice,
} from "@/lib/furniture3d";
import s from "./furniture.module.css";

interface Props {
  products: any[];
}

export function FurnitureSection({ products }: Props) {
  // Extract categories present in data
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      const slug = p.category?.slug || p.categorySlug || "other";
      const name = p.category?.name || p.categorySlug || "Other";
      if (!map.has(slug)) {
        map.set(slug, name);
      }
    }
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [products]);

  // Extract min/max price range from data
  const { minPrice, maxPrice } = useMemo(() => {
    let min = Infinity;
    let max = 0;
    for (const p of products) {
      const vars = p.productVariants || p.variants || [];
      const lowest =
        vars.length > 0
          ? Math.min(...vars.map((v: any) => v.priceCents || p.priceCents))
          : p.priceCents;
      if (lowest < min) min = lowest;
      if (lowest > max) max = lowest;
    }
    return {
      minPrice: min === Infinity ? 0 : min,
      maxPrice: max === 0 ? 200000 : max,
    };
  }, [products]);

  // Filter & sort states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedColours, setSelectedColours] = useState<string[]>([]);
  const [priceLimit, setPriceLimit] = useState<number>(maxPrice);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Available filter swatches (combined fabrics & finishes)
  const allSwatches = useMemo(() => {
    const combined = [...REFERENCE_FABRICS, ...REFERENCE_FINISHES];
    const map = new Map<string, string>();
    combined.forEach((c) => {
      if (!map.has(c.hex)) map.set(c.hex, c.name);
    });
    return Array.from(map.entries()).map(([hex, name]) => ({ hex, name }));
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category match
      if (selectedCategories.length > 0) {
        const catSlug = p.category?.slug || p.categorySlug || "";
        if (!selectedCategories.includes(catSlug)) return false;
      }

      // Price match
      const vars = p.productVariants || p.variants || [];
      const lowest =
        vars.length > 0
          ? Math.min(...vars.map((v: any) => v.priceCents || p.priceCents))
          : p.priceCents;
      if (lowest > priceLimit) return false;

      // Colour match (matches if ANY option matches)
      if (selectedColours.length > 0) {
        const meta = getFurnitureMeta(p);
        const hasColour = meta.colourOptions.some((opt) =>
          selectedColours.includes(opt.hex)
        );
        if (!hasColour) return false;
      }

      return true;
    });
  }, [products, selectedCategories, selectedColours, priceLimit]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === "price_asc") {
      list.sort((a, b) => {
        const aP = (a.productVariants?.[0]?.priceCents ?? a.priceCents) || 0;
        const bP = (b.productVariants?.[0]?.priceCents ?? b.priceCents) || 0;
        return aP - bP;
      });
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => {
        const aP = (a.productVariants?.[0]?.priceCents ?? a.priceCents) || 0;
        const bP = (b.productVariants?.[0]?.priceCents ?? b.priceCents) || 0;
        return bP - aP;
      });
    }
    return list;
  }, [filteredProducts, sortBy]);

  const activeFiltersCount =
    selectedCategories.length +
    selectedColours.length +
    (priceLimit < maxPrice ? 1 : 0);

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedColours([]);
    setPriceLimit(maxPrice);
  };

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const toggleColour = (hex: string) => {
    setSelectedColours((prev) =>
      prev.includes(hex) ? prev.filter((c) => c !== hex) : [...prev, hex]
    );
  };

  return (
    <div className={s.layout}>
      {/* Mobile backdrop */}
      <div
        className={`${s.sheetOverlay} ${mobileOpen ? s.sheetOverlayOpen : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar / Bottom sheet on <=860px */}
      <aside
        className={`${s.sidebar} ${mobileOpen ? s.sidebarMobileOpen : ""}`}
        aria-label="Filters"
      >
        {mobileOpen && (
          <div className={s.sheetHeader}>
            <span className="font-semibold text-[#14262b]">Filters ({activeFiltersCount})</span>
            <button
              type="button"
              className={s.sheetCloseBtn}
              onClick={() => setMobileOpen(false)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div className={s.filterGroup}>
            <div className="flex items-center justify-between mb-3">
              <span className={s.filterGroupTitle}>Category</span>
            </div>
            <div className={s.checkboxList}>
              {categories.map((cat) => (
                <label key={cat.slug} className={s.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.slug)}
                    onChange={() => toggleCategory(cat.slug)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Colours */}
        <div className={s.filterGroup}>
          <div className="flex items-center justify-between mb-3">
            <span className={s.filterGroupTitle}>Colour</span>
          </div>
          <div className={s.colorSwatches} role="group" aria-label="Filter by colour">
            {allSwatches.map((c) => {
              const isSelected = selectedColours.includes(c.hex);
              return (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  aria-pressed={isSelected}
                  className={`${s.swatchBtn} ${isSelected ? s.swatchActive : ""}`}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => toggleColour(c.hex)}
                />
              );
            })}
          </div>
        </div>

        {/* Price Slider */}
        <div className={s.filterGroup}>
          <div className="flex items-center justify-between mb-2">
            <span className={s.filterGroupTitle}>Max Price</span>
            <span className="text-sm font-semibold text-[#14262b]">
              {formatPrice(priceLimit)}
            </span>
          </div>
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            step={1000}
            value={priceLimit}
            onChange={(e) => setPriceLimit(Number(e.target.value))}
            className={s.priceSlider}
            aria-label="Maximum price filter"
          />
          <div className={s.priceLabel}>
            <span>{formatPrice(minPrice)}</span>
            <span>{formatPrice(maxPrice)}</span>
          </div>
        </div>

        {/* Clear all */}
        {activeFiltersCount > 0 && (
          <div>
            <button type="button" onClick={clearAll} className={s.clearBtn}>
              Clear all filters ({activeFiltersCount})
            </button>
          </div>
        )}

        {mobileOpen && (
          <button
            type="button"
            className={s.sheetSubmitBtn}
            onClick={() => setMobileOpen(false)}
          >
            Show {filteredProducts.length} pieces
          </button>
        )}
      </aside>

      {/* Main Content */}
      <section className={s.mainContent}>
        {/* Top bar with count, mobile button, and sort */}
        <div className={s.topBar}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={s.mobileFilterBtn}
              onClick={() => setMobileOpen(true)}
            >
              <span>Filters ({activeFiltersCount})</span>
            </button>
            <p className={s.countText}>
              Showing {sortedProducts.length} {sortedProducts.length === 1 ? "piece" : "pieces"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="furniture-sort" className="text-sm text-[#55696f]">
              Sort by
            </label>
            <select
              id="furniture-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={s.sortSelect}
            >
              <option value="newest">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Grid or Empty State */}
        {sortedProducts.length === 0 ? (
          <div className={s.emptyState}>
            <h3 className={s.emptyTitle}>No matching furniture found</h3>
            <p className={s.emptyText}>
              Try adjusting your filter options or clearing selected filters to see all available pieces.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-full bg-[#14262b] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0f6b6b] transition"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className={s.grid}>
            {sortedProducts.map((product) => (
              <FurnitureCard key={product.id || product.slug} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

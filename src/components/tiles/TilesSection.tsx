"use client";

import { useState, useMemo } from "react";
import type { Product } from "@/db/schema";
import { TileCard } from "./TileCard";
import {
  TileFiltersSidebar,
  MobileFilterBar,
  makeDefaultFilters,
  type FilterState,
  type SortKey,
} from "./TileFilters";
import s from "./tiles.module.css";

interface Props {
  products: Product[];
}

export function TilesSection({ products }: Props) {
  const [filters, setFilters] = useState<FilterState>(makeDefaultFilters);
  const [sort, setSort]       = useState<SortKey>("featured");

  // Collect all unique size labels from products
  const allSizes = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.sizeLabel) set.add(p.sizeLabel);
    }
    return Array.from(set).sort();
  }, [products]);

  // Apply filters (multi-select within group = OR; across groups = AND)
  const filtered = useMemo(() => {
    return products.filter((p) => {
      // Type filter
      if (filters.types.size > 0) {
        if (!p.tileType || !filters.types.has(p.tileType)) return false;
      }
      // Colour filter
      if (filters.colours.size > 0) {
        if (!p.colourFamily || !filters.colours.has(p.colourFamily)) return false;
      }
      // Size filter
      if (filters.sizes.size > 0) {
        if (!p.sizeLabel || !filters.sizes.has(p.sizeLabel)) return false;
      }
      // Price per m² filter
      if (filters.maxPriceM2 < 50000) {
        const pm2 = p.pricePerM2 ?? p.priceCents;
        if (pm2 > filters.maxPriceM2) return false;
      }
      return true;
    });
  }, [products, filters]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === "price_asc") {
      arr.sort((a, b) => (a.pricePerM2 ?? a.priceCents) - (b.pricePerM2 ?? b.priceCents));
    } else if (sort === "price_desc") {
      arr.sort((a, b) => (b.pricePerM2 ?? b.priceCents) - (a.pricePerM2 ?? a.priceCents));
    } else {
      // Featured first, then original order
      arr.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return arr;
  }, [filtered, sort]);

  const handleFilters = (f: FilterState) => setFilters(f);

  return (
    <>
      {/* Mobile: filter button + sort (hidden on desktop) */}
      <MobileFilterBar
        filters={filters}
        onChange={handleFilters}
        totalVisible={sorted.length}
        allSizes={allSizes}
        sort={sort}
        onSort={setSort}
      />

      <div className={s.shopLayout}>
        {/* Desktop sidebar (hidden on mobile) */}
        <TileFiltersSidebar
          filters={filters}
          onChange={handleFilters}
          totalVisible={sorted.length}
          allSizes={allSizes}
        />

        {/* Grid */}
        <div>
          {/* Grid header: count + sort */}
          <div className={s.gridHeader}>
            <span className={s.gridCount}>
              {sorted.length} tile{sorted.length !== 1 ? "s" : ""}
            </span>
            <select
              className={s.sortSelect}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort tiles"
            >
              <option value="featured">Featured</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
          </div>

          {sorted.length === 0 ? (
            <div className={s.empty}>
              <p>No tiles match these filters. Clear a filter to see more.</p>
              <button
                className={s.emptyBtn}
                type="button"
                onClick={() => setFilters(makeDefaultFilters())}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className={s.grid}>
              {sorted.map((p, i) => (
                <TileCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

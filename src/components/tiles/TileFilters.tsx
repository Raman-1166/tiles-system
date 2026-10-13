"use client";

import { useState } from "react";
import s from "./tiles.module.css";

// ── types ──────────────────────────────────────────────────────────────────
export type SortKey = "featured" | "price_asc" | "price_desc";

export interface FilterState {
  types:    Set<string>;  // Gloss | Matte | Natural | Mosaic
  colours:  Set<string>;  // White | Beige | Grey | Charcoal | Blue | Green | Terracotta | Wood
  sizes:    Set<string>;  // sizeLabel values
  maxPriceM2: number;     // cents per m²
  sort:     SortKey;
}

export function makeDefaultFilters(): FilterState {
  return {
    types:      new Set(),
    colours:    new Set(),
    sizes:      new Set(),
    maxPriceM2: 50000, // $500/m² ceiling
    sort:       "featured",
  };
}

// ── swatch colour map ──────────────────────────────────────────────────────
const COLOUR_HEX: Record<string, string> = {
  White:      "#f0eee8",
  Beige:      "#cdb99b",
  Grey:       "#9ca3af",
  Charcoal:   "#3d4043",
  Blue:       "#20395c",
  Green:      "#8ea592",
  Terracotta: "#b8613b",
  Wood:       "#8a5a34",
};

// ── sidebar content (shared by desktop sidebar + mobile sheet) ─────────────
interface FiltersContentProps {
  filters:       FilterState;
  onChange:      (f: FilterState) => void;
  totalVisible:  number;
  allSizes:      string[];
  onClose?:      () => void;  // only passed in mobile sheet
}

export function FiltersContent({
  filters,
  onChange,
  totalVisible,
  allSizes,
  onClose,
}: FiltersContentProps) {
  const hasActive =
    filters.types.size > 0 ||
    filters.colours.size > 0 ||
    filters.sizes.size > 0 ||
    filters.maxPriceM2 < 50000;

  function toggleSet(key: "types" | "colours" | "sizes", value: string) {
    const next = new Set(filters[key]);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange({ ...filters, [key]: next });
  }

  function clearAll() {
    onChange(makeDefaultFilters());
  }

  return (
    <>
      <div className={s.filterHead}>
        <span className={s.filterTitle}>Filters</span>
        {hasActive && (
          <button className={s.clearBtn} onClick={clearAll} type="button">
            Clear all
          </button>
        )}
      </div>

      {/* Type */}
      <div className={s.filterGroup}>
        <span className={s.filterGroupLabel}>Type</span>
        <div className={s.checkList}>
          {(["Gloss", "Matte", "Natural", "Mosaic"] as const).map((t) => (
            <label key={t} className={s.checkItem}>
              <input
                type="checkbox"
                checked={filters.types.has(t)}
                onChange={() => toggleSet("types", t)}
              />
              <span>{t}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Colour */}
      <div className={s.filterGroup}>
        <span className={s.filterGroupLabel}>Colour</span>
        <div className={s.swatchGrid} role="group" aria-label="Colour filter">
          {Object.entries(COLOUR_HEX).map(([name, hex]) => (
            <button
              key={name}
              type="button"
              className={`${s.swatch} ${filters.colours.has(name) ? s.swatchActive : ""}`}
              style={{ backgroundColor: hex }}
              aria-label={`${name}${filters.colours.has(name) ? " (selected)" : ""}`}
              aria-pressed={filters.colours.has(name)}
              onClick={() => toggleSet("colours", name)}
            />
          ))}
        </div>
      </div>

      {/* Size */}
      {allSizes.length > 0 && (
        <div className={s.filterGroup}>
          <span className={s.filterGroupLabel}>Size</span>
          <div className={s.checkList}>
            {allSizes.map((sz) => (
              <label key={sz} className={s.checkItem}>
                <input
                  type="checkbox"
                  checked={filters.sizes.has(sz)}
                  onChange={() => toggleSet("sizes", sz)}
                />
                <span>{sz}cm</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price per m² */}
      <div className={s.filterGroup}>
        <div className={s.priceRow}>
          <span className={s.priceLabel}>Price per m²</span>
          <span className={s.priceValue}>
            up to ${(filters.maxPriceM2 / 100).toFixed(0)}
          </span>
        </div>
        <input
          type="range"
          className={s.rangeSlider}
          min={1000}
          max={50000}
          step={500}
          value={filters.maxPriceM2}
          onChange={(e) =>
            onChange({ ...filters, maxPriceM2: Number(e.target.value) })
          }
          aria-label="Maximum price per m²"
        />
      </div>

      {/* Mobile "show N tiles" button */}
      {onClose && (
        <button className={s.showTilesBtn} onClick={onClose} type="button">
          Show {totalVisible} tile{totalVisible !== 1 ? "s" : ""}
        </button>
      )}
    </>
  );
}

// ── desktop sidebar ────────────────────────────────────────────────────────
interface SidebarProps {
  filters:      FilterState;
  onChange:     (f: FilterState) => void;
  totalVisible: number;
  allSizes:     string[];
}

export function TileFiltersSidebar({
  filters,
  onChange,
  totalVisible,
  allSizes,
}: SidebarProps) {
  return (
    <aside className={s.sidebar}>
      <div className={s.sidebarInner}>
        <FiltersContent
          filters={filters}
          onChange={onChange}
          totalVisible={totalVisible}
          allSizes={allSizes}
        />
      </div>
    </aside>
  );
}

// ── mobile filter button + bottom sheet ───────────────────────────────────
interface MobileProps extends SidebarProps {
  sort:     SortKey;
  onSort:   (s: SortKey) => void;
}

export function MobileFilterBar({
  filters,
  onChange,
  totalVisible,
  allSizes,
  sort,
  onSort,
}: MobileProps) {
  const [open, setOpen] = useState(false);

  const activeCount =
    filters.types.size +
    filters.colours.size +
    filters.sizes.size +
    (filters.maxPriceM2 < 50000 ? 1 : 0);

  return (
    <>
      <div className={s.mobileFilterBar}>
        <button
          type="button"
          className={s.mobileFilterBtn}
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="mobile-filter-sheet"
        >
          ⚙ Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>

        <select
          className={s.sortSelect}
          value={sort}
          onChange={(e) => onSort(e.target.value as SortKey)}
          aria-label="Sort tiles"
        >
          <option value="featured">Featured</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>
      </div>

      {open && (
        <>
          {/* Overlay */}
          <div
            className={s.sheetOverlay}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Sheet */}
          <div
            id="mobile-filter-sheet"
            className={s.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Tile filters"
          >
            <div className={s.sheetHandle} aria-hidden="true" />
            <FiltersContent
              filters={filters}
              onChange={onChange}
              totalVisible={totalVisible}
              allSizes={allSizes}
              onClose={() => setOpen(false)}
            />
          </div>
        </>
      )}
    </>
  );
}

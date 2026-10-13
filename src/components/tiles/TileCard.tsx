"use client";

import { useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { shot, deriveSpec, type TileSpec } from "@/lib/tileArt";
import { getProductRealFinishes, sideColor, mixColor } from "./TileImage";
import type { Product } from "@/db/schema";
import s from "./tiles.module.css";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ── component ──────────────────────────────────────────────────────────────
interface Props {
  product: Product;
  index:   number; // for deterministic seed
}

export function TileCard({ product, index }: Props) {
  const stageRef    = useRef<HTMLDivElement>(null);
  const slabRef     = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const altCanvasRef  = useRef<HTMLCanvasElement>(null);

  // Real finish resolution: "Gloss · Matte" if both, Gloss flag matches
  const { finishTag, isGloss } = getProductRealFinishes(product);

  const spec: TileSpec = deriveSpec({
    name:            product.name,
    visualizerColor: product.visualizerColor,
    pattern:         product.pattern,
    finish:          isGloss ? "gloss" : "matte",
    groutColor:      product.groutColor,
    tileLayout:      product.tileLayout,
    tilesAcross:     product.tilesAcross,
  });

  // Ensure art's gloss flag matches the resolved finish (draw Gloss version on card if both)
  spec.gloss = isGloss;

  // Alternate layout spec (swap straight↔herringbone)
  const altSpec: TileSpec = {
    ...spec,
    layout: spec.layout === "straight" ? "herringbone" : "straight",
  };

  // Draw both canvases once after mount
  useEffect(() => {
    const main = mainCanvasRef.current;
    const alt  = altCanvasRef.current;
    if (!main || !alt) return;

    // Use requestAnimationFrame to ensure DOM is ready
    const raf = requestAnimationFrame(() => {
      shot(main, spec, index * 97 + 11);
      shot(alt,  altSpec, index * 97 + 53);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGloss]);

  // ── Hover tilt (NO React state — pure imperative CSS vars) ────────────────
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Skip touch and reduced-motion
    if (e.pointerType === "touch") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const stage = stageRef.current;
    const slab  = slabRef.current;
    if (!stage || !slab) return;

    const rect = stage.getBoundingClientRect();
    const px   = (e.clientX - rect.left) / rect.width;   // 0→1
    const py   = (e.clientY - rect.top)  / rect.height;  // 0→1

    // ±13deg pointer offset on top of base transform
    const ry =  (px - 0.5) * 26;   // +right / -left
    const rx = -(py - 0.5) * 26;   // +up    / -down

    slab.style.setProperty("--rx", String(rx.toFixed(2)));
    slab.style.setProperty("--ry", String(ry.toFixed(2)));

    // Glare origin follows cursor (percentage of stage)
    stage.style.setProperty("--mx", String((px * 100).toFixed(1)));
    stage.style.setProperty("--my", String((py * 100).toFixed(1)));
  }, []);

  const handlePointerLeave = useCallback(() => {
    const slab = slabRef.current;
    if (slab) {
      slab.style.removeProperty("--rx");
      slab.style.removeProperty("--ry");
    }
    const stage = stageRef.current;
    if (stage) {
      stage.style.removeProperty("--mx");
      stage.style.removeProperty("--my");
    }
  }, []);

  const tileColor    = spec.color;
  const sideColorTop = mixColor(tileColor, 0.9);
  const sideColorBot = mixColor(tileColor, 0.7);
  const sideColorL   = mixColor(tileColor, 1.15);
  const sideColorR   = mixColor(tileColor, 0.6);
  const backColor    = sideColor(tileColor, 0.5);

  const pricePerM2   = product.pricePerM2;
  const showFrom     = product.showFromPrice;
  const sizeLabel    = product.sizeLabel ?? (product.tileSizeCm ? `${product.tileSizeCm}×${product.tileSizeCm}` : null);

  // Check if product name already ends with the size (e.g. 20x20 or 20×20)
  const nameTrim = product.name.trim().toLowerCase();
  const sizeLabelNorm = sizeLabel ? sizeLabel.trim().toLowerCase() : "";
  const labelX = sizeLabelNorm.replace(/×/g, "x");
  const labelTimes = sizeLabelNorm.replace(/x/g, "×");
  const nameAlreadyEndsWithSize =
    Boolean(sizeLabel && (nameTrim.endsWith(labelX) || nameTrim.endsWith(labelTimes))) ||
    /\b\d+\s*[x×]\s*\d+$/i.test(nameTrim);
  const showSeparateSize = Boolean(sizeLabel && !nameAlreadyEndsWithSize);

  return (
    <Link
      href={`/shop/tile/${product.slug}`}
      className={s.card}
      aria-label={`${product.name}${showSeparateSize && sizeLabel ? ` ${sizeLabel}cm` : ""}`}
    >
      {/* ── Image / Stage ── */}
      <div
        ref={stageRef}
        className={s.stage}
        style={{ "--tile-color": tileColor } as React.CSSProperties}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {/* 3D slab scene: direct parent of .slab with perspective: 900px */}
        <div className={s.scene} style={{ perspective: "900px" }}>
          <div ref={slabRef} className={s.slab}>
            {/* Front face — main layout */}
            <div className={s.slabFront}>
              <canvas
                ref={mainCanvasRef}
                width={480}
                height={480}
                style={{ width: "100%", height: "100%", display: "block" }}
                role="img"
                aria-label={`${product.name} tile, close-up`}
              />
            </div>

            {/* Front face alt — crossfades on hover */}
            <div className={s.slabFrontAlt}>
              <canvas
                ref={altCanvasRef}
                width={480}
                height={480}
                style={{ width: "100%", height: "100%", display: "block" }}
                aria-hidden="true"
              />
            </div>

            {/* Glare */}
            <div className={s.glare} aria-hidden="true" />

            {/* Back face */}
            <div
              className={s.slabBack}
              style={{ background: backColor }}
              aria-hidden="true"
            />

            {/* Side faces */}
            <div
              className={`${s.slabSide} ${s.slabSideTop}`}
              style={{ background: sideColorTop, height: 18 }}
              aria-hidden="true"
            />
            <div
              className={`${s.slabSide} ${s.slabSideBottom}`}
              style={{ background: sideColorBot, height: 18 }}
              aria-hidden="true"
            />
            <div
              className={`${s.slabSide} ${s.slabSideLeft}`}
              style={{ background: sideColorL, width: 18 }}
              aria-hidden="true"
            />
            <div
              className={`${s.slabSide} ${s.slabSideRight}`}
              style={{ background: sideColorR, width: 18 }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Finish tag */}
        {finishTag && (
          <span className={s.finishTag} aria-label={`Finish: ${finishTag}`}>
            {finishTag}
          </span>
        )}
      </div>

      {/* ── Card body ── */}
      <div className={s.cardBody}>
        <p className={s.cardName}>
          {product.name}
          {showSeparateSize && sizeLabel && <span className={s.cardSize}>{sizeLabel}cm</span>}
        </p>

        {product.tagline && (
          <p className={s.cardDesc}>{product.tagline}</p>
        )}

        <div className={s.cardPrice}>
          {showFrom && <span className={s.priceFrom}>from</span>}
          <span className={s.priceAmount}>
            {pricePerM2 ? formatPrice(pricePerM2) : formatPrice(product.priceCents)}
          </span>
          {pricePerM2 && <span className={s.priceUnit}>/m²</span>}
        </div>

        <span
          className={s.viewBtn}
          role="button"
          tabIndex={0}
          aria-label={`View ${product.name} in room`}
          onClick={(e) => {
            e.preventDefault();
            window.location.href = `/visualizer?tile=${product.slug}`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              window.location.href = `/visualizer?tile=${product.slug}`;
            }
          }}
        >
          View in room
        </span>
      </div>
    </Link>
  );
}

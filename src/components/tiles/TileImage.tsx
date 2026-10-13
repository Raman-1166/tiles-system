"use client";

import React, { useRef, useEffect, useState, useCallback, useId } from "react";
import {
  surf,
  light,
  deriveSpec,
  type TileSpec,
  type TileLayout,
} from "@/lib/tileArt";
import s from "./tileImage.module.css";

// ── Types ──────────────────────────────────────────────────────────────────
export type TileImageVariant = "closeup" | "alt" | "slab" | "scale";

export interface TileProductData {
  slug?: string;
  name?: string;
  visualizerColor?: string | null;
  pattern?: string | null;
  finish?: string | null;
  groutColor?: string | null;
  tileLayout?: string | null;
  layout?: string | null;
  tilesAcross?: number | null;
  sizeLabel?: string | null;
  tileSizeCm?: number | null;
  tileType?: string | null;
  specs?: Record<string, string> | null;
  productVariants?: Array<{ finish?: string | null; colour?: string | null }>;
  variants?: any;
}

export interface TileImageProps {
  product: TileProductData;
  variant?: TileImageVariant;
  finish?: "Gloss" | "Matte";
  size?: number; // size in px, e.g. 96, 240, 480, 960
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
  interactive?: boolean; // For 3D slab drag / pointer tilt / idle sway
  onClick?: () => void;
}

// ── Cache & Helpers ────────────────────────────────────────────────────────
const imageCache = new Map<string, HTMLCanvasElement>();
const warnedProducts = new Set<string>();

export function sideColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16) || 200;
  const g = parseInt(hex.slice(3, 5), 16) || 200;
  const b = parseInt(hex.slice(5, 7), 16) || 200;
  return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
}

export function mixColor(hex: string, factor: number): string {
  const r1 = parseInt(hex.slice(1, 3), 16) || 200;
  const g1 = parseInt(hex.slice(3, 5), 16) || 200;
  const b1 = parseInt(hex.slice(5, 7), 16) || 200;
  const r2 = 0x7a;
  const g2 = 0x6a;
  const b2 = 0x58;
  const t = 0.45;
  const r = Math.round(r1 * (1 - t) + r2 * t);
  const g = Math.round(g1 * (1 - t) + g2 * t);
  const b = Math.round(b1 * (1 - t) + b2 * t);
  return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function formatDimensionLabel(product: TileProductData): string {
  if (product.sizeLabel) {
    const raw = product.sizeLabel.trim();
    // E.g. "20×20", "20x20", "5×5 hex"
    const match = raw.match(/^(\d+)\s*[x×]\s*(\d+)/i);
    if (match) {
      return `${match[1]} × ${match[2]} cm`;
    }
    return `${raw} cm`;
  }
  if (product.tileSizeCm) {
    return `${product.tileSizeCm} × ${product.tileSizeCm} cm`;
  }
  return "20 × 20 cm";
}

/**
 * Determines real finish information from product and variants data.
 */
export function getProductRealFinishes(product: TileProductData): {
  finishTag: string;
  isGloss: boolean;
  hasBoth: boolean;
} {
  const variantFinishes = new Set<string>();
  if (Array.isArray(product.productVariants)) {
    for (const v of product.productVariants) {
      if (v.finish) variantFinishes.add(v.finish.toLowerCase());
    }
  }
  if (Array.isArray(product.variants)) {
    for (const v of product.variants) {
      if (v.finish) variantFinishes.add(v.finish.toLowerCase());
    }
  }

  const specFinish = (product.specs?.Finish || product.specs?.finish || "").toLowerCase();
  const isCharcoal = product.slug?.includes("charcoal");

  const hasGloss =
    variantFinishes.has("gloss") ||
    product.finish?.toLowerCase() === "gloss" ||
    product.tileType?.toLowerCase() === "gloss" ||
    specFinish.includes("gloss") ||
    isCharcoal;

  const hasMatte =
    variantFinishes.has("matte") ||
    (!isCharcoal &&
      (product.finish?.toLowerCase() === "matte" ||
        product.tileType?.toLowerCase() === "matte" ||
        specFinish.includes("matte")));

  if (hasGloss && hasMatte) {
    return { finishTag: "Gloss · Matte", isGloss: true, hasBoth: true };
  } else if (hasGloss) {
    return { finishTag: "Gloss", isGloss: true, hasBoth: false };
  } else if (hasMatte) {
    return { finishTag: "Matte", isGloss: false, hasBoth: false };
  }

  const fallbackTag =
    product.tileType ??
    (product.finish === "gloss" ? "Gloss" : product.finish === "matte" ? "Matte" : "Natural");
  return {
    finishTag: fallbackTag,
    isGloss: fallbackTag.toLowerCase() === "gloss",
    hasBoth: false,
  };
}

// ── TileImage Component ────────────────────────────────────────────────────
export function TileImage({
  product,
  variant = "closeup",
  finish: finishOverride,
  size,
  className,
  style,
  alt,
  interactive = false,
  onClick,
}: TileImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slabRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const uniqueId = useId();

  // Drag-to-rotate state for interactive slab
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; rx: number; ry: number }>({
    x: 0,
    y: 0,
    rx: 0,
    ry: 0,
  });
  const currentDragRef = useRef<{ rx: number; ry: number }>({ rx: 0, ry: 0 });

  // 1. Resolve finishes & colours
  const realFinishes = getProductRealFinishes(product);
  const effectiveFinish = finishOverride ?? (realFinishes.isGloss ? "Gloss" : "Matte");
  const isGloss = effectiveFinish === "Gloss";

  // Check if Matte variant has its own colour override
  let colorOverride = product.visualizerColor;
  if (!isGloss && Array.isArray(product.productVariants)) {
    const matteVar = product.productVariants.find(
      (v) => v.finish?.toLowerCase() === "matte" && v.colour
    );
    if (matteVar?.colour && matteVar.colour.startsWith("#")) {
      colorOverride = matteVar.colour;
    }
  }

  // Derive TileSpec safely with single warning on missing fields
  const specKey = product.slug || product.name || "unknown-tile";
  let spec: TileSpec;
  if (warnedProducts.has(specKey)) {
    // Silent derivation
    spec = deriveSpec({
      name: product.name ?? "Tile",
      visualizerColor: colorOverride,
      pattern: product.pattern,
      finish: isGloss ? "gloss" : "matte",
      groutColor: product.groutColor,
      tileLayout: product.tileLayout ?? product.layout,
      tilesAcross: product.tilesAcross,
    });
  } else {
    warnedProducts.add(specKey);
    spec = deriveSpec({
      name: product.name ?? "Tile",
      visualizerColor: colorOverride,
      pattern: product.pattern,
      finish: isGloss ? "gloss" : "matte",
      groutColor: product.groutColor,
      tileLayout: product.tileLayout ?? product.layout,
      tilesAcross: product.tilesAcross,
    });
  }

  // Force gloss boolean to match effective finish
  spec.gloss = isGloss;

  // Determine layout and tilesAcross per variant
  if (variant === "alt") {
    spec = {
      ...spec,
      layout: (spec.layout === "straight" ? "herringbone" : "straight") as TileLayout,
    };
  } else if (variant === "scale") {
    spec = {
      ...spec,
      layout: "straight",
      tilesAcross: 3,
    };
  }

  const tileColor = spec.color || "#c8c4bc";
  const seed = hashString(product.slug || product.name || "tile") * 97 + (variant === "alt" ? 53 : 11);

  // 2. Client-only mounting flag
  useEffect(() => {
    setMounted(true);
  }, []);

  // 3. Drawing into canvas with cache and DPR cap
  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    const targetSize = size ?? 480;
    const drawW = Math.round(targetSize * dpr);
    const drawH = Math.round(targetSize * dpr);

    const cacheKey = `${product.slug || product.name}_${variant}_${effectiveFinish}_${targetSize}_${dpr}_${tileColor}`;

    let cached = imageCache.get(cacheKey);
    if (!cached) {
      // Draw onto offscreen canvas and cache
      cached = document.createElement("canvas");
      cached.width = drawW;
      cached.height = drawH;
      const offCtx = cached.getContext("2d");
      if (offCtx) {
        surf(cached, spec, seed);
        light(offCtx, drawW, drawH, spec.gloss);
        imageCache.set(cacheKey, cached);
      }
    }

    // Set canvas dimensions
    canvas.width = drawW;
    canvas.height = drawH;
    const ctx = canvas.getContext("2d");
    if (ctx && cached) {
      ctx.clearRect(0, 0, drawW, drawH);
      ctx.drawImage(cached, 0, 0);
    }
  }, [mounted, variant, effectiveFinish, size, spec, seed, product.slug, product.name, tileColor]);

  // 4. Interactive pointer tilt & drag for 3D slab
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      const slab = slabRef.current;
      if (!container || !slab) return;

      const rect = container.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      // Update glare coordinates
      container.style.setProperty("--mx", String((px * 100).toFixed(1)));
      container.style.setProperty("--my", String((py * 100).toFixed(1)));

      if (isDraggingRef.current) {
        // Drag-to-rotate
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        const dry = dragStartRef.current.ry + dx * 0.5;
        const drx = Math.max(-45, Math.min(45, dragStartRef.current.rx - dy * 0.5));
        currentDragRef.current = { rx: drx, ry: dry };
        slab.style.setProperty("--drag-rx", String(drx.toFixed(2)));
        slab.style.setProperty("--drag-ry", String(dry.toFixed(2)));
      } else {
        // Subtle pointer tilt if not reduced-motion and not touch
        if (e.pointerType !== "touch" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          const ry = (px - 0.5) * 24;
          const rx = -(py - 0.5) * 24;
          slab.style.setProperty("--rx", String(rx.toFixed(2)));
          slab.style.setProperty("--ry", String(ry.toFixed(2)));
        }
      }
    },
    []
  );

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      rx: currentDragRef.current.rx,
      ry: currentDragRef.current.ry,
    };
    if (slabRef.current) {
      slabRef.current.classList.add(s.slabDragging);
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [interactive]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    isDraggingRef.current = false;
    if (slabRef.current) {
      slabRef.current.classList.remove(s.slabDragging);
    }
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  }, [interactive]);

  const handlePointerLeave = useCallback(() => {
    if (isDraggingRef.current) return;
    const slab = slabRef.current;
    if (slab) {
      slab.style.removeProperty("--rx");
      slab.style.removeProperty("--ry");
    }
  }, []);

  // 5. Idle sway for interactive 3D slab
  useEffect(() => {
    if (!interactive || variant !== "slab" || !mounted) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let animId: number;
    const startTime = performance.now();

    const loop = (t: number) => {
      if (!isDraggingRef.current && slabRef.current) {
        const elapsed = (t - startTime) * 0.001;
        const swayRy = Math.sin(elapsed * 0.8) * 4.5;
        const swayRx = Math.cos(elapsed * 0.6) * 3.0;
        slabRef.current.style.setProperty("--sway-rx", swayRx.toFixed(2));
        slabRef.current.style.setProperty("--sway-ry", swayRy.toFixed(2));
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [interactive, variant, mounted]);

  // Derived 3D slab colors
  const sideColorTop = mixColor(tileColor, 0.9);
  const sideColorBot = mixColor(tileColor, 0.7);
  const sideColorL = mixColor(tileColor, 1.15);
  const sideColorR = mixColor(tileColor, 0.6);
  const backColor = sideColor(tileColor, 0.5);

  const altText = alt ?? `${product.name ?? "Tile"} — ${variant}`;

  // Neutral background style avoiding hydration mismatch
  const containerStyle: React.CSSProperties = {
    ...style,
    "--tile-bg": `radial-gradient(circle at 60% 38%, color-mix(in srgb, ${tileColor} 38%, #f0ede6), #e8e4de)`,
    aspectRatio: "1 / 1",
  } as React.CSSProperties;

  return (
    <div
      ref={containerRef}
      className={`${s.container} ${className ?? ""}`}
      style={containerStyle}
      onClick={onClick}
      onPointerMove={variant === "slab" ? handlePointerMove : undefined}
      onPointerDown={variant === "slab" && interactive ? handlePointerDown : undefined}
      onPointerUp={variant === "slab" && interactive ? handlePointerUp : undefined}
      onPointerLeave={variant === "slab" ? handlePointerLeave : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {variant === "slab" ? (
        /* ── 3D Slab View ── */
        <div className={s.scene}>
          <div ref={slabRef} className={s.slab}>
            {/* Front face with canvas */}
            <div className={s.slabFront}>
              <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block" }}
                role="img"
                aria-label={altText}
              />
            </div>

            {/* Glare overlay: active on Gloss, hidden on Matte */}
            <div
              className={`${s.glare} ${isGloss ? s.glareGloss : s.glareMatte}`}
              aria-hidden="true"
            />

            {/* Back face */}
            <div
              className={s.slabBack}
              style={{ background: backColor }}
              aria-hidden="true"
            />

            {/* 4 Side faces: 18px thickness connecting front (+9px) to back (-9px) */}
            <div
              className={`${s.slabSide} ${s.slabSideTop}`}
              style={{ background: sideColorTop }}
              aria-hidden="true"
            />
            <div
              className={`${s.slabSide} ${s.slabSideBottom}`}
              style={{ background: sideColorBot }}
              aria-hidden="true"
            />
            <div
              className={`${s.slabSide} ${s.slabSideLeft}`}
              style={{ background: sideColorL }}
              aria-hidden="true"
            />
            <div
              className={`${s.slabSide} ${s.slabSideRight}`}
              style={{ background: sideColorR }}
              aria-hidden="true"
            />
          </div>
        </div>
      ) : (
        /* ── Flat Canvas Views (closeup, alt, scale) ── */
        <>
          <canvas
            ref={canvasRef}
            className={s.flatCanvas}
            role="img"
            aria-label={altText}
          />

          {variant === "scale" && (
            <div className={s.scaleOverlay} aria-hidden="true">
              {/* Technical architectural measurement lines marking one tile (33.3% of 3x3) */}
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full pointer-events-none"
                preserveAspectRatio="none"
              >
                <defs>
                  <marker
                    id={`arrow-${uniqueId}`}
                    viewBox="0 0 6 6"
                    refX="3"
                    refY="3"
                    markerWidth="4"
                    markerHeight="4"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 4.5 3 L 0 4.5 z" fill="#14262b" />
                  </marker>
                </defs>
                {/* Horizontal dimension line above center tile */}
                <line
                  x1="33.33"
                  y1="28"
                  x2="66.66"
                  y2="28"
                  stroke="#14262b"
                  strokeWidth="1"
                  markerStart={`url(#arrow-${uniqueId})`}
                  markerEnd={`url(#arrow-${uniqueId})`}
                />
                <line x1="33.33" y1="24" x2="33.33" y2="32" stroke="#14262b" strokeWidth="1" />
                <line x1="66.66" y1="24" x2="66.66" y2="32" stroke="#14262b" strokeWidth="1" />

                {/* Vertical dimension line to left of center tile */}
                <line
                  x1="28"
                  y1="33.33"
                  x2="28"
                  y2="66.66"
                  stroke="#14262b"
                  strokeWidth="1"
                  markerStart={`url(#arrow-${uniqueId})`}
                  markerEnd={`url(#arrow-${uniqueId})`}
                />
                <line x1="24" y1="33.33" x2="32" y2="33.33" stroke="#14262b" strokeWidth="1" />
                <line x1="24" y1="66.66" x2="32" y2="66.66" stroke="#14262b" strokeWidth="1" />
              </svg>

              <div className="flex-1" />
              {/* Dimension label badge */}
              <div className={s.scaleBadge} role="note" aria-label={`Size: ${formatDimensionLabel(product)}`}>
                {formatDimensionLabel(product)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { shot, deriveSpec, type TileSpec } from "@/lib/tileArt";
import { getProductRealFinishes, sideColor, mixColor } from "./TileImage";
import type { Product } from "@/db/schema";
import s from "./tiles.module.css";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ── Component ──────────────────────────────────────────────────────────────
interface Props {
  product: Product;
  index: number; // for deterministic seed
}

export function TileCard({ product, index }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const slabRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const altCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Real finish resolution: "Gloss · Matte" if both, Gloss flag matches
  const { finishTag, isGloss } = getProductRealFinishes(product);

  const spec: TileSpec = deriveSpec({
    name: product.name,
    visualizerColor: product.visualizerColor,
    pattern: product.pattern,
    finish: isGloss ? "gloss" : "matte",
    groutColor: product.groutColor,
    tileLayout: product.tileLayout,
    tilesAcross: product.tilesAcross,
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
    const alt = altCanvasRef.current;
    if (!main || !alt) return;

    const raf = requestAnimationFrame(() => {
      shot(main, spec, index * 97 + 11);
      shot(alt, altSpec, index * 97 + 53);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGloss]);

  // ── Hover tilt (NO React state — pure imperative CSS vars) ────────────────
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const stage = stageRef.current;
    const slab = slabRef.current;
    if (!stage || !slab) return;

    const rect = stage.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const ry = (px - 0.5) * 26;
    const rx = -(py - 0.5) * 26;

    slab.style.setProperty("--rx", String(rx.toFixed(2)));
    slab.style.setProperty("--ry", String(ry.toFixed(2)));

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

  const tileColor = spec.color;
  const sideColorTop = mixColor(tileColor, 0.9);
  const sideColorBot = mixColor(tileColor, 0.7);
  const sideColorL = mixColor(tileColor, 1.15);
  const sideColorR = mixColor(tileColor, 0.6);
  const backColor = sideColor(tileColor, 0.5);

  const pricePerM2 = product.pricePerM2;
  const showFrom = product.showFromPrice;
  const sizeLabel =
    product.sizeLabel ??
    (product.tileSizeCm ? `${product.tileSizeCm}×${product.tileSizeCm}` : null);

  const nameTrim = product.name.trim().toLowerCase();
  const sizeLabelNorm = sizeLabel ? sizeLabel.trim().toLowerCase() : "";
  const labelX = sizeLabelNorm.replace(/×/g, "x");
  const labelTimes = sizeLabelNorm.replace(/x/g, "×");
  const nameAlreadyEndsWithSize =
    Boolean(sizeLabel && (nameTrim.endsWith(labelX) || nameTrim.endsWith(labelTimes))) ||
    /\b\d+\s*[x×]\s*\d+$/i.test(nameTrim);
  const showSeparateSize = Boolean(sizeLabel && !nameAlreadyEndsWithSize);

  return (
    <article
      className={`${s.card} group relative`}
      aria-label={`${product.name}${showSeparateSize && sizeLabel ? ` ${sizeLabel}cm` : ""}`}
    >
      {/* ── Image / Stage Link ── */}
      <Link
        href={`/shop/tile/${product.slug}`}
        className="block focus-visible:outline-2 focus-visible:outline-stone-900 rounded-t-[14px]"
        aria-label={`View ${product.name} details`}
      >
        <div
          ref={stageRef}
          className={s.stage}
          style={{ "--tile-color": tileColor } as React.CSSProperties}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {/* 3D slab scene */}
          <div className={s.scene} style={{ perspective: "900px" }}>
            <div
              ref={slabRef}
              className={s.slab}
              style={
                isFlipped
                  ? {
                      transform:
                        "rotateX(28deg) rotateY(148deg) rotateX(calc(var(--rx, 0) * 1deg)) rotateY(calc(var(--ry, 0) * 1deg))",
                    }
                  : undefined
              }
            >
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

              {/* Back face (Terracotta / Ceramic underside) */}
              <div
                className={s.slabBack}
                style={{
                  background: backColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "serif",
                  fontSize: "12px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
                aria-hidden="true"
              >
                Clay &amp; Co.
              </div>

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
      </Link>

      {/* Accessible Flip Tile Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsFlipped((f) => !f);
        }}
        aria-label={
          isFlipped
            ? `Show front face of ${product.name}`
            : `Inspect clay underside of ${product.name}`
        }
        aria-pressed={isFlipped}
        className="absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur border border-stone-200/80 text-stone-700 shadow-2xs hover:bg-white hover:text-stone-950 transition focus-visible:outline-2 focus-visible:outline-stone-900"
        title="Flip tile to inspect biscuit underside"
      >
        <span aria-hidden="true" className="text-xs">
          🔄
        </span>
      </button>

      {/* ── Card body ── */}
      <div className={s.cardBody}>
        <Link
          href={`/shop/tile/${product.slug}`}
          className="block hover:underline focus-visible:outline-stone-900"
        >
          <p className={s.cardName}>
            {product.name}
            {showSeparateSize && sizeLabel && <span className={s.cardSize}>{sizeLabel}cm</span>}
          </p>
        </Link>

        {product.tagline && <p className={s.cardDesc}>{product.tagline}</p>}

        <div className={s.cardPrice}>
          {showFrom && <span className={s.priceFrom}>from</span>}
          <span className={s.priceAmount}>
            {pricePerM2 ? formatPrice(pricePerM2) : formatPrice(product.priceCents)}
          </span>
          {pricePerM2 && <span className={s.priceUnit}>/m²</span>}
        </div>

        <Link
          href={`/visualizer?tile=${product.slug}`}
          className={s.viewBtn}
          aria-label={`View ${product.name} in 3D visualizer`}
        >
          View in room
        </Link>
      </div>
    </article>
  );
}

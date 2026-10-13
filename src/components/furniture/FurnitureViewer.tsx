"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import * as THREE from "three";
import {
  F,
  createStage,
  fitModel,
  updateCameraPosition,
  disposeObject,
  getFurnitureMeta,
  type FurnitureProductInput,
} from "@/lib/furniture3d";
import s from "./furnitureViewer.module.css";

interface Props {
  product: FurnitureProductInput;
}

export function FurnitureViewer({ product }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const meta = getFurnitureMeta(product);
  const [selectedColour, setSelectedColour] = useState<string>(meta.defaultColour);
  const [selectedColourName, setSelectedColourName] = useState<string>(
    meta.colourOptions.find((c) => c.hex === meta.defaultColour)?.name ||
      meta.colourOptions[0]?.name ||
      "Default"
  );

  // Computed dimensions for "Will it fit?" card
  const [fitDimensions, setFitDimensions] = useState<{
    widthCm: number;
    depthCm: number;
    heightCm: number;
  }>({
    widthCm: product.dimensions?.width ?? 80,
    depthCm: product.dimensions?.depth ?? 80,
    heightCm: product.dimensions?.height ?? 85,
  });

  // State refs for animation loop
  const animStateRef = useRef<{
    angle: number;
    elevation: number;
    zoom: number;
    target: THREE.Vector3;
    baseDistance: number;
    hasDragged: boolean;
    isDragging: boolean;
    lastPointerX: number;
    lastPointerY: number;
  }>({
    angle: -0.65,
    elevation: 0.38,
    zoom: 1.0,
    target: new THREE.Vector3(0, 0, 0),
    baseDistance: 3.5,
    hasDragged: false,
    isDragging: false,
    lastPointerX: 0,
    lastPointerY: 0,
  });

  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    model: THREE.Group | null;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    model: null,
  });

  // Rebuild model when colour changes
  const rebuildModel = useCallback(
    (newColourHex: string) => {
      const { scene, camera } = threeRef.current;
      if (!scene || !camera) return;

      if (threeRef.current.model) {
        scene.remove(threeRef.current.model);
        disposeObject(threeRef.current.model);
        threeRef.current.model = null;
      }

      const builder = F[meta.modelType] || F.chair;
      const model = builder(newColourHex);
      threeRef.current.model = model;
      scene.add(model);

      const state = animStateRef.current;
      const fit = fitModel(model, camera, state.angle, state.elevation, state.zoom);
      state.target = fit.target;
      state.baseDistance = fit.distance;

      // Update Will it fit dimensions from bounding box
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      setFitDimensions({
        widthCm: product.dimensions?.width ?? Math.round(size.x * 100),
        depthCm: product.dimensions?.depth ?? Math.round(size.z * 100),
        heightCm: product.dimensions?.height ?? Math.round(size.y * 100),
      });
    },
    [meta.modelType, product.dimensions]
  );

  // Initialize Three.js scene & animation loop
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Create dedicated WebGLRenderer with pixelRatio min(dpr, 2)
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(dpr);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const { scene, camera } = createStage();
    threeRef.current = { renderer, scene, camera, model: null };

    // Build initial model
    rebuildModel(selectedColour);

    // Initial sizing
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // ResizeObserver
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        }
      }
    });
    ro.observe(container);

    // Wheel zoom clamped .55 to 1.6 (passive: false)
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const state = animStateRef.current;
      state.zoom = Math.max(0.55, Math.min(1.6, state.zoom - e.deltaY * 0.001));
    };
    container.addEventListener("wheel", handleWheel, { passive: false });

    // Animation Loop
    let animId: number;
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const loop = () => {
      const state = animStateRef.current;

      // Auto-rotate .005 per frame until first drag (off under reduced motion)
      if (!state.hasDragged && !reducedMotion) {
        state.angle += 0.005;
      }

      if (camera) {
        const distance = state.baseDistance / state.zoom;
        updateCameraPosition(camera, state.target, state.angle, state.elevation, distance);
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      container.removeEventListener("wheel", handleWheel);

      if (threeRef.current.model) {
        scene.remove(threeRef.current.model);
        disposeObject(threeRef.current.model);
      }
      disposeObject(scene);
      renderer.dispose();
      threeRef.current = { renderer: null, scene: null, camera: null, model: null };
    };
  }, [rebuildModel, selectedColour]);

  // Pointer drag events
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = animStateRef.current;
    state.isDragging = true;
    state.hasDragged = true; // Stops auto-rotate
    state.lastPointerX = e.clientX;
    state.lastPointerY = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = animStateRef.current;
    if (!state.isDragging) return;

    const dx = e.clientX - state.lastPointerX;
    const dy = e.clientY - state.lastPointerY;
    state.lastPointerX = e.clientX;
    state.lastPointerY = e.clientY;

    // Drag: angle += dx * .008, elevation clamp(.05, 1.1) += dy * .004
    state.angle += dx * 0.008;
    state.elevation = Math.max(0.05, Math.min(1.1, state.elevation + dy * 0.004));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = animStateRef.current;
    state.isDragging = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Synchronize colour selection with right column
  useEffect(() => {
    const handleColourChange = (e: Event) => {
      const custom = e as CustomEvent<{ colour?: string; hex?: string }>;
      if (custom.detail?.hex) {
        setSelectedColour(custom.detail.hex);
        if (custom.detail.colour) setSelectedColourName(custom.detail.colour);
        rebuildModel(custom.detail.hex);
      } else if (custom.detail?.colour) {
        const found = meta.colourOptions.find(
          (c) => c.name.toLowerCase() === custom.detail?.colour?.toLowerCase()
        );
        if (found) {
          setSelectedColour(found.hex);
          setSelectedColourName(found.name);
          rebuildModel(found.hex);
        }
      }
    };
    window.addEventListener("clay-furniture-colour-change", handleColourChange);
    return () => window.removeEventListener("clay-furniture-colour-change", handleColourChange);
  }, [meta.colourOptions, rebuildModel]);

  return (
    <div className={s.container}>
      {/* ── 3D Viewer Canvas ── */}
      <div
        ref={containerRef}
        className={s.viewerWrapper}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <canvas ref={canvasRef} className={s.viewerCanvas} />
        <div className={s.hintBadge}>Drag to rotate · scroll to zoom</div>
      </div>

      {/* ── Option Chips ── */}
      {meta.colourOptions.length > 0 && (
        <div className={s.chipsContainer}>
          <span className={s.chipsLabel}>
            {meta.optionKind === "Fabric" ? "Fabric colour" : "Wood finish"}:{" "}
            <span className="font-normal text-[#55696f]">{selectedColourName}</span>
          </span>
          <div className={s.chipsRow} role="radiogroup" aria-label="Colour and finish options">
            {meta.colourOptions.map((opt) => {
              const isSelected = selectedColour === opt.hex;
              const chipLabel =
                meta.optionKind === "Fabric"
                  ? `Fabric colour: ${opt.name}`
                  : `Wood finish: ${opt.name}`;

              return (
                <button
                  key={opt.name}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`${s.chip} ${isSelected ? s.chipSelected : ""}`}
                  onClick={() => {
                    setSelectedColour(opt.hex);
                    setSelectedColourName(opt.name);
                    rebuildModel(opt.hex);
                    window.dispatchEvent(
                      new CustomEvent("clay-furniture-colour-change", {
                        detail: { colour: opt.name, hex: opt.hex },
                      })
                    );
                  }}
                >
                  <span className={s.chipDot} style={{ backgroundColor: opt.hex }} />
                  <span>{chipLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── "Will it fit?" Card ── */}
      <div className={s.infoCard}>
        <div className={s.infoCardTitle}>
          <svg className="w-4 h-4 text-[#0f6b6b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          <span>Will it fit?</span>
        </div>
        <div className={s.dimensionsGrid}>
          <div className={s.dimensionBox}>
            <div className={s.dimensionLabel}>Width</div>
            <div className={s.dimensionValue}>{fitDimensions.widthCm} cm</div>
          </div>
          <div className={s.dimensionBox}>
            <div className={s.dimensionLabel}>Depth</div>
            <div className={s.dimensionValue}>{fitDimensions.depthCm} cm</div>
          </div>
          <div className={s.dimensionBox}>
            <div className={s.dimensionLabel}>Height</div>
            <div className={s.dimensionValue}>{fitDimensions.heightCm} cm</div>
          </div>
        </div>
      </div>

      {/* ── Details Card ── */}
      <div className={s.infoCard}>
        <div className={s.infoCardTitle}>
          <svg className="w-4 h-4 text-[#0f6b6b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>Details & Specifications</span>
        </div>
        <div className={s.detailsList}>
          {product.material && (
            <div className={s.detailsRow}>
              <span className={s.detailsTerm}>Material</span>
              <span className={s.detailsDesc}>{product.material}</span>
            </div>
          )}
          {product.specs &&
            Object.entries(product.specs).map(([key, val]) => (
              <div key={key} className={s.detailsRow}>
                <span className={s.detailsTerm}>{key.replace(/_/g, " ")}</span>
                <span className={s.detailsDesc}>{String(val)}</span>
              </div>
            ))}
        </div>
      </div>

      {/* ── "Place in 3D room" Ghost Button ── */}
      <div>
        <Link href={`/visualizer?furniture=${product.slug}`} className={s.ghostBtn}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <span>Place in 3D room</span>
        </Link>
      </div>
    </div>
  );
}

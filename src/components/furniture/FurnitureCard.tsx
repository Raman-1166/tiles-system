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
  acquireSharedRenderer,
  releaseSharedRenderer,
  getFurnitureMeta,
  formatPrice,
  type FurnitureModelType,
} from "@/lib/furniture3d";
import s from "./furniture.module.css";

export interface FurnitureCardProps {
  product: any;
}

export function FurnitureCard({ product }: FurnitureCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const meta = getFurnitureMeta(product);
  const [activeColour, setActiveColour] = useState<string>(meta.defaultColour);

  // References for Three.js scene & model attached to this card
  const stageRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    ground: THREE.Mesh;
    model: THREE.Group | null;
    target: THREE.Vector3;
    distance: number;
    angle: number;
    elevation: number;
  } | null>(null);

  // Draw scene onto card canvas using the shared renderer
  const renderCard = useCallback(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const renderer = acquireSharedRenderer();
    if (!renderer) return;

    try {
      updateCameraPosition(
        stage.camera,
        stage.target,
        stage.angle,
        stage.elevation,
        stage.distance
      );
      renderer.render(stage.scene, stage.camera);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(renderer.domElement, 0, 0, canvas.width, canvas.height);
      }
    } finally {
      releaseSharedRenderer();
    }
  }, []);

  // Rebuild model when colour changes
  const rebuildModel = useCallback(
    (newColour: string) => {
      const stage = stageRef.current;
      if (!stage) return;

      if (stage.model) {
        stage.scene.remove(stage.model);
        disposeObject(stage.model);
        stage.model = null;
      }

      const builder = F[meta.modelType] || F.chair;
      const model = builder(newColour);
      stage.model = model;
      stage.scene.add(model);

      const fit = fitModel(
        model,
        stage.camera,
        stage.angle,
        stage.elevation
      );
      stage.target = fit.target;
      stage.distance = fit.distance;

      renderCard();

      // Update --tc variable on container
      if (containerRef.current) {
        containerRef.current.style.setProperty("--tc", newColour);
      }
    },
    [meta.modelType, renderCard]
  );

  // Initialize card scene in useEffect (StrictMode safe)
  useEffect(() => {
    const renderer = acquireSharedRenderer();
    if (!renderer) return;

    const { scene, camera, ground } = createStage();
    const builder = F[meta.modelType] || F.chair;
    const model = builder(activeColour);
    scene.add(model);

    const initialAngle = -0.65;
    const initialElevation = 0.38;

    const fit = fitModel(model, camera, initialAngle, initialElevation);

    stageRef.current = {
      scene,
      camera,
      ground,
      model,
      target: fit.target,
      distance: fit.distance,
      angle: initialAngle,
      elevation: initialElevation,
    };

    if (containerRef.current) {
      containerRef.current.style.setProperty("--tc", activeColour);
    }

    renderCard();

    return () => {
      // Cleanup stage and release renderer
      if (stageRef.current) {
        if (stageRef.current.model) {
          stageRef.current.scene.remove(stageRef.current.model);
          disposeObject(stageRef.current.model);
        }
        disposeObject(stageRef.current.scene);
        stageRef.current = null;
      }
      releaseSharedRenderer();
    };
  }, [meta.modelType, activeColour, renderCard]);

  // Pointer hover interactions (mouse and pen only; no React state)
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "touch") return;
      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const visual = visualRef.current;
      const stage = stageRef.current;
      if (!visual || !stage) return;

      const rect = visual.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;

      stage.angle = -0.65 + (x - 0.5) * 2.4;
      stage.elevation = 0.38;

      renderCard();
    },
    [renderCard]
  );

  const handlePointerLeave = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.angle = -0.65;
    stage.elevation = 0.38;

    renderCard();
  }, [renderCard]);

  // Price calculation
  const variants = product.productVariants || product.variants || [];
  const lowestPrice =
    variants.length > 0
      ? Math.min(...variants.map((v: any) => v.priceCents || product.priceCents))
      : product.priceCents;
  const hasMultiplePrices =
    variants.length > 1 &&
    new Set(variants.map((v: any) => v.priceCents)).size > 1;

  return (
    <div ref={containerRef} className={s.card}>
      <Link href={`/shop/furniture/${product.slug}`} className="block">
        <div
          ref={visualRef}
          className={s.cardVisual}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <canvas
            ref={canvasRef}
            width={480}
            height={480}
            className={s.cardCanvas}
            role="img"
            aria-label={`${product.name} 3D model`}
          />
        </div>
      </Link>

      <div className={s.cardInfo}>
        <Link href={`/shop/furniture/${product.slug}`}>
          <h3 className={s.cardName}>{product.name}</h3>
        </Link>
        {product.tagline && <p className={s.cardTagline}>{product.tagline}</p>}

        <div className={s.cardPriceRow}>
          <div className="flex items-baseline gap-1">
            {hasMultiplePrices && (
              <span className="text-xs text-[#55696f]">from</span>
            )}
            <span className={s.cardPrice}>{formatPrice(lowestPrice)}</span>
          </div>

          {/* Colour dots */}
          {meta.colourOptions.length > 0 && (
            <div className={s.cardDots} role="group" aria-label="Available colours">
              {meta.colourOptions.slice(0, 5).map((opt) => {
                const isActive = activeColour === opt.hex;
                return (
                  <button
                    key={opt.name}
                    type="button"
                    title={opt.name}
                    aria-label={`Select ${opt.name}`}
                    className={`${s.cardDot} ${isActive ? s.cardDotActive : ""}`}
                    style={{ backgroundColor: opt.hex }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveColour(opt.hex);
                      rebuildModel(opt.hex);
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

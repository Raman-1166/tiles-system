"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  F,
  createStage,
  fitModel,
  disposeObject,
  acquireSharedRenderer,
  releaseSharedRenderer,
  getFurnitureMeta,
} from "@/lib/furniture3d";

export interface FurnitureImageProps {
  product: any;
  colour?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

export function FurnitureImage({
  product,
  colour: colourProp,
  size = 240,
  className,
  style,
  alt,
}: FurnitureImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  const meta = getFurnitureMeta(product);

  // Resolve colour: either colour prop or default colour
  const effectiveColour =
    colourProp && colourProp.startsWith("#")
      ? colourProp
      : meta.colourOptions.find(
          (c) => c.name.toLowerCase() === (colourProp || "").toLowerCase()
        )?.hex ||
        colourProp ||
        meta.defaultColour;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = acquireSharedRenderer();
    if (!renderer) return;

    const { scene, camera } = createStage();
    const builder = F[meta.modelType] || F.chair;
    const model = builder(effectiveColour);
    scene.add(model);

    fitModel(model, camera, -0.65, 0.38);

    try {
      renderer.render(scene, camera);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(renderer.domElement, 0, 0, canvas.width, canvas.height);
      }
    } finally {
      scene.remove(model);
      disposeObject(model);
      disposeObject(scene);
      releaseSharedRenderer();
    }
  }, [mounted, meta.modelType, effectiveColour]);

  return (
    <div
      className={`relative aspect-square overflow-hidden ${className ?? ""}`}
      style={{
        background: "radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.9), rgba(228, 232, 227, 0.6))",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ width: "100%", height: "100%", display: "block" }}
        role="img"
        aria-label={alt ?? `${product?.name ?? "Furniture"} 3D snapshot`}
      />
    </div>
  );
}

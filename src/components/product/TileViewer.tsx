"use client";

import { useState } from "react";
import Image from "next/image";
import { LazyScene } from "@/components/three/LazyScene";
import { TileSlab } from "@/components/three/TileSlab";
import { TilePatternGrid, type PatternLayout } from "@/components/three/TilePatternGrid";
import { SimpleOrbitControls } from "@/components/three/SimpleOrbitControls";
import type { TileColorway } from "@/components/three/tileTextures";
import type { Product } from "@/db/schema";
import { AddToCartForm } from "./AddToCartForm";

function Stage({ color }: { color: string }) {
  return (
    <>
      <color attach="background" args={[color]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 5, 6]} intensity={1.3} />
      <directionalLight position={[-4, 2, -3]} intensity={0.35} color="#dce6ff" />
    </>
  );
}

export function TileViewer({ product, colorway }: { product: Product; colorway: TileColorway }) {
  const [mode, setMode] = useState<"slab" | "pattern">("slab");
  const [layout, setLayout] = useState<PatternLayout>("grid");
  const [rotationSteps, setRotationSteps] = useState(0);
  const [showPhotos, setShowPhotos] = useState(false);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-stone-300 text-sm">
            <button
              onClick={() => setMode("slab")}
              className={`px-4 py-1.5 ${mode === "slab" ? "bg-stone-900 text-white" : "bg-white text-stone-700"}`}
            >
              Single slab
            </button>
            <button
              onClick={() => setMode("pattern")}
              className={`px-4 py-1.5 ${mode === "pattern" ? "bg-stone-900 text-white" : "bg-white text-stone-700"}`}
            >
              3×3 pattern
            </button>
          </div>
          <button
            onClick={() => setShowPhotos((s) => !s)}
            className="ml-auto rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm text-stone-700 hover:bg-stone-100"
          >
            {showPhotos ? "Back to 3D view" : "View photos instead"}
          </button>
        </div>

        {showPhotos ? (
          <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-stone-100">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                width={900}
                height={675}
                className="h-full w-full object-cover"
              />
            ) : (
              <p className="text-stone-500">No photo available</p>
            )}
          </div>
        ) : (
          <LazyScene
            className="aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100 outline-none"
            cameraPosition={[0, 0, 4]}
            tabIndex={0}
            onFocusHint
          >
            <Stage color="#eae6db" />
            {mode === "slab" ? (
              <TileSlab colorway={colorway} size={1.7} rotationY={(rotationSteps * Math.PI) / 2} />
            ) : (
              <TilePatternGrid colorway={colorway} layout={layout} rotationSteps={rotationSteps} tileSize={1} />
            )}
            <SimpleOrbitControls
              initialRadius={mode === "slab" ? 3.2 : 5.2}
              minRadius={mode === "slab" ? 1.6 : 3}
              maxRadius={mode === "slab" ? 6 : 9}
              initialPolar={1.15}
            />
          </LazyScene>
        )}

        {!showPhotos && (
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-stone-500">Rotation</span>
              <div className="flex overflow-hidden rounded-full border border-stone-300">
                {[0, 1, 2, 3].map((step) => (
                  <button
                    key={step}
                    onClick={() => setRotationSteps(step)}
                    className={`px-3 py-1 ${rotationSteps === step ? "bg-stone-900 text-white" : "bg-white text-stone-700"}`}
                  >
                    {step * 90}°
                  </button>
                ))}
              </div>
            </div>
            {mode === "pattern" && (
              <div className="flex items-center gap-2">
                <span className="text-stone-500">Layout</span>
                <div className="flex overflow-hidden rounded-full border border-stone-300">
                  {(["grid", "alternating", "herringbone"] as PatternLayout[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLayout(l)}
                      className={`px-3 py-1 capitalize ${layout === l ? "bg-stone-900 text-white" : "bg-white text-stone-700"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-stone-500">{product.tagline}</p>
        <h1 className="mt-2 text-3xl font-semibold text-stone-900">{product.name}</h1>
        <p className="mt-4 text-stone-700">{product.description}</p>
        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
          {Object.entries(product.specs).map(([k, v]) => (
            <div key={k} className="rounded-lg bg-stone-50 p-3">
              <dt className="text-stone-500">{k}</dt>
              <dd className="font-medium text-stone-900">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-2xl font-semibold text-stone-900">
          ${(product.priceCents / 100).toFixed(2)}
          <span className="ml-1 text-sm font-normal text-stone-500">{product.unit}</span>
        </p>
        <AddToCartForm productId={product.id} unitLabel={product.unit} />
      </div>
    </div>
  );
}

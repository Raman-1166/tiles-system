"use client";

import dynamic from "next/dynamic";
import type { ProductWithDetails } from "@/db/queries";

// Dynamically import the heavy 3D component — no SSR
const RoomVisualizer = dynamic(
  () =>
    import("@/components/visualizer/RoomVisualizer").then((m) => ({
      default: m.RoomVisualizer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[500px] items-center justify-center rounded-2xl bg-[#F6F4EE]">
        <p className="animate-pulse text-stone-500">Loading 3D room…</p>
      </div>
    ),
  }
);

interface Props {
  tiles: ProductWithDetails[];
  initialTileIdx?: number;
  initialRoom?: string;
}

export function VisualizerClient({ tiles, initialTileIdx = 0, initialRoom }: Props) {
  // Check WebGL support (safe: this component is client-only via dynamic import)
  if (typeof window !== "undefined") {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      return (
        <div className="rounded-2xl bg-[#F6F4EE] p-12 text-center shadow-sm">
          <p className="text-lg text-stone-500">
            Your browser does not support WebGL, which is required for the 3D room visualizer.
          </p>
          <p className="mt-2 text-sm text-stone-400">
            Please try a modern browser like Chrome, Firefox, Safari, or Edge.
          </p>
        </div>
      );
    }
  }

  // Flatten to the Product shape RoomVisualizerNew expects
  const tileProducts = tiles.map((t) => ({
    ...t,
    variants: [],
  }));

  const handleAddToCart = async (quantity: number, meta: Record<string, unknown>) => {
    // Resolve productId from meta if provided by visualizer selection, fallback to initial tile
    const resolvedProductId =
      (meta?.productId ? Number(meta.productId) : null) ?? tiles[initialTileIdx]?.id;
    if (!resolvedProductId) return;

    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: resolvedProductId,
        quantity,
        meta,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log("Added to cart:", data);
    }
  };

  return (
    <RoomVisualizer
      products={tileProducts}
      onAddToCart={handleAddToCart}
      initialTileIdx={initialTileIdx}
      initialRoom={initialRoom as any}
    />
  );
}

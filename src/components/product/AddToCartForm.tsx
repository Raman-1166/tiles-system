"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cartStore";

export function AddToCartForm({
  productId,
  unitLabel,
  variants,
}: {
  productId: number;
  unitLabel: string;
  variants?: { name: string; colorHex: string }[];
}) {
  const [quantity, setQuantity] = useState(1);
  const [variant, setVariant] = useState(variants?.[0]?.name ?? null);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const setFromResponse = useCartStore((s) => s.setFromResponse);

  const submit = async () => {
    setStatus("loading");
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity, variant }),
    });
    const data = await res.json();
    setFromResponse(data);
    setStatus("done");
    setTimeout(() => setStatus("idle"), 1800);
  };

  return (
    <div className="mt-6 flex flex-col gap-4">
      {variants && variants.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-stone-500">Colour / material</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.name}
                onClick={() => setVariant(v.name)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                  variant === v.name ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-stone-700"
                }`}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full border border-black/10"
                  style={{ background: v.colorHex }}
                />
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-full border border-stone-300">
          <button
            className="px-3 py-2 text-lg"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 text-center text-sm">{quantity}</span>
          <button
            className="px-3 py-2 text-lg"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <span className="text-sm text-stone-500">{unitLabel}</span>
      </div>

      <button
        onClick={submit}
        disabled={status === "loading"}
        className="w-full rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-stone-700 disabled:opacity-60 sm:w-auto"
      >
        {status === "done" ? "Added to cart ✓" : status === "loading" ? "Adding…" : "Add to cart"}
      </button>
    </div>
  );
}

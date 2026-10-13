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
  const { setFromResponse, showToast, openMiniCart } = useCartStore();

  const submit = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity, variant }),
      });
      const data = await res.json();
      setFromResponse(data);
      setStatus("done");
      showToast(`Added ${quantity} ${unitLabel} to your bag`, "success");
      openMiniCart();
      setTimeout(() => setStatus("idle"), 1800);
    } catch (err) {
      console.error("Failed to add to cart:", err);
      setStatus("idle");
      showToast("Could not add to bag. Please try again.", "error");
    }
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
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                  variant === v.name
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
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
        <div className="flex items-center overflow-hidden rounded-full border border-stone-300 bg-white shadow-2xs">
          <button
            className="px-3.5 py-2 text-base text-stone-700 hover:bg-stone-100 transition"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-medium text-stone-900">{quantity}</span>
          <button
            className="px-3.5 py-2 text-base text-stone-700 hover:bg-stone-100 transition"
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
        className="w-full cursor-pointer rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-stone-700 disabled:opacity-60 sm:w-auto"
      >
        {status === "done" ? "Added to bag ✓" : status === "loading" ? "Adding…" : "Add to bag"}
      </button>
    </div>
  );
}

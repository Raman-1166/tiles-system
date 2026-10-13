import { listProducts, formatPrice } from "@/db/queries";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { TilesSection } from "@/components/tiles/TilesSection";
import type { Product } from "@/db/schema";

type SearchParams = Promise<{
  category?: string;
  type?: "tile" | "furniture";
  sort?: "newest" | "price_asc" | "price_desc";
  page?: string;
}>;

// ── Tiles view ──────────────────────────────────────────────────────────────
async function TilesView() {
  let tileProducts: Product[] = [];

  try {
    const all = await listProducts({ type: "tile", isActive: true, limit: 200 });
    // Exclude accessories (adhesive, grout, tools)
    tileProducts = all
      .filter(
        (p) =>
          p.category &&
          !p.category.slug.includes("accessories") &&
          (p.category.slug.includes("tile") || p.category.slug.includes("mosaic"))
      )
      .map((p) => {
        // strip productVariants / category (ProductWithDetails → Product shape)
        const { category: _c, productVariants: _v, ...product } = p as typeof p & {
          category: unknown;
          productVariants: unknown;
        };
        return product as Product;
      });
  } catch (err) {
    console.error("DB error loading tiles:", err);
  }

  if (tileProducts.length === 0) {
    return (
      <div className="rounded-2xl bg-[#F6F4EE] p-12 text-center shadow-sm">
        <p className="text-stone-500 text-lg">
          Could not load tile catalogue. Please try again later.
        </p>
      </div>
    );
  }

  return <TilesSection products={tileProducts} />;
}

import { FurnitureSection } from "@/components/furniture/FurnitureSection";

// ── Furniture view ──────────────────────────────────────────────────────────
async function FurnitureView() {
  let products: Awaited<ReturnType<typeof listProducts>> = [];
  let dbAvailable = true;

  try {
    products = await listProducts({ type: "furniture", isActive: true, limit: 200 });
  } catch {
    dbAvailable = false;
  }

  if (!dbAvailable) {
    return (
      <div className="rounded-lg bg-[#F6F4EE] p-8 text-center">
        <p className="text-lg text-[#14262B]">
          Database is currently unavailable. Please try again later.
        </p>
      </div>
    );
  }

  return <FurnitureSection products={products} />;
}


// ── Page ────────────────────────────────────────────────────────────────────
export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  let resolvedType: "tile" | "furniture" | undefined = params.type;
  if (!resolvedType && params.category === "furniture") resolvedType = "furniture";
  if (!resolvedType) resolvedType = "tile"; // default to tiles

  return (
    <div className="min-h-screen bg-[#faf7f0]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-[#1e1c18]">
            {resolvedType === "furniture" ? "Furniture" : "Tiles"}
          </h1>
          <p className="mt-2 text-[#7a6a58]">
            {resolvedType === "furniture"
              ? "Considered furniture, built to last."
              : "Handmade glazed ceramic tiles for every surface."}
          </p>
        </div>

        {/* Type tabs */}
        <div className="mb-8 flex gap-2">
          {(
            [
              ["tile", "Tiles"],
              ["furniture", "Furniture"],
            ] as const
          ).map(([val, label]) => (
            <Link
              key={val}
              href={`/shop?type=${val}`}
              className={`rounded-full border px-5 py-2 text-sm font-medium transition ${
                resolvedType === val
                  ? "border-[#1e1c18] bg-[#1e1c18] text-white"
                  : "border-[#c8bfaa] bg-white text-[#2d2820] hover:border-[#2d2820]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Content */}
        <Suspense
          fallback={
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="animate-pulse text-[#9a8870]">Loading…</p>
            </div>
          }
        >
          {resolvedType === "furniture" ? (
            <FurnitureView />
          ) : (
            <TilesView />
          )}
        </Suspense>
      </div>
    </div>
  );
}

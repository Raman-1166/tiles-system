import Link from "next/link";
import { Suspense } from "react";
import { ProductService } from "@/services/product.service";
import { TilesSection } from "@/components/tiles/TilesSection";
import { FurnitureSection } from "@/components/furniture/FurnitureSection";
import { ShopSearchAndSort } from "@/components/catalog/ShopSearchAndSort";
import { Pagination } from "@/components/catalog/Pagination";
import type { Product } from "@/db/schema";

type SearchParams = Promise<{
  category?: string;
  type?: "tile" | "furniture";
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: string;
}>;

const ITEMS_PER_PAGE = 12;

// ── Tiles view ──────────────────────────────────────────────────────────────
async function TilesView({
  search,
  sort,
  page,
}: {
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  page: number;
}) {
  let tileProducts: Product[] = [];
  let total = 0;
  let totalPages = 1;

  try {
    const result = await ProductService.listPaginated({
      type: "tile",
      search,
      sort,
      page,
      limit: ITEMS_PER_PAGE,
      isActive: true,
    });

    total = result.pagination.total;
    totalPages = result.pagination.totalPages;

    // Filter out accessories from tile view
    tileProducts = result.products
      .filter(
        (p) =>
          !p.category ||
          (!p.category.slug.includes("accessories") &&
            (p.category.slug.includes("tile") || p.category.slug.includes("mosaic")))
      )
      .map((p) => {
        // Strip out productVariants and category to return pure Product shape
        const {
          category: _c,
          productVariants: _v,
          ...product
        } = p as typeof p & {
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
      <div className="rounded-2xl bg-white border border-stone-200 p-12 text-center shadow-xs">
        <p className="font-serif text-lg font-medium text-stone-900">
          No tiles found matching your search.
        </p>
        <p className="mt-1 text-xs text-stone-500">
          Try adjusting your search query, or clear your filters to view the full collection.
        </p>
        <Link
          href="/shop?type=tile"
          className="mt-4 inline-block text-xs font-semibold text-stone-900 underline underline-offset-4"
        >
          View all tiles →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <TilesSection products={tileProducts} />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        baseUrl="/shop"
        searchParams={{
          type: "tile",
          search,
          sort,
        }}
      />
    </div>
  );
}

// ── Furniture view ──────────────────────────────────────────────────────────
async function FurnitureView({
  search,
  sort,
  page,
}: {
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  page: number;
}) {
  let products: Awaited<ReturnType<typeof ProductService.list>> = [];
  let totalPages = 1;

  try {
    const result = await ProductService.listPaginated({
      type: "furniture",
      search,
      sort,
      page,
      limit: ITEMS_PER_PAGE,
      isActive: true,
    });
    products = result.products;
    totalPages = result.pagination.totalPages;
  } catch (err) {
    console.error("DB error loading furniture:", err);
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-stone-200 p-12 text-center shadow-xs">
        <p className="font-serif text-lg font-medium text-stone-900">No furniture pieces found.</p>
        <p className="mt-1 text-xs text-stone-500">
          Try searching for a different material or finish.
        </p>
        <Link
          href="/shop?type=furniture"
          className="mt-4 inline-block text-xs font-semibold text-stone-900 underline underline-offset-4"
        >
          View all furniture →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <FurnitureSection products={products} />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        baseUrl="/shop"
        searchParams={{
          type: "furniture",
          search,
          sort,
        }}
      />
    </div>
  );
}

// ── Page Component ──────────────────────────────────────────────────────────
export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  let resolvedType: "tile" | "furniture" | undefined = params.type;
  if (!resolvedType && params.category === "furniture") resolvedType = "furniture";
  if (!resolvedType) resolvedType = "tile";

  const search = params.search || undefined;
  const sort = params.sort || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  return (
    <div className="min-h-screen bg-[#faf7f0]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase">
            Atelier Catalog
          </p>
          <h1 className="mt-1 font-serif text-4xl font-light tracking-tight text-stone-900">
            {resolvedType === "furniture" ? "Handcrafted Furniture" : "Architectural Tiles"}
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            {resolvedType === "furniture"
              ? "Sculptural ceramic credenzas and solid oak pieces, built to endure."
              : "Hand-pressed, wood-fired ceramic and porcelain surfaces engineered for light and living."}
          </p>
        </div>

        {/* Type Switcher Tabs */}
        <div className="mb-6 flex gap-2">
          {(
            [
              ["tile", "Tiles Collection"],
              ["furniture", "Furniture Collection"],
            ] as const
          ).map(([val, label]) => (
            <Link
              key={val}
              href={`/shop?type=${val}`}
              className={`rounded-full px-5 py-2 text-xs font-semibold transition ${
                resolvedType === val
                  ? "bg-stone-900 text-white shadow-xs"
                  : "border border-stone-300 bg-white text-stone-700 hover:border-stone-400"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Search & Sort Bar */}
        <Suspense fallback={null}>
          <ShopSearchAndSort />
        </Suspense>

        {/* Catalog Grid with Pagination */}
        <Suspense
          fallback={
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="animate-pulse text-stone-500 text-sm">Loading collection…</p>
            </div>
          }
        >
          {resolvedType === "furniture" ? (
            <FurnitureView search={search} sort={sort} page={page} />
          ) : (
            <TilesView search={search} sort={sort} page={page} />
          )}
        </Suspense>
      </div>
    </div>
  );
}

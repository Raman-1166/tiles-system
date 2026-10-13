import { listProducts } from "@/db/queries";
import { TileCalculatorClient } from "./TileCalculatorClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tile Project Estimator & Box Calculator — Clay & Co.",
  description:
    "Calculate precise box quantities, industry wastage allowances, and installation essentials for your bespoke tile project.",
};

type SearchParams = Promise<{
  product?: string;
  area?: string;
  layout?: string;
  unit?: string;
}>;

export default async function TileCalculatorPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  let tiles: Awaited<ReturnType<typeof listProducts>> = [];

  try {
    const all = await listProducts({ type: "tile", isActive: true, limit: 100 });
    tiles = all.filter(
      (p) =>
        p.category &&
        !p.category.slug.includes("accessories") &&
        (p.category.slug.includes("tile") || p.category.slug.includes("mosaic"))
    );
  } catch (error) {
    console.error("Failed to load tiles for calculator:", error);
  }

  return (
    <div className="min-h-screen bg-[#faf7f0] py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center sm:text-left">
          <span className="inline-block rounded-full bg-stone-200/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-stone-700">
            Architectural Project Tools
          </span>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
            Tile &amp; Wastage Project Calculator
          </h1>
          <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-2xl">
            Input your surface dimensions and installation layout pattern. Our architectural
            calculator computes exact gross box quantities, pattern cuts wastage buffer, and
            required mortars and leveling accessories.
          </p>
        </div>

        <TileCalculatorClient
          tiles={tiles}
          initialProductSlug={params.product}
          initialArea={params.area}
          initialLayout={params.layout}
          initialUnit={params.unit}
        />
      </div>
    </div>
  );
}

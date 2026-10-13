import Link from "next/link";
import Image from "next/image";
import { HeroSection } from "@/components/hero/HeroSection";
import { TileImage } from "@/components/tiles/TileImage";
import { FurnitureImage } from "@/components/furniture/FurnitureImage";
import { VisualizerTeaser } from "@/components/visualizer/VisualizerTeaser";
import { listProducts, formatPrice } from "@/lib/products";
import { listCategories } from "@/db/queries";
import type { ProductWithDetails } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let tiles: ProductWithDetails[] = [];
  let furniture: ProductWithDetails[] = [];
  let tileCategories: Awaited<ReturnType<typeof listCategories>> = [];
  let furnitureCategories: Awaited<ReturnType<typeof listCategories>> = [];
  let hasDatabase = true;

  try {
    [tileCategories, furnitureCategories] = await Promise.all([
      listCategories("tile"),
      listCategories("furniture"),
    ]);

    // Get tile products from first tile category
    if (tileCategories.length > 0) {
      tiles = await listProducts({ categoryId: tileCategories[0].id, featured: true, limit: 6 });
    }

    // Get furniture products from all furniture categories
    if (furnitureCategories.length > 0) {
      furniture = await listProducts({
        categoryId: furnitureCategories[0].id,
        featured: true,
        limit: 4,
      });
    }
  } catch (error) {
    hasDatabase = false;
    console.warn("Database not available:", error);
  }

  return (
    <main>
      <HeroSection />

      {!hasDatabase && (
        <section className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-6">
            <h3 className="text-lg font-semibold text-amber-900">Database not connected</h3>
            <p className="mt-2 text-sm text-amber-700">
              Set DATABASE_URL in your environment to see products. Run migrations and seed the database first.
            </p>
          </div>
        </section>
      )}

      {hasDatabase && tiles.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Shop tiles</p>
              <h2 className="mt-2 text-3xl font-semibold text-stone-900">Glazed, thick, and ready to turn</h2>
            </div>
            <Link
              href={`/shop?category=${tileCategories[0]?.slug || "tile"}`}
              className="hidden text-sm font-medium text-stone-700 hover:text-stone-950 sm:block"
            >
              View all tiles →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {tiles.slice(0, 6).map((p) => (
              <Link key={p.id} href={`/shop/tile/${p.slug}`} className="group">
                <div className="aspect-square overflow-hidden rounded-xl bg-stone-100 transition group-hover:scale-105">
                  <TileImage
                    product={p}
                    variant="closeup"
                    size={240}
                    className="h-full w-full"
                  />
                </div>
                <p className="mt-2 text-sm font-medium text-stone-800">{p.name}</p>
                <p className="text-xs text-stone-500">
                  {formatPrice(p.priceCents)} {p.unit}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bg-[#efe9db] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-stone-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-stone-600 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0F6B6B]" />
                Room Visualizer
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 leading-tight">
                See any tile on your floor or walls before you buy
              </h2>
              <p className="mt-4 text-base text-stone-700 leading-relaxed max-w-lg">
                Drop any tile from the shop into a 3D bathroom, kitchen or living room. Change the
                size, grout colour, layout and lighting, then calculate exact boxes needed for your project.
              </p>

              {/* Feature Highlights */}
              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm border border-stone-200">
                  <svg className="w-3.5 h-3.5 text-[#0F6B6B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  3 Custom 3D Environments
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm border border-stone-200">
                  <svg className="w-3.5 h-3.5 text-[#0F6B6B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Adjustable Grout & Layouts
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm border border-stone-200">
                  <svg className="w-3.5 h-3.5 text-[#0F6B6B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Real-time Glaze Reflections
                </span>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/visualizer"
                  className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-7 py-3.5 text-sm font-semibold tracking-wide text-white shadow-md transition hover:bg-[#0F6B6B] hover:shadow-lg active:scale-[0.99]"
                >
                  <span>Launch 3D Visualizer</span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link
                  href="/shop?type=tile"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-stone-800 border border-stone-300 transition hover:bg-stone-50"
                >
                  Browse Tiles Catalogue
                </Link>
              </div>
            </div>

            <div>
              <VisualizerTeaser />
            </div>
          </div>
        </div>
      </section>

      {hasDatabase && furniture.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Shop furniture</p>
              <h2 className="mt-2 text-3xl font-semibold text-stone-900">
                Orbit, zoom and view it in your room
              </h2>
            </div>
            <Link
              href={`/shop?category=${furnitureCategories[0]?.slug || "furniture"}`}
              className="hidden text-sm font-medium text-stone-700 hover:text-stone-950 sm:block"
            >
              View all furniture →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {furniture.map((p) => (
              <Link key={p.id} href={`/shop/${p.category?.slug || "furniture"}/${p.slug}`} className="group">
                <div className="aspect-square overflow-hidden rounded-xl bg-stone-100 transition group-hover:scale-105">
                  <FurnitureImage
                    product={p}
                    size={240}
                    className="h-full w-full"
                  />
                </div>
                <p className="mt-2 text-sm font-medium text-stone-800">{p.name}</p>
                <p className="text-xs text-stone-500">{formatPrice(p.priceCents)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

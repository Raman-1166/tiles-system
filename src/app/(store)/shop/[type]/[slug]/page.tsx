import { getProductBySlug } from "@/db/queries";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ProductVariantSelector } from "@/components/product/ProductVariantSelector";
import { TileCalculator } from "@/components/product/TileCalculator";
import { TileMediaViewer } from "@/components/tiles/TileMediaViewer";
import { FurnitureViewer } from "@/components/furniture/FurnitureViewer";
import type { Metadata } from "next";

type Props = {
  params: Promise<{
    type: string;
    slug: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await getProductBySlug(slug);

    if (!product) {
      return { title: "Product Not Found" };
    }

    return {
      title: `${product.name} | Shop`,
      description: product.tagline,
      openGraph: {
        title: product.name,
        description: product.tagline,
        // Tiles and furniture must not use product.image (room photos); use site default OG image
        images: ["/images/hero-fallback.jpg"],
      },
    };
  } catch {
    return { title: "Product Not Found" };
  }
}

export default async function ProductPage({ params }: Props) {
  const { type, slug } = await params;

  let product;
  try {
    product = await getProductBySlug(slug);
  } catch (error) {
    console.error("Database error:", error);
    return (
      <div className="min-h-screen bg-[#E4E8E3] flex items-center justify-center">
        <div className="rounded-lg bg-[#F6F4EE] p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-[#14262B] mb-4">Database Unavailable</h1>
          <p className="text-[#14262B]/70">
            Unable to load product details. Please try again later.
          </p>
          <Link href="/shop" className="mt-4 inline-block text-[#0F6B6B] hover:underline">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  if (!product || !product.isActive) {
    notFound();
  }

  // Verify product type matches URL
  if (product.category?.type !== type) {
    notFound();
  }

  const isTile = product.category?.type === "tile";
  // The room photo is removed for tiles; never fall back to product.image
  const displayProduct = isTile ? { ...product, images: [] } : product;
  const lowestPrice =
    displayProduct.productVariants.length > 0
      ? Math.min(...displayProduct.productVariants.map((v) => v.priceCents))
      : displayProduct.priceCents;

  // Generate JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: displayProduct.name,
    description: displayProduct.description,
    image: undefined,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: (lowestPrice / 100).toFixed(2),
      availability: displayProduct.productVariants.some((v) => v.stockQuantity > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#E4E8E3]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-[#14262B]/70">
            <Link href="/" className="hover:text-[#0F6B6B]">
              Home
            </Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-[#0F6B6B]">
              Shop
            </Link>
            {displayProduct.category && (
              <>
                <span>/</span>
                <span>{displayProduct.category.name}</span>
              </>
            )}
            <span>/</span>
            <span className="text-[#14262B]">{displayProduct.name}</span>
          </nav>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left media: TileMediaViewer for tiles, FurnitureViewer for furniture */}
            <div>
              {isTile ? (
                <TileMediaViewer product={displayProduct} />
              ) : (
                <FurnitureViewer product={displayProduct} />
              )}
            </div>

            {/* Product Info */}
            <div className="rounded-lg bg-[#F6F4EE] p-6 lg:p-8">
              <h1 className="text-3xl font-bold text-[#14262B]">{product.name}</h1>
              <p className="mt-2 text-lg text-[#14262B]/70">{product.tagline}</p>

              <p className="mt-6 text-[#14262B]">{product.description}</p>

              {/* Variant Selector */}
              <div className="mt-8">
                <ProductVariantSelector
                  product={displayProduct}
                  variants={displayProduct.productVariants}
                />
              </div>

              {/* Tile Calculator */}
              {isTile && product.soldBy === "box" && product.coveragePerBoxSqm && (
                <div className="mt-8">
                  <TileCalculator
                    coveragePerBoxSqm={parseFloat(product.coveragePerBoxSqm)}
                    pricePerBox={lowestPrice}
                    productSlug={product.slug}
                  />
                </div>
              )}

              {/* Visualizer Link for Tiles */}
              {isTile && (
                <div className="mt-6 rounded-xl border border-[#14262B]/15 bg-white/70 p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#0F6B6B]">
                        Interactive 3D Preview
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-[#14262B]">
                        See this tile in a living room, bathroom, or kitchen
                      </p>
                    </div>
                    <Link
                      href={`/visualizer?tile=${product.slug}`}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#14262B] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0F6B6B]"
                    >
                      <span>Launch in Room</span>
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )}

              {/* Furniture Dimensions */}
              {!isTile && product.dimensions && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-[#14262B]">Dimensions</h3>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-[#14262B]/70">Width:</span>
                      <p className="font-medium text-[#14262B]">{product.dimensions.width}cm</p>
                    </div>
                    <div>
                      <span className="text-[#14262B]/70">Height:</span>
                      <p className="font-medium text-[#14262B]">{product.dimensions.height}cm</p>
                    </div>
                    <div>
                      <span className="text-[#14262B]/70">Depth:</span>
                      <p className="font-medium text-[#14262B]">{product.dimensions.depth}cm</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Specifications */}
              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-[#14262B]">Specifications</h3>
                  <dl className="mt-4 space-y-3">
                    {Object.entries(product.specs).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between text-sm border-b border-[#14262B]/10 pb-2"
                      >
                        <dt className="text-[#14262B]/70">{key}:</dt>
                        <dd className="font-medium text-[#14262B]">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

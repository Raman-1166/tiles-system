import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | Artisanal Handcrafted Tiles & Furniture | Clay & Co.",
  description:
    "Discover the heritage of Clay & Co. Handcrafted ceramic tiles, raw architectural minerals, and bespoke furniture bridged with modern 3D design technology.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#faf7f0] text-stone-900">
      {/* Hero Section */}
      <section className="relative border-b border-stone-200 bg-[#f4efe4] px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase">
            Our Studio Heritage
          </p>
          <h1 className="mt-3 font-serif text-4xl font-light tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            Rooted in Earth. <br />
            <span className="italic font-normal text-stone-700">Crafted for Generations.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-stone-600">
            Clay &amp; Co. was born from a singular conviction: that living spaces deserve tactile,
            living surfaces. We unite centuries-old ceramic traditions with contemporary
            architectural precision and digital craft.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/shop?type=tile"
              className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
            >
              Explore Tile Collections
            </Link>
            <Link
              href="/visualizer"
              className="rounded-full border border-stone-300 bg-white/70 px-6 py-3 text-sm font-medium text-stone-800 backdrop-blur transition hover:bg-white hover:border-stone-400"
            >
              Launch 3D Visualizer
            </Link>
          </div>
        </div>
      </section>

      {/* Story & Philosophy */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-serif text-3xl font-light text-stone-900 sm:text-4xl">
              The Poetry of Imperfection
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-stone-600">
              <p>
                In an era dominated by uniform synthetic materials, we celebrate the organic depth
                of pure clay. Each batch of our tiles is pressed, glazed, and wood-fired by master
                artisans who understand how mineral slips react to atmospheric flame.
              </p>
              <p>
                No two tiles are mathematically identical. Subtle nuances in glaze pooling,
                micro-crazing, and surface undulations capture ambient light in ways machine-stamped
                surfaces never can. From sun-drenched Mediterranean terracottas to cool Japanese
                matte stoneware, our catalog is curated for spaces with soul.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h3 className="font-serif text-xl font-medium text-stone-900">
              Our Artisanal Standards
            </h3>
            <dl className="mt-6 space-y-5 text-sm">
              <div className="border-b border-stone-100 pb-4">
                <dt className="font-semibold text-stone-900">100% Natural Earth Minerals</dt>
                <dd className="mt-1 text-stone-600">
                  Responsibly extracted clays, mineral pigments, and water-based ceramic slips free
                  from heavy metal stabilizers.
                </dd>
              </div>
              <div className="border-b border-stone-100 pb-4">
                <dt className="font-semibold text-stone-900">Slow-Fired Kiln Cycles</dt>
                <dd className="mt-1 text-stone-600">
                  Fired up to 1,280°C over 48-hour cooling cycles to ensure structural vitreous
                  density, frost resistance, and tactile warmth.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-900">Closed-Loop Water Management</dt>
                <dd className="mt-1 text-stone-600">
                  95% of studio water used in glaze washdowns is filtered through natural reed-bed
                  settling lagoons and recirculated.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* The 3D Digital Bridge */}
      <section className="border-y border-stone-200 bg-[#f4efe4] px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl font-light text-stone-900 sm:text-4xl">
            Bridging Physical Craft &amp; Interactive 3D
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-stone-600">
            Selecting architectural finishes should never be guesswork. We developed real-time WebGL
            visualizers and physics-accurate material simulations so you can test tile layouts,
            lighting reflections, and grout colors in real time before ordering your first swatch.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-stone-200 bg-white p-6 text-left shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-900 text-white font-serif font-bold">
                1
              </div>
              <h3 className="mt-4 font-semibold text-stone-900">Sample Swatches</h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Order cut tile swatches shipped in recyclable craft packaging to experience the
                tactile glaze in your room&apos;s natural sunlight.
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-6 text-left shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-900 text-white font-serif font-bold">
                2
              </div>
              <h3 className="mt-4 font-semibold text-stone-900">3D Room Studio</h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Rotate 3D furniture models, switch tile materials across floor and wall planes, and
                inspect light falloff in real time.
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-6 text-left shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-900 text-white font-serif font-bold">
                3
              </div>
              <h3 className="mt-4 font-semibold text-stone-900">Freight &amp; Guidance</h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Direct freight delivery on reinforced wooden pallets with automated 15% wastage
                calculations tailored to room geometry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trade & Architectural Inquiries */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h2 className="font-serif text-3xl font-light text-stone-900">
          Trade &amp; Commercial Partnerships
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-stone-600">
          We partner with architects, interior designers, and hospitality developers across the
          globe. Registered trade professionals receive custom glaze formulation support, commercial
          volume pricing, and priority sample dispatch.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/contact"
            className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            Inquire About Trade Program
          </Link>
          <Link
            href="/faq"
            className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
          >
            Read FAQs
          </Link>
        </div>
      </section>
    </div>
  );
}

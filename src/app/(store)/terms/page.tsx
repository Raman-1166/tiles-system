import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Ceramic Disclosures & Conditions of Sale | Clay & Co.",
  description:
    "Review Clay & Co. Terms of Service, conditions of sale, artisanal tile variation disclosures, freight delivery protocols, and dispute resolution.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#faf7f0] text-stone-900">
      {/* Header */}
      <section className="border-b border-stone-200 bg-[#f4efe4] px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase">
            Legal Terms &amp; Conditions
          </p>
          <h1 className="mt-3 font-serif text-4xl font-light tracking-tight text-stone-900 sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-stone-600">
            Last Updated: October 2026. Please read these terms carefully before placing orders for
            architectural ceramic tiles and handcrafted furniture.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-12 text-sm leading-relaxed text-stone-600">
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-stone-900">
            1. Acceptance of Terms &amp; Scope
          </h2>
          <p>
            By accessing the Clay &amp; Co. website, using the interactive 3D room visualizer, or
            purchasing products from Clay &amp; Co. (&quot;we&quot;, &quot;our&quot;, or
            &quot;us&quot;), you agree to be legally bound by these Terms of Service. If you
            disagree with any portion of these terms, you must discontinue using our services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-stone-900">
            2. Artisanal Ceramic Disclosures &amp; Natural Variations
          </h2>
          <div className="rounded-xl border border-stone-200 bg-[#f4efe4] p-5 text-stone-800 text-xs leading-relaxed space-y-2">
            <p className="font-semibold uppercase tracking-wider text-stone-900">
              Notice to Architects, Contractors &amp; Homeowners:
            </p>
            <p>
              Ceramic, terracotta, and zellige tiles are manufactured from organic natural clays and
              fired at temperatures up to 1,280°C. Due to the inherent nature of artisanal kiln
              firing, the following characteristics are natural and intrinsic to authentic ceramics:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong>Shade &amp; Color Variation:</strong> Variations in glaze pooling,
                saturation, and sheen (industry classes V1 to V4) are expected between production
                runs.
              </li>
              <li>
                <strong>Dimensional Tolerances:</strong> Hand-pressed and rustic edges may vary by
                ±1mm to 2mm in thickness and dimensions.
              </li>
              <li>
                <strong>Surface Crazing &amp; Pitting:</strong> Micro-crazing in glossy glazes and
                iron speckling from raw minerals are decorative hallmarks of handcrafted ceramics.
              </li>
            </ul>
            <p>
              These variations are not considered manufacturing defects. We recommend mixing tiles
              from multiple cartons during dry-laying prior to final mortar bonding.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-stone-900">
            3. Order Placement, Wastage &amp; Pricing
          </h2>
          <p>
            Tiles are sold in full box increments to guarantee structural integrity during freight
            transit.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-stone-700 pl-2">
            <li>
              <strong>Wastage Recommendations:</strong> Our website provides guidance recommending
              10% to 15% extra material to accommodate cuts, corner breaks, and future attic stock.
              The customer is solely responsible for verifying final room measurements before
              ordering.
            </li>
            <li>
              <strong>Pricing Accuracy:</strong> All prices are displayed in USD/GBP/EUR as
              indicated and exclude freight delivery unless specified during checkout. In the event
              of an obvious clerical error in pricing, we reserve the right to cancel the order and
              provide a full refund.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-stone-900">
            4. Freight Delivery &amp; Risk of Loss
          </h2>
          <p>
            Full tile orders are dispatched via third-party freight carriers as curbside liftgate
            deliveries. Title and risk of loss pass to the customer upon delivery to the curbside or
            driveway.
          </p>
          <p>
            It is the customer&apos;s responsibility to inspect the outer pallet bands and report
            any visible damage on the driver&apos;s Bill of Lading (BOL). Claims for freight damage
            must be submitted in writing to Clay &amp; Co. within 48 hours of delivery accompanied
            by photographic evidence.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-stone-900">
            5. Installation Notice &amp; Waiver
          </h2>
          <p>
            <strong>
              INSTALLATION CONSTITUTES ACCEPTANCE OF MATERIAL CONDITION AND COLOR SHADE.
            </strong>
          </p>
          <p className="text-xs">
            Clay &amp; Co. cannot accept claims for shade variation, texture, or visual defects once
            tiles have been set in adhesive or mortar. Always dry-lay a representative sample of
            tiles in the intended room under ambient lighting and approve the appearance prior to
            final installation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-stone-900">
            6. Limitation of Liability
          </h2>
          <p className="text-xs">
            To the maximum extent permitted by applicable law, Clay &amp; Co. shall not be liable
            for indirect, incidental, or consequential damages, including installation labor fees,
            job delay penalties, contractor remobilization fees, or substrate repair costs. Our
            total aggregate liability shall not exceed the purchase price paid for the affected
            goods.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-stone-900">7. Governing Law</h2>
          <p className="text-xs">
            These terms shall be governed by and construed in accordance with the laws of the United
            Kingdom, without regard to its conflict of law provisions.
          </p>
        </section>
      </div>
    </div>
  );
}

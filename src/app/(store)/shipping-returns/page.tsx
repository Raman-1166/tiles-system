import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping & Returns Policy | Pallet Freight & 30-Day Guarantee | Clay & Co.",
  description:
    "Review Clay & Co. freight delivery protocols, sample swatch dispatch timelines, damage replacement guarantees, and our 30-day unopened box return guidelines.",
};

export default function ShippingReturnsPage() {
  return (
    <div className="min-h-screen bg-[#faf7f0] text-stone-900">
      {/* Header */}
      <section className="border-b border-stone-200 bg-[#f4efe4] px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase">
            Logistics &amp; Customer Protection
          </p>
          <h1 className="mt-3 font-serif text-4xl font-light tracking-tight text-stone-900 sm:text-5xl">
            Shipping &amp; Returns Policy
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-stone-600">
            Handcrafted architectural ceramics require specialized freight handling. Here is exactly
            how our shipments are secured, dispatched, and supported.
          </p>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="mx-auto max-w-4xl px-6 py-16 space-y-16">
        {/* Shipping Overview */}
        <section className="rounded-2xl border border-stone-200 bg-white p-8 sm:p-10 shadow-sm">
          <h2 className="font-serif text-2xl font-light text-stone-900">
            1. Freight Delivery &amp; Sample Dispatch
          </h2>
          <div className="mt-6 space-y-6 text-sm text-stone-600 leading-relaxed">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-stone-100 bg-[#faf7f0] p-5">
                <h3 className="font-semibold text-stone-900">Sample Swatch Kits</h3>
                <ul className="mt-3 space-y-2 text-xs">
                  <li>• Dispatched within 24–48 hours via carbon-neutral courier.</li>
                  <li>• Typical transit: 2–4 business days worldwide.</li>
                  <li>• Packed in 100% recyclable molded fiber protective sleeves.</li>
                  <li>• Includes color consultation notes and voucher code.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-stone-100 bg-[#faf7f0] p-5">
                <h3 className="font-semibold text-stone-900">Full Pallet Tile Freight</h3>
                <ul className="mt-3 space-y-2 text-xs">
                  <li>• Shipped on heat-treated, heavy-gauge banded timber pallets.</li>
                  <li>• Standard freight transit: 4–7 business days.</li>
                  <li>• Dispatched with liftgate delivery to ground curbside.</li>
                  <li>• Direct carrier tracking number and phone scheduling appointment.</li>
                </ul>
              </div>
            </div>

            <p>
              Full orders of ceramic tiles are heavy architectural goods weighing anywhere from 300
              kg to 1,200 kg per pallet. To guarantee safe transit, all tile boxes are
              shrink-wrapped and banded with reinforced polypropylene strapping.
            </p>
          </div>
        </section>

        {/* Curbside Delivery Protocol */}
        <section className="rounded-2xl border border-stone-200 bg-white p-8 sm:p-10 shadow-sm">
          <h2 className="font-serif text-2xl font-light text-stone-900">
            2. Curbside Pallet Delivery: What to Expect
          </h2>
          <div className="mt-6 space-y-4 text-sm text-stone-600 leading-relaxed">
            <p>
              All standard tile deliveries are strictly <strong>curbside liftgate delivery</strong>.
              The carrier will lower the pallet from the truck onto flat, hard paved ground
              (driveway, curbside, or loading dock) using an electric pallet jack.
            </p>
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 text-amber-950">
              <h3 className="font-semibold text-xs tracking-wider uppercase text-amber-900">
                Important Delivery Day Protocol
              </h3>
              <ol className="mt-3 space-y-2 text-xs list-decimal list-inside">
                <li>
                  <strong>Be Present:</strong> A designated adult must be present during the
                  scheduled delivery window to inspect the outer pallet wrapping and sign the Bill
                  of Lading (BOL).
                </li>
                <li>
                  <strong>Inspect Pallet Bands:</strong> Verify that the timber pallet bands and
                  shrink wrap are intact and unbroken before signing.
                </li>
                <li>
                  <strong>Note Any Discrepancies:</strong> If you observe any crushed outer cartons
                  or broken tiles, simply note <em>&quot;Damaged on Delivery&quot;</em> next to your
                  signature on the driver&apos;s manifest and take high-resolution photos
                  immediately.
                </li>
              </ol>
            </div>
            <p className="text-xs text-stone-500">
              * Note: Freight drivers are not authorized to carry individual tile boxes inside
              residential homes, up flights of stairs, or into back gardens. Please arrange
              installation contractors or physical assistance to move boxes indoors after curbside
              drop-off.
            </p>
          </div>
        </section>

        {/* Breakage & Damage Guarantee */}
        <section className="rounded-2xl border border-stone-200 bg-white p-8 sm:p-10 shadow-sm">
          <h2 className="font-serif text-2xl font-light text-stone-900">
            3. Damage Protection Guarantee
          </h2>
          <div className="mt-6 space-y-4 text-sm text-stone-600 leading-relaxed">
            <p>
              In accordance with international ceramic trade standards, normal transit vibrations
              may cause up to <strong>1% to 2% minor corner chipping</strong>. Professional tile
              installers routinely use chipped pieces for perimeter cuts against walls, corners, and
              plumbing inlets.
            </p>
            <p>
              If your shipment has sustained freight impact damage exceeding this allowance, Clay
              &amp; Co. will replace the damaged boxes at <strong>zero cost to you</strong>.
            </p>
            <div className="rounded-xl border border-stone-100 bg-[#faf7f0] p-5">
              <h3 className="font-semibold text-xs tracking-wider uppercase text-stone-900">
                To Submit a Damage Claim:
              </h3>
              <p className="mt-2 text-xs">
                Email <strong>concierge@clayandco.com</strong> within 48 hours of delivery with your
                Order Number, a photograph of the damaged boxes, and photos of the signed Bill of
                Lading. We expedite replacement boxes within 24 hours.
              </p>
            </div>
          </div>
        </section>

        {/* 30-Day Return Policy */}
        <section className="rounded-2xl border border-stone-200 bg-white p-8 sm:p-10 shadow-sm">
          <h2 className="font-serif text-2xl font-light text-stone-900">
            4. 30-Day Unopened Box Return Policy
          </h2>
          <div className="mt-6 space-y-4 text-sm text-stone-600 leading-relaxed">
            <p>
              We want you to be completely confident in your selection. We accept returns of
              unopened, complete tile boxes within 30 days of shipment receipt under the following
              guidelines:
            </p>
            <ul className="space-y-2 text-xs list-disc list-inside text-stone-700">
              <li>
                <strong>Condition:</strong> Boxes must be in original, unblemished manufacturer
                packaging, completely taped and sealed, without water damage or mortar stains.
              </li>
              <li>
                <strong>Quantity:</strong> Returns must be in full box increments (we cannot accept
                loose or partial boxes due to lot-code tracking).
              </li>
              <li>
                <strong>Return Shipping:</strong> As tiles are heavy freight items, the customer is
                responsible for return freight booking, or we can arrange discounted pallet return
                collection deducted from the final refund.
              </li>
              <li>
                <strong>Restocking Fee:</strong> A standard 15% restocking fee applies to cover
                warehouse pallet unpacking, shade-lot quality control inspection, and restacking.
              </li>
            </ul>

            <h3 className="font-semibold text-stone-900 pt-4">Non-Returnable Items</h3>
            <p className="text-xs">
              Individual sample swatches, custom artisan glaze commissions, clearance archive lots,
              and opened boxes are non-returnable.
            </p>
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="rounded-2xl border border-stone-200 bg-[#f4efe4] p-8 text-center">
          <h2 className="font-serif text-xl font-light text-stone-900">
            Need Help With an Upcoming Delivery?
          </h2>
          <p className="mt-2 text-xs text-stone-600">
            Track your order or reach out directly to our logistics coordination desk.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/order/lookup"
              className="rounded-full bg-stone-900 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-stone-700"
            >
              Track Existing Order
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-stone-300 bg-white px-6 py-2.5 text-xs font-semibold text-stone-800 transition hover:bg-stone-50"
            >
              Contact Logistics Concierge
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-[#f3efe6] text-stone-700">
      <div className="mx-auto max-w-6xl px-6 py-14">
        {/* Top 4-Column Grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Studio Mission */}
          <div className="space-y-4">
            <Link href="/" className="font-serif text-xl font-medium tracking-tight text-stone-900">
              Clay &amp; Co.
            </Link>
            <p className="text-xs leading-relaxed text-stone-600">
              Handcrafted architectural ceramics and bespoke furniture. We unite traditional
              wood-fired kilns with interactive 3D WebGL visualization for discerning spaces.
            </p>
            <div className="pt-1 text-xs text-stone-500">
              <p>Stoke-on-Trent • London • Global Freight</p>
              <p className="mt-1">concierge@clayandco.com</p>
            </div>
          </div>

          {/* Column 2: Collections & Studio Tools */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-900">
              Collections &amp; Tools
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs text-stone-600">
              <li>
                <Link href="/shop?type=tile" className="hover:text-stone-950 transition-colors">
                  Architectural Tiles
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?type=furniture"
                  className="hover:text-stone-950 transition-colors"
                >
                  Handcrafted Furniture
                </Link>
              </li>
              <li>
                <Link href="/visualizer" className="hover:text-stone-950 transition-colors">
                  3D Room Visualizer
                </Link>
              </li>
              <li>
                <Link href="/order/lookup" className="hover:text-stone-950 transition-colors">
                  Lookup Order &amp; Receipt
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care & Freight */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-900">
              Customer Care
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs text-stone-600">
              <li>
                <Link href="/shipping-returns" className="hover:text-stone-950 transition-colors">
                  Shipping &amp; Pallet Freight
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-stone-950 transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-stone-950 transition-colors">
                  Contact Studio Concierge
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping-returns#returns"
                  className="hover:text-stone-950 transition-colors"
                >
                  30-Day Unopened Returns
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Heritage & Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-900">
              Heritage &amp; Legal
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs text-stone-600">
              <li>
                <Link href="/about" className="hover:text-stone-950 transition-colors">
                  About Our Studio
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-stone-950 transition-colors">
                  Privacy Policy &amp; GDPR
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-stone-950 transition-colors">
                  Terms of Service &amp; Disclosures
                </Link>
              </li>
              <li>
                <Link
                  href="/contact?topic=trade"
                  className="hover:text-stone-950 transition-colors"
                >
                  Trade &amp; Architecture Program
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Trust Badges & Copyright */}
        <div className="mt-12 border-t border-stone-200/80 pt-8 flex flex-col gap-4 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Clay &amp; Co. All rights reserved. Tiles you can turn.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              100% Natural Earth Clays
            </span>
            <span>•</span>
            <span>Direct Freight Pallet Delivery</span>
            <span>•</span>
            <span>PCI-DSS Secure Checkout</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

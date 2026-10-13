import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Data Protection & Security | Clay & Co.",
  description:
    "Learn how Clay & Co. protects customer personal data, handles secure Stripe payments, and manages session cookies in compliance with GDPR and privacy regulations.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#faf7f0] text-stone-900">
      {/* Header */}
      <section className="border-b border-stone-200 bg-[#f4efe4] px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase">
            Data Transparency &amp; Protection
          </p>
          <h1 className="mt-3 font-serif text-4xl font-light tracking-tight text-stone-900 sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-stone-600">
            Last Updated: October 2026. Your privacy and transaction security are fundamental to how
            we operate our studio and digital visualizers.
          </p>
        </div>
      </section>

      {/* Main Legal Content */}
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-12 text-sm leading-relaxed text-stone-600">
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-stone-900">
            1. Information We Collect
          </h2>
          <p>
            When you visit Clay &amp; Co., browse our tile catalog, use our 3D room visualizer, or
            place an order, we collect information necessary to deliver our services:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-stone-700 pl-2">
            <li>
              <strong>Order &amp; Fulfillment Information:</strong> Customer full name, email
              address, telephone contact number, shipping destination, and billing address.
            </li>
            <li>
              <strong>Payment Information:</strong> All payment transactions are securely handled
              via Stripe. We do NOT store or process raw credit card numbers or CVVs on Clay &amp;
              Co. servers.
            </li>
            <li>
              <strong>Digital Interactions:</strong> Information about your device, browser, IP
              address, and 3D visualizer settings (saved tile selections, lighting presets, room
              configurations).
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-stone-900">
            2. How We Use Your Information
          </h2>
          <p>We use the data collected strictly for legitimate business purposes:</p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-stone-700 pl-2">
            <li>
              To process, fulfill, and provide freight tracking for your tile and furniture orders.
            </li>
            <li>
              To dispatch transactional emails, payment receipts, and delivery scheduling alerts.
            </li>
            <li>To provide customer support and respond to custom glaze inquiries.</li>
            <li>To prevent fraudulent transactions, double-submits, and malicious API misuse.</li>
            <li>To maintain and improve the performance of our WebGL 3D visualizer.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-stone-900">
            3. Payment Security &amp; PCI-DSS Compliance
          </h2>
          <p>
            All financial transactions on our platform are processed by{" "}
            <strong>Stripe, Inc.</strong>, a certified PCI Service Provider Level 1 (the most
            stringent security standard in the payments industry).
          </p>
          <p>
            Your payment card details are encrypted and tokenized directly through Stripe Elements.
            Clay &amp; Co. only retains payment confirmation identifiers, timestamps, and order
            reference numbers for auditing and fulfillment purposes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-stone-900">
            4. Cookies &amp; Local Browser Storage
          </h2>
          <p>We respect your browsing experience and keep local storage minimal. We utilize:</p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-stone-700 pl-2">
            <li>
              <strong>Essential Session Storage:</strong> Temporary cart state, active shopping bag,
              and authenticated admin session tokens (`clay_admin_session`, HttpOnly and SameSite).
            </li>
            <li>
              <strong>Saved Items &amp; Preferences:</strong> Browser `localStorage` to save your
              &quot;Save for Later&quot; tile choices and room visualizer camera position.
            </li>
            <li>
              <strong>No Third-Party Ad Trackers:</strong> We do not sell your personal data or rent
              customer lists to third-party advertising syndicates.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-stone-900">
            5. Your Data Rights (GDPR &amp; Global Privacy)
          </h2>
          <p>
            Regardless of your geographic location, you have rights regarding your personal data:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-stone-700 pl-2">
            <li>The right to request access to the personal data we hold about you.</li>
            <li>The right to rectify inaccurate or incomplete delivery information.</li>
            <li>The right to request deletion of your account and personal history.</li>
            <li>The right to restrict or object to automated data processing.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-stone-900">
            6. Contact Data Protection Officer
          </h2>
          <p>
            If you have questions regarding this Privacy Policy or wish to exercise your data
            rights, please write to our Data Privacy Officer:
          </p>
          <div className="rounded-xl border border-stone-200 bg-white p-5 text-xs text-stone-800">
            <p className="font-semibold">Clay &amp; Co. Data Protection Office</p>
            <p className="mt-1">Email: privacy@clayandco.com</p>
            <p>Address: 142 Artisan Row, Stoke-on-Trent, ST1 4DY, United Kingdom</p>
          </div>
        </section>
      </div>
    </div>
  );
}

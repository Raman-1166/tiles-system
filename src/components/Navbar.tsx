"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/cartStore";

export function Navbar() {
  const { count, refresh } = useCartStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const currentType =
    searchParams.get("type") ||
    (searchParams.get("category") === "tile" || searchParams.get("category") === "furniture"
      ? searchParams.get("category")
      : null);

  function navLinkClass(type: "tile" | "furniture") {
    const active = currentType === type;
    return `hover:text-stone-950 transition-colors ${active ? "font-semibold text-stone-950 underline underline-offset-4" : ""}`;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-[#faf7f0]/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-stone-900">
          Clay &amp; Co.
        </Link>
        <div className="flex items-center gap-6 text-sm text-stone-700">
          <Link href="/shop?type=tile" className={navLinkClass("tile")}>
            Tiles
          </Link>
          <Link href="/shop?type=furniture" className={navLinkClass("furniture")}>
            Furniture
          </Link>
          <Link
            href="/visualizer"
            className={`hover:text-stone-950 transition-colors ${pathname === "/visualizer" ? "font-semibold text-stone-950 underline underline-offset-4" : ""}`}
          >
            Room visualizer
          </Link>
          <Link
            href="/cart"
            className="relative rounded-full bg-stone-900 px-4 py-1.5 text-white transition hover:bg-stone-700"
          >
            Cart
            {count > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-xs font-semibold text-stone-900">
                {count}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
}

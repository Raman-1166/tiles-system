import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-[#f3efe6] py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Clay &amp; Co. Tiles you can turn.</p>
        <div className="flex gap-5">
          <Link href="/shop" className="hover:text-stone-900">
            Shop
          </Link>
          <Link href="/visualizer" className="hover:text-stone-900">
            Visualizer
          </Link>
          <Link href="/guide" className="hover:text-stone-900">
            Add new products
          </Link>
        </div>
      </div>
    </footer>
  );
}

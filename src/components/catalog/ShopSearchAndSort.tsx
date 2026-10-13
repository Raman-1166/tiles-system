"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function ShopSearchAndSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialSearch = searchParams.get("search") || "";
  const initialSort = searchParams.get("sort") || "newest";

  const [searchVal, setSearchVal] = useState(initialSearch);
  const [sortVal, setSortVal] = useState(initialSort);

  // Sync state if URL changes externally
  useEffect(() => {
    setSearchVal(searchParams.get("search") || "");
    setSortVal(searchParams.get("sort") || "newest");
  }, [searchParams]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentParam = searchParams.get("search") || "";
      if (searchVal !== currentParam) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchVal.trim()) {
          params.set("search", searchVal.trim());
        } else {
          params.delete("search");
        }
        params.delete("page"); // reset to page 1 on search change
        startTransition(() => {
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchVal, pathname, router, searchParams]);

  function handleSortChange(newSort: string) {
    setSortVal(newSort);
    const params = new URLSearchParams(searchParams.toString());
    if (newSort === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }
    params.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function handleClearSearch() {
    setSearchVal("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Debounced Search Input */}
      <div className="relative flex-1 max-w-md">
        <label htmlFor="shop-search" className="sr-only">
          Search products
        </label>
        <div className="relative">
          <input
            id="shop-search"
            type="search"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search glazes, terracotta, oak furniture, sizes..."
            className="w-full rounded-full border border-stone-300 bg-white px-4 py-2 text-xs text-stone-900 shadow-2xs placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
          />
          {searchVal && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-2 text-stone-400 hover:text-stone-700 text-xs"
              aria-label="Clear search query"
            >
              ✕
            </button>
          )}
        </div>
        {isPending && (
          <span className="absolute right-8 top-2.5 text-[10px] text-stone-400">Updating…</span>
        )}
      </div>

      {/* Sort Selector */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <label htmlFor="shop-sort" className="text-xs font-medium text-stone-600 whitespace-nowrap">
          Sort by:
        </label>
        <select
          id="shop-sort"
          value={sortVal}
          onChange={(e) => handleSortChange(e.target.value)}
          className="rounded-full border border-stone-300 bg-white px-3.5 py-2 text-xs text-stone-900 shadow-2xs focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
        >
          <option value="newest">Featured &amp; Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
}

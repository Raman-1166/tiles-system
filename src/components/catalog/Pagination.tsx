import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams: Record<string, string | undefined>;
}

export function Pagination({ currentPage, totalPages, baseUrl, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  function createPageUrl(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") {
        params.set(key, value);
      }
    }
    params.set("page", String(page));
    return `${baseUrl}?${params.toString()}`;
  }

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    // Show first, last, current, and adjacent pages
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    }
  }

  return (
    <nav aria-label="Catalog pagination" className="mt-12 flex items-center justify-center gap-2">
      {/* Previous Page Button */}
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition shadow-2xs"
        >
          ← Previous
        </Link>
      ) : (
        <span className="rounded-full border border-stone-200 bg-stone-100 px-4 py-2 text-xs font-medium text-stone-400 cursor-not-allowed">
          ← Previous
        </span>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-1.5">
        {pages.map((p, idx) => {
          const prevPage = pages[idx - 1];
          const hasEllipsis = prevPage && p - prevPage > 1;

          return (
            <div key={p} className="flex items-center gap-1.5">
              {hasEllipsis && <span className="px-1 text-xs text-stone-400">…</span>}
              <Link
                href={createPageUrl(p)}
                aria-current={p === currentPage ? "page" : undefined}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                  p === currentPage
                    ? "bg-stone-900 text-white shadow-2xs"
                    : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                }`}
              >
                {p}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Next Page Button */}
      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition shadow-2xs"
        >
          Next →
        </Link>
      ) : (
        <span className="rounded-full border border-stone-200 bg-stone-100 px-4 py-2 text-xs font-medium text-stone-400 cursor-not-allowed">
          Next →
        </span>
      )}
    </nav>
  );
}

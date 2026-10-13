import type { ReactNode } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#E4E8E3] text-[#14262B]">
      {/* Admin Top Navigation Bar */}
      <header className="border-b border-stone-300 bg-[#F6F4EE]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="font-serif font-bold text-lg tracking-tight text-[#14262B]"
            >
              Clay &amp; Co.{" "}
              <span className="text-xs font-sans font-medium px-2 py-0.5 ml-1 rounded bg-stone-200 text-stone-700 uppercase tracking-wider">
                Admin
              </span>
            </Link>
            <nav className="hidden sm:flex items-center gap-4 text-sm font-medium text-stone-600">
              <Link href="/admin" className="hover:text-stone-900 transition-colors">
                Inventory
              </Link>
              <Link href="/admin" className="hover:text-stone-900 transition-colors">
                Orders
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-600 hover:text-stone-900 flex items-center gap-1 transition-colors"
            >
              <span>View Store</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      {children}
    </div>
  );
}

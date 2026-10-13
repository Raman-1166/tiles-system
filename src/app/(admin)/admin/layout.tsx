import type { ReactNode } from "react";
import Link from "next/link";
import { AdminNavLinks } from "./AdminNavLinks";
import { AdminLogoutButton } from "./AdminLogoutButton";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f3efe6] text-stone-900 flex flex-col md:flex-row">
      {/* Admin Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-stone-900 text-stone-200 shrink-0 border-r border-stone-800 flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-stone-800/80">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg tracking-tight text-white">
              Clay &amp; Co.
            </span>
            <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded bg-amber-600/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
              Admin
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-6">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
            Operations &amp; Commerce
          </p>
          <AdminNavLinks />
        </div>

        {/* Footer / Store Link / Logout */}
        <div className="p-4 border-t border-stone-800/80 space-y-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-stone-400 hover:text-white rounded-lg hover:bg-stone-800/50 transition"
          >
            <span className="flex items-center gap-2">
              <span>🏪</span>
              <span>View Storefront</span>
            </span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </Link>
          <div className="px-3 pt-2">
            <AdminLogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-4 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}

"use client";

import { useCartStore } from "@/store/cartStore";

export function ToastContainer() {
  const { toast, hideToast } = useCartStore();

  if (!toast) return null;

  const bgStyles = {
    success: "bg-stone-900 text-white border-stone-800",
    info: "bg-stone-800 text-stone-100 border-stone-700",
    error: "bg-red-900 text-white border-red-800",
  }[toast.type];

  const icon = {
    success: (
      <svg
        aria-hidden="true"
        className="h-4 w-4 text-emerald-400 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
      </svg>
    ),
    info: (
      <svg
        aria-hidden="true"
        className="h-4 w-4 text-sky-400 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    error: (
      <svg
        aria-hidden="true"
        className="h-4 w-4 text-rose-400 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  }[toast.type];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-3 rounded-xl border p-4 shadow-xl backdrop-blur transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div
        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs font-medium shadow-sm ${bgStyles}`}
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span>{toast.message}</span>
        </div>
        <button
          onClick={hideToast}
          aria-label="Dismiss notification"
          className="ml-2 rounded p-1 text-stone-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

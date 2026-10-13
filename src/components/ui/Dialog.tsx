"use client";

import React, { useEffect, useRef, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  closeOnBackdrop?: boolean;
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
  closeOnBackdrop = true,
}: DialogProps) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;

      // Lock body scroll
      document.body.style.overflow = "hidden";

      // Focus first focusable element inside modal
      const focusTimer = setTimeout(() => {
        if (dialogRef.current) {
          const focusable = dialogRef.current.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          focusable?.focus();
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }

        // Trap focus inside modal
        if (e.key === "Tab" && dialogRef.current) {
          const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusables.length === 0) return;

          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
        clearTimeout(focusTimer);
        previouslyFocusedRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (closeOnBackdrop) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`relative z-10 w-full overflow-hidden rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-stone-900/5 transition-all dark:bg-stone-800 dark:ring-stone-100/10 ${maxWidthMap[maxWidth]}`}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-700">
          <div>
            <h2
              id={titleId}
              className="font-serif text-xl font-bold text-[#14262B] dark:text-[#FAF7F0]"
            >
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14262B] dark:hover:bg-stone-700 dark:hover:text-stone-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="py-4 text-sm text-stone-600 dark:text-stone-300 font-sans">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-stone-700">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

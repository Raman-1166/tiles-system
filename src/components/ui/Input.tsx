"use client";

import React, { forwardRef, useId, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { id, label, helperText, error, leftAddon, rightAddon, disabled, className = "", ...props },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedBy = error ? errorId : helperText ? helperId : undefined;

    return (
      <div className="w-full space-y-1.5 font-sans">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center rounded-xl bg-white shadow-sm ring-1 ring-stone-300 transition-all focus-within:ring-2 focus-within:ring-[#14262B] dark:bg-stone-800 dark:ring-stone-700 dark:focus-within:ring-[#FAF7F0]">
          {leftAddon && (
            <div className="pointer-events-none flex items-center pl-3.5 text-stone-400">
              {leftAddon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={`w-full bg-transparent px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400 dark:text-stone-100 dark:disabled:bg-stone-900 ${leftAddon ? "pl-2" : ""} ${rightAddon ? "pr-2" : ""} ${className}`}
            {...props}
          />

          {rightAddon && (
            <div className="flex items-center pr-3.5 text-stone-400">{rightAddon}</div>
          )}
        </div>

        {error ? (
          <p id={errorId} className="text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-stone-500 dark:text-stone-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

"use client";

import React, { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#14262B] text-[#FAF7F0] hover:bg-[#1E383F] active:bg-[#0D191D] border-transparent shadow-sm",
  secondary:
    "bg-[#E4E8E3] text-[#14262B] hover:bg-[#D5DCD4] active:bg-[#C8D1C7] border-transparent",
  outline:
    "bg-transparent text-[#14262B] border-[#14262B]/20 hover:bg-[#14262B]/5 active:bg-[#14262B]/10 dark:text-[#FAF7F0] dark:border-[#FAF7F0]/30",
  ghost:
    "bg-transparent text-[#14262B] hover:bg-[#14262B]/5 active:bg-[#14262B]/10 border-transparent dark:text-[#FAF7F0]",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border-transparent shadow-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5",
  md: "px-4 py-2.5 text-sm font-medium rounded-xl gap-2",
  lg: "px-6 py-3.5 text-base font-medium rounded-xl gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = "",
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={`inline-flex items-center justify-center border font-sans select-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14262B] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="sr-only">Loading...</span>
          </>
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";

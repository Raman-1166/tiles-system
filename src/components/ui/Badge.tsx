import React, { type HTMLAttributes } from "react";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "outline" | "subtle";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[#14262B] text-[#FAF7F0] border-transparent",
  success:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  warning:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  danger:
    "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
  outline:
    "bg-transparent text-stone-700 border-stone-300 dark:text-stone-300 dark:border-stone-700",
  subtle: "bg-[#E4E8E3] text-[#14262B] border-transparent dark:bg-stone-800 dark:text-stone-200",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  icon,
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center font-sans font-medium rounded-full border tracking-wide select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

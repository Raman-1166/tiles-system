import React, { type HTMLAttributes } from "react";

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl bg-white border border-stone-200/80 shadow-sm transition-shadow dark:bg-stone-800 dark:border-stone-700/80 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`p-6 pb-3 border-b border-stone-100 dark:border-stone-700/60 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`p-6 pt-3 border-t border-stone-100 dark:border-stone-700/60 flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

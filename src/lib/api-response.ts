import { NextResponse } from "next/server";

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const ERROR_CODES = {
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  IDEMPOTENCY_CONFLICT: "IDEMPOTENCY_CONFLICT",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  PAYMENT_FAILED: "PAYMENT_FAILED",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode | string,
    message: string,
    public readonly status: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Standard error response with uniform shape and no-store caching headers.
 */
export function jsonError(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const isProd = process.env.NODE_ENV === "production";
  const safeMessage =
    status >= 500 && isProd
      ? "An unexpected internal error occurred. Please try again later."
      : message;

  return NextResponse.json(
    {
      error: {
        code,
        message: safeMessage,
        ...(details && !isProd ? { details } : {}),
      },
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  );
}

/**
 * Standard success response with configurable caching headers.
 */
export function jsonSuccess<T>(
  data: T,
  status: number = 200,
  cacheable: boolean = false
): NextResponse<T> {
  const headers: Record<string, string> = cacheable
    ? { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" }
    : { "Cache-Control": "no-store, no-cache, must-revalidate", Pragma: "no-cache" };

  return NextResponse.json(data, { status, headers });
}

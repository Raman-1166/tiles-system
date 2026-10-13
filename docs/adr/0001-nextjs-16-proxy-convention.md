# ADR 0001: Next.js 16 Proxy Convention & Edge Route Guarding

## Status

Accepted

## Context

Next.js 16 deprecates the legacy `middleware.ts` naming convention in favor of `proxy.ts` (`export async function proxy(request)`). Furthermore, edge runtime code cannot import `node:crypto` or rely on Node.js native bindings.

## Decision

1. Implement route interception and origin checks inside `src/proxy.ts` using the Web Crypto API (`crypto.subtle`) for HMAC-SHA256 signature verification.
2. Isolate administrative routes (`/admin/*`) from unauthorized access at the network boundary before reaching Server Components or route handlers.
3. Enforce strict origin checking on all state-changing requests (`POST`, `PATCH`, `DELETE`) across `/api/*`, except for external payment webhook endpoints (`/api/webhooks/stripe`).

## Consequences

- **Positive:** Complies with Next.js 16 forward-compatibility, eliminating deprecation notices.
- **Positive:** Blocks CSRF and cross-origin tampering at the edge without database lookups.
- **Trade-off:** Secrets checked at the edge must be passed via standard environment variables and evaluated without Node-specific modules.

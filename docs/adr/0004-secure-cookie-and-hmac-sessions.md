# ADR 0004: Secure Cookie & HMAC Session Management

## Status

Accepted

## Context

Storing session tokens in browser `localStorage` exposes them to Cross-Site Scripting (XSS) exfiltration. Conversely, database-backed sessions create high I/O overhead on every server component render.

## Decision

1. Use cryptographically signed, tamper-proof `HttpOnly`, `SameSite=Lax`, `Secure` cookies for both administrative sessions (`admin_session`) and customer accounts (`customer_session`).
2. Sign cookie payloads using HMAC-SHA256 with constant-time equality comparisons (`timingSafeEqual`) to eliminate timing attacks.
3. Encapsulate session payload with timestamp expiration to ensure automatic session invalidation without stateful database session tracking.

## Consequences

- **Positive:** Immune to JavaScript token theft via XSS.
- **Positive:** Zero database query overhead for session validation.
- **Positive:** Compatible with Next.js edge runtime and server components.

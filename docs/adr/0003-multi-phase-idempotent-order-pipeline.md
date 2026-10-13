# ADR 0003: Multi-Phase Idempotent Order & Payment Pipeline

## Status

Accepted

## Context

E-commerce checkout flows are prone to network timeouts, double-submit button clicks, and out-of-order webhook deliveries from payment gateways, which can cause duplicate charges and inventory race conditions.

## Decision

1. Implement a 2-stage checkout transaction architecture:
   - Stage 1: `createPendingOrder` validates prices directly against MySQL database, locks SKU stock, and records a pending order with a unique idempotency key.
   - Stage 2: Payment webhook (`stripe` or `mock`) marks order as `paid`, decrements inventory, writes payment record, and logs audit events inside a single atomic database transaction.
2. Webhook processing is backed by a `webhook_events` table ensuring duplicate webhook notifications are dropped immediately with HTTP 200 without re-executing fulfillment logic.

## Consequences

- **Positive:** Zero risk of duplicate charges or inconsistent stock allocations.
- **Positive:** Fully auditable timeline in `order_events` from `order_placed` to `payment_received` and `delivered`.

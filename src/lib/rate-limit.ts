/**
 * rate-limit.ts — Lightweight in-memory rate limiting with pluggable store support.
 */

export interface RateLimitOptions {
  intervalMs: number; // Time window (e.g., 60_000 for 1 minute)
  max: number; // Maximum allowed requests within the interval
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export interface RateLimitStore {
  consume(key: string, max: number, intervalMs: number): Promise<RateLimitResult> | RateLimitResult;
  reset(key: string): Promise<void> | void;
}

interface WindowRecord {
  timestamps: number[];
}

export class MemoryRateLimitStore implements RateLimitStore {
  private records = new Map<string, WindowRecord>();
  private lastCleanup = Date.now();

  consume(key: string, max: number, intervalMs: number): RateLimitResult {
    const now = Date.now();

    // Occasional cleanup of stale entries (every 60s)
    if (now - this.lastCleanup > 60_000) {
      this.cleanup(now, intervalMs);
      this.lastCleanup = now;
    }

    let record = this.records.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }

    // Filter out timestamps outside the active window
    const windowStart = now - intervalMs;
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= max) {
      const oldest = record.timestamps[0];
      const resetMs = Math.max(0, oldest + intervalMs - now);
      return {
        allowed: false,
        remaining: 0,
        resetMs,
      };
    }

    record.timestamps.push(now);
    const remaining = max - record.timestamps.length;
    const resetMs = intervalMs;

    return {
      allowed: true,
      remaining,
      resetMs,
    };
  }

  reset(key: string): void {
    this.records.delete(key);
  }

  private cleanup(now: number, maxIntervalMs: number): void {
    const threshold = now - maxIntervalMs;
    for (const [key, record] of this.records.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > threshold);
      if (record.timestamps.length === 0) {
        this.records.delete(key);
      }
    }
  }
}

// Global in-memory store instance
const defaultStore = new MemoryRateLimitStore();

/**
 * Check and consume a rate limit token for an identifier (e.g. IP address or session).
 */
export async function checkRateLimit(
  key: string,
  options: RateLimitOptions,
  store: RateLimitStore = defaultStore
): Promise<RateLimitResult> {
  return store.consume(key, options.max, options.intervalMs);
}

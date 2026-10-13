import crypto from "node:crypto";

const DEFAULT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): string {
  return process.env.ORDER_TOKEN_SECRET || "default_test_order_token_secret_32chars_long_minimum!";
}

/**
 * Generate a signed, time-limited token for securely accessing an order.
 * Format: <orderNumber>.<expiresAtTimestamp>.<hmacSignature>
 */
export function createOrderToken(
  orderNumber: string,
  expiresInMs: number = DEFAULT_EXPIRY_MS,
  secretOverride?: string
): string {
  const secret = secretOverride || getSecret();
  const expiresAt = Date.now() + expiresInMs;
  const data = `${orderNumber}.${expiresAt}`;
  const signature = crypto.createHmac("sha256", secret).update(data).digest("hex");
  return `${data}.${signature}`;
}

export interface VerifyOrderTokenResult {
  valid: boolean;
  orderNumber?: string;
  expired?: boolean;
}

/**
 * Verify an order access token.
 */
export function verifyOrderToken(token: string, secretOverride?: string): VerifyOrderTokenResult {
  if (!token || typeof token !== "string") {
    return { valid: false };
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false };
  }

  const [orderNumber, expiresAtStr, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAt)) {
    return { valid: false };
  }

  const secret = secretOverride || getSecret();
  const expectedData = `${orderNumber}.${expiresAt}`;
  const expectedSig = crypto.createHmac("sha256", secret).update(expectedData).digest("hex");

  // Constant-time comparison
  const sigBuf = Buffer.from(signature, "hex");
  const expectedBuf = Buffer.from(expectedSig, "hex");

  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return { valid: false };
  }

  if (Date.now() > expiresAt) {
    return { valid: false, orderNumber, expired: true };
  }

  return { valid: true, orderNumber, expired: false };
}

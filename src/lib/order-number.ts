import crypto from "node:crypto";
import { ORDER_PREFIX, ORDER_NUMBER_MAX_RETRIES } from "@/config/commerce";

// Unambiguous Base32 character set (excludes 0/O, 1/I/L, U)
// 32 characters: 23456789ABCDEFGHJKMNPQRSTVWXYZ
const UNAMBIGUOUS_CHARS = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Generate an 8-character cryptographically random unambiguous code.
 * E.g., '7K9M4W2P'
 */
export function generateRandomCode(length = 8): string {
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += UNAMBIGUOUS_CHARS[bytes[i] % UNAMBIGUOUS_CHARS.length];
  }
  return code;
}

/**
 * Generate a full order number prefixed with CLAY-.
 * E.g., 'CLAY-7K9M4W2P'
 */
export function generateOrderNumber(): string {
  return `${ORDER_PREFIX}-${generateRandomCode(8)}`;
}

/**
 * Check if a candidate string matches the standard order number format.
 */
export function isValidOrderNumber(orderNumber: string): boolean {
  if (!orderNumber || typeof orderNumber !== "string") return false;
  const regex = new RegExp(`^${ORDER_PREFIX}-[${UNAMBIGUOUS_CHARS}]{8}$`);
  return regex.test(orderNumber.trim().toUpperCase());
}

/**
 * Generate a guaranteed unique order number using a collision-check function and retries.
 */
export async function generateUniqueOrderNumber(
  checkExists: (orderNumber: string) => Promise<boolean>,
  maxRetries = ORDER_NUMBER_MAX_RETRIES
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const candidate = generateOrderNumber();
    const exists = await checkExists(candidate);
    if (!exists) {
      return candidate;
    }
  }
  throw new Error(`Failed to generate a unique order number after ${maxRetries} attempts.`);
}

import { NextRequest } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/session";
import { OrderService } from "@/services/order.service";
import { getPaymentProvider } from "@/services/payment.provider";
import { checkRateLimit } from "@/lib/rate-limit";
import { jsonError, jsonSuccess, AppError, ERROR_CODES } from "@/lib/api-response";

const checkoutSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  line1: z.string().min(3, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  region: z.string().min(2, "State or Province is required"),
  postalCode: z.string().min(2, "Postal code is required"),
  country: z.string().default("US"),
  shippingMethod: z.enum(["standard", "express", "overnight"]).default("standard"),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value ?? null;

    if (!sessionId) {
      return jsonError(ERROR_CODES.BAD_REQUEST, "No active cart session found", 400);
    }

    // Rate limiting: max 10 checkout attempts per minute
    const rateLimit = await checkRateLimit(`checkout:${ip}:${sessionId}`, {
      max: 10,
      intervalMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return jsonError(
        ERROR_CODES.RATE_LIMITED,
        `Too many checkout attempts. Please wait ${Math.ceil(rateLimit.resetMs / 1000)} seconds.`,
        429
      );
    }

    // Parse & validate body
    const rawBody = await request.json().catch(() => ({}));
    const parseResult = checkoutSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return jsonError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid checkout details",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const data = parseResult.data;
    const idempotencyKey =
      request.headers.get("idempotency-key") ||
      request.headers.get("x-idempotency-key") ||
      undefined;

    // 1. Create or retrieve pending order
    const { order, items, token } = await OrderService.createPendingOrder({
      sessionId,
      email: data.email,
      phone: data.phone,
      shippingAddress: {
        name: data.name,
        line1: data.line1,
        line2: data.line2,
        city: data.city,
        region: data.region,
        postalCode: data.postalCode,
        country: data.country,
      },
      shippingMethod: data.shippingMethod,
      idempotencyKey,
    });

    // 2. Request hosted checkout session from payment provider
    const origin = request.nextUrl.origin || "http://localhost:3000";
    const paymentProvider = getPaymentProvider();

    const checkoutSession = await paymentProvider.createCheckoutSession({
      orderNumber: order.orderNumber,
      customerEmail: order.email,
      totalCents: order.totalCents,
      currency: order.currency,
      lineItems: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
      })),
      shippingCents: order.shippingCents,
      taxCents: order.taxCents,
      successUrl: `${origin}/order/${order.orderNumber}?token=${token}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/checkout`,
    });

    return jsonSuccess({
      ok: true,
      orderNumber: order.orderNumber,
      checkoutUrl: checkoutSession.checkoutUrl,
      sessionId: checkoutSession.sessionId,
      totalCents: order.totalCents,
      token,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status, error.details);
    }
    console.error("Checkout route error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "An error occurred during checkout", 500);
  }
}

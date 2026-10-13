import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { getDb } from "@/db";
import { webhookEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { OrderService } from "@/services/order.service";
import { jsonError, jsonSuccess, ERROR_CODES } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return jsonError(ERROR_CODES.BAD_REQUEST, "Missing webhook signature or secret", 400);
  }

  let event: any;
  const rawBody = await request.text();

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2025-02-24.acacia" as any,
    });
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("Stripe signature verification failed:", err.message);
    return jsonError(ERROR_CODES.UNAUTHORIZED, `Webhook Error: ${err.message}`, 400);
  }

  const { db } = getDb();

  // 1. Event Deduplication via webhook_events table
  const [alreadyProcessed] = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.eventId, event.id))
    .limit(1);

  if (alreadyProcessed) {
    console.log(`[STRIPE WEBHOOK] Event ${event.id} already processed. Acknowledging with 200 OK.`);
    return jsonSuccess({ received: true, deduplicated: true });
  }

  try {
    // 2. Process event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderNumber = session.client_reference_id || session.metadata?.orderNumber;

        if (orderNumber && session.payment_status === "paid") {
          const amountCents = session.amount_total;
          const currency = (session.currency || "usd").toUpperCase();

          await OrderService.fulfillPayment({
            orderNumber,
            provider: "stripe",
            providerPaymentId: session.id,
            amountCents,
            currency,
          });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const orderNumber = session.client_reference_id || session.metadata?.orderNumber;
        if (orderNumber) {
          console.log(`[STRIPE WEBHOOK] Session expired for order ${orderNumber}`);
        }
        break;
      }

      default:
        console.log(`[STRIPE WEBHOOK] Unhandled event type: ${event.type}`);
    }

    // 3. Record event in webhook_events table
    await db.insert(webhookEvents).values({
      provider: "stripe",
      eventId: event.id,
      type: event.type,
    });

    return jsonSuccess({ received: true });
  } catch (err: any) {
    console.error(`[STRIPE WEBHOOK ERROR] Failed processing event ${event.id}:`, err);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to process webhook event", 500);
  }
}

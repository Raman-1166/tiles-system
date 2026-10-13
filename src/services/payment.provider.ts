import { env } from "@/lib/env";
import { AppError, ERROR_CODES } from "@/lib/api-response";

export interface LineItemSummary {
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export interface CreateCheckoutSessionParams {
  orderNumber: string;
  customerEmail: string;
  totalCents: number;
  currency: string;
  lineItems: LineItemSummary[];
  shippingCents: number;
  taxCents: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
}

export interface IPaymentProvider {
  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult>;
}

/**
 * Dev-only Mock Payment Provider.
 * Directs the customer to a mock checkout simulation page (/dev/pay/[orderNumber]).
 */
export class MockPaymentProvider implements IPaymentProvider {
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
    if (process.env.NODE_ENV === "production") {
      throw new AppError(
        ERROR_CODES.PAYMENT_FAILED,
        "Mock payment provider cannot be used in production.",
        500
      );
    }

    const mockSessionId = `mock_sess_${params.orderNumber}_${Date.now()}`;
    const checkoutUrl = `/dev/pay/${params.orderNumber}?session_id=${mockSessionId}`;

    return {
      sessionId: mockSessionId,
      checkoutUrl,
    };
  }
}

/**
 * Stripe Hosted Checkout Provider.
 */
export class StripePaymentProvider implements IPaymentProvider {
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
    const stripeKey = env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new AppError(ERROR_CODES.PAYMENT_FAILED, "Stripe secret key not configured", 500);
    }

    // Lazy load Stripe
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);

    const stripeLineItems = params.lineItems.map((item) => ({
      price_data: {
        currency: params.currency.toLowerCase(),
        product_data: {
          name: item.name,
        },
        unit_amount: item.unitPriceCents,
      },
      quantity: item.quantity,
    }));

    // Add tax line if present
    if (params.taxCents > 0) {
      stripeLineItems.push({
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: "Estimated Sales Tax",
          },
          unit_amount: params.taxCents,
        },
        quantity: 1,
      });
    }

    // Add shipping line if present
    if (params.shippingCents > 0) {
      stripeLineItems.push({
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: "Shipping",
          },
          unit_amount: params.shippingCents,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: stripeLineItems,
      mode: "payment",
      customer_email: params.customerEmail,
      client_reference_id: params.orderNumber,
      metadata: {
        orderNumber: params.orderNumber,
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    if (!session.url) {
      throw new AppError(ERROR_CODES.PAYMENT_FAILED, "Failed to retrieve Stripe checkout URL", 500);
    }

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  }
}

/**
 * Factory to retrieve the configured payment provider.
 */
export function getPaymentProvider(): IPaymentProvider {
  const providerType = env.PAYMENT_PROVIDER;
  if (providerType === "mock") {
    return new MockPaymentProvider();
  }
  if (providerType === "stripe") {
    return new StripePaymentProvider();
  }
  throw new AppError(
    ERROR_CODES.PAYMENT_FAILED,
    `Unsupported payment provider: ${providerType}`,
    500
  );
}

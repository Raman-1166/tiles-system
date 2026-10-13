import { formatMoney } from "@/lib/money";

export interface OrderConfirmationEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  currency: string;
  items: Array<{ name: string; quantity: number; unitPriceCents: number }>;
  shippingAddress: {
    line1: string;
    city: string;
    region: string;
    postalCode: string;
  };
}

export class EmailService {
  /**
   * Send order confirmation email.
   * Never throws — errors are caught, logged, and isolated from transaction commits.
   */
  static async sendOrderConfirmation(data: OrderConfirmationEmailData): Promise<boolean> {
    try {
      const formattedTotal = formatMoney(data.totalCents, data.currency);
      console.log(`[EMAIL] Sending Order Confirmation to: ${data.customerEmail}`);
      console.log(`[EMAIL] Order: ${data.orderNumber} | Total: ${formattedTotal}`);
      console.log(`[EMAIL] Items: ${data.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}`);
      console.log(
        `[EMAIL] Ship to: ${data.shippingAddress.line1}, ${data.shippingAddress.city}, ${data.shippingAddress.region} ${data.shippingAddress.postalCode}`
      );

      // In production, integrate Resend / SendGrid / Postmark here
      return true;
    } catch (err) {
      console.error(
        `[EMAIL ERROR] Failed to send order confirmation for ${data.orderNumber}:`,
        err
      );
      return false;
    }
  }
}

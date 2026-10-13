import {
  getCartLines,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  type CartLine,
} from "@/lib/cart";
import { calcSubtotal, calcTax, calcOrderTotal } from "@/lib/money";
import {
  shippingCentsForMethod,
  type ShippingOptionId,
  DEFAULT_TAX_RATE,
  SAMPLE_SWATCH_PRICE_CENTS,
  MAX_SAMPLES_PER_ORDER,
} from "@/config/commerce";
import { ProductService } from "@/services/product.service";
import { AppError, ERROR_CODES } from "@/lib/api-response";

export class CartService {
  /**
   * Get all lines in the active session cart.
   */
  static async getLines(sessionId: string | null): Promise<CartLine[]> {
    if (!sessionId) return [];
    return getCartLines(sessionId);
  }

  /**
   * Calculate totals deterministically in integer cents using pure money math.
   */
  static calculateTotals(lines: CartLine[], shippingMethod: ShippingOptionId = "standard") {
    const subtotalCents = calcSubtotal(
      lines.map((line) => {
        const isSample = Boolean(line.meta && (line.meta as Record<string, unknown>).isSample);
        const unitPriceCents = isSample ? SAMPLE_SWATCH_PRICE_CENTS : line.product.priceCents;
        return {
          unitPriceCents,
          quantity: line.quantity,
        };
      })
    );

    const shippingCents = shippingCentsForMethod(shippingMethod);
    const taxCents = calcTax(subtotalCents, DEFAULT_TAX_RATE);
    const totalCents = calcOrderTotal(subtotalCents, shippingCents, taxCents);

    return {
      subtotalCents,
      shippingCents,
      taxCents,
      totalCents,
      itemCount: lines.reduce((acc, l) => acc + l.quantity, 0),
      linesCount: lines.length,
    };
  }

  /**
   * Add item to cart with stock and sample limit validation.
   */
  static async addItem(params: {
    sessionId: string;
    productId: number;
    variantId?: number;
    quantity: number;
    variant?: string | null;
    meta?: Record<string, unknown> | null;
  }) {
    if (params.quantity <= 0) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Quantity must be greater than zero", 400);
    }

    const isSample = Boolean(params.meta && (params.meta as Record<string, unknown>).isSample);
    if (isSample) {
      const existingLines = await CartService.getLines(params.sessionId);
      const currentSampleCount = existingLines
        .filter((l) => Boolean(l.meta && (l.meta as Record<string, unknown>).isSample))
        .reduce((sum, l) => sum + l.quantity, 0);

      if (currentSampleCount + params.quantity > MAX_SAMPLES_PER_ORDER) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          `You can order a maximum of ${MAX_SAMPLES_PER_ORDER} sample swatches per order.`,
          400
        );
      }
    }

    // Validate product existence and stock
    await ProductService.validateForPurchase(params.productId, params.variantId, params.quantity);

    return addToCart(params);
  }

  static async updateQuantity(id: number, sessionId: string, quantity: number) {
    if (quantity <= 0) {
      return removeCartItem(id, sessionId);
    }
    return updateCartItemQuantity(id, sessionId, quantity);
  }

  static async removeItem(id: number, sessionId: string) {
    return removeCartItem(id, sessionId);
  }

  static async clear(sessionId: string | null) {
    if (!sessionId) return;
    return clearCart(sessionId);
  }
}

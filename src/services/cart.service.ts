import {
  getCartLines,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  type CartLine,
} from "@/lib/cart";
import { calcSubtotal, calcTax, calcOrderTotal } from "@/lib/money";
import { shippingCentsForMethod, type ShippingOptionId, DEFAULT_TAX_RATE } from "@/config/commerce";
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
      lines.map((line) => ({
        unitPriceCents: line.product.priceCents,
        quantity: line.quantity,
      }))
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
   * Add item to cart with stock validation.
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

import { getDb } from "@/db";
import {
  customers,
  addresses,
  orders,
  orderItems,
  type NewCustomer,
  type NewAddress,
} from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { AppError, ERROR_CODES } from "@/lib/api-response";
import { hashPassword, verifyPassword } from "@/lib/auth-crypto";

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AddressInput {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

export class CustomerService {
  /**
   * Register a new customer account.
   */
  static async register(input: RegisterInput) {
    const { db } = getDb();
    const normalizedEmail = input.email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "A valid email address is required", 400);
    }

    if (!input.password || input.password.length < 8) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Password must be at least 8 characters long",
        400
      );
    }

    if (!input.name || input.name.trim().length === 0) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Full name is required", 400);
    }

    // Check if email already registered
    const [existing] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, normalizedEmail))
      .limit(1);

    if (existing) {
      throw new AppError(
        ERROR_CODES.CONFLICT,
        "An account with this email address already exists. Please log in.",
        409
      );
    }

    const passwordHash = await hashPassword(input.password);

    const [inserted] = await db.insert(customers).values({
      email: normalizedEmail,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      passwordHash,
    });

    const newCustomerId = inserted.insertId;

    // Link previous guest orders placed with this email to the new account
    await db
      .update(orders)
      .set({ customerId: newCustomerId })
      .where(eq(orders.email, normalizedEmail));

    return {
      id: newCustomerId,
      email: normalizedEmail,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
    };
  }

  /**
   * Authenticate customer credentials.
   */
  static async login(input: LoginInput) {
    const { db } = getDb();
    const normalizedEmail = input.email.trim().toLowerCase();

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, normalizedEmail))
      .limit(1);

    if (!customer || !customer.passwordHash) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        "Invalid email or password. Please try again.",
        401
      );
    }

    const isValid = await verifyPassword(input.password, customer.passwordHash);
    if (!isValid) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        "Invalid email or password. Please try again.",
        401
      );
    }

    return {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
    };
  }

  /**
   * Retrieve full profile including saved delivery addresses and recent orders.
   */
  static async getProfile(customerId: number) {
    const { db } = getDb();

    const [customer] = await db
      .select({
        id: customers.id,
        email: customers.email,
        name: customers.name,
        phone: customers.phone,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Customer not found", 404);
    }

    const savedAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.customerId, customerId))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));

    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt))
      .limit(20);

    return {
      customer,
      addresses: savedAddresses,
      orders: customerOrders,
    };
  }

  /**
   * Add a new saved shipping address for the customer.
   */
  static async addAddress(customerId: number, input: AddressInput) {
    const { db } = getDb();

    if (!input.line1 || !input.city || !input.region || !input.postalCode) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Address line 1, city, state/region, and postal code are required",
        400
      );
    }

    // If setting as default, clear previous default
    if (input.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.customerId, customerId));
    }

    const [inserted] = await db.insert(addresses).values({
      customerId,
      line1: input.line1.trim(),
      line2: input.line2?.trim() || null,
      city: input.city.trim(),
      region: input.region.trim(),
      postalCode: input.postalCode.trim(),
      country: input.country?.trim() || "US",
      isDefault: Boolean(input.isDefault),
    });

    const [created] = await db
      .select()
      .from(addresses)
      .where(eq(addresses.id, inserted.insertId))
      .limit(1);

    return created;
  }

  /**
   * Remove a saved address.
   */
  static async deleteAddress(customerId: number, addressId: number) {
    const { db } = getDb();

    const [existing] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.customerId, customerId)))
      .limit(1);

    if (!existing) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Address not found", 404);
    }

    await db
      .delete(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.customerId, customerId)));

    return { success: true };
  }
}

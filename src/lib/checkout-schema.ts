import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().email("Please provide a valid email address"),
  phone: z.string().trim().optional(),
});

export const addressSchema = z.object({
  line1: z.string().trim().min(3, "Street address must be at least 3 characters"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2, "City is required"),
  region: z.string().trim().min(2, "State or Province is required"),
  postalCode: z.string().trim().min(2, "Postal or ZIP code is required"),
  country: z.string().trim().min(2, "Country is required").default("US"),
});

export const shippingSchema = z.object({
  shippingMethod: z.enum(["standard", "express", "overnight"]).default("standard"),
});

export const checkoutSchema = contactSchema.merge(addressSchema).merge(shippingSchema);

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ShippingInput = z.infer<typeof shippingSchema>;

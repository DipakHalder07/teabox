import { z } from "zod";

/**
 * Sanitizes phone numbers from browser autofill, paste, or user input:
 * - Strips "+91" or "91" country codes
 * - Strips leading "0"s from STD / trunk prefix
 * - Removes non-digit characters, spaces, and dashes
 * - Returns clean 10-digit mobile number
 */
export function cleanIndianPhone(val: string): string {
  if (!val) return "";
  let cleaned = val.trim();

  // Remove leading +91 or +
  if (cleaned.startsWith("+91")) {
    cleaned = cleaned.slice(3).trim();
  } else if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1).trim();
  }

  // Remove non-digit characters
  cleaned = cleaned.replace(/\D/g, "");

  // If starts with 91 and has > 10 digits (e.g. 918617513004 -> 12 digits), strip country code 91
  if (cleaned.length > 10 && cleaned.startsWith("91")) {
    cleaned = cleaned.slice(2);
  }

  // Remove leading zeros (e.g. 08617513004 or 00...)
  while (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  // Secondary check if 91 followed the zero (e.g. 0918617513004)
  if (cleaned.length > 10 && cleaned.startsWith("91")) {
    cleaned = cleaned.slice(2);
  }

  return cleaned.slice(0, 10);
}

export const checkoutShippingSchema = z.object({
  fullName: z
    .string()
    .min(2, "Please enter your full name (at least 2 characters)")
    .max(80, "Name cannot exceed 80 characters"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Please enter a valid 6-digit postal PIN code"),
  address: z
    .string()
    .min(5, "Please enter complete flat / house no., building and street"),
  city: z
    .string()
    .min(2, "City name is required"),
  state: z
    .string()
    .min(2, "State is required"),
  landmark: z.string().optional().or(z.literal("")),
  paymentMethod: z.enum(["upi", "cod"]),
});

export type CheckoutShippingFormData = z.infer<typeof checkoutShippingSchema>;

export const utrVerificationSchema = z.object({
  orderId: z.string().min(3, "Valid order ID is required"),
  utr: z
    .string()
    .regex(/^\d{12}$/, "UTR / UPI reference number must be exactly 12 digits"),
});

export type UtrVerificationData = z.infer<typeof utrVerificationSchema>;

export const orderCreationSchema = z.object({
  orderNumber: z.string().min(1),
  customerName: z.string().min(2),
  customerPhone: z.string().min(10),
  customerEmail: z.string().email().nullable().optional(),
  address: z.string().min(3),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(6),
  landmark: z.string().nullable().optional(),
  subtotal: z.number().nonnegative(),
  discountAmount: z.number().default(0),
  couponCode: z.string().nullable().optional(),
  shippingFee: z.number().default(0),
  codFee: z.number().default(0),
  totalAmount: z.number().positive(),
  paymentMethod: z.enum(["upi", "cod"]),
  paymentStatus: z.enum(["PAID", "PENDING", "FAILED"]).default("PENDING"),
  orderStatus: z
    .enum(["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"])
    .default("PROCESSING"),
  utrNumber: z.string().nullable().optional(),
  // YouPI-PG payment session id; the server confirms it with the gateway
  paymentId: z.string().max(64).nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(
    z.object({
      productId: z.string().nullable().optional(),
      title: z.string().min(1),
      weight: z.string().nullable().optional(),
      price: z.number().nonnegative(),
      quantity: z.number().positive(),
      image: z.string().nullable().optional(),
    })
  ).min(1, "Order must contain at least one item"),
});

export type OrderCreationData = z.infer<typeof orderCreationSchema>;

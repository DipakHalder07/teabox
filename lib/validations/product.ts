import { z } from "zod";
import { isAllowedImage } from "@/lib/productImages";

// Product form rules, shared by the admin form (browser) and the API (server).

const imageUrl = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .refine(isAllowedImage, "Use an uploaded photo (camera or gallery) or an image from cdn.shopify.com");

const money = z.coerce.number().int("Prices are whole rupees").min(1, "Price must be at least ₹1").max(10_000_000);

export const variantSchema = z.object({
  name: z.string().trim().min(1, "Every size needs a name, e.g. 100G").max(80),
  price: money,
  compareAtPrice: z.coerce.number().int().min(0).max(10_000_000).nullable().optional(),
  sku: z.string().trim().max(64).nullable().optional(),
});

export const productInputSchema = z.object({
  title: z.string().trim().min(2, "Add a product title").max(200),
  handle: z.string().trim().max(120).optional().or(z.literal("")),
  subtitle: z.string().trim().max(300).optional().or(z.literal("")),
  description: z.string().trim().max(10_000).optional().or(z.literal("")),
  status: z.enum(["active", "draft", "archived"]),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  format: z.string().trim().max(60).optional().or(z.literal("")),
  region: z.string().trim().max(60).optional().or(z.literal("")),
  caffeine: z.string().trim().max(40).optional().or(z.literal("")),
  badge: z.string().trim().max(40).optional().or(z.literal("")),
  vendor: z.string().trim().max(120).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(60)).max(50).default([]),
  images: z.array(imageUrl).min(1, "Add at least one photo").max(20),
  variants: z
    .array(variantSchema)
    .min(1, "Add at least one size with a price")
    .max(30)
    .refine((v) => new Set(v.map((x) => x.name.toLowerCase())).size === v.length, "Each size name must be different"),
  trackInventory: z.boolean().default(false),
  stockQuantity: z.coerce.number().int().min(0).max(1_000_000).default(0),
  inStock: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "product";
}

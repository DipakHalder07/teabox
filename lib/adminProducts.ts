import type { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ProductInput, slugify } from "@/lib/validations/product";

export { productInputSchema, slugify } from "@/lib/validations/product";

// Validation and saving for products created or edited in Admin → Products.

/** A URL handle no other product uses: "assam-gold", then "assam-gold-2", … */
export async function uniqueHandle(wanted: string, exceptId?: string) {
  const base = slugify(wanted);
  for (let n = 1; n < 500; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const taken = await prisma.product.findFirst({
      where: { OR: [{ handle: candidate }, { id: candidate }], ...(exceptId ? { NOT: { id: exceptId } } : {}) },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  throw new Error("Could not find a free URL handle");
}

/** Form input → database columns. The first size is the default one shown on product cards. */
export function inputToData(input: ProductInput) {
  const first = input.variants[0];
  const variants = input.variants.map((v) => ({
    name: v.name,
    price: v.price,
    compareAtPrice: v.compareAtPrice && v.compareAtPrice > v.price ? v.compareAtPrice : null,
    sku: v.sku || null,
  }));
  return {
    title: input.title,
    subtitle: input.subtitle || null,
    description: input.description || null,
    status: input.status,
    category: input.category || null,
    format: input.format || null,
    estate: input.region || null,
    caffeine: input.caffeine || null,
    badge: input.badge || null,
    vendor: input.vendor || null,
    tags: input.tags,
    sku: first.sku || null,
    image: input.images[0],
    secondaryImage: input.images[1] || input.images[0],
    galleryImages: input.images,
    variants: variants as unknown as Prisma.InputJsonValue,
    weights: variants.map((v) => v.name),
    price: first.price,
    originalPrice: variants[0].compareAtPrice || first.price,
    trackInventory: input.trackInventory,
    stockQuantity: input.stockQuantity,
    // Tracked products are on sale while stock lasts; untracked ones follow the switch
    inStock: input.trackInventory ? input.stockQuantity > 0 : input.inStock,
  };
}

export function firstIssue(error: z.ZodError) {
  const issue = error.issues[0];
  return issue?.message || "Please check the product details.";
}

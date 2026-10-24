import type { Prisma } from "@prisma/client";
import type { Product } from "../data/products";
import { productVariants } from "../lib/productVariants";

/**
 * A starter-catalog product (data/products.ts) as a database row, with its size prices stored
 * as variants. Shared by the seed, the deploy sync and the shop's one-time catalog copy.
 */
export function productRow(p: Product, sortOrder = 0): Prisma.ProductCreateManyInput {
  const variants = productVariants(p);
  return {
    id: p.id,
    handle: p.handle || p.id,
    title: p.title,
    subtitle: p.subtitle,
    description: p.subtitle,
    price: p.price,
    originalPrice: p.originalPrice,
    rating: p.rating || 4.9,
    reviewsCount: p.reviewsCount || 0,
    badge: p.badge || null,
    image: p.image,
    secondaryImage: p.secondaryImage,
    galleryImages: p.galleryImages || [p.image],
    weights: variants.map((v) => v.name),
    variants: variants as unknown as Prisma.InputJsonValue,
    inStock: p.inStock ?? true,
    category: p.category,
    format: p.format,
    estate: p.region,
    caffeine: p.caffeine,
    status: "active",
    sortOrder,
  };
}

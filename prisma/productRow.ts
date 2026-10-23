import { Product } from "../data/products";

/** A catalog product (data/products.ts) as a database row. Shared by the seed and the deploy sync. */
export function productRow(prod: Product) {
  return {
    id: prod.id,
    handle: prod.handle || prod.id,
    title: prod.title,
    subtitle: prod.subtitle,
    description: prod.subtitle,
    price: prod.price,
    originalPrice: prod.originalPrice,
    rating: prod.rating || 4.9,
    reviewsCount: prod.reviewsCount || 0,
    badge: prod.badge,
    image: prod.image,
    secondaryImage: prod.secondaryImage,
    galleryImages: prod.galleryImages || [prod.image],
    weights: prod.weights || ["100G", "200G", "300G"],
    inStock: prod.inStock ?? true,
    category: prod.category,
    estate: prod.region,
    caffeine: prod.caffeine,
  };
}

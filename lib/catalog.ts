import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import type { Prisma, Product as ProductRow } from "@prisma/client";
import { prisma, isDatabaseConnected } from "@/lib/prisma";
import { PRODUCTS, Product, Variant } from "@/data/products";
import { productVariants } from "@/lib/productVariants";
import { getSetting, setSetting } from "@/lib/gateway/settings";
import { productRow } from "@/prisma/productRow";

// The product catalog. The database is the source of truth once it exists (Admin → Products);
// the built-in list in data/products.ts is only the starter catalog, copied in once.

export const PRODUCTS_TAG = "products";
const SEEDED_KEY = "catalog.seeded";

export type ProductStatus = "active" | "draft" | "archived";

function parseVariants(value: Prisma.JsonValue | null): Variant[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Prisma.JsonObject => typeof v === "object" && v !== null && !Array.isArray(v))
    .map((v) => ({
      name: String(v.name ?? ""),
      price: Number(v.price) || 0,
      compareAtPrice: v.compareAtPrice == null ? null : Number(v.compareAtPrice),
      sku: v.sku == null ? null : String(v.sku),
    }))
    .filter((v) => v.name && v.price > 0);
}

export function rowToProduct(row: ProductRow): Product {
  const base = {
    id: row.id,
    handle: row.handle,
    price: row.price,
    originalPrice: row.originalPrice ?? row.price,
    weight: row.weights[0] || "",
    weights: row.weights,
    variants: parseVariants(row.variants),
  };
  const variants = productVariants(base);
  const soldOut = row.trackInventory && row.stockQuantity <= 0;
  return {
    ...base,
    variants,
    weight: variants[0].name,
    weights: variants.map((v) => v.name),
    title: row.title,
    subtitle: row.subtitle || "",
    description: row.description || "",
    discount: base.originalPrice > row.price ? Math.round(((base.originalPrice - row.price) / base.originalPrice) * 100) : 0,
    rating: row.rating,
    reviewsCount: row.reviewsCount,
    image: row.image,
    secondaryImage: row.secondaryImage || row.image,
    galleryImages: row.galleryImages.length > 0 ? row.galleryImages : [row.image],
    category: row.category || "",
    format: row.format || "",
    region: row.estate || "",
    caffeine: row.caffeine || "",
    badge: row.badge || "",
    inStock: row.inStock && !soldOut,
    status: (row.status as ProductStatus) || "active",
    sku: row.sku || "",
    vendor: row.vendor || "",
    tags: row.tags,
    stockQuantity: row.stockQuantity,
    trackInventory: row.trackInventory,
  };
}

/**
 * Copies the starter catalog into an empty database, once. Products deleted in the admin
 * later are never brought back.
 */
export async function ensureCatalogSeeded() {
  if (await getSetting(SEEDED_KEY)) return;
  if ((await prisma.product.count()) === 0) {
    await prisma.product.createMany({ data: PRODUCTS.map(productRow), skipDuplicates: true });
  }
  await setSetting(SEEDED_KEY, new Date().toISOString());
}

async function loadActiveRows(): Promise<ProductRow[] | null> {
  try {
    if (!(await isDatabaseConnected())) return null;
    await ensureCatalogSeeded();
    return await prisma.product.findMany({
      where: { status: "active" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  } catch (err) {
    console.warn("[Catalog] Database unavailable, using the starter catalog:", err);
    return null;
  }
}

/** Products shown in the shop (active only). Cached; admin changes refresh it straight away. */
export async function getStoreProducts(): Promise<Product[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  const rows = await loadActiveRows();
  if (!rows) {
    cacheLife("seconds"); // database down: retry soon instead of keeping the fallback
    return PRODUCTS.map((p) => ({ ...p, variants: productVariants(p) }));
  }
  return rows.map(rowToProduct);
}

export async function getStoreProduct(handle: string) {
  const products = await getStoreProducts();
  return products.find((p) => p.handle === handle || p.id === handle) || null;
}

/** Call after any product change so the shop shows it on the next request. */
export function refreshCatalog() {
  try {
    revalidateTag(PRODUCTS_TAG, { expire: 0 });
  } catch {
    // outside a request (scripts): nothing cached to refresh
  }
}

/**
 * Lowers stock for products that track inventory, after an order is placed, and marks them
 * sold out at zero.
 */
export async function consumeStock(items: Array<{ productId: string | null; quantity: number }>) {
  const tracked = items.filter((i): i is { productId: string; quantity: number } => Boolean(i.productId));
  if (tracked.length === 0) return;
  try {
    for (const item of tracked) {
      await prisma.product.updateMany({
        where: { id: item.productId, trackInventory: true },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }
    await prisma.product.updateMany({
      where: { id: { in: tracked.map((i) => i.productId) }, trackInventory: true, stockQuantity: { lte: 0 } },
      data: { inStock: false },
    });
    refreshCatalog();
  } catch (err) {
    console.warn("[Catalog] Stock update failed:", err);
  }
}

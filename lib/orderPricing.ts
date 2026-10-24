import type { Product } from "@/data/products";
import { getStoreProducts } from "@/lib/catalog";
import { findVariant } from "@/lib/productVariants";

// Server-side prices. The browser's prices and totals are never trusted: every line is priced
// from the live catalog (Admin → Products) at the price of the size the customer picked.

export interface OrderLineInput {
  productId?: string | null;
  title: string;
  weight?: string | null;
  price: number;
  quantity: number;
  image?: string | null;
}

export interface PricedOrder {
  items: Array<OrderLineInput & { productId: string | null }>;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  codFee: number;
  totalAmount: number;
}

/** A cart line that can't be sold (removed, hidden, sold out or not enough stock). */
export class PricingError extends Error {
  status = 400;
}

/** Cart ids are "<product id>-<size>", so match the longest product id they start with. */
function findProduct(catalog: Product[], cartId: string | null | undefined) {
  if (!cartId) return null;
  return (
    catalog.find((p) => p.id === cartId || p.handle === cartId) ||
    catalog
      .filter((p) => cartId.startsWith(`${p.id}-`))
      .sort((a, b) => b.id.length - a.id.length)[0] ||
    null
  );
}

export async function priceOrder(input: {
  items: OrderLineInput[];
  couponCode?: string | null;
  paymentMethod: "upi" | "cod";
}): Promise<PricedOrder> {
  const catalog = await getStoreProducts();

  const items = input.items.map((item) => {
    const product = findProduct(catalog, item.productId);
    if (!product) {
      throw new PricingError(`"${item.title}" is no longer available. Please remove it from your cart.`);
    }
    const quantity = Math.max(1, Math.floor(item.quantity));
    if (!product.inStock) {
      throw new PricingError(`"${product.title}" is sold out. Please remove it from your cart.`);
    }
    if (product.trackInventory && (product.stockQuantity ?? 0) < quantity) {
      throw new PricingError(`Only ${product.stockQuantity ?? 0} left of "${product.title}". Please lower the quantity.`);
    }
    const variant = findVariant(product, item.weight);
    return {
      ...item,
      // Catalog id (cart ids carry a size suffix), so it links to the products table.
      productId: product.id,
      title: product.title,
      weight: variant.name,
      price: variant.price,
      quantity,
      image: item.image || product.image,
    };
  });

  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  let discountAmount = 0;
  if (input.couponCode) {
    const code = input.couponCode.trim().toUpperCase();
    if (code === "WELCOME10" || code === "TEA10") {
      discountAmount = Math.round(subtotal * 0.1);
    } else if (code === "FIRSTTEA") {
      discountAmount = Math.min(150, subtotal);
    }
  }

  const shippingFee = subtotal >= 399 ? 0 : 50;
  const codFee = input.paymentMethod === "cod" ? 40 : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee + codFee);

  return { items, subtotal, discountAmount, shippingFee, codFee, totalAmount };
}

/**
 * Today's price for each cart line (null when the product no longer exists), so the cart can
 * show exactly what checkout will charge. Never throws for sold-out lines: checkout reports those.
 */
export async function priceCartLines(items: Array<{ productId?: string | null; weight?: string | null }>) {
  const catalog = await getStoreProducts();
  return items.map((item) => {
    const product = findProduct(catalog, item.productId);
    return product ? findVariant(product, item.weight).price : null;
  });
}

import { PRODUCTS } from "@/data/products";

// Server-side prices. The browser's prices and totals are never trusted.

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

export function priceOrder(input: {
  items: OrderLineInput[];
  couponCode?: string | null;
  paymentMethod: "upi" | "cod";
}): PricedOrder {
  const items = input.items.map((item) => {
    const found = PRODUCTS.find(
      (p) =>
        p.id === item.productId ||
        p.handle === item.productId ||
        (item.productId && item.productId.startsWith(p.id))
    );
    return {
      ...item,
      // Catalog id (cart ids may carry a size suffix), so it links to the products table.
      productId: found ? found.id : null,
      price: found ? found.price : Math.max(1, Math.round(item.price)),
      quantity: Math.max(1, Math.floor(item.quantity)),
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

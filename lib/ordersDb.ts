import { prisma, isDatabaseConnected } from "./prisma";
import { PRODUCTS, Product } from "@/data/products";
import { cleanIndianPhone } from "./validations/checkout";

export interface StoredOrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string | null;
  subtotal: number;
  discountAmount: number;
  couponCode?: string | null;
  shippingFee: number;
  codFee: number;
  totalAmount: number;
  paymentMethod: "upi" | "cod";
  paymentStatus: "PAID" | "PENDING" | "FAILED";
  orderStatus: "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  utrNumber?: string | null;
  notes?: string | null;
  items: Array<{
    id?: string;
    productId?: string | null;
    title: string;
    weight?: string | null;
    price: number;
    quantity: number;
    image?: string | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory fallback cache when PostgreSQL is in setup or offline
const globalForOrders = globalThis as unknown as {
  inMemoryOrders?: Map<string, StoredOrderData>;
};

if (!globalForOrders.inMemoryOrders) {
  globalForOrders.inMemoryOrders = new Map<string, StoredOrderData>();
}

// Purge any legacy sample mock/demo orders from memory cache
export const DEMO_ORDER_IDS = ["TBX-2026-98124", "TBX-2026-98125", "TBX-2026-98126"];
for (const demoId of DEMO_ORDER_IDS) {
  globalForOrders.inMemoryOrders.delete(demoId);
}

/**
 * Save an order to PostgreSQL (with fallback to in-memory store)
 */
export async function saveOrder(orderData: Omit<StoredOrderData, "createdAt" | "updatedAt">): Promise<StoredOrderData> {
  const now = new Date();
  const fullOrder: StoredOrderData = {
    ...orderData,
    createdAt: now,
    updatedAt: now,
  };

  // 1. In-memory store
  globalForOrders.inMemoryOrders?.set(orderData.id, fullOrder);

  // 2. PostgreSQL via Prisma
  try {
    const isDbUp = await isDatabaseConnected();
    if (isDbUp) {
      const created = await prisma.order.create({
        data: {
          id: orderData.id,
          orderNumber: orderData.orderNumber,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerEmail: orderData.customerEmail,
          address: orderData.address,
          city: orderData.city,
          state: orderData.state,
          pincode: orderData.pincode,
          landmark: orderData.landmark,
          subtotal: orderData.subtotal,
          discountAmount: orderData.discountAmount,
          couponCode: orderData.couponCode,
          shippingFee: orderData.shippingFee,
          codFee: orderData.codFee,
          totalAmount: orderData.totalAmount,
          paymentMethod: orderData.paymentMethod,
          paymentStatus: orderData.paymentStatus,
          orderStatus: orderData.orderStatus,
          utrNumber: orderData.utrNumber,
          notes: orderData.notes,
          items: {
            create: orderData.items.map((item) => ({
              productId: item.productId,
              title: item.title,
              weight: item.weight,
              price: item.price,
              quantity: item.quantity,
              image: item.image,
            })),
          },
        },
        include: { items: true },
      });
      return created as unknown as StoredOrderData;
    }
  } catch (err) {
    console.warn("PostgreSQL order save warning (using memory store):", err);
  }

  return fullOrder;
}

/**
 * Fetch all orders for the Admin Dashboard
 */
export async function getAllOrders(): Promise<StoredOrderData[]> {
  try {
    const isDbUp = await isDatabaseConnected();
    if (isDbUp) {
      const orders = await prisma.order.findMany({
        where: {
          id: { notIn: DEMO_ORDER_IDS },
        },
        include: { items: true, payments: true },
        orderBy: { createdAt: "desc" },
      });
      return orders as unknown as StoredOrderData[];
    }
  } catch (err) {
    console.warn("PostgreSQL order fetch warning (using memory store):", err);
  }

  // Fallback to in-memory orders sorted by createdAt desc (excluding any demo orders)
  const list = Array.from(globalForOrders.inMemoryOrders?.values() || []).filter(
    (o) =>
      !DEMO_ORDER_IDS.includes(o.id) &&
      !o.id.startsWith("TBX-2026-9812") &&
      o.customerEmail !== "aarav.mehta@example.com"
  );
  return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Delete an order by ID from memory and database
 */
export async function deleteOrder(orderId: string): Promise<boolean> {
  let deleted = false;
  if (globalForOrders.inMemoryOrders?.has(orderId)) {
    globalForOrders.inMemoryOrders.delete(orderId);
    deleted = true;
  }

  try {
    const isDbUp = await isDatabaseConnected();
    if (isDbUp) {
      await prisma.order.delete({
        where: { id: orderId },
      });
      deleted = true;
    }
  } catch (err) {
    console.warn("PostgreSQL order delete warning:", err);
  }

  return deleted;
}

/**
 * Update an order's status or tracking details
 */
export async function updateOrderStatus(
  orderId: string,
  updates: {
    orderStatus?: "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    paymentStatus?: "PAID" | "PENDING" | "FAILED";
    trackingNumber?: string;
    trackingUrl?: string;
    utrNumber?: string;
  }
): Promise<StoredOrderData | null> {
  // Update memory store
  const existing = globalForOrders.inMemoryOrders?.get(orderId);
  if (existing) {
    const updated: StoredOrderData = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    globalForOrders.inMemoryOrders?.set(orderId, updated);
  }

  // Update PostgreSQL
  try {
    const isDbUp = await isDatabaseConnected();
    if (isDbUp) {
      const updatedDb = await prisma.order.update({
        where: { id: orderId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
        include: { items: true },
      });
      return updatedDb as unknown as StoredOrderData;
    }
  } catch (err) {
    console.warn("PostgreSQL order update warning:", err);
  }

  return globalForOrders.inMemoryOrders?.get(orderId) || null;
}

/**
 * Fetch a single order by ID or orderNumber
 */
export async function getOrderById(idOrNumber: string): Promise<StoredOrderData | null> {
  if (DEMO_ORDER_IDS.includes(idOrNumber)) {
    return null;
  }

  // Check PostgreSQL first if connected
  try {
    const isDbUp = await isDatabaseConnected();
    if (isDbUp) {
      const order = await prisma.order.findFirst({
        where: {
          OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }],
          NOT: { id: { in: DEMO_ORDER_IDS } },
        },
        include: { items: true, payments: true },
      });
      if (order) {
        return order as unknown as StoredOrderData;
      }
    }
  } catch (err) {
    console.warn("PostgreSQL order lookup warning (checking memory store):", err);
  }

  // Check in-memory store
  if (globalForOrders.inMemoryOrders) {
    if (globalForOrders.inMemoryOrders.has(idOrNumber)) {
      return globalForOrders.inMemoryOrders.get(idOrNumber)!;
    }
    for (const ord of globalForOrders.inMemoryOrders.values()) {
      if (ord.orderNumber === idOrNumber || ord.id === idOrNumber) {
        return ord;
      }
    }
  }

  return null;
}

/**
 * Search/lookup orders by Order Number, Tracking ID, or Phone number
 */
export async function searchOrders(query: string): Promise<StoredOrderData[]> {
  const q = query.trim();
  if (!q) return [];

  const cleanPhone = cleanIndianPhone(q);

  // Check PostgreSQL first if connected
  try {
    const isDbUp = await isDatabaseConnected();
    if (isDbUp) {
      const orders = await prisma.order.findMany({
        where: {
          OR: [
            { id: { equals: q, mode: "insensitive" } },
            { orderNumber: { equals: q, mode: "insensitive" } },
            { trackingNumber: { equals: q, mode: "insensitive" } },
            // Only a full 10-digit mobile number matches, never a fragment of one.
            ...(/^[6-9]\d{9}$/.test(cleanPhone) ? [{ customerPhone: cleanPhone }] : []),
          ],
        },
        include: { items: true, payments: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      if (orders && orders.length > 0) {
        return orders as unknown as StoredOrderData[];
      }
    }
  } catch (err) {
    console.warn("PostgreSQL order search warning:", err);
  }

  // Check in-memory store
  if (globalForOrders.inMemoryOrders) {
    const matched: StoredOrderData[] = [];
    const qLower = q.toLowerCase();
    for (const ord of globalForOrders.inMemoryOrders.values()) {
      if (DEMO_ORDER_IDS.includes(ord.id)) continue;
      const matchId = ord.id.toLowerCase() === qLower || ord.orderNumber.toLowerCase() === qLower;
      const matchTracking = ord.trackingNumber?.toLowerCase() === qLower;
      const matchPhone = /^[6-9]\d{9}$/.test(cleanPhone) && ord.customerPhone === cleanPhone;
      if (matchId || matchTracking || matchPhone) {
        matched.push(ord);
      }
    }
    return matched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return [];
}


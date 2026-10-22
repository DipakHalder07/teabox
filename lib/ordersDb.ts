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
  
  // Seed sample initial mock orders so the admin dashboard immediately has rich data
  const sampleOrders: StoredOrderData[] = [
    {
      id: "TBX-2026-98124",
      orderNumber: "TBX-2026-98124",
      customerName: "Aarav Mehta",
      customerPhone: "9820112233",
      customerEmail: "aarav.mehta@example.com",
      address: "B-402, Highmont Apts, Baner",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411045",
      subtotal: 1199,
      discountAmount: 120,
      couponCode: "WELCOME10",
      shippingFee: 0,
      codFee: 0,
      totalAmount: 1079,
      paymentMethod: "upi",
      paymentStatus: "PAID",
      orderStatus: "PROCESSING",
      utrNumber: "428719283401",
      items: [
        {
          title: "The Ramayana Chai Collection (Ayurvedic Chai Blends)",
          weight: "150G",
          price: 1199,
          quantity: 1,
          image: "https://in.teabox.com/cdn/shop/files/TheRamayanaChaiCollectionListingImage.jpg",
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 35),
      updatedAt: new Date(Date.now() - 1000 * 60 * 35),
    },
    {
      id: "TBX-2026-98125",
      orderNumber: "TBX-2026-98125",
      customerName: "Pooja Hegde",
      customerPhone: "9876543210",
      customerEmail: "pooja.h@example.com",
      address: "123 Connaught Place, Inner Circle",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110001",
      subtotal: 449,
      discountAmount: 0,
      shippingFee: 0,
      codFee: 40,
      totalAmount: 489,
      paymentMethod: "cod",
      paymentStatus: "PENDING",
      orderStatus: "SHIPPED",
      trackingNumber: "CP-IND-8849201",
      trackingUrl: "/track?tracking_id=CP-IND-8849201",
      items: [
        {
          title: "Abhay Ras Chai",
          weight: "150G",
          price: 449,
          quantity: 1,
          image: "https://in.teabox.com/cdn/shop/files/AbhayRasChaiListingImage.jpg",
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 120),
      updatedAt: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
      id: "TBX-2026-98126",
      orderNumber: "TBX-2026-98126",
      customerName: "Vikram Singhania",
      customerPhone: "9819283746",
      customerEmail: "vikram.s@example.com",
      address: "42, Ballygunge Circular Road",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700019",
      subtotal: 667,
      discountAmount: 0,
      shippingFee: 0,
      codFee: 0,
      totalAmount: 667,
      paymentMethod: "upi",
      paymentStatus: "PAID",
      orderStatus: "DELIVERED",
      utrNumber: "428799112233",
      trackingNumber: "CP-IND-7729104",
      trackingUrl: "/track?tracking_id=CP-IND-7729104",
      items: [
        {
          title: "Organic Darjeeling Green Tea",
          weight: "300G",
          price: 667,
          quantity: 1,
          image: "https://in.teabox.com/cdn/shop/files/organic-darjeeling-green-tea-1_500x.jpg",
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
  ];

  for (const o of sampleOrders) {
    globalForOrders.inMemoryOrders.set(o.id, o);
  }
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
        include: { items: true, payments: true },
        orderBy: { createdAt: "desc" },
      });
      if (orders.length > 0) {
        return orders as unknown as StoredOrderData[];
      }
    }
  } catch (err) {
    console.warn("PostgreSQL order fetch warning (using memory store):", err);
  }

  // Fallback to in-memory orders sorted by createdAt desc
  const list = Array.from(globalForOrders.inMemoryOrders?.values() || []);
  return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
  // Check PostgreSQL first if connected
  try {
    const isDbUp = await isDatabaseConnected();
    if (isDbUp) {
      const order = await prisma.order.findFirst({
        where: {
          OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }],
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
            ...(cleanPhone && cleanPhone.length >= 6 ? [{ customerPhone: { contains: cleanPhone } }] : []),
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
      const matchId = ord.id.toLowerCase() === qLower || ord.orderNumber.toLowerCase() === qLower;
      const matchTracking = ord.trackingNumber?.toLowerCase() === qLower;
      const matchPhone = cleanPhone && cleanPhone.length >= 6 && ord.customerPhone.includes(cleanPhone);
      if (matchId || matchTracking || matchPhone) {
        matched.push(ord);
      }
    }
    return matched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return [];
}


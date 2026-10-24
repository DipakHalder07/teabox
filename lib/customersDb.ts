import { prisma, isDatabaseConnected } from "./prisma";
import { getAllOrders, StoredOrderData } from "./ordersDb";

export interface CustomerRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  source: "NEWSLETTER" | "ORDER" | "ACCOUNT";
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory fallback for development or offline resilience
const globalForCustomers = globalThis as unknown as {
  inMemorySubscribers?: Map<string, { email: string; name: string; createdAt: Date }>;
};

if (!globalForCustomers.inMemorySubscribers) {
  globalForCustomers.inMemorySubscribers = new Map();
}

/**
 * Subscribe a customer via email (from Footer newsletter or opt-in)
 */
export async function subscribeCustomer(emailInput: string, nameInput?: string) {
  const normalizedEmail = emailInput.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Invalid email address");
  }

  const defaultName = nameInput?.trim() || normalizedEmail.split("@")[0] || "Subscriber";
  const now = new Date();

  // Save to in-memory fallback
  globalForCustomers.inMemorySubscribers?.set(normalizedEmail, {
    email: normalizedEmail,
    name: defaultName,
    createdAt: now,
  });

  // Save to PostgreSQL if connected
  try {
    const isDbUp = await isDatabaseConnected();
    if (isDbUp) {
      const user = await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
          updatedAt: now,
        },
        create: {
          email: normalizedEmail,
          name: defaultName,
          role: "CUSTOMER",
          createdAt: now,
          updatedAt: now,
        },
      });
      return { success: true, customer: user, email: normalizedEmail };
    }
  } catch (err) {
    console.warn("[Customers DB] PostgreSQL upsert failed, using memory store:", err);
  }

  return {
    success: true,
    customer: {
      id: `mem_${Date.now()}`,
      email: normalizedEmail,
      name: defaultName,
      role: "CUSTOMER",
      createdAt: now,
    },
    email: normalizedEmail,
  };
}

/**
 * Get all customers aggregated from Users, Orders, and Subscribers
 */
export async function getAllCustomers(): Promise<CustomerRecord[]> {
  const customerMap = new Map<string, CustomerRecord>();

  // 1. Fetch from PostgreSQL User table if available
  try {
    const isDbUp = await isDatabaseConnected();
    if (isDbUp) {
      const users = await prisma.user.findMany({
        include: {
          orders: {
            select: {
              id: true,
              totalAmount: true,
              paymentStatus: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      for (const u of users) {
        const key = u.email ? u.email.toLowerCase() : u.id;
        const paidOrders = u.orders.filter((o) => o.paymentStatus === "PAID");
        const totalSpent = u.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const latestOrder = u.orders.length > 0
          ? u.orders.reduce((latest, o) => (o.createdAt > latest ? o.createdAt : latest), u.orders[0].createdAt)
          : null;

        customerMap.set(key, {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          source: u.orders.length > 0 ? "ORDER" : "NEWSLETTER",
          ordersCount: u.orders.length,
          totalSpent,
          lastOrderAt: latestOrder,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        });
      }
    }
  } catch (err) {
    console.warn("[Customers DB] Error fetching from Prisma User:", err);
  }

  // 2. Fetch distinct customers from Orders (lib/ordersDb)
  try {
    const orders: StoredOrderData[] = await getAllOrders();
    for (const order of orders) {
      const email = order.customerEmail?.trim().toLowerCase();
      const phone = order.customerPhone?.trim();
      const key = email || phone || order.id;

      const existing = customerMap.get(key);
      if (existing) {
        // Update order stats if not already counted by Prisma relation
        if (existing.source !== "ORDER" && !existing.ordersCount) {
          existing.ordersCount = 1;
          existing.totalSpent = order.totalAmount;
          existing.lastOrderAt = new Date(order.createdAt);
          existing.source = "ORDER";
        }
        if (!existing.phone && phone) existing.phone = phone;
      } else {
        customerMap.set(key, {
          id: `ord_cust_${key.replace(/[^a-zA-Z0-9]/g, "_")}`,
          name: order.customerName || "Customer",
          email: email || null,
          phone: phone || null,
          role: "CUSTOMER",
          source: "ORDER",
          ordersCount: 1,
          totalSpent: order.totalAmount,
          lastOrderAt: new Date(order.createdAt),
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt || order.createdAt),
        });
      }
    }
  } catch (err) {
    console.warn("[Customers DB] Error merging from Orders:", err);
  }

  // 3. Merge in-memory subscribers (if any not already in the map)
  if (globalForCustomers.inMemorySubscribers) {
    for (const [email, sub] of globalForCustomers.inMemorySubscribers.entries()) {
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          id: `sub_${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
          name: sub.name,
          email: sub.email,
          phone: null,
          role: "CUSTOMER",
          source: "NEWSLETTER",
          ordersCount: 0,
          totalSpent: 0,
          lastOrderAt: null,
          createdAt: sub.createdAt,
          updatedAt: sub.createdAt,
        });
      }
    }
  }

  // Convert map to sorted array (newest first)
  return Array.from(customerMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

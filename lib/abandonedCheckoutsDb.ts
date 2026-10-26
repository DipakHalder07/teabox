import { prisma, isDatabaseConnected } from "./prisma";
import { cleanIndianPhone } from "./validations/checkout";

export interface AbandonedCheckoutItem {
  id?: string;
  productId?: string | null;
  title: string;
  weight?: string | null;
  price: number;
  quantity: number;
  image?: string | null;
}

export interface StoredAbandonedCheckout {
  id: string;
  checkoutNumber: string;
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
  items: AbandonedCheckoutItem[];
  status: "ABANDONED" | "RECOVERED";
  recoveryStatus: "UNSENT" | "EMAIL_SENT" | "WHATSAPP_SENT";
  recoveredOrderId?: string | null;
  recoveryToken: string;
  lastContactedAt?: Date | string | null;
  recoveredAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// In-memory fallback cache when PostgreSQL is in setup or offline
const globalForAbandoned = globalThis as unknown as {
  inMemoryAbandonedCheckouts?: Map<string, StoredAbandonedCheckout>;
};

if (!globalForAbandoned.inMemoryAbandonedCheckouts) {
  globalForAbandoned.inMemoryAbandonedCheckouts = new Map<string, StoredAbandonedCheckout>();
}

/**
 * Generate a clean checkout number like TB-CHK-82914
 */
export function newCheckoutNumber(): string {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `TB-CHK-${rand}`;
}

/**
 * Generate a random URL-safe recovery token
 */
export function newRecoveryToken(): string {
  return `rec_${Math.random().toString(36).slice(2, 11)}_${Date.now().toString(36)}`;
}

/**
 * Save or update an Abandoned Checkout session.
 * If customer with same phone already has an open abandoned checkout within last 24h,
 * we update the existing checkout rather than creating confusing duplicates.
 */
export async function saveAbandonedCheckout(
  data: Omit<StoredAbandonedCheckout, "id" | "recoveryToken" | "createdAt" | "updatedAt"> & {
    id?: string;
    recoveryToken?: string;
  }
): Promise<StoredAbandonedCheckout> {
  const now = new Date();
  const cleanPhone = cleanIndianPhone(data.customerPhone);

  const isDbUp = await isDatabaseConnected();

  if (isDbUp) {
    try {
      // Look for an existing unrecovered checkout for this phone in the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existing = await prisma.abandonedCheckout.findFirst({
        where: {
          customerPhone: cleanPhone,
          status: "ABANDONED",
          createdAt: { gte: twentyFourHoursAgo },
        },
        orderBy: { createdAt: "desc" },
      });

      if (existing) {
        // Update existing record with latest cart & contact details
        const updated = await prisma.abandonedCheckout.update({
          where: { id: existing.id },
          data: {
            customerName: data.customerName,
            customerEmail: data.customerEmail || existing.customerEmail,
            address: data.address,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            landmark: data.landmark || null,
            subtotal: data.subtotal,
            discountAmount: data.discountAmount,
            couponCode: data.couponCode || null,
            shippingFee: data.shippingFee,
            codFee: data.codFee,
            totalAmount: data.totalAmount,
            items: data.items as any,
            updatedAt: now,
          },
        });

        const stored: StoredAbandonedCheckout = {
          ...updated,
          items: updated.items as any,
          status: updated.status as "ABANDONED" | "RECOVERED",
          recoveryStatus: updated.recoveryStatus as "UNSENT" | "EMAIL_SENT" | "WHATSAPP_SENT",
        };
        globalForAbandoned.inMemoryAbandonedCheckouts?.set(updated.id, stored);
        return stored;
      }

      // Create new abandoned checkout in PostgreSQL
      const created = await prisma.abandonedCheckout.create({
        data: {
          checkoutNumber: data.checkoutNumber || newCheckoutNumber(),
          customerName: data.customerName,
          customerPhone: cleanPhone,
          customerEmail: data.customerEmail || null,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          landmark: data.landmark || null,
          subtotal: data.subtotal,
          discountAmount: data.discountAmount,
          couponCode: data.couponCode || null,
          shippingFee: data.shippingFee,
          codFee: data.codFee,
          totalAmount: data.totalAmount,
          items: data.items as any,
          status: "ABANDONED",
          recoveryStatus: "UNSENT",
          recoveryToken: data.recoveryToken || newRecoveryToken(),
        },
      });

      const stored: StoredAbandonedCheckout = {
        ...created,
        items: created.items as any,
        status: created.status as "ABANDONED" | "RECOVERED",
        recoveryStatus: created.recoveryStatus as "UNSENT" | "EMAIL_SENT" | "WHATSAPP_SENT",
      };
      globalForAbandoned.inMemoryAbandonedCheckouts?.set(created.id, stored);
      return stored;
    } catch (err) {
      console.warn("PostgreSQL abandoned checkout save warning (falling back to memory):", err);
    }
  }

  // Fallback to in-memory store
  const id = data.id || `chk_${Date.now()}`;
  const token = data.recoveryToken || newRecoveryToken();
  const full: StoredAbandonedCheckout = {
    ...data,
    id,
    customerPhone: cleanPhone,
    recoveryToken: token,
    status: data.status || "ABANDONED",
    recoveryStatus: data.recoveryStatus || "UNSENT",
    createdAt: now,
    updatedAt: now,
  };

  globalForAbandoned.inMemoryAbandonedCheckouts?.set(id, full);
  return full;
}

/**
 * Fetch all abandoned checkouts for Admin Dashboard with optional search and status filter
 */
export async function getAllAbandonedCheckouts(options?: {
  status?: string;
  search?: string;
}): Promise<StoredAbandonedCheckout[]> {
  const isDbUp = await isDatabaseConnected();

  if (isDbUp) {
    try {
      const where: any = {};
      if (options?.status && options.status !== "ALL") {
        where.status = options.status;
      }

      if (options?.search) {
        const q = options.search.trim().toLowerCase();
        where.OR = [
          { checkoutNumber: { contains: q, mode: "insensitive" } },
          { customerName: { contains: q, mode: "insensitive" } },
          { customerPhone: { contains: q } },
          { customerEmail: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
        ];
      }

      const rows = await prisma.abandonedCheckout.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      return rows.map((r) => ({
        ...r,
        items: r.items as any,
        status: r.status as "ABANDONED" | "RECOVERED",
        recoveryStatus: r.recoveryStatus as "UNSENT" | "EMAIL_SENT" | "WHATSAPP_SENT",
      }));
    } catch (err) {
      console.warn("PostgreSQL abandoned checkouts fetch warning:", err);
    }
  }

  // In-memory fallback
  let list = Array.from(globalForAbandoned.inMemoryAbandonedCheckouts?.values() || []);
  if (options?.status && options.status !== "ALL") {
    list = list.filter((c) => c.status === options.status);
  }
  if (options?.search) {
    const q = options.search.trim().toLowerCase();
    list = list.filter(
      (c) =>
        c.checkoutNumber.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.customerPhone.includes(q) ||
        (c.customerEmail && c.customerEmail.toLowerCase().includes(q)) ||
        c.city.toLowerCase().includes(q)
    );
  }

  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get an abandoned checkout by its ID or Checkout Number
 */
export async function getAbandonedCheckoutById(idOrNumber: string): Promise<StoredAbandonedCheckout | null> {
  const isDbUp = await isDatabaseConnected();
  if (isDbUp) {
    try {
      const row = await prisma.abandonedCheckout.findFirst({
        where: {
          OR: [{ id: idOrNumber }, { checkoutNumber: idOrNumber }],
        },
      });
      if (row) {
        return {
          ...row,
          items: row.items as any,
          status: row.status as "ABANDONED" | "RECOVERED",
          recoveryStatus: row.recoveryStatus as "UNSENT" | "EMAIL_SENT" | "WHATSAPP_SENT",
        };
      }
    } catch (err) {
      console.warn("Error fetching abandoned checkout by id:", err);
    }
  }

  // Memory fallback
  for (const c of globalForAbandoned.inMemoryAbandonedCheckouts?.values() || []) {
    if (c.id === idOrNumber || c.checkoutNumber === idOrNumber) return c;
  }
  return null;
}

/**
 * Get an abandoned checkout by its unique recovery token
 */
export async function getAbandonedCheckoutByToken(token: string): Promise<StoredAbandonedCheckout | null> {
  const isDbUp = await isDatabaseConnected();
  if (isDbUp) {
    try {
      const row = await prisma.abandonedCheckout.findUnique({
        where: { recoveryToken: token },
      });
      if (row) {
        return {
          ...row,
          items: row.items as any,
          status: row.status as "ABANDONED" | "RECOVERED",
          recoveryStatus: row.recoveryStatus as "UNSENT" | "EMAIL_SENT" | "WHATSAPP_SENT",
        };
      }
    } catch (err) {
      console.warn("Error fetching abandoned checkout by token:", err);
    }
  }

  // Memory fallback
  for (const c of globalForAbandoned.inMemoryAbandonedCheckouts?.values() || []) {
    if (c.recoveryToken === token) return c;
  }
  return null;
}

/**
 * Mark abandoned checkout(s) as RECOVERED when an order is completed.
 * Matches by phone number, email, or orderNumber.
 */
export async function markAbandonedCheckoutRecovered({
  customerPhone,
  customerEmail,
  orderNumber,
  orderId,
}: {
  customerPhone?: string | null;
  customerEmail?: string | null;
  orderNumber?: string | null;
  orderId?: string | null;
}): Promise<number> {
  const now = new Date();
  let count = 0;

  const isDbUp = await isDatabaseConnected();
  if (isDbUp) {
    try {
      const OR: any[] = [];
      if (customerPhone) {
        OR.push({ customerPhone: cleanIndianPhone(customerPhone) });
      }
      if (customerEmail) {
        OR.push({ customerEmail: customerEmail.trim().toLowerCase() });
      }
      if (orderNumber) {
        OR.push({ checkoutNumber: orderNumber });
      }

      if (OR.length > 0) {
        const res = await prisma.abandonedCheckout.updateMany({
          where: {
            status: "ABANDONED",
            OR,
          },
          data: {
            status: "RECOVERED",
            recoveredOrderId: orderId || orderNumber || null,
            recoveredAt: now,
          },
        });
        count = res.count;
      }
    } catch (err) {
      console.warn("Error marking abandoned checkout as recovered:", err);
    }
  }

  // Also update in-memory
  const cleanedPhone = customerPhone ? cleanIndianPhone(customerPhone) : null;
  for (const c of globalForAbandoned.inMemoryAbandonedCheckouts?.values() || []) {
    if (
      c.status === "ABANDONED" &&
      ((cleanedPhone && c.customerPhone === cleanedPhone) ||
        (customerEmail && c.customerEmail?.toLowerCase() === customerEmail.toLowerCase()) ||
        (orderNumber && c.checkoutNumber === orderNumber))
    ) {
      c.status = "RECOVERED";
      c.recoveredOrderId = orderId || orderNumber || null;
      c.recoveredAt = now;
      c.updatedAt = now;
      count++;
    }
  }

  return count;
}

/**
 * Update recovery follow-up status (e.g. EMAIL_SENT or WHATSAPP_SENT)
 */
export async function updateAbandonedCheckoutFollowUp(
  id: string,
  recoveryStatus: "UNSENT" | "EMAIL_SENT" | "WHATSAPP_SENT",
  statusOverride?: "ABANDONED" | "RECOVERED"
): Promise<StoredAbandonedCheckout | null> {
  const now = new Date();
  const isDbUp = await isDatabaseConnected();

  if (isDbUp) {
    try {
      const data: any = {
        recoveryStatus,
        lastContactedAt: now,
        updatedAt: now,
      };
      if (statusOverride) {
        data.status = statusOverride;
        if (statusOverride === "RECOVERED") {
          data.recoveredAt = now;
        }
      }
      const updated = await prisma.abandonedCheckout.update({
        where: { id },
        data,
      });
      const stored: StoredAbandonedCheckout = {
        ...updated,
        items: updated.items as any,
        status: updated.status as "ABANDONED" | "RECOVERED",
        recoveryStatus: updated.recoveryStatus as "UNSENT" | "EMAIL_SENT" | "WHATSAPP_SENT",
      };
      globalForAbandoned.inMemoryAbandonedCheckouts?.set(id, stored);
      return stored;
    } catch (err) {
      console.warn("Error updating follow-up status:", err);
    }
  }

  // Memory fallback
  const existing = globalForAbandoned.inMemoryAbandonedCheckouts?.get(id);
  if (existing) {
    existing.recoveryStatus = recoveryStatus;
    existing.lastContactedAt = now;
    if (statusOverride) {
      existing.status = statusOverride;
      if (statusOverride === "RECOVERED") existing.recoveredAt = now;
    }
    existing.updatedAt = now;
    return existing;
  }

  return null;
}

/**
 * Delete an abandoned checkout record
 */
export async function deleteAbandonedCheckout(id: string): Promise<boolean> {
  const isDbUp = await isDatabaseConnected();
  if (isDbUp) {
    try {
      await prisma.abandonedCheckout.delete({ where: { id } });
      globalForAbandoned.inMemoryAbandonedCheckouts?.delete(id);
      return true;
    } catch (err) {
      console.warn("Error deleting abandoned checkout:", err);
    }
  }

  if (globalForAbandoned.inMemoryAbandonedCheckouts?.has(id)) {
    globalForAbandoned.inMemoryAbandonedCheckouts.delete(id);
    return true;
  }
  return false;
}

/**
 * Get aggregated analytics for Abandoned Checkouts (Shopify style)
 */
export async function getAbandonedCheckoutStats() {
  const all = await getAllAbandonedCheckouts();

  const totalCheckouts = all.length;
  const abandoned = all.filter((c) => c.status === "ABANDONED");
  const recovered = all.filter((c) => c.status === "RECOVERED");

  const potentialLostRevenue = abandoned.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const recoveredRevenue = recovered.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const recoveryRate = totalCheckouts > 0 ? Math.round((recovered.length / totalCheckouts) * 100) : 0;

  return {
    totalCheckouts,
    abandonedCount: abandoned.length,
    recoveredCount: recovered.length,
    potentialLostRevenue,
    recoveredRevenue,
    recoveryRate,
  };
}

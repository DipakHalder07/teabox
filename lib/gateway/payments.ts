import crypto from "crypto";
import { Prisma, PaymentSession } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { priceOrder, PricedOrder, OrderLineInput, PricingError } from "@/lib/orderPricing";
import { consumeStock } from "@/lib/catalog";
import { after } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { alertPaid } from "./alerts";
import { getUpiConfig, LATE_MATCH_MS, PAYMENT_WINDOW_MS, VERIFYING_EXTENSION_MS } from "./config";

export class GatewayError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

export interface CheckoutInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string | null;
  couponCode?: string | null;
  notes?: string | null;
  items: OrderLineInput[];
}

interface OrderDraft extends Omit<CheckoutInput, "items"> {
  priced: PricedOrder;
}

const OPEN_STATUSES = ["PENDING", "VERIFYING"];

function isUniqueViolation(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

function activeKeyFor(upiId: string, payPaise: number) {
  return `${upiId}:${payPaise}`;
}

/** Frees amounts whose late-payment window has passed, so they can be handed out again. */
async function releaseStaleAmounts() {
  const now = new Date();
  await prisma.paymentSession.updateMany({
    where: { activeKey: { not: null }, matchUntil: { lt: now }, status: { in: OPEN_STATUSES } },
    data: { status: "EXPIRED" },
  });
  await prisma.paymentSession.updateMany({
    where: { activeKey: { not: null }, matchUntil: { lt: now } },
    data: { activeKey: null },
  });
}

async function newOrderNumber() {
  for (let i = 0; i < 5; i++) {
    const candidate = `TB-${crypto.randomInt(10_000_000, 100_000_000)}`;
    const taken = await prisma.order.findUnique({ where: { orderNumber: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  throw new GatewayError("Could not allocate an order number", 500);
}

/**
 * Starts a UPI checkout. The customer pays the order total minus a random 1-99 paise tag that
 * no other open checkout uses, so the bank credit identifies this checkout exactly.
 */
export async function startPayment(input: CheckoutInput) {
  const { upiId, payeeName } = getUpiConfig();
  if (!upiId) throw new GatewayError("UPI payments are not configured", 503);

  let priced: PricedOrder;
  try {
    priced = await priceOrder({ items: input.items, couponCode: input.couponCode, paymentMethod: "upi" });
  } catch (err) {
    if (err instanceof PricingError) throw new GatewayError(err.message, 400);
    throw err;
  }
  const orderPaise = priced.totalAmount * 100;
  if (orderPaise < 200) throw new GatewayError("Order total is too small for UPI", 400);

  await releaseStaleAmounts();
  const draft: OrderDraft = {
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail || null,
    address: input.address,
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    landmark: input.landmark || null,
    couponCode: input.couponCode || null,
    notes: input.notes || null,
    priced,
  };

  for (let attempt = 0; attempt < 6; attempt++) {
    // Taken: amounts still open, and amounts paid in the last 30 min (a late duplicate alert
    // for that payment must never look like this new checkout's money).
    const used = await prisma.paymentSession.findMany({
      where: {
        upiId,
        payPaise: { gte: orderPaise - 99, lt: orderPaise },
        OR: [{ activeKey: { not: null } }, { status: "PAID", paidAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } }],
      },
      select: { payPaise: true },
    });
    const usedTags = new Set(used.map((u) => orderPaise - u.payPaise));
    const free: number[] = [];
    for (let tag = 1; tag <= 99; tag++) if (!usedTags.has(tag)) free.push(tag);
    if (free.length === 0) {
      throw new GatewayError("Many customers are paying this exact amount right now. Please try again in a minute.", 503);
    }

    const payPaise = orderPaise - free[crypto.randomInt(free.length)];
    const now = Date.now();
    try {
      return await prisma.paymentSession.create({
        data: {
          orderNumber: await newOrderNumber(),
          orderDraft: draft as unknown as Prisma.InputJsonValue,
          upiId,
          payeeName,
          orderPaise,
          payPaise,
          activeKey: activeKeyFor(upiId, payPaise),
          customerPhone: input.customerPhone,
          expiresAt: new Date(now + PAYMENT_WINDOW_MS),
          matchUntil: new Date(now + PAYMENT_WINDOW_MS + LATE_MATCH_MS),
        },
      });
    } catch (err) {
      if (isUniqueViolation(err)) continue; // another checkout took that amount a moment ago
      throw err;
    }
  }
  throw new GatewayError("Could not start the payment. Please try again.", 503);
}

/** Marks open sessions past their window as EXPIRED (they can still be matched until matchUntil). */
export async function refreshStatus(session: PaymentSession) {
  if (OPEN_STATUSES.includes(session.status) && session.expiresAt.getTime() < Date.now()) {
    return prisma.paymentSession.update({ where: { id: session.id }, data: { status: "EXPIRED" } });
  }
  return session;
}

export async function getSession(id: string) {
  const session = await prisma.paymentSession.findUnique({ where: { id } });
  return session ? refreshStatus(session) : null;
}

export function upiUriFor(session: PaymentSession) {
  const params = new URLSearchParams({
    pa: session.upiId,
    pn: session.payeeName,
    am: (session.payPaise / 100).toFixed(2),
    tn: `Teabox ${session.orderNumber}`,
    cu: "INR",
  });
  return `upi://pay?${params.toString().replace(/\+/g, "%20")}`;
}

/** Creates the real order from the stored draft once the money is in. Runs inside the payment transaction. */
async function createOrderFromDraft(
  tx: Prisma.TransactionClient,
  session: PaymentSession,
  utr: string | null,
  note: string | null
) {
  const draft = session.orderDraft as unknown as OrderDraft;
  const productIds = draft.priced.items.map((i) => i.productId).filter((id): id is string => Boolean(id));
  const existing = new Set(
    (await tx.product.findMany({ where: { id: { in: productIds } }, select: { id: true } })).map((p) => p.id)
  );

  return tx.order.create({
    data: {
      id: session.orderNumber,
      orderNumber: session.orderNumber,
      customerName: draft.customerName,
      customerPhone: draft.customerPhone,
      customerEmail: draft.customerEmail || null,
      address: draft.address,
      city: draft.city,
      state: draft.state,
      pincode: draft.pincode,
      landmark: draft.landmark || null,
      subtotal: draft.priced.subtotal,
      discountAmount: draft.priced.discountAmount,
      couponCode: draft.couponCode || null,
      shippingFee: draft.priced.shippingFee,
      codFee: 0,
      totalAmount: draft.priced.totalAmount,
      paymentMethod: "upi",
      paymentStatus: "PAID",
      orderStatus: "PROCESSING",
      utrNumber: utr,
      notes: [draft.notes, note].filter(Boolean).join(" | ") || null,
      items: {
        create: draft.priced.items.map((item) => ({
          productId: item.productId && existing.has(item.productId) ? item.productId : null,
          title: item.title,
          weight: item.weight || null,
          price: item.price,
          quantity: item.quantity,
          image: item.image || null,
        })),
      },
    },
    include: { items: true },
  });
}

/**
 * Settles a session: creates the order, links the credit and frees the amount. Safe to call
 * twice; only the first call wins.
 */
export async function markSessionPaid(
  sessionId: string,
  opts: { utr: string | null; via: string; creditId?: string; note?: string | null }
) {
  const result = await prisma.$transaction(async (tx) => {
    const claimed = await tx.paymentSession.updateMany({
      where: { id: sessionId, status: { not: "PAID" } },
      data: { status: "PAID", paidAt: new Date(), utr: opts.utr, paidVia: opts.via, activeKey: null },
    });
    if (claimed.count !== 1) return null;

    const session = await tx.paymentSession.findUniqueOrThrow({ where: { id: sessionId } });
    const order = await createOrderFromDraft(tx, session, opts.utr, opts.note ?? null);
    await tx.paymentSession.update({ where: { id: sessionId }, data: { orderId: order.id } });
    if (opts.creditId) {
      await tx.creditEvent.update({ where: { id: opts.creditId }, data: { sessionId, matchedAt: new Date() } });
    }
    return order;
  });

  if (result) {
    await consumeStock(result.items);
    const settled = await prisma.paymentSession.findUnique({ where: { id: sessionId } });
    if (settled) {
      // After the response, so a phone or customer request is not slowed down by WhatsApp.
      const task = () => alertPaid(settled).catch((e) => console.warn("[TeaPay] WhatsApp paid alert failed:", e?.message || e));
      try {
        after(task);
      } catch {
        void task(); // outside a request (scripts)
      }
    }
    const emailTask = () =>
      sendOrderConfirmationEmail({
        orderNumber: result.orderNumber,
        customerName: result.customerName,
        customerPhone: result.customerPhone,
        customerEmail: result.customerEmail,
        items: result.items,
        subtotal: result.subtotal,
        discountAmount: result.discountAmount,
        shippingFee: result.shippingFee,
        codFee: result.codFee,
        totalAmount: result.totalAmount,
        paymentMethod: "upi",
        paymentStatus: "PAID",
        utrNumber: result.utrNumber,
        address: result.address,
        city: result.city,
        state: result.state,
        pincode: result.pincode,
        landmark: result.landmark,
      }).catch((e) => console.warn("[TeaPay] Order email failed:", e));
    // Admin + customer order emails, after the response like the WhatsApp alert above
    try {
      after(emailTask);
    } catch {
      void emailTask(); // outside a request (scripts)
    }
  }
  return result;
}

export interface CreditInput {
  source: "ANDROID_SMS" | "ANDROID_NOTIFICATION" | "GMAIL" | "MANUAL";
  amountPaise: number;
  utr: string | null;
  payerVpa: string | null;
  sender: string | null;
  rawText: string;
  observedAt: Date;
  deviceId?: string | null;
  /** Used when the alert has no UTR (e.g. "gmail:<messageId>") */
  sourceKey: string;
}

/**
 * Stores an incoming bank credit and settles the checkout it belongs to. The same credit may
 * arrive by SMS, app notification and email; the UTR keeps it from being counted twice.
 */
export async function recordCredit(input: CreditInput) {
  const dedupeKey = input.utr ? `utr:${input.utr}` : input.sourceKey;
  let credit;
  try {
    credit = await prisma.creditEvent.create({
      data: {
        source: input.source,
        amountPaise: input.amountPaise,
        utr: input.utr,
        payerVpa: input.payerVpa,
        sender: input.sender,
        rawText: input.rawText.slice(0, 2000),
        dedupeKey,
        observedAt: input.observedAt,
        deviceId: input.deviceId || null,
      },
    });
  } catch (err) {
    if (isUniqueViolation(err)) return { duplicate: true, matched: false, sessionId: null };
    throw err;
  }

  const { upiId } = getUpiConfig();
  const observed = credit.observedAt.getTime();
  const session = await prisma.paymentSession.findUnique({
    where: { activeKey: activeKeyFor(upiId, credit.amountPaise) },
  });

  // The credit must fall between the checkout starting (2 min clock slack) and its late window.
  if (session && observed >= session.createdAt.getTime() - 2 * 60 * 1000 && observed <= session.matchUntil.getTime()) {
    const order = await markSessionPaid(session.id, { utr: credit.utr, via: credit.source, creditId: credit.id });
    if (order) return { duplicate: false, matched: true, sessionId: session.id };
  }

  // The customer already typed this UTR (e.g. they paid a different amount than shown): the bank
  // confirms it, so settle it if at least the asked amount arrived.
  if (credit.utr) {
    const byUtr = await prisma.paymentSession.findFirst({
      where: { customerUtr: credit.utr, status: { not: "PAID" }, upiId },
      orderBy: { createdAt: "desc" },
    });
    if (byUtr && credit.amountPaise >= byUtr.payPaise) {
      const note =
        credit.amountPaise === byUtr.payPaise
          ? null
          : `Matched by UTR: received ₹${(credit.amountPaise / 100).toFixed(2)}, asked ₹${(byUtr.payPaise / 100).toFixed(2)}`;
      const order = await markSessionPaid(byUtr.id, { utr: credit.utr, via: credit.source, creditId: credit.id, note });
      if (order) return { duplicate: false, matched: true, sessionId: byUtr.id };
    }
  }

  // A second alert for a payment we already settled (e.g. app notification without UTR after the
  // SMS). Two alerts with different UTRs are different payments, so only link when one has none.
  const recent = await prisma.paymentSession.findFirst({
    where: {
      status: "PAID",
      payPaise: credit.amountPaise,
      upiId,
      paidAt: { gte: new Date(observed - 15 * 60 * 1000), lte: new Date(observed + 15 * 60 * 1000) },
    },
    orderBy: { paidAt: "desc" },
  });
  if (recent && (!credit.utr || !recent.utr)) {
    await prisma.creditEvent.update({ where: { id: credit.id }, data: { sessionId: recent.id, matchedAt: new Date() } });
    if (credit.utr && !recent.utr) {
      // The SMS often carries the UTR that the app notification lacked: keep it on the order.
      await prisma.paymentSession.update({ where: { id: recent.id }, data: { utr: credit.utr } });
      if (recent.orderId) {
        await prisma.order.update({ where: { id: recent.orderId }, data: { utrNumber: credit.utr } });
      }
    }
    return { duplicate: true, matched: false, sessionId: recent.id };
  }

  return { duplicate: false, matched: false, sessionId: null };
}

/** Customer pressed "I've paid". Gives the bank alert a little more time and tries their UTR. */
export async function markVerifying(sessionId: string, customerUtr: string | null) {
  const session = await getSession(sessionId);
  if (!session) throw new GatewayError("Payment not found", 404);
  if (session.status === "PAID") return session;
  if (session.status === "CANCELLED") throw new GatewayError("This payment was cancelled", 409);

  if (customerUtr) {
    // One bank payment can pay for one order only.
    const reused = await prisma.paymentSession.findFirst({
      where: { id: { not: sessionId }, OR: [{ customerUtr }, { utr: customerUtr }] },
      select: { id: true },
    });
    const linkedElsewhere = await prisma.creditEvent.findFirst({
      where: { utr: customerUtr, sessionId: { not: null, notIn: [sessionId] } },
      select: { id: true },
    });
    if (reused || linkedElsewhere) throw new GatewayError("This UPI reference was already used for another order.", 409);
  }

  const extended = new Date(Math.max(session.expiresAt.getTime(), Date.now() + VERIFYING_EXTENSION_MS));
  const updated = await prisma.paymentSession.update({
    where: { id: sessionId },
    data: {
      status: session.status === "EXPIRED" ? "EXPIRED" : "VERIFYING",
      expiresAt: session.status === "EXPIRED" ? session.expiresAt : extended,
      customerUtr: customerUtr || session.customerUtr,
    },
  });

  // The bank alert may have arrived first: match the customer's UTR against it. The UTR alone is
  // not proof; the bank's alert with that UTR and at least the asked amount is.
  if (customerUtr) {
    const credit = await prisma.creditEvent.findFirst({ where: { utr: customerUtr, sessionId: null } });
    if (credit && credit.amountPaise >= session.payPaise) {
      const note =
        credit.amountPaise === session.payPaise
          ? null
          : `Matched by UTR: received ₹${(credit.amountPaise / 100).toFixed(2)}, asked ₹${(session.payPaise / 100).toFixed(2)}`;
      await markSessionPaid(sessionId, { utr: credit.utr, via: credit.source, creditId: credit.id, note });
      return prisma.paymentSession.findUniqueOrThrow({ where: { id: sessionId } });
    }
  }
  return updated;
}

export async function cancelSession(sessionId: string) {
  // The amount stays reserved until matchUntil, so a payment made just before cancelling still settles.
  await prisma.paymentSession.updateMany({
    where: { id: sessionId, status: { in: [...OPEN_STATUSES, "EXPIRED"] } },
    data: { status: "CANCELLED" },
  });
}

/** Admin links a stored credit to a checkout (e.g. the customer paid a slightly different amount). */
export async function assignCredit(creditId: string, sessionId: string) {
  const credit = await prisma.creditEvent.findUnique({ where: { id: creditId } });
  if (!credit) throw new GatewayError("Credit not found", 404);
  if (credit.sessionId) throw new GatewayError("This credit is already linked to a payment", 409);
  const session = await prisma.paymentSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new GatewayError("Payment not found", 404);

  const note =
    credit.amountPaise === session.payPaise
      ? "Matched by admin"
      : `Matched by admin: received ₹${(credit.amountPaise / 100).toFixed(2)}, expected ₹${(session.payPaise / 100).toFixed(2)}`;
  const order = await markSessionPaid(sessionId, { utr: credit.utr, via: "MANUAL", creditId, note });
  if (!order) throw new GatewayError("This payment is already settled", 409);
  return order;
}

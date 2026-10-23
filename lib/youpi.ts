import QRCode from "qrcode";
import crypto from "crypto";
import { getYouPiConfig } from "./youpiConfig";
import { createGatewaySession, getGatewayHealth, GatewayHealth, GatewayStatus } from "./youpiGateway";

export { getYouPiConfig };

export interface YouPiCustomer {
  name: string;
  email?: string;
  phone: string;
}

export interface YouPiCreateOrderInput {
  orderId: string;
  amount: number;
  customer: YouPiCustomer;
  note?: string;
}

export interface UpiDeepLinks {
  gpay: string;
  phonepe: string;
  paytm: string;
  cred: string;
  generic: string;
}

/** Shop-generated QR; payment is confirmed by the admin against the bank statement. */
export interface YouPiManualSession {
  mode: "manual";
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  vpa: string;
  merchantName: string;
  upiUri: string;
  qrCodeDataUrl: string;
  deepLinks: UpiDeepLinks;
  expiresAt: string;
  status: "PENDING" | "COMPLETED" | "EXPIRED";
}

/** Session on the YouPI-PG gateway: WhatsApp OTP, queued QR and automatic bank confirmation. */
export interface YouPiGatewaySession {
  mode: "gateway";
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: GatewayStatus;
  health: GatewayHealth | null;
}

export type YouPiPaymentSession = YouPiManualSession | YouPiGatewaySession;

// Global persistent order cache (persists during Next.js hot-reloads)
interface YouPiStoredOrder {
  orderId: string;
  amount: number;
  status: "PENDING" | "COMPLETED";
  /** YouPI-PG payment session id, when the gateway is used */
  paymentId?: string;
  /** UTR confirmed by the gateway's signed webhook */
  utr?: string;
  /** UTR typed in by the customer. Unverified: for admin reconciliation only */
  submittedUtr?: string;
  paidAt?: string;
}

const globalForYouPi = globalThis as unknown as {
  youPiOrders?: Map<string, YouPiStoredOrder>;
};

export const inMemoryOrders =
  globalForYouPi.youPiOrders || new Map<string, YouPiStoredOrder>();

if (process.env.NODE_ENV !== "production") {
  globalForYouPi.youPiOrders = inMemoryOrders;
}

function registerPendingPayment(orderId: string, amount: number, paymentId?: string) {
  const existing = inMemoryOrders.get(orderId);
  // Re-opening the payment screen must never undo a confirmed payment or drop a submitted UTR.
  if (existing?.status === "COMPLETED") return;
  inMemoryOrders.set(orderId, {
    orderId,
    amount,
    status: "PENDING",
    paymentId: paymentId || existing?.paymentId,
    submittedUtr: existing?.submittedUtr,
  });
}

/** App-specific intent links built from a standard upi://pay URI. */
export function buildUpiDeepLinks(upiUri: string): UpiDeepLinks {
  const query = upiUri.split("?")[1] || "";
  return {
    generic: upiUri,
    gpay: `gpay://upi/pay?${query}`,
    phonepe: `phonepe://pay?${query}`,
    paytm: `paytmmp://pay?${query}`,
    cred: `cred://pay?${query}`,
  };
}

export function buildUpiQrDataUrl(upiUri: string) {
  return QRCode.toDataURL(upiUri, {
    errorCorrectionLevel: "H",
    margin: 2,
    scale: 8,
    color: {
      dark: "#1f3a2c", // Teabox luxury forest green
      light: "#ffffff",
    },
  });
}

/**
 * Creates a payment session.
 * With YOUPI_PG_BASE_URL set, the session is created on the YouPI-PG gateway (WhatsApp OTP,
 * queue, automatic confirmation). If the gateway is not configured or unreachable, the shop
 * falls back to its own UPI QR, confirmed manually by the admin.
 */
export async function createYouPiPayment(
  input: YouPiCreateOrderInput
): Promise<YouPiPaymentSession> {
  const config = getYouPiConfig();

  // 1. YouPI-PG gateway
  if (config.baseUrl) {
    try {
      const [gateway, health] = await Promise.all([
        createGatewaySession({ orderId: input.orderId, amount: input.amount, note: input.note }),
        getGatewayHealth().catch(() => null),
      ]);
      registerPendingPayment(input.orderId, input.amount, gateway.paymentId);
      return {
        mode: "gateway",
        paymentId: gateway.paymentId,
        orderId: input.orderId,
        amount: input.amount,
        currency: "INR",
        status: gateway.status,
        health,
      };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.warn(`[YouPI-PG] Gateway unavailable (${reason}); using manual UPI mode`);
    }
  }

  // 2. Manual mode: shop-generated NPCI UPI QR
  if (!config.merchantVpa) {
    throw new Error("UPI payments are not configured: set YOUPI_MERCHANT_VPA");
  }

  const formattedAmount = input.amount.toFixed(2);
  const note = input.note || `Teabox ${input.orderId}`;

  // Standard NPCI UPI URI Specification
  // upi://pay?pa={vpa}&pn={name}&am={amount}&tr={refId}&tn={note}&cu=INR
  const upiUri = `upi://pay?pa=${encodeURIComponent(config.merchantVpa)}&pn=${encodeURIComponent(
    config.merchantName
  )}&am=${formattedAmount}&tr=${encodeURIComponent(input.orderId)}&tn=${encodeURIComponent(
    note
  )}&cu=INR`;

  registerPendingPayment(input.orderId, input.amount);

  return {
    mode: "manual",
    paymentId: `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    orderId: input.orderId,
    amount: input.amount,
    currency: "INR",
    vpa: config.merchantVpa,
    merchantName: config.merchantName,
    upiUri,
    qrCodeDataUrl: await buildUpiQrDataUrl(upiUri),
    deepLinks: buildUpiDeepLinks(upiUri),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    status: "PENDING",
  };
}

/**
 * Read-only payment status. Only the gateway's signed webhook can make this COMPLETED.
 */
export function getPaymentStatus(orderId: string) {
  const existing = inMemoryOrders.get(orderId);
  if (!existing) return { status: "NOT_FOUND" as const };
  return {
    status: existing.status,
    amount: existing.amount,
    paymentId: existing.paymentId,
    utr: existing.status === "COMPLETED" ? existing.utr : undefined,
    submittedUtr: existing.submittedUtr,
  };
}

/**
 * Records a customer-typed UTR. This does NOT confirm payment: it is stored as
 * unverified so the admin can reconcile it against the bank statement.
 */
export function submitCustomerUtr(
  orderId: string,
  utr: string
): "OK" | "NOT_FOUND" | "DUPLICATE" {
  const existing = inMemoryOrders.get(orderId);
  if (!existing) return "NOT_FOUND";

  for (const other of inMemoryOrders.values()) {
    if (other.orderId !== orderId && (other.utr === utr || other.submittedUtr === utr)) {
      return "DUPLICATE";
    }
  }

  if (existing.status !== "COMPLETED") existing.submittedUtr = utr;
  return "OK";
}

/**
 * Marks a payment as COMPLETED. Call this ONLY from the signature-verified webhook.
 * `paidAmount` is the amount the gateway says it received.
 */
export function markPaymentCompleted(
  orderId: string,
  utr: string | undefined,
  paidAmount: number
): { ok: boolean; reason?: string } {
  const existing = inMemoryOrders.get(orderId);
  if (existing && existing.amount > 0 && Math.abs(existing.amount - paidAmount) >= 1) {
    return {
      ok: false,
      reason: `amount mismatch: session ₹${existing.amount}, received ₹${paidAmount}`,
    };
  }

  inMemoryOrders.set(orderId, {
    orderId,
    amount: paidAmount,
    status: "COMPLETED",
    utr,
    paymentId: existing?.paymentId,
    submittedUtr: existing?.submittedUtr,
    paidAt: new Date().toISOString(),
  });
  return { ok: true };
}

/**
 * Cryptographic verification for incoming YouPI-PG webhooks.
 * YouPI sends `X-Gateway-Signature: sha256=<hex hmac-sha256 of the raw body>`.
 */
export function verifyYouPiSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  try {
    const received = signature.trim().replace(/^sha256=/i, "").toLowerCase();
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (received.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  } catch {
    return false;
  }
}

import crypto from "crypto";
import { getUpiConfig } from "./gateway/config";
import { buildUpiDeepLinks, buildUpiQrDataUrl, UpiDeepLinks } from "./gateway/upi";

// Manual UPI: used only when the TeaPay gateway is unavailable (no database). The shop shows
// its own QR; the customer types their UTR and the admin confirms the payment against the bank.

export interface ManualUpiSession {
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
  status: "PENDING";
}

interface PendingPayment {
  orderId: string;
  amount: number;
  /** Typed by the customer. Unverified: for admin reconciliation only */
  submittedUtr?: string;
}

const globalForManualUpi = globalThis as unknown as {
  manualUpiPayments?: Map<string, PendingPayment>;
};

const pendingPayments = globalForManualUpi.manualUpiPayments || new Map<string, PendingPayment>();

if (process.env.NODE_ENV !== "production") {
  globalForManualUpi.manualUpiPayments = pendingPayments;
}

export async function createManualUpiPayment(input: {
  orderId: string;
  amount: number;
  note?: string;
}): Promise<ManualUpiSession> {
  const { upiId, payeeName } = getUpiConfig();
  if (!upiId) {
    throw new Error("UPI payments are not configured: set UPI_ID");
  }

  // Re-opening the payment screen must not drop a UTR the customer already typed.
  const existing = pendingPayments.get(input.orderId);
  pendingPayments.set(input.orderId, {
    orderId: input.orderId,
    amount: input.amount,
    submittedUtr: existing?.submittedUtr,
  });

  // Standard NPCI UPI URI: upi://pay?pa={vpa}&pn={name}&am={amount}&tr={refId}&tn={note}&cu=INR
  const note = input.note || `Teabox ${input.orderId}`;
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${input.amount.toFixed(2)}&tr=${encodeURIComponent(input.orderId)}&tn=${encodeURIComponent(
    note
  )}&cu=INR`;

  return {
    mode: "manual",
    paymentId: `PAY_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    orderId: input.orderId,
    amount: input.amount,
    currency: "INR",
    vpa: upiId,
    merchantName: payeeName,
    upiUri,
    qrCodeDataUrl: await buildUpiQrDataUrl(upiUri),
    deepLinks: buildUpiDeepLinks(upiUri),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    status: "PENDING",
  };
}

export function isKnownManualPayment(orderId: string) {
  return pendingPayments.has(orderId);
}

export function getSubmittedUtr(orderId: string) {
  return pendingPayments.get(orderId)?.submittedUtr || null;
}

/**
 * Records a customer-typed UTR. This does NOT confirm payment: it is stored as unverified so
 * the admin can reconcile it against the bank statement.
 */
export function submitCustomerUtr(orderId: string, utr: string): "OK" | "NOT_FOUND" | "DUPLICATE" {
  const existing = pendingPayments.get(orderId);
  if (!existing) return "NOT_FOUND";

  for (const other of pendingPayments.values()) {
    if (other.orderId !== orderId && other.submittedUtr === utr) return "DUPLICATE";
  }

  existing.submittedUtr = utr;
  return "OK";
}

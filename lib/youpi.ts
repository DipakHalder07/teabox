import QRCode from "qrcode";
import crypto from "crypto";

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

export interface YouPiPaymentSession {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  vpa: string;
  merchantName: string;
  upiUri: string;
  qrCodeDataUrl: string;
  deepLinks: {
    gpay: string;
    phonepe: string;
    paytm: string;
    cred: string;
    generic: string;
  };
  expiresAt: string;
  status: "PENDING" | "COMPLETED" | "EXPIRED";
}

// Global persistent order cache (persists during Next.js hot-reloads)
interface YouPiStoredOrder {
  orderId: string;
  amount: number;
  status: "PENDING" | "COMPLETED";
  utr?: string;
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

export const getYouPiConfig = () => {
  return {
    baseUrl: process.env.YOUPI_PG_BASE_URL || "",
    merchantVpa: process.env.YOUPI_MERCHANT_VPA || "8617513004@ptaxis",
    merchantName: process.env.YOUPI_MERCHANT_NAME || "Teabox India",
    publicKey: process.env.YOUPI_PUBLIC_KEY || "youpi_pk_live_teabox",
    webhookSecret: process.env.YOUPI_WEBHOOK_SECRET || "youpi_whsec_teabox_secret_2026",
  };
};

/**
 * Creates a YouPI-PG payment session.
 * If YOUPI_PG_BASE_URL is set, it attempts to proxy to the external YouPI-PG node server.
 * Otherwise, it performs zero-latency native dynamic UPI QR & intent generation.
 */
export async function createYouPiPayment(
  input: YouPiCreateOrderInput
): Promise<YouPiPaymentSession> {
  const config = getYouPiConfig();
  const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  // 1. Try forwarding to external self-hosted YouPI-PG server if configured
  if (config.baseUrl) {
    try {
      const response = await fetch(`${config.baseUrl}/v1/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.publicKey}`,
        },
        body: JSON.stringify({
          orderId: input.orderId,
          amount: input.amount,
          currency: "INR",
          customer: input.customer,
          note: input.note || `Teabox Order ${input.orderId}`,
        }),
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.data?.qrCodeDataUrl || data?.data?.upiUri) {
          return data.data;
        }
      }
    } catch {
      // Fallback smoothly to direct YouPI-PG standard algorithm
      console.warn("External YouPI-PG server unreachable, switching to native YouPI-PG engine");
    }
  }

  // 2. Standard YouPI-PG NPCI UPI Protocol implementation
  const formattedAmount = input.amount.toFixed(2);
  const note = input.note || `Teabox ${input.orderId}`;

  // Standard NPCI UPI URI Specification
  // upi://pay?pa={vpa}&pn={name}&am={amount}&tr={refId}&tn={note}&cu=INR
  const upiUri = `upi://pay?pa=${encodeURIComponent(config.merchantVpa)}&pn=${encodeURIComponent(
    config.merchantName
  )}&am=${formattedAmount}&tr=${encodeURIComponent(input.orderId)}&tn=${encodeURIComponent(
    note
  )}&cu=INR`;

  // Dynamic QR Code generation (High error correction, clean margin)
  const qrCodeDataUrl = await QRCode.toDataURL(upiUri, {
    errorCorrectionLevel: "H",
    margin: 2,
    scale: 8,
    color: {
      dark: "#1f3a2c", // Teabox luxury forest green
      light: "#ffffff",
    },
  });

  // App-specific intent schemes
  const deepLinks = {
    generic: upiUri,
    gpay: `gpay://upi/pay?pa=${encodeURIComponent(config.merchantVpa)}&pn=${encodeURIComponent(
      config.merchantName
    )}&am=${formattedAmount}&tr=${encodeURIComponent(input.orderId)}&tn=${encodeURIComponent(
      note
    )}&cu=INR`,
    phonepe: `phonepe://pay?pa=${encodeURIComponent(config.merchantVpa)}&pn=${encodeURIComponent(
      config.merchantName
    )}&am=${formattedAmount}&tr=${encodeURIComponent(input.orderId)}&tn=${encodeURIComponent(
      note
    )}&cu=INR`,
    paytm: `paytmmp://pay?pa=${encodeURIComponent(config.merchantVpa)}&pn=${encodeURIComponent(
      config.merchantName
    )}&am=${formattedAmount}&tr=${encodeURIComponent(input.orderId)}&tn=${encodeURIComponent(
      note
    )}&cu=INR`,
    cred: `cred://pay?pa=${encodeURIComponent(config.merchantVpa)}&pn=${encodeURIComponent(
      config.merchantName
    )}&am=${formattedAmount}&tr=${encodeURIComponent(input.orderId)}&tn=${encodeURIComponent(
      note
    )}&cu=INR`,
  };

  // Register in local store
  inMemoryOrders.set(input.orderId, {
    orderId: input.orderId,
    amount: input.amount,
    status: "PENDING",
  });

  return {
    paymentId,
    orderId: input.orderId,
    amount: input.amount,
    currency: "INR",
    vpa: config.merchantVpa,
    merchantName: config.merchantName,
    upiUri,
    qrCodeDataUrl,
    deepLinks,
    expiresAt,
    status: "PENDING",
  };
}

/**
 * Verify payment status (via UTR or webhook status)
 */
export function verifyPaymentStatus(orderId: string, utr?: string) {
  const existing = inMemoryOrders.get(orderId);
  if (!existing) {
    if (utr && utr.length >= 8) {
      inMemoryOrders.set(orderId, {
        orderId,
        amount: 0,
        status: "COMPLETED",
        utr,
        paidAt: new Date().toISOString(),
      });
      return { success: true, status: "COMPLETED", utr };
    }
    return { success: false, status: "NOT_FOUND" };
  }

  if (utr) {
    existing.status = "COMPLETED";
    existing.utr = utr;
    existing.paidAt = new Date().toISOString();
    inMemoryOrders.set(orderId, existing);
    return { success: true, status: "COMPLETED", utr };
  }

  return {
    success: existing.status === "COMPLETED",
    status: existing.status,
    utr: existing.utr,
  };
}

/**
 * Cryptographic verification for incoming YouPI-PG webhooks
 */
export function verifyYouPiSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  try {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = hmac.update(rawBody).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

import { PaymentSession } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendCheckoutStartedEmail } from "@/lib/email";
import { whatsAppProvider } from "./config";
import { signValue } from "./crypto";
import { getSetting, setSetting } from "./settings";
import { getToggles } from "./toggles";
import { getWhatsAppServiceStatus, sendWhatsAppText } from "./whatsapp";

// WhatsApp alerts to the shop owner (through the logged-in WhatsApp service):
//  - a customer reached the payment QR: order details + a link to confirm or cancel
//  - a payment was confirmed automatically

const REVIEW_LINK_TTL_MS = 24 * 60 * 60 * 1000;

export async function getAlertSettings() {
  const [enabled, number] = await Promise.all([getSetting("alerts.enabled"), getSetting("alerts.number")]);
  return { enabled: enabled !== "off", number: number || "" };
}

export async function saveAlertSettings(enabled: boolean, number: string) {
  await setSetting("alerts.enabled", enabled ? "on" : "off");
  await setSetting("alerts.number", number);
}

/** Link that opens one payment for review without logging in (signed, valid 24 h). */
export function reviewLink(baseUrl: string, sessionId: string) {
  return `${baseUrl}/pay-review/${encodeURIComponent(signValue("payment-review", sessionId, REVIEW_LINK_TTL_MS))}`;
}

/** Where alerts go: the number set in admin, or the logged-in WhatsApp itself ("message yourself"). */
async function alertTarget(): Promise<string | null> {
  if (whatsAppProvider() !== "qr") return null; // the official Cloud API cannot send free text
  const settings = await getAlertSettings();
  if (!settings.enabled) return null;
  const status = await getWhatsAppServiceStatus();
  if (!status.connected) return null;
  const digits = (settings.number || status.phone || "").replace(/\D/g, "");
  if (!digits) return null;
  return digits.length === 10 ? `91${digits}` : digits;
}

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const clock = (d: Date) =>
  d.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });

interface Draft {
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  address: string;
  city: string;
  pincode: string;
  landmark?: string | null;
  priced: { items: Array<{ title: string; quantity: number; weight?: string | null }> };
}

/** Sent immediately when the customer starts a checkout session. */
export async function alertNewCheckout(sessionId: string, baseUrl: string) {
  const to = await alertTarget();
  if (!to) {
    console.log("[TeaPay] Order alert skipped: WhatsApp alerts off or WhatsApp not connected");
    return;
  }

  // Only one alert per checkout, even if several requests race.
  const claimed = await prisma.paymentSession.updateMany({
    where: { id: sessionId, adminNotifiedAt: null },
    data: { adminNotifiedAt: new Date() },
  });
  if (claimed.count !== 1) return;

  const session = await prisma.paymentSession.findUniqueOrThrow({ where: { id: sessionId } });
  const draft = session.orderDraft as unknown as Draft;
  const items = draft.priced.items.map((i) => `${i.title}${i.weight ? ` (${i.weight})` : ""} ×${i.quantity}`).join(", ");
  const minutesLeft = Math.max(1, Math.round((session.expiresAt.getTime() - Date.now()) / 60000));

  const startTime = clock(session.createdAt);
  const expiryTime = clock(session.expiresAt);
  const dateStr = session.createdAt.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const text = [
    `🛒 *New Checkout Started* · Order #${session.orderNumber}`,
    `🕒 *Started:* ${startTime} (${dateStr})`,
    `⏱ *Payment Window:* ${minutesLeft} min (expires at ${expiryTime})`,
    ``,
    `👤 *Customer:* ${draft.customerName}`,
    `📞 *Phone:* +91 ${draft.customerPhone}`,
    `📍 *Delivery Address:*`,
    `${draft.address}, ${draft.city} - ${draft.pincode}${draft.landmark ? ` (Near: ${draft.landmark})` : ""}`,
    ``,
    `📦 *Order Items:*`,
    `${items}`,
    ``,
    `💰 *Payable Amount:* *${rupees(session.payPaise)}* (Total: ${rupees(session.orderPaise)})`,
    ``,
    `🔗 *Quick Review & 1-Click Confirm:*`,
    `${reviewLink(baseUrl, session.id)}`,
  ].join("\n");

  await sendWhatsAppText(to, text);
  console.log(`[TeaPay] Order alert for ${session.orderNumber} sent to +${to}`);
}

/** Email to the shop owner when a customer reaches the payment QR (start time + payment deadline). */
export async function emailNewCheckout(sessionId: string, baseUrl: string) {
  if (!(await getToggles()).emailCheckout) return;
  const session = await prisma.paymentSession.findUniqueOrThrow({ where: { id: sessionId } });
  const draft = session.orderDraft as unknown as Draft;
  const dateStr = session.createdAt.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const result = await sendCheckoutStartedEmail({
    orderNumber: session.orderNumber,
    customerName: draft.customerName,
    customerPhone: draft.customerPhone,
    customerEmail: draft.customerEmail,
    address: `${draft.address}, ${draft.city} - ${draft.pincode}${draft.landmark ? ` (near ${draft.landmark})` : ""}`,
    items: draft.priced.items.map((i) => `${i.title}${i.weight ? ` (${i.weight})` : ""} ×${i.quantity}`),
    payAmount: rupees(session.payPaise),
    orderTotal: rupees(session.orderPaise),
    startedAt: `${clock(session.createdAt)}, ${dateStr}`,
    expiresAt: clock(session.expiresAt),
    windowMinutes: Math.round((session.expiresAt.getTime() - session.createdAt.getTime()) / 60000),
    reviewUrl: reviewLink(baseUrl, session.id),
  });
  if (!result.success) throw new Error(result.error || "Email send failed");
}

/** Sent when a Cash on Delivery (COD) order is placed. */
export async function alertCodOrder(
  order: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string | null;
    totalAmount: number;
    items: Array<{ title: string; quantity: number; weight?: string | null }>;
    createdAt?: Date | string;
  },
  baseUrl: string
) {
  const to = await alertTarget();
  if (!to) return;

  const now = order.createdAt ? new Date(order.createdAt) : new Date();
  const timeStr = clock(now);
  const dateStr = now.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const items = order.items.map((i) => `${i.title}${i.weight ? ` (${i.weight})` : ""} ×${i.quantity}`).join(", ");

  const text = [
    `📦 *New Cash on Delivery (COD) Order* · #${order.orderNumber}`,
    `🕒 *Started / Placed:* ${timeStr} (${dateStr})`,
    `💵 *Payment Method:* Cash on Delivery (COD)`,
    ``,
    `👤 *Customer:* ${order.customerName}`,
    `📞 *Phone:* +91 ${order.customerPhone}`,
    `📍 *Delivery Address:*`,
    `${order.address}, ${order.city}, ${order.state} - ${order.pincode}${order.landmark ? ` (Near: ${order.landmark})` : ""}`,
    ``,
    `📦 *Order Items:*`,
    `${items}`,
    ``,
    `💰 *Total Amount:* *₹${order.totalAmount.toLocaleString("en-IN")}*`,
    ``,
    `🔗 *View Live Order & Invoice:*`,
    `${baseUrl}/order/${order.orderNumber}`,
  ].join("\n");

  await sendWhatsAppText(to, text).catch((e) => console.warn("[TeaPay] COD alert error:", e?.message || e));
  console.log(`[TeaPay] COD order alert for ${order.orderNumber} sent to +${to}`);
}

/** Sent when a payment confirms automatically (not when the admin confirmed it). */
export async function alertPaid(session: PaymentSession) {
  if (!session.paidVia || session.paidVia === "MANUAL") return;
  const to = await alertTarget();
  if (!to) return;
  const via: Record<string, string> = {
    ANDROID_SMS: "bank SMS",
    ANDROID_NOTIFICATION: "payment app",
    GMAIL: "bank email",
  };
  const text = `✅ *Paid* ${session.orderNumber}: ${rupees(session.payPaise)} received (${via[session.paidVia] || session.paidVia}${
    session.utr ? `, UTR ${session.utr}` : ""
  }). Order confirmed.`;
  await sendWhatsAppText(to, text).catch((e) => console.warn("[TeaPay] WhatsApp paid alert failed:", e?.message));
}

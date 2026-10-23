import { PaymentSession } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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
  if (!(await getToggles()).whatsapp) return null;
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
  address: string;
  city: string;
  pincode: string;
  priced: { items: Array<{ title: string; quantity: number; weight?: string | null }> };
}

/** Sent once per checkout, when the customer first sees the payment QR. */
export async function alertNewCheckout(sessionId: string, baseUrl: string) {
  const to = await alertTarget();
  if (!to) {
    console.log("[TeaPay] Order alert skipped: WhatsApp login/alerts off or WhatsApp not connected");
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

  const text = [
    `🛒 *New UPI order* ${session.orderNumber}`,
    `${draft.customerName} · +91 ${draft.customerPhone}`,
    `${draft.address}, ${draft.city} ${draft.pincode}`,
    `Items: ${items}`,
    `Pay: *${rupees(session.payPaise)}* (order ${rupees(session.orderPaise)})`,
    `⏱ ${minutesLeft} min to pay (until ${clock(session.expiresAt)})`,
    ``,
    `Check & confirm: ${reviewLink(baseUrl, session.id)}`,
  ].join("\n");

  await sendWhatsAppText(to, text);
  console.log(`[TeaPay] Order alert for ${session.orderNumber} sent to +${to}`);
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

import { NextRequest, NextResponse } from "next/server";
import { PaymentSession } from "@prisma/client";
import { isOtpRequired } from "./whatsapp";
import { readSignedValue, signValue } from "./crypto";
import { GatewayError, upiUriFor } from "./payments";
import { buildUpiDeepLinks, buildUpiQrDataUrl } from "./upi";

const PHONE_COOKIE = "teabox_pay_phone";
const PHONE_COOKIE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function errorResponse(error: unknown, fallback = "Payment error") {
  if (error instanceof GatewayError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("[TeaPay]", error);
  const msg = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: msg }, { status: 500 });
}

/** The shop's public address (used in the phone pairing QR and the Google sign-in redirect). */
export function publicBaseUrl(req: NextRequest) {
  const configured = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
  if (/^https?:\/\//.test(configured) && !configured.includes("your-teabox")) return configured;
  return req.nextUrl.origin;
}

/**
 * The visitor's IP, used for abuse limits. Headers set by the hosting platform come first; in
 * X-Forwarded-For only the last entry (added by the host's own proxy) can't be faked by a visitor.
 */
export function clientIp(req: NextRequest) {
  const fromHost = req.headers.get("x-vercel-forwarded-for") || req.headers.get("x-real-ip");
  if (fromHost) return fromHost.split(",")[0].trim();
  const chain = (req.headers.get("x-forwarded-for") || "").split(",").map((s) => s.trim()).filter(Boolean);
  return chain[chain.length - 1] || null;
}

/** A phone verified by WhatsApp code is remembered for 30 days on this browser. */
export function verifiedPhoneFromCookie(req: NextRequest) {
  return readSignedValue("verified-phone", req.cookies.get(PHONE_COOKIE)?.value);
}

export function rememberVerifiedPhone(res: NextResponse, phone: string) {
  res.cookies.set(PHONE_COOKIE, signValue("verified-phone", phone, PHONE_COOKIE_TTL_MS), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/pay",
    maxAge: PHONE_COOKIE_TTL_MS / 1000,
  });
}

/** Where the customer is in the checkout right now (null once it is over). */
export function checkoutStage(session: Pick<PaymentSession, "status" | "phoneVerifiedAt">, otpRequired: boolean) {
  if (session.status === "VERIFYING") return "Says paid, checking bank";
  if (session.status !== "PENDING") return null;
  return otpRequired && !session.phoneVerifiedAt ? "Verifying WhatsApp" : "On the payment QR";
}

function maskPhone(phone: string) {
  return phone.length >= 10 ? `${phone.slice(0, 2)}XXXXXX${phone.slice(-2)}` : phone;
}

/** What the checkout page may see. The QR is shown only once the number is verified (if required). */
export async function sessionView(session: PaymentSession) {
  const open = session.status === "PENDING" || session.status === "VERIFYING";
  const otpRequired = await isOtpRequired();
  const phoneVerified = Boolean(session.phoneVerifiedAt);
  const canPay = open && (!otpRequired || phoneVerified);
  const upiUri = canPay ? upiUriFor(session) : null;

  return {
    sessionId: session.id,
    orderNumber: session.orderNumber,
    status: session.status,
    payAmount: (session.payPaise / 100).toFixed(2),
    orderTotal: session.orderPaise / 100,
    adjustmentPaise: session.orderPaise - session.payPaise,
    upiId: session.upiId,
    payeeName: session.payeeName,
    secondsLeft: open ? Math.max(0, Math.ceil((session.expiresAt.getTime() - Date.now()) / 1000)) : 0,
    otpRequired,
    phoneVerified,
    phoneMasked: maskPhone(session.customerPhone),
    upiUri,
    qrCodeDataUrl: upiUri ? await buildUpiQrDataUrl(upiUri) : null,
    deepLinks: upiUri ? buildUpiDeepLinks(upiUri) : null,
    utr: session.status === "PAID" ? session.utr : null,
  };
}

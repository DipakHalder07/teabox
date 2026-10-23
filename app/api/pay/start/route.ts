import { NextRequest, NextResponse, after } from "next/server";
import { isDatabaseConnected } from "@/lib/prisma";
import { paymentStartSchema, cleanIndianPhone } from "@/lib/validations/checkout";
import { startPayment } from "@/lib/gateway/payments";
import { errorResponse, publicBaseUrl, sessionView, verifiedPhoneFromCookie } from "@/lib/gateway/http";
import { alertNewCheckout } from "@/lib/gateway/alerts";
import { prisma } from "@/lib/prisma";

// Starts a UPI checkout with the shop's own gateway. Without a database the checkout falls
// back to manual UPI (customer types the UTR, admin confirms).
export async function POST(req: NextRequest) {
  try {
    if (!(await isDatabaseConnected())) {
      return NextResponse.json({ error: "UPI gateway needs the database", fallback: "manual" }, { status: 503 });
    }

    const raw = await req.json().catch(() => ({}));
    if (raw.customerPhone) raw.customerPhone = cleanIndianPhone(String(raw.customerPhone));
    const parsed = paymentStartSchema.safeParse(raw);
    if (!parsed.success || !/^[6-9]\d{9}$/.test(parsed.data.customerPhone)) {
      return NextResponse.json({ error: "Please check your delivery details." }, { status: 400 });
    }

    let session = await startPayment(parsed.data);

    // Same number verified on this browser recently: no new code needed.
    if (verifiedPhoneFromCookie(req) === session.customerPhone) {
      session = await prisma.paymentSession.update({
        where: { id: session.id },
        data: { phoneVerifiedAt: new Date() },
      });
    }

    const view = await sessionView(session);
    // The QR is on screen: tell the shop on WhatsApp (order details + confirm link).
    if (view.upiUri) after(() => alertNewCheckout(session.id, publicBaseUrl(req)).catch((e) => console.warn("[TeaPay] WhatsApp order alert failed:", e?.message || e)));
    return NextResponse.json(view);
  } catch (error) {
    return errorResponse(error, "Could not start the payment");
  }
}

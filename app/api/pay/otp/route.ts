import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/gateway/payments";
import { sendCode, verifyCode } from "@/lib/gateway/otp";
import { clientIp, errorResponse, publicBaseUrl, rememberVerifiedPhone, sessionView } from "@/lib/gateway/http";
import { alertNewCheckout } from "@/lib/gateway/alerts";

// WhatsApp verification of the checkout's phone number.
// action: "send" | "verify" (with code)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const session = await getSession(String(body.sessionId || ""));
    if (!session) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    if (session.phoneVerifiedAt) return NextResponse.json(await sessionView(session));

    if (body.action === "send") {
      const result = await sendCode(session.customerPhone, clientIp(req));
      return NextResponse.json({ sent: true, devCode: result.devCode });
    }

    if (body.action === "verify") {
      const code = String(body.code || "").trim();
      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json({ error: "Enter the 6-digit code from WhatsApp." }, { status: 400 });
      }
      await verifyCode(session.customerPhone, code);
      const updated = await prisma.paymentSession.update({
        where: { id: session.id },
        data: { phoneVerifiedAt: new Date() },
      });
      const view = await sessionView(updated);
      if (view.upiUri) after(() => alertNewCheckout(updated.id, publicBaseUrl(req)).catch((e) => console.warn("[TeaPay] WhatsApp order alert failed:", e?.message || e)));
      const res = NextResponse.json(view);
      rememberVerifiedPhone(res, session.customerPhone);
      return res;
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return errorResponse(error, "WhatsApp verification failed");
  }
}

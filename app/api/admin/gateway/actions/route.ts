import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPairingQr } from "@/lib/gateway/android";
import { assignCredit, cancelSession, GatewayError, markSessionPaid } from "@/lib/gateway/payments";
import { disconnectGmail, pollGmail } from "@/lib/gateway/gmail";
import {
  logoutWhatsApp,
  requestWhatsAppPairingCode,
  requestWhatsAppQr,
  sendWhatsAppCode,
} from "@/lib/gateway/whatsapp";
import { errorResponse, publicBaseUrl } from "@/lib/gateway/http";
import { isToggleKey, setToggle } from "@/lib/gateway/toggles";
import { saveAlertSettings } from "@/lib/gateway/alerts";
import { cleanIndianPhone } from "@/lib/validations/checkout";

// Admin controls for the shop's UPI gateway.
export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  try {
    switch (body.action) {
      case "toggle": {
        const key = String(body.key || "");
        if (!isToggleKey(key)) throw new GatewayError("Unknown switch");
        await setToggle(key, Boolean(body.enabled));
        return NextResponse.json({ success: true, key, enabled: Boolean(body.enabled) });
      }

      case "alerts": {
        const number = String(body.number || "").replace(/\D/g, "");
        if (number && !/^(91)?[6-9]\d{9}$/.test(number)) throw new GatewayError("Enter a valid 10-digit WhatsApp number");
        await saveAlertSettings(Boolean(body.enabled), number.slice(-10));
        return NextResponse.json({ success: true });
      }

      case "pairing-qr":
        return NextResponse.json(await createPairingQr(publicBaseUrl(req)));

      case "remove-device":
        await prisma.observerDevice.update({ where: { id: String(body.deviceId) }, data: { isActive: false } });
        return NextResponse.json({ success: true });

      case "assign-credit": {
        const order = await assignCredit(String(body.creditId), String(body.sessionId));
        return NextResponse.json({ success: true, orderNumber: order.orderNumber });
      }

      case "mark-paid": {
        const utr = String(body.utr || "").replace(/\D/g, "") || null;
        const order = await markSessionPaid(String(body.sessionId), {
          utr,
          via: "MANUAL",
          note: `Marked paid by ${admin.email}`,
        });
        if (!order) throw new GatewayError("This payment is already settled", 409);
        return NextResponse.json({ success: true, orderNumber: order.orderNumber });
      }

      case "cancel-session":
        await cancelSession(String(body.sessionId));
        return NextResponse.json({ success: true });

      case "gmail-check":
        return NextResponse.json(await pollGmail({ force: true }));

      case "gmail-disconnect":
        await disconnectGmail();
        return NextResponse.json({ success: true });

      case "whatsapp-test": {
        const phone = cleanIndianPhone(String(body.phone || ""));
        if (!/^[6-9]\d{9}$/.test(phone)) throw new GatewayError("Enter a valid 10-digit mobile number");
        const code = String(crypto.randomInt(100000, 1000000));
        const sent = await sendWhatsAppCode(phone, code);
        if (!sent.ok) throw new GatewayError(sent.error || "WhatsApp send failed", 502);
        return NextResponse.json({ success: true, code });
      }

      case "whatsapp-qr":
        return NextResponse.json(await requestWhatsAppQr());

      case "whatsapp-pairing-code": {
        const phone = cleanIndianPhone(String(body.phone || ""));
        if (!/^[6-9]\d{9}$/.test(phone)) throw new GatewayError("Enter the 10-digit number of the phone to link");
        return NextResponse.json(await requestWhatsAppPairingCode(phone));
      }

      case "whatsapp-logout":
        return NextResponse.json(await logoutWhatsApp());

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    if (String(body.action || "").startsWith("whatsapp-") && error instanceof Error && !(error instanceof GatewayError)) {
      return NextResponse.json({ error: `WhatsApp service: ${error.message}` }, { status: 502 });
    }
    return errorResponse(error, "Action failed");
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth";
import {
  describeError,
  reconnectWhatsApp,
  requestWhatsAppPairingCode,
  sendWhatsAppTestMessage,
} from "@/lib/youpiGateway";
import { cleanIndianPhone } from "@/lib/validations/checkout";

// Lets the shop admin log the OTP sender into WhatsApp (QR or pairing code) and send a test.
// action: "qr" (fresh login QR), "pairing-code" (phone), "test" (phone)
export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const phone = cleanIndianPhone(String(body.phone || ""));

  try {
    if (action === "qr") {
      const result = await reconnectWhatsApp();
      const qrCode = typeof result.qrCode === "string" && result.qrCode.startsWith("data:image/") ? result.qrCode : null;
      return NextResponse.json({ status: result.status, qrCode });
    }

    if (action === "pairing-code" || action === "test") {
      if (!/^[6-9]\d{9}$/.test(phone)) {
        return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
      }
    }

    if (action === "pairing-code") {
      const result = await requestWhatsAppPairingCode(`91${phone}`);
      return NextResponse.json({ pairingCode: result.pairingCode });
    }

    if (action === "test") {
      const result = await sendWhatsAppTestMessage(
        `91${phone}`,
        "Teabox: this is a test message. Customer OTPs will arrive from this number."
      );
      return NextResponse.json({ delivered: result.delivered !== false && result.success !== false });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const { status, message } = describeError(error, "WhatsApp request failed");
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { describeError, sendWhatsAppOtp } from "@/lib/youpiGateway";
import { cleanIndianPhone } from "@/lib/validations/checkout";

// Sends a WhatsApp OTP through the YouPI-PG gateway (YouPI also rate-limits per number).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = cleanIndianPhone(String(body.phone || ""));
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 400 });
    }

    const result = await sendWhatsAppOtp(phone, typeof body.name === "string" ? body.name.trim() : "");
    return NextResponse.json({
      success: true,
      phone,
      expiresInSeconds: result.expiresInSeconds || 300,
      delivered: result.dispatch?.delivered !== false,
      // YouPI only returns this when YOUPI_EXPOSE_DEV_OTP=true on a non-production gateway.
      devOtp: process.env.NODE_ENV !== "production" ? result.devOtp : undefined,
    });
  } catch (error) {
    const { status, message } = describeError(error, "Could not send OTP");
    return NextResponse.json({ error: message }, { status });
  }
}

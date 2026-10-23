import { NextRequest, NextResponse } from "next/server";
import { describeError, verifyWhatsAppOtp } from "@/lib/youpiGateway";
import { writeCustomerSession } from "@/lib/youpiCustomerSession";
import { cleanIndianPhone } from "@/lib/validations/checkout";

// Verifies the WhatsApp OTP with YouPI-PG and keeps the customer token in an httpOnly cookie.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = cleanIndianPhone(String(body.phone || ""));
    const otp = String(body.otp || "").trim();
    if (!/^[6-9]\d{9}$/.test(phone) || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "Enter the 6-digit code sent to your WhatsApp." }, { status: 400 });
    }

    const result = await verifyWhatsAppOtp(phone, otp);
    const res = NextResponse.json({ success: true, phone });
    writeCustomerSession(res, { token: result.token, phone });
    return res;
  } catch (error) {
    const { status, message } = describeError(error, "Verification failed");
    return NextResponse.json({ error: message }, { status });
  }
}

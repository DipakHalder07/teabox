import { NextRequest, NextResponse } from "next/server";
import { emailOtpSchema } from "@/lib/validations/account";
import { generateOtp } from "@/lib/store/otpStore";
import { sendOtpVerificationEmail } from "@/lib/email";
import { clientIp } from "@/lib/gateway/http";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = emailOtpSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    const { email } = parseResult.data;

    // Generate server-side OTP (enforces 30s cooldown and 10-minute expiry)
    const otpResult = await generateOtp(email, clientIp(req));
    if (!otpResult.success || !otpResult.code) {
      return NextResponse.json(
        {
          success: false,
          error: otpResult.error || "Please wait before requesting another code.",
          remainingCooldown: otpResult.remainingCooldown || 30,
        },
        { status: 429 }
      );
    }

    // Dispatch branded email via SMTP (Nodemailer) or Resend API (with dev console fallback)
    await sendOtpVerificationEmail(email, otpResult.code);

    // Secure server log (Never transmitted to client)
    console.log(`[Teabox Auth] OTP generated & dispatched for: ${email}`);

    // Return success without revealing the code to the client
    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${email}`,
      cooldownSeconds: 30,
    });
  } catch (err) {
    console.error("[Auth API] Error in send-otp:", err);
    return NextResponse.json(
      { success: false, error: "Failed to send verification code. Please try again." },
      { status: 500 }
    );
  }
}

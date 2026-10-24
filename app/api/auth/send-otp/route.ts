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

    // Dispatch branded email via Nodemailer (Gmail SMTP) or Resend API (with local dev fallback)
    const emailResult = await sendOtpVerificationEmail(email, otpResult.code);

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || "Failed to dispatch email. Please verify your Gmail configuration.",
        },
        { status: 502 }
      );
    }

    // Secure server log
    console.log(
      `[Teabox Auth] 6-digit OTP generated & dispatched for ${email} (mock: ${!!emailResult.isDevMock})`
    );

    // No email provider configured: show the code on screen in development only. In production
    // that would let anyone sign in as any email, so refuse instead.
    if (emailResult.isDevMock) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { success: false, error: "Email sign-in is not available right now. Please try again later." },
          { status: 503 }
        );
      }
      return NextResponse.json({
        success: true,
        message: `A 6-digit verification code was sent to ${email}`,
        cooldownSeconds: 30,
        devCode: otpResult.code,
        isDevMock: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code was sent to ${email}`,
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

import { NextRequest, NextResponse } from "next/server";
import { emailOtpVerifySchema } from "@/lib/validations/account";
import { verifyOtp } from "@/lib/store/otpStore";
import { prisma, isDatabaseConnected } from "@/lib/prisma";
import { SignJWT } from "jose";
import { getJwtSecret } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = emailOtpVerifySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || "Please enter a valid 4-digit code.",
        },
        { status: 400 }
      );
    }

    const { email, code } = parseResult.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Verify OTP against server store
    const verifyResult = await verifyOtp(normalizedEmail, code);
    if (!verifyResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: verifyResult.error || "Incorrect verification code.",
        },
        { status: 400 }
      );
    }

    const defaultName = normalizedEmail.split("@")[0] || "Customer";

    // Attempt to upsert user record in PostgreSQL if available
    try {
      const dbAlive = await isDatabaseConnected();
      if (dbAlive) {
        await prisma.user.upsert({
          where: { email: normalizedEmail },
          update: { updatedAt: new Date() },
          create: {
            email: normalizedEmail,
            name: defaultName,
            role: "CUSTOMER",
          },
        });
      }
    } catch (dbErr) {
      console.warn("[Auth API] DB upsert skipped:", dbErr);
    }

    // Generate Customer JWT session token (30 days validity)
    const token = await new SignJWT({
      email: normalizedEmail,
      name: defaultName,
      role: "CUSTOMER",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setAudience("teabox-customer")
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(getJwtSecret());

    const response = NextResponse.json({
      success: true,
      message: "Successfully verified and signed in.",
      user: {
        email: normalizedEmail,
        name: defaultName,
      },
    });

    // Set secure session cookie
    response.cookies.set("teabox_customer_session", token, {
      httpOnly: false, // Accessible to client for instant UI sync
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[Auth API] Error in verify-otp:", err);
    return NextResponse.json(
      { success: false, error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}

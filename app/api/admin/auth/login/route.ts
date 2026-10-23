import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_HOURS,
  adminCookieOptions,
  authenticateAdmin,
  isLoginLocked,
  recordLoginAttempt,
  signAdminToken,
} from "@/lib/auth";
import { clientIp } from "@/lib/gateway/http";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password || email.length > 254 || password.length > 200) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const ip = clientIp(req);
    const userAgent = req.headers.get("user-agent");

    // 1. Too many wrong passwords recently: refuse without checking the password
    if (await isLoginLocked(email, ip)) {
      return NextResponse.json(
        { error: "Too many wrong attempts. Please wait 15 minutes and try again." },
        { status: 429 }
      );
    }

    // 2. Check the password (database, or the environment password for the main admin)
    const admin = await authenticateAdmin(email, password);
    await recordLoginAttempt({ email, ip, userAgent, success: Boolean(admin) });

    if (!admin) {
      return NextResponse.json({ error: "Invalid admin email or password" }, { status: 401 });
    }

    // 3. Sign the session and set it as an HttpOnly cookie
    const token = await signAdminToken(admin);
    const response = NextResponse.json({
      status: "success",
      message: "Admin authentication successful",
      admin: {
        id: admin.adminId,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
    response.cookies.set({ ...adminCookieOptions(ADMIN_SESSION_HOURS * 60 * 60), value: token });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Sign-in failed. Please try again." }, { status: 500 });
  }
}

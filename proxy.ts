import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/adminToken";

// First line of defence for the admin area. Every /api/admin route also checks the session
// against the database itself; this only stops signed-out visitors and cross-site requests early.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/admin")) {
    if (req.method !== "GET" && req.method !== "HEAD" && !isSameOrigin(req)) {
      return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // Admin pages: the login page is open, everything else needs a valid session cookie.
  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !(await verifyAdminToken(token))) {
    const login = new URL("/admin/login", req.url);
    const response = NextResponse.redirect(login);
    if (token) response.cookies.delete(ADMIN_COOKIE_NAME);
    return response;
  }
  return NextResponse.next();
}

/** Browsers send Origin (or Sec-Fetch-Site) on POSTs; a request from another site is refused. */
function isSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      const host = new URL(origin).host;
      return host === req.headers.get("host") || host === req.headers.get("x-forwarded-host");
    } catch {
      return false;
    }
  }
  const site = req.headers.get("sec-fetch-site");
  return !site || site === "same-origin" || site === "none";
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

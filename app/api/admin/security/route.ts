import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConnected } from "@/lib/prisma";
import { adminCookieOptions, revokeAdminSessions, verifyAdminRequest } from "@/lib/auth";

// Admin → Security: recent sign-in attempts, and "Sign out all devices".
export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await isDatabaseConnected())) {
    return NextResponse.json({ databaseConnected: false, admin, lastLoginAt: null, attempts: [], failedLast24h: 0 });
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [row, attempts, failedLast24h] = await Promise.all([
    prisma.admin.findUnique({ where: { id: admin.adminId }, select: { lastLoginAt: true } }),
    prisma.adminLoginAttempt.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, email: true, ip: true, userAgent: true, success: true, createdAt: true },
    }),
    prisma.adminLoginAttempt.count({ where: { success: false, createdAt: { gte: dayAgo } } }),
  ]);

  return NextResponse.json({
    databaseConnected: true,
    admin,
    lastLoginAt: row?.lastLoginAt ?? null,
    attempts,
    failedLast24h,
  });
}

// { action: "logout-all" } signs this admin out everywhere, including this browser.
export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body.action !== "logout-all") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  if (!(await isDatabaseConnected())) {
    return NextResponse.json({ error: "The database is offline. Try again later." }, { status: 503 });
  }

  await revokeAdminSessions(admin.adminId);
  const response = NextResponse.json({ status: "success" });
  response.cookies.set({ ...adminCookieOptions(0), value: "" });
  return response;
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pollGmail } from "@/lib/gateway/gmail";

// Vercel Cron (see vercel.json). Vercel sends "Authorization: Bearer $CRON_SECRET".
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const expired = await prisma.paymentSession.updateMany({
    where: { status: { in: ["PENDING", "VERIFYING"] }, expiresAt: { lt: now } },
    data: { status: "EXPIRED" },
  });
  const released = await prisma.paymentSession.updateMany({
    where: { activeKey: { not: null }, matchUntil: { lt: now } },
    data: { activeKey: null },
  });
  // Housekeeping: old one-time codes and sign-in history.
  const day = 24 * 60 * 60 * 1000;
  const otps = await prisma.otpChallenge.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 2 * day) } } });
  const logins = await prisma.adminLoginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(now.getTime() - 90 * day) } },
  });
  const gmail = await pollGmail({ force: true });

  return NextResponse.json({
    expired: expired.count,
    released: released.count,
    removedCodes: otps.count,
    removedLoginRecords: logins.count,
    gmail,
  });
}

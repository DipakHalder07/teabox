import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth";
import { prisma, isDatabaseConnected } from "@/lib/prisma";
import { checkoutStage } from "@/lib/gateway/http";
import { isOtpRequired } from "@/lib/gateway/whatsapp";

// Polled every few seconds by every admin page: payments in progress (with their timers)
// and payments that just came in, so the admin gets notified wherever they are.
export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serverNow = new Date();
  if (!(await isDatabaseConnected())) {
    return NextResponse.json({ serverNow, live: [], recentPaid: [] });
  }

  const [open, paid, otpRequired] = await Promise.all([
    prisma.paymentSession.findMany({
      where: { status: { in: ["PENDING", "VERIFYING"] }, expiresAt: { gt: serverNow } },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
    prisma.paymentSession.findMany({
      where: { status: "PAID", paidAt: { gte: new Date(serverNow.getTime() - 10 * 60 * 1000) } },
      orderBy: { paidAt: "desc" },
      take: 10,
    }),
    isOtpRequired(),
  ]);

  const name = (draft: unknown) => (draft as { customerName?: string })?.customerName || "Customer";
  return NextResponse.json({
    serverNow,
    live: open.map((s) => ({
      id: s.id,
      orderNumber: s.orderNumber,
      customerName: name(s.orderDraft),
      payAmount: (s.payPaise / 100).toFixed(2),
      status: s.status,
      stage: checkoutStage(s, otpRequired),
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    })),
    recentPaid: paid.map((s) => ({
      id: s.id,
      orderNumber: s.orderNumber,
      customerName: name(s.orderDraft),
      payAmount: (s.payPaise / 100).toFixed(2),
      paidAt: s.paidAt,
      paidVia: s.paidVia,
    })),
  });
}

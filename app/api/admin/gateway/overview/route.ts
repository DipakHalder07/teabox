import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth";
import { prisma, isDatabaseConnected } from "@/lib/prisma";
import { getUpiConfig, whatsAppProvider } from "@/lib/gateway/config";
import { getWhatsAppServiceStatus, isOtpRequired } from "@/lib/gateway/whatsapp";
import { getGmailStatus } from "@/lib/gateway/gmail";
import { getGmailSenderStatus } from "@/lib/gateway/gmailSender";
import { checkoutStage, publicBaseUrl } from "@/lib/gateway/http";
import { getToggles } from "@/lib/gateway/toggles";
import { ADMIN_NOTIFICATION_EMAIL } from "@/lib/email";
import { getAlertSettings } from "@/lib/gateway/alerts";
import { isLocalUrlOnServer } from "@/lib/dbStatus";

const DEVICE_ONLINE_MS = 3 * 60 * 1000;

let overviewCache: { at: number; data: any } | null = null;
const CACHE_TTL_MS = 3500; // 3.5-second cache to prevent stampedes from rapid polling

// Everything the admin Payment Gateway page shows.
export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fresh = req.nextUrl.searchParams.get("fresh") === "true";
  if (!fresh && overviewCache && Date.now() - overviewCache.at < CACHE_TTL_MS) {
    return NextResponse.json(overviewCache.data);
  }

  const upi = getUpiConfig();
  const provider = whatsAppProvider();
  const toggles = await getToggles({ fresh: false });
  const base = {
    toggles,
    upi: { upiId: upi.upiId || null, payeeName: upi.payeeName },
    // WhatsApp works without the database, so the admin can log it in any time.
    whatsapp: {
      provider,
      configured: provider !== null,
      otpRequired: await isOtpRequired(),
      service: provider === "qr" ? await getWhatsAppServiceStatus({ fresh: false }) : null,
      alerts: await getAlertSettings().catch(() => ({ enabled: true, number: "" })),
    },
    cronConfigured: Boolean(process.env.CRON_SECRET),
    adminNotificationEmail: ADMIN_NOTIFICATION_EMAIL,
    publicBaseUrl: publicBaseUrl(req),
    apkUrl: "/downloads/teapay-observer.apk",
  };

  if (!(await isDatabaseConnected())) {
    // Only the host is reported (never credentials), so the page can say what to fix.
    let databaseHost: string | null = null;
    try {
      databaseHost = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).host : null;
    } catch {}
    return NextResponse.json({
      ...base,
      database: false,
      databaseHost,
      databaseLocal:
        !isLocalUrlOnServer() && Boolean(databaseHost && /^(127\.0\.0\.1|localhost):(5433|5435)$/.test(databaseHost)),
      databaseLocalOnServer: isLocalUrlOnServer(),
    });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  try {
    const [gmail, gmailSender, devices, sessions, unmatched, paidToday, waiting, phoneFeed] = await Promise.all([
      getGmailStatus(),
      getGmailSenderStatus(),
      prisma.observerDevice.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } }),
      prisma.paymentSession.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
      prisma.creditEvent.findMany({ where: { sessionId: null }, orderBy: { observedAt: "desc" }, take: 30 }),
      prisma.paymentSession.count({ where: { status: "PAID", paidAt: { gte: startOfDay } } }),
      prisma.paymentSession.count({ where: { status: { in: ["PENDING", "VERIFYING"] } } }),
      // What the paired phone reported recently, and which order it paid.
      prisma.creditEvent.findMany({
        where: { deviceId: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { session: { select: { orderNumber: true, status: true } } },
      }),
    ]);

    const result = {
      ...base,
      database: true,
      gmail,
      gmailSender,
      devices: devices.map((d) => ({
        id: d.id,
        name: d.name,
        model: d.model,
        batteryPercent: d.batteryPercent,
        lastHeartbeatAt: d.lastHeartbeatAt,
        lastEventAt: d.lastEventAt,
        lastTestAt: d.lastTestAt,
        online: Boolean(d.lastHeartbeatAt && Date.now() - d.lastHeartbeatAt.getTime() < DEVICE_ONLINE_MS),
      })),
      sessions: sessions.map((s) => {
        const draft = s.orderDraft as { customerName?: string };
        return {
          stage: checkoutStage(s, base.whatsapp.otpRequired),
          expiresAt: s.expiresAt,
          id: s.id,
          orderNumber: s.orderNumber,
          status: s.status,
          customerName: draft?.customerName || "",
          customerPhone: s.customerPhone,
          payAmount: (s.payPaise / 100).toFixed(2),
          orderTotal: s.orderPaise / 100,
          customerUtr: s.customerUtr,
          utr: s.utr,
          paidVia: s.paidVia,
          phoneVerified: Boolean(s.phoneVerifiedAt),
          createdAt: s.createdAt,
          paidAt: s.paidAt,
        };
      }),
      unmatchedCredits: unmatched.map((c) => ({
        id: c.id,
        source: c.source,
        amount: (c.amountPaise / 100).toFixed(2),
        utr: c.utr,
        payerVpa: c.payerVpa,
        sender: c.sender,
        text: c.rawText.slice(0, 200),
        observedAt: c.observedAt,
      })),
      stats: { paidToday, waiting },
      serverNow: new Date().toISOString(),
      phoneFeed: phoneFeed.map((c) => ({
        id: c.id,
        source: c.source,
        amount: (c.amountPaise / 100).toFixed(2),
        utr: c.utr,
        receivedAt: c.createdAt,
        orderNumber: c.session?.orderNumber || null,
      })),
    };

    overviewCache = { at: Date.now(), data: result };
    return NextResponse.json(result);
  } catch (err: any) {
    console.warn("[gateway/overview] Database connection busy or waking up:", err?.message || err);
    if (overviewCache) {
      return NextResponse.json(overviewCache.data);
    }
    return NextResponse.json({
      ...base,
      database: true,
      gmail: { configured: false, connected: false, email: null, lastPollAt: null, lastError: null },
      gmailSender: { configured: false, connected: false, email: null, lastError: null },
      devices: [],
      sessions: [],
      unmatchedCredits: [],
      stats: { paidToday: 0, waiting: 0 },
      serverNow: new Date().toISOString(),
      phoneFeed: [],
    });
  }
}

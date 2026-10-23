import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyAdminRequest } from "@/lib/auth";
import { getYouPiConfig } from "@/lib/youpiConfig";
import {
  describeError,
  fetchObserverApk,
  getGatewayAdminOverview,
  getGatewayHealth,
  getWhatsAppStatus,
} from "@/lib/youpiGateway";

// The APK rarely changes; hash it at most every 10 minutes.
let apkCache: { at: number; sizeBytes: number; sha256: string } | null = null;

async function getApkInfo() {
  if (apkCache && Date.now() - apkCache.at < 10 * 60 * 1000) return apkCache;
  const res = await fetchObserverApk();
  const bytes = Buffer.from(await res.arrayBuffer());
  apkCache = {
    at: Date.now(),
    sizeBytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  };
  return apkCache;
}

// Live view of the YouPI-PG gateway for the shop admin's Payment Gateway page.
export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getYouPiConfig();
  const started = Date.now();

  const [health, whatsapp, apk, overview] = await Promise.all([
    config.baseUrl
      ? getGatewayHealth()
          .then((data) => ({ reachable: true, latencyMs: Date.now() - started, data, error: null }))
          .catch((err) => ({ reachable: false, latencyMs: null, data: null, error: describeError(err, "Unreachable").message }))
      : null,
    config.baseUrl && config.adminToken
      ? getWhatsAppStatus().catch((err) => ({ error: describeError(err, "Unavailable").message }))
      : null,
    config.baseUrl || config.adminUrl
      ? getApkInfo().catch(() => null)
      : null,
    config.baseUrl && config.adminToken ? getGatewayAdminOverview().catch(() => null) : null,
  ]);

  return NextResponse.json({
    configured: {
      gateway: Boolean(config.baseUrl),
      hub: Boolean(config.adminUrl),
      adminToken: Boolean(config.adminToken),
      webhookSecret: Boolean(config.webhookSecret),
      merchantVpa: Boolean(process.env.YOUPI_MERCHANT_VPA),
    },
    gateway: health
      ? { url: config.baseUrl, reachable: health.reachable, latencyMs: health.latencyMs, error: health.error }
      : null,
    observers: health?.data
      ? {
          tier: health.data.tier,
          label: health.data.label,
          isWorking: health.data.isWorking,
          reason: health.data.reason || null,
          sms: Boolean(health.data.smsHealthy),
          gmail: Boolean(health.data.gmailHealthy),
        }
      : null,
    whatsapp,
    receivingUpi: overview?.receivingUpi ?? null,
    shopUpi: process.env.YOUPI_MERCHANT_VPA || null,
    youpiWebhookUrl: overview?.webhookUrl ?? null,
    androidPairing: overview?.androidPairing ?? null,
    apk: apk ? { available: true, sizeBytes: apk.sizeBytes, sha256: apk.sha256 } : { available: false },
    hubUrl: config.adminUrl || null,
    webhookUrl: `${req.nextUrl.origin}/api/webhooks/youpi`,
    checkedAt: new Date().toISOString(),
  });
}

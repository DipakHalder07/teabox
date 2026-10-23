import { NextRequest, NextResponse } from "next/server";
import { recordHeartbeat } from "@/lib/gateway/android";

// Android observer app: "I'm alive" every minute (shown as online/offline in the admin).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const deviceId = req.headers.get("x-device-id") || String(body.deviceId || "");
  const ok = deviceId ? await recordHeartbeat(deviceId, body.batteryPercent) : false;
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Unknown or removed device. Pair the app again." }, { status: 401 });
}

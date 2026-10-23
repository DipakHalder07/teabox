import { NextResponse } from "next/server";
import { isDatabaseConnected } from "@/lib/prisma";

// Public uptime check: says whether the shop and its database are up, nothing more.
export async function GET() {
  const connected = await isDatabaseConnected();
  return NextResponse.json(
    {
      status: connected ? "ok" : "degraded",
      database: connected ? "connected" : "offline",
      timestamp: new Date().toISOString(),
    },
    { status: connected ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}

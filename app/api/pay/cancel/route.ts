import { NextRequest, NextResponse } from "next/server";
import { cancelSession } from "@/lib/gateway/payments";
import { errorResponse } from "@/lib/gateway/http";

// Customer switched to Cash on Delivery or restarted checkout.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    await cancelSession(String(body.sessionId || ""));
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

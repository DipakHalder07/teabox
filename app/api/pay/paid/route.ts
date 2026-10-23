import { NextRequest, NextResponse } from "next/server";
import { markVerifying } from "@/lib/gateway/payments";
import { errorResponse, sessionView } from "@/lib/gateway/http";

// Customer pressed "I've paid", optionally with the 12-digit UPI reference from their app.
// This never marks the order paid by itself: only a bank credit (or the admin) can.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const utr = String(body.utr || "").replace(/\D/g, "");
    if (utr && utr.length !== 12) {
      return NextResponse.json({ error: "The UPI reference has 12 digits." }, { status: 400 });
    }
    const session = await markVerifying(String(body.sessionId || ""), utr || null);
    return NextResponse.json(await sessionView(session));
  } catch (error) {
    return errorResponse(error);
  }
}

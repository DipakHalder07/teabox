import { NextRequest, NextResponse, after } from "next/server";
import { getSession } from "@/lib/gateway/payments";
import { pollGmail } from "@/lib/gateway/gmail";
import { errorResponse, sessionView } from "@/lib/gateway/http";

const SESSION_ID = /^[a-z0-9]{20,40}$/;

// Polled by the checkout every few seconds. While a customer is waiting it also lets the
// server look for the bank's email (throttled to one check per 15 s for the whole shop).
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId") || "";
  if (!SESSION_ID.test(sessionId)) {
    return NextResponse.json({ error: "Invalid payment id" }, { status: 400 });
  }

  try {
    const session = await getSession(sessionId);
    if (!session) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    if (session.status === "PENDING" || session.status === "VERIFYING") {
      after(() => pollGmail().catch((e) => console.warn("[TeaPay] Gmail check failed:", e)));
    }
    return NextResponse.json(await sessionView(session));
  } catch (error) {
    return errorResponse(error);
  }
}

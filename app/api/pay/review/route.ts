import { NextRequest, NextResponse } from "next/server";
import { readSignedValue } from "@/lib/gateway/crypto";
import { cancelSession, getSession, GatewayError, markSessionPaid } from "@/lib/gateway/payments";
import { errorResponse } from "@/lib/gateway/http";

// The signed link the shop owner gets on WhatsApp: view one payment and confirm it,
// without logging in. Anyone without the link (or after 24 h) gets nothing.

interface Draft {
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string | null;
  priced: { items: Array<{ title: string; weight?: string | null; quantity: number; price: number }>; totalAmount: number };
}

function sessionIdFrom(token: string | null) {
  return readSignedValue("payment-review", token || "");
}

export async function GET(req: NextRequest) {
  const sessionId = sessionIdFrom(req.nextUrl.searchParams.get("token"));
  if (!sessionId) return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 401 });

  const session = await getSession(sessionId);
  if (!session) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  const draft = session.orderDraft as unknown as Draft;
  const open = session.status === "PENDING" || session.status === "VERIFYING";

  return NextResponse.json({
    orderNumber: session.orderNumber,
    status: session.status,
    customerName: draft.customerName,
    customerPhone: draft.customerPhone,
    address: [draft.address, draft.landmark, `${draft.city}, ${draft.state} ${draft.pincode}`].filter(Boolean).join(", "),
    items: draft.priced.items.map((i) => ({ title: i.title, weight: i.weight || null, quantity: i.quantity, price: i.price })),
    payAmount: (session.payPaise / 100).toFixed(2),
    orderTotal: session.orderPaise / 100,
    upiId: session.upiId,
    secondsLeft: open ? Math.max(0, Math.ceil((session.expiresAt.getTime() - Date.now()) / 1000)) : 0,
    customerUtr: session.customerUtr,
    utr: session.utr,
    paidVia: session.paidVia,
    paidAt: session.paidAt,
  });
}

// action: "paid" (optional utr) | "cancel"
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = sessionIdFrom(String(body.token || ""));
    if (!sessionId) return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 401 });

    if (body.action === "paid") {
      const utr = String(body.utr || "").replace(/\D/g, "") || null;
      const order = await markSessionPaid(sessionId, { utr, via: "MANUAL", note: "Confirmed from the WhatsApp link" });
      if (!order) throw new GatewayError("This payment is already confirmed", 409);
      return NextResponse.json({ success: true, orderNumber: order.orderNumber });
    }
    if (body.action === "cancel") {
      await cancelSession(sessionId);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return errorResponse(error, "Could not update the payment");
  }
}

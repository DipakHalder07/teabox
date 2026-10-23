import { NextRequest, NextResponse } from "next/server";
import { getYouPiConfig, verifyYouPiSignature, markPaymentCompleted } from "@/lib/youpi";
import { getOrderById, updateOrderStatus } from "@/lib/ordersDb";

// "SUCCESS" is the event name YouPI-PG actually sends; the others are kept for older setups.
const SUCCESS_EVENTS = new Set(["SUCCESS", "payment.success", "observer.credit_matched"]);

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const { webhookSecret } = getYouPiConfig();

    // Fail closed: without a configured secret nobody can prove a webhook is genuine.
    if (!webhookSecret) {
      console.error("[YouPI-PG Webhook] YOUPI_WEBHOOK_SECRET is not set; rejecting webhook");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }

    const signature =
      req.headers.get("x-gateway-signature") || req.headers.get("x-youpi-signature") || "";
    if (!verifyYouPiSignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { event } = payload;
    const data = payload.data || payload;

    if (SUCCESS_EVENTS.has(event)) {
      const orderId: string | undefined = data.orderId || data.order_id;
      const utr: string | undefined = data.utr || data.rrn;
      const paidAmount =
        typeof data.amountPaise === "number" ? data.amountPaise / 100 : parseFloat(data.amount);

      if (!orderId || !Number.isFinite(paidAmount)) {
        console.warn("[YouPI-PG Webhook] SUCCESS event missing orderId or amount; ignored");
        return NextResponse.json({ received: true });
      }

      // If the shop order already exists, the money received must match its total.
      const order = await getOrderById(orderId);
      if (order && Math.abs(order.totalAmount - paidAmount) >= 1) {
        console.warn(
          `[YouPI-PG Webhook] Amount mismatch for ${orderId}: paid ₹${paidAmount}, order ₹${order.totalAmount}`
        );
        return NextResponse.json({ received: true });
      }

      const result = markPaymentCompleted(orderId, utr, paidAmount);
      if (!result.ok) {
        console.warn(`[YouPI-PG Webhook] Payment not confirmed for ${orderId}: ${result.reason}`);
        return NextResponse.json({ received: true });
      }

      if (order) {
        await updateOrderStatus(order.id, { paymentStatus: "PAID", utrNumber: utr });
      }
      console.log(`[YouPI-PG Webhook] Payment confirmed for Order ${orderId}, UTR: ${utr}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[YouPI-PG Webhook Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Webhook handling failed" },
      { status: 500 }
    );
  }
}

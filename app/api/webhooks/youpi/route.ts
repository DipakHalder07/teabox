import { NextRequest, NextResponse } from "next/server";
import { getYouPiConfig, verifyYouPiSignature, verifyPaymentStatus } from "@/lib/youpi";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-youpi-signature") || "";
    const config = getYouPiConfig();

    // Verify cryptographic signature if secret is configured
    if (config.webhookSecret && signature) {
      const isValid = verifyYouPiSignature(rawBody, signature, config.webhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const { event, data } = payload;

    // Handle payment success from YouPI-PG observer
    if (event === "payment.success" || event === "observer.credit_matched") {
      const orderId = data.orderId || data.order_id;
      const utr = data.utr || data.rrn;

      if (orderId) {
        verifyPaymentStatus(orderId, utr);
        console.log(`[YouPI-PG Webhook] Payment confirmed for Order ${orderId}, UTR: ${utr}`);
      }
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

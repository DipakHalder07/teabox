import { NextRequest, NextResponse } from "next/server";
import { getPaymentStatus, submitCustomerUtr } from "@/lib/youpi";
import { utrVerificationSchema } from "@/lib/validations/checkout";

// Polled by the checkout page. Read-only: only the signed gateway webhook can make a payment COMPLETED.
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const result = getPaymentStatus(orderId);
  return NextResponse.json({
    success: result.status === "COMPLETED",
    status: result.status,
    utr: result.status === "COMPLETED" ? result.utr : undefined,
  });
}

// The customer's typed UTR is recorded for the admin to reconcile. It is never treated as proof of payment.
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    const parsed = utrVerificationSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid UTR format. Please enter a 12-digit numeric UPI reference number.",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { orderId, utr } = parsed.data;
    const cleanUtr = utr.trim().replace(/\D/g, "");

    const outcome = submitCustomerUtr(orderId, cleanUtr);
    if (outcome === "NOT_FOUND") {
      return NextResponse.json(
        { error: "Payment session not found or expired. Please reopen the payment step." },
        { status: 404 }
      );
    }
    if (outcome === "DUPLICATE") {
      return NextResponse.json(
        { error: "This UTR has already been used for another order." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      status: "UNDER_REVIEW",
      orderId,
      utr: cleanUtr,
      message: "UTR received. Your order is confirmed once the payment is matched with our bank record.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Verification failed" },
      { status: 500 }
    );
  }
}

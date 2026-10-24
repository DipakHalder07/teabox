import { NextRequest, NextResponse } from "next/server";
import { isKnownManualPayment, submitCustomerUtr } from "@/lib/manualUpi";
import { utrVerificationSchema } from "@/lib/validations/checkout";

// Checks payment status across local gateway records
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  return NextResponse.json({
    success: false,
    status: isKnownManualPayment(orderId) ? "PENDING" : "NOT_FOUND",
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

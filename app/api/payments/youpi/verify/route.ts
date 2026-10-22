import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentStatus } from "@/lib/youpi";
import { utrVerificationSchema } from "@/lib/validations/checkout";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const result = verifyPaymentStatus(orderId);
  return NextResponse.json(result);
}

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

    const result = verifyPaymentStatus(orderId, cleanUtr);
    return NextResponse.json({
      success: true,
      status: "COMPLETED",
      orderId,
      utr: cleanUtr,
      message: "Payment successfully verified via YouPI-PG",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Verification failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentStatus } from "@/lib/youpi";

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
    const body = await req.json();
    const { orderId, utr } = body;

    if (!orderId || !utr) {
      return NextResponse.json(
        { error: "orderId and utr are required" },
        { status: 400 }
      );
    }

    const cleanUtr = utr.trim().replace(/\D/g, "");
    if (cleanUtr.length < 12) {
      return NextResponse.json(
        { error: "Invalid UPI Ref/UTR number. UTR must be 12 digits." },
        { status: 400 }
      );
    }

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

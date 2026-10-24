import { NextRequest, NextResponse } from "next/server";
import { createManualUpiPayment } from "@/lib/manualUpi";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, customer, note } = body;

    if (!orderId || !amount || !customer?.phone) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, amount, customer.phone" },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Native UPI payment session for Teabox
    const session = await createManualUpiPayment({ orderId, amount: numericAmount, note });

    return NextResponse.json({
      status: "success",
      gateway: "UPI",
      data: session,
    });
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create payment session" },
      { status: 500 }
    );
  }
}

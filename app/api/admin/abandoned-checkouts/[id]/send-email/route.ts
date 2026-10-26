import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth";
import {
  getAbandonedCheckoutById,
  updateAbandonedCheckoutFollowUp,
} from "@/lib/abandonedCheckoutsDb";
import { sendAbandonedCheckoutRecoveryEmail } from "@/lib/email";
import { publicBaseUrl } from "@/lib/gateway/http";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const checkout = await getAbandonedCheckoutById(id);

    if (!checkout) {
      return NextResponse.json({ error: "Abandoned checkout not found" }, { status: 404 });
    }

    if (!checkout.customerEmail) {
      return NextResponse.json(
        { error: "This checkout does not have an email address associated with it" },
        { status: 400 }
      );
    }

    const baseUrl = publicBaseUrl(req);
    const recoveryUrl = `${baseUrl}/checkout?recover=${checkout.recoveryToken}`;

    const emailResult = await sendAbandonedCheckoutRecoveryEmail({
      checkoutNumber: checkout.checkoutNumber,
      customerName: checkout.customerName,
      customerEmail: checkout.customerEmail,
      items: checkout.items,
      subtotal: checkout.subtotal,
      discountAmount: checkout.discountAmount,
      shippingFee: checkout.shippingFee,
      totalAmount: checkout.totalAmount,
      recoveryUrl,
      couponCode: checkout.couponCode,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Failed to deliver email" },
        { status: 500 }
      );
    }

    // Update follow-up status
    const updated = await updateAbandonedCheckoutFollowUp(checkout.id, "EMAIL_SENT");

    return NextResponse.json({
      status: "success",
      message: `Recovery email sent to ${checkout.customerEmail}`,
      isDevMock: emailResult.isDevMock,
      checkout: updated,
    });
  } catch (error: any) {
    console.error("Error dispatching recovery email:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send recovery email" },
      { status: 500 }
    );
  }
}

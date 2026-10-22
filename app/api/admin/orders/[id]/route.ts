import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/ordersDb";
import { verifyAdminRequest } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await updateOrderStatus(id, {
      orderStatus: body.orderStatus,
      paymentStatus: body.paymentStatus,
      trackingNumber: body.trackingNumber,
      trackingUrl: body.trackingUrl,
      utrNumber: body.utrNumber,
    });

    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: "success",
      order: updated,
    });
  } catch (error: any) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update order" },
      { status: 500 }
    );
  }
}

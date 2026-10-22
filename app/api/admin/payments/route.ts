import { NextRequest, NextResponse } from "next/server";
import { getAllOrders } from "@/lib/ordersDb";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await getAllOrders();
    const payments = orders.map((o) => ({
      id: `TXN-${o.orderNumber.replace("TBX-", "")}`,
      orderId: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      amount: o.totalAmount,
      gateway: o.paymentMethod === "upi" ? "YouPI-PG (Direct UPI)" : "Cash on Delivery",
      method: o.paymentMethod,
      vpa: o.paymentMethod === "upi" ? "8617513004@ptaxis" : null,
      utr: o.utrNumber || null,
      status: o.paymentStatus,
      createdAt: o.createdAt,
    }));

    return NextResponse.json({
      status: "success",
      count: payments.length,
      payments,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

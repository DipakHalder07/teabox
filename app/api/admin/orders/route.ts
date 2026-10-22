import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, saveOrder, StoredOrderData } from "@/lib/ordersDb";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Authenticate admin
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();
    const status = searchParams.get("status");

    let orders = await getAllOrders();

    // Filters
    if (status && status !== "ALL") {
      orders = orders.filter((o) => o.orderStatus === status || o.paymentStatus === status);
    }

    if (search) {
      orders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(search) ||
          o.customerName.toLowerCase().includes(search) ||
          o.customerPhone.includes(search) ||
          (o.utrNumber && o.utrNumber.toLowerCase().includes(search)) ||
          o.city.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      status: "success",
      count: orders.length,
      orders,
    });
  } catch (error: any) {
    console.error("Error fetching admin orders:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// Storefront Checkout calls this to persist real orders into PostgreSQL
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.orderNumber || !body.customerName || !body.customerPhone || !body.totalAmount) {
      return NextResponse.json(
        { error: "Missing required order fields" },
        { status: 400 }
      );
    }

    const saved = await saveOrder({
      id: body.id || body.orderNumber,
      orderNumber: body.orderNumber,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail || null,
      address: body.address,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      landmark: body.landmark || null,
      subtotal: Number(body.subtotal) || Number(body.totalAmount),
      discountAmount: Number(body.discountAmount) || 0,
      couponCode: body.couponCode || null,
      shippingFee: Number(body.shippingFee) || 0,
      codFee: Number(body.codFee) || 0,
      totalAmount: Number(body.totalAmount),
      paymentMethod: body.paymentMethod || "upi",
      paymentStatus: body.paymentStatus || (body.paymentMethod === "cod" ? "PENDING" : "PAID"),
      orderStatus: body.orderStatus || "PROCESSING",
      utrNumber: body.utrNumber || null,
      notes: body.notes || null,
      items: Array.isArray(body.items) ? body.items : [],
    });

    return NextResponse.json({
      status: "success",
      order: saved,
    });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create order" },
      { status: 500 }
    );
  }
}

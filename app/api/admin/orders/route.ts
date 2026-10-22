import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, saveOrder, StoredOrderData } from "@/lib/ordersDb";
import { verifyAdminRequest } from "@/lib/auth";
import { orderCreationSchema, cleanIndianPhone } from "@/lib/validations/checkout";
import { sendOrderConfirmationEmail } from "@/lib/email";

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
    const rawBody = await req.json();

    // Sanitize phone from autofill (+91 or leading 0s)
    if (rawBody.customerPhone) {
      rawBody.customerPhone = cleanIndianPhone(String(rawBody.customerPhone));
    }

    // Validate incoming payload with Zod
    const validationResult = orderCreationSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid order data format",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const body = validationResult.data;

    const saved = await saveOrder({
      id: rawBody.id || body.orderNumber,
      orderNumber: body.orderNumber,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail || null,
      address: body.address,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      landmark: body.landmark || null,
      subtotal: body.subtotal,
      discountAmount: body.discountAmount,
      couponCode: body.couponCode || null,
      shippingFee: body.shippingFee,
      codFee: body.codFee,
      totalAmount: body.totalAmount,
      paymentMethod: body.paymentMethod,
      paymentStatus: body.paymentStatus,
      orderStatus: body.orderStatus,
      utrNumber: body.utrNumber || null,
      notes: body.notes || null,
      items: body.items,
    });

    // Send order confirmation email asynchronously
    if (body.customerEmail) {
      sendOrderConfirmationEmail({
        orderNumber: body.orderNumber,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        items: body.items,
        totalAmount: body.totalAmount,
        paymentMethod: body.paymentMethod,
        paymentStatus: body.paymentStatus,
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
      }).catch((e) => console.warn("Email dispatch error:", e));
    }

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

import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, saveOrder, getOrderById, StoredOrderData } from "@/lib/ordersDb";
import { priceOrder } from "@/lib/orderPricing";
import { verifyAdminRequest } from "@/lib/auth";
import { orderCreationSchema, cleanIndianPhone } from "@/lib/validations/checkout";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { getSubmittedUtr } from "@/lib/manualUpi";
import { alertCodOrder } from "@/lib/gateway/alerts";
import { publicBaseUrl } from "@/lib/gateway/http";
import { toPublicOrder } from "@/lib/publicOrder";
import { getToggles } from "@/lib/gateway/toggles";

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

    // 1. Prevent duplicate order creation
    const existingOrder = await getOrderById(body.orderNumber);
    if (existingOrder) {
      return NextResponse.json({
        status: "success",
        order: toPublicOrder(existingOrder),
        duplicatePrevented: true,
      });
    }

    // 2. Cash on Delivery can be switched off in Admin → Payment Gateway
    if (body.paymentMethod === "cod" && !(await getToggles()).cod) {
      return NextResponse.json(
        { error: "Cash on Delivery is not available right now. Please pay by UPI." },
        { status: 400 }
      );
    }

    // 3. Authoritative prices, coupon, shipping and COD fee (lib/orderPricing)
    const priced = priceOrder(body);
    const validatedItems = priced.items;
    const authoritativeSubtotal = priced.subtotal;
    const authoritativeDiscount = priced.discountAmount;
    const authoritativeShipping = priced.shippingFee;
    const authoritativeCod = priced.codFee;
    const authoritativeTotal = priced.totalAmount;

    // 4. Payment status is decided here, never by the browser. This route takes COD orders and
    // the manual-UPI fallback; a customer-typed UTR stays PENDING until the admin reconciles it.
    // (Gateway UPI orders are created by lib/gateway when the money arrives.)
    const paymentStatus = "PENDING" as const;
    const notes = body.notes || null;
    const utrNumber =
      body.paymentMethod === "upi" ? getSubmittedUtr(body.orderNumber) || body.utrNumber || null : null;

    const saved = await saveOrder({
      id: body.orderNumber,
      orderNumber: body.orderNumber,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail || null,
      address: body.address,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      landmark: body.landmark || null,
      subtotal: authoritativeSubtotal,
      discountAmount: authoritativeDiscount,
      couponCode: body.couponCode || null,
      shippingFee: authoritativeShipping,
      codFee: authoritativeCod,
      totalAmount: authoritativeTotal,
      paymentMethod: body.paymentMethod,
      paymentStatus,
      orderStatus: "PROCESSING",
      utrNumber,
      notes,
      items: validatedItems,
    });

    // Send order notification email to admin dipakh810@gmail.com (& customer if email provided)
    sendOrderConfirmationEmail({
      orderNumber: body.orderNumber,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail || null,
      items: validatedItems,
      subtotal: authoritativeSubtotal,
      discountAmount: authoritativeDiscount,
      shippingFee: authoritativeShipping,
      codFee: authoritativeCod,
      totalAmount: authoritativeTotal,
      paymentMethod: body.paymentMethod,
      paymentStatus,
      utrNumber,
      address: body.address,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      landmark: body.landmark || null,
    }).catch((e) => console.warn("[Email Dispatch Error]:", e));

    // Send WhatsApp alert to shop owner for COD orders
    if (body.paymentMethod === "cod") {
      alertCodOrder(saved, publicBaseUrl(req)).catch((e) =>
        console.warn("[WhatsApp COD Alert Error]:", e?.message || e)
      );
    }

    return NextResponse.json({
      status: "success",
      order: saved,
    });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

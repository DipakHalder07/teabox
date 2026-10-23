import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, saveOrder, getOrderById, StoredOrderData } from "@/lib/ordersDb";
import { PRODUCTS } from "@/data/products";
import { verifyAdminRequest } from "@/lib/auth";
import { orderCreationSchema, cleanIndianPhone } from "@/lib/validations/checkout";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { getPaymentStatus } from "@/lib/youpi";
import { getGatewayPayment, isGatewayConfigured } from "@/lib/youpiGateway";

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
        order: existingOrder,
        duplicatePrevented: true,
      });
    }

    // 2. Authoritative Price & Line Item Verification from Catalog
    const validatedItems = body.items.map((item) => {
      const found = PRODUCTS.find(
        (p) =>
          p.id === item.productId ||
          p.handle === item.productId ||
          (item.productId && item.productId.startsWith(p.id))
      );

      const authoritativePrice = found
        ? found.price
        : Math.max(1, Math.round(item.price));
      const validQuantity = Math.max(1, Math.floor(item.quantity));

      return {
        ...item,
        price: authoritativePrice,
        quantity: validQuantity,
      };
    });

    const authoritativeSubtotal = validatedItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );

    // 3. Authoritative Coupon Discount Calculation
    let authoritativeDiscount = 0;
    if (body.couponCode) {
      const code = body.couponCode.trim().toUpperCase();
      if (code === "WELCOME10" || code === "TEA10") {
        authoritativeDiscount = Math.round(authoritativeSubtotal * 0.1);
      } else if (code === "FIRSTTEA") {
        authoritativeDiscount = Math.min(150, authoritativeSubtotal);
      }
    }

    // 4. Authoritative Shipping & COD Fees
    const authoritativeShipping = authoritativeSubtotal >= 399 ? 0 : 50;
    const authoritativeCod = body.paymentMethod === "cod" ? 40 : 0;
    const authoritativeTotal = Math.max(
      0,
      authoritativeSubtotal - authoritativeDiscount + authoritativeShipping + authoritativeCod
    );

    // 5. Payment status is decided here, never by the browser. A UPI order is PAID only when the
    // YouPI gateway (asked directly, or via its signed webhook) confirms the right amount. A
    // customer-typed UTR stays unverified (PENDING) until the admin reconciles it.
    let paymentStatus: "PAID" | "PENDING" = "PENDING";
    let utrNumber: string | null = null;
    let notes = body.notes || null;
    const addNote = (note: string) => {
      notes = [notes, note].filter(Boolean).join(" | ");
    };
    if (body.paymentMethod === "upi") {
      const payment = getPaymentStatus(body.orderNumber);

      // Gateway checkout: ask YouPI directly (server-to-server) instead of relying on memory.
      let gatewayDecided = false;
      if (body.paymentId && isGatewayConfigured()) {
        try {
          const gateway = await getGatewayPayment(body.paymentId);
          if (gateway.orderId === body.orderNumber && gateway.status === "SUCCESS") {
            gatewayDecided = true;
            const paid = Number(gateway.amountPaise) / 100;
            utrNumber = (payment.status === "COMPLETED" && payment.utr) || null;
            if (Math.abs(paid - authoritativeTotal) < 1) {
              paymentStatus = "PAID";
            } else {
              addNote(`Payment amount mismatch: received ₹${paid}, order total ₹${authoritativeTotal}`);
            }
          }
        } catch (err) {
          console.warn("[Orders] YouPI payment check failed:", err);
        }
      }

      if (!gatewayDecided && payment.status === "COMPLETED") {
        utrNumber = payment.utr || null;
        if (Math.abs((payment.amount ?? 0) - authoritativeTotal) < 1) {
          paymentStatus = "PAID";
        } else {
          addNote(`Payment amount mismatch: received ₹${payment.amount}, order total ₹${authoritativeTotal}`);
        }
      } else if (!gatewayDecided) {
        utrNumber = (payment.status === "PENDING" && payment.submittedUtr) || body.utrNumber || null;
      }
    }

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

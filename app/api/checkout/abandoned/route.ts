import { NextRequest, NextResponse } from "next/server";
import {
  saveAbandonedCheckout,
  getAbandonedCheckoutByToken,
  getAbandonedCheckoutById,
} from "@/lib/abandonedCheckoutsDb";
import { cleanIndianPhone } from "@/lib/validations/checkout";
import { limitByIp } from "@/lib/rateLimit";

// Public endpoint called by Storefront Checkout (/checkout and FastrrCheckoutModal)
// when customer enters shipping details and clicks "Proceed to Payment".
export async function POST(req: NextRequest) {
  // Moderate rate limit: max 20 per IP per 5 mins
  const limited = limitByIp(req, "abandoned-checkout-track", 20, 5 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await req.json();

    const customerName = String(body.customerName || "").trim();
    const rawPhone = String(body.customerPhone || "").trim();
    const customerPhone = cleanIndianPhone(rawPhone);

    if (!customerPhone || customerPhone.length < 10) {
      return NextResponse.json({ error: "Valid mobile number is required" }, { status: 400 });
    }

    if (!customerName || !body.address || !body.pincode) {
      return NextResponse.json({ error: "Customer name, address and pincode are required" }, { status: 400 });
    }

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: "Cart items cannot be empty" }, { status: 400 });
    }

    const subtotal = Number(body.subtotal) || 0;
    const discountAmount = Number(body.discountAmount) || 0;
    const shippingFee = Number(body.shippingFee) || 0;
    const codFee = Number(body.codFee) || 0;
    const totalAmount = Number(body.totalAmount) || Math.max(0, subtotal - discountAmount + shippingFee + codFee);

    const saved = await saveAbandonedCheckout({
      checkoutNumber: body.checkoutNumber || body.orderNumber,
      customerName,
      customerPhone,
      customerEmail: body.customerEmail ? String(body.customerEmail).trim().toLowerCase() : null,
      address: String(body.address || "").trim(),
      city: String(body.city || "").trim(),
      state: String(body.state || "").trim(),
      pincode: String(body.pincode || "").trim(),
      landmark: body.landmark ? String(body.landmark).trim() : null,
      subtotal,
      discountAmount,
      couponCode: body.couponCode || null,
      shippingFee,
      codFee,
      totalAmount,
      items: items.map((i: any) => ({
        id: i.id || i.productId,
        productId: i.productId || i.id,
        title: i.title || "Tea",
        weight: i.weight || null,
        price: Number(i.price) || 0,
        quantity: Number(i.quantity) || 1,
        image: i.image || null,
      })),
      status: "ABANDONED",
      recoveryStatus: "UNSENT",
    });

    return NextResponse.json({
      success: true,
      checkoutNumber: saved.checkoutNumber,
      recoveryToken: saved.recoveryToken,
      id: saved.id,
    });
  } catch (error: any) {
    console.error("Error saving abandoned checkout session:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to record checkout session" },
      { status: 500 }
    );
  }
}

// Restore abandoned checkout data by recovery token or ID
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const id = searchParams.get("id");

    if (!token && !id) {
      return NextResponse.json({ error: "Token or ID required" }, { status: 400 });
    }

    const checkout = token
      ? await getAbandonedCheckoutByToken(token)
      : await getAbandonedCheckoutById(id!);

    if (!checkout) {
      return NextResponse.json({ error: "Abandoned checkout not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      checkout: {
        id: checkout.id,
        checkoutNumber: checkout.checkoutNumber,
        customerName: checkout.customerName,
        customerPhone: checkout.customerPhone,
        customerEmail: checkout.customerEmail,
        address: checkout.address,
        city: checkout.city,
        state: checkout.state,
        pincode: checkout.pincode,
        landmark: checkout.landmark,
        subtotal: checkout.subtotal,
        discountAmount: checkout.discountAmount,
        couponCode: checkout.couponCode,
        shippingFee: checkout.shippingFee,
        codFee: checkout.codFee,
        totalAmount: checkout.totalAmount,
        items: checkout.items,
        status: checkout.status,
      },
    });
  } catch (error: any) {
    console.error("Error retrieving abandoned checkout:", error);
    return NextResponse.json({ error: "Failed to retrieve checkout" }, { status: 500 });
  }
}

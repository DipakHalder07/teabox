import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConnected } from "@/lib/prisma";
import { getCustomerFromRequest } from "@/lib/customerAuth";

// "My orders" for the signed-in customer: every order placed with their verified email.
export async function GET(req: NextRequest) {
  const customer = await getCustomerFromRequest(req);
  if (!customer) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  if (!(await isDatabaseConnected())) {
    return NextResponse.json({ customer, orders: [], databaseOffline: true });
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [{ customerEmail: { equals: customer.email, mode: "insensitive" } }, { user: { email: customer.email } }],
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    customer,
    orders: orders.map((o) => ({
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      orderStatus: o.orderStatus,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      subtotal: o.subtotal,
      discountAmount: o.discountAmount,
      shippingFee: o.shippingFee,
      codFee: o.codFee,
      totalAmount: o.totalAmount,
      trackingNumber: o.trackingNumber,
      trackingUrl: o.trackingUrl,
      customerName: o.customerName,
      address: o.address,
      city: o.city,
      state: o.state,
      pincode: o.pincode,
      items: o.items.map((i) => ({ title: i.title, weight: i.weight, price: i.price, quantity: i.quantity, image: i.image })),
    })),
  });
}

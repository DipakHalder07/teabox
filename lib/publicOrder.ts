import { StoredOrderData } from "./ordersDb";

// What the public order and tracking pages may show. Anyone with an order number or a phone
// number can open those pages, so personal details are partly hidden; the full record stays
// in the admin.

function maskName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.pop();
  return last ? `${first} ${last[0].toUpperCase()}.` : first || "Customer";
}

function maskPhone(phone: string) {
  return phone.length >= 10 ? `${phone.slice(0, 2)}XXXXXX${phone.slice(-2)}` : "XXXXXXXXXX";
}

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return null;
  return `${user.slice(0, 2)}${"•".repeat(Math.max(3, user.length - 2))}@${domain}`;
}

function maskTail(value: string, visible: number) {
  return value.length > visible ? `${"•".repeat(value.length - visible)}${value.slice(-visible)}` : value;
}

export function toPublicOrder(order: StoredOrderData) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: maskName(order.customerName),
    customerPhone: maskPhone(order.customerPhone),
    customerEmail: order.customerEmail ? maskEmail(order.customerEmail) : null,
    address: "Street address hidden for privacy",
    city: order.city,
    state: order.state,
    pincode: maskTail(order.pincode, 3),
    landmark: null,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    couponCode: order.couponCode ?? null,
    shippingFee: order.shippingFee,
    codFee: order.codFee,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    trackingNumber: order.trackingNumber ?? null,
    trackingUrl: order.trackingUrl ?? null,
    utrNumber: order.utrNumber ? maskTail(order.utrNumber, 4) : null,
    items: order.items.map((i) => ({
      title: i.title,
      weight: i.weight ?? null,
      price: i.price,
      quantity: i.quantity,
      image: i.image ?? null,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

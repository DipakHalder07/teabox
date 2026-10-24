"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Package, Truck } from "lucide-react";
import { toast } from "sonner";
import SiteLayoutWrapper from "@/components/SiteLayoutWrapper";
import { useCart } from "@/components/context/CartContext";

interface AccountOrder {
  orderNumber: string;
  createdAt: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  codFee: number;
  totalAmount: number;
  trackingNumber: string | null;
  trackingUrl: string | null;
  customerName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: Array<{ title: string; weight: string | null; price: number; quantity: number; image: string | null }>;
}

const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  PROCESSING: { label: "Processing", className: "bg-[#fbf4e8] text-[#8a5a18]" },
  SHIPPED: { label: "Shipped", className: "bg-[#e8f0fb] text-[#1d4f91]" },
  DELIVERED: { label: "Delivered", className: "bg-[#eaf8ef] text-[#016c2f]" },
  CANCELLED: { label: "Cancelled", className: "bg-[#fdecec] text-[#b42318]" },
};

function paymentLabel(o: AccountOrder) {
  if (o.paymentMethod === "cod") return o.paymentStatus === "PAID" ? "Paid (COD)" : "Cash on Delivery";
  if (o.paymentStatus === "PAID") return "Paid (UPI)";
  if (o.paymentStatus === "FAILED") return "Payment failed";
  return "Payment being verified";
}

function orderDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AccountPage() {
  const router = useRouter();
  const { clearCart, cartItems } = useCart();
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<AccountOrder[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/account/orders", { cache: "no-store" });
      if (res.status === 401) {
        try {
          localStorage.removeItem("teabox_customer_user");
        } catch {}
        router.replace("/account/login");
        return;
      }
      const data = await res.json();
      setEmail(data.customer?.email || "");
      setOrders(data.orders || []);
    } catch {
      toast.error("Could not load your orders. Please refresh.");
      setOrders([]);
    }
  }, [router]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    return () => clearTimeout(first);
  }, [load]);

  const signOut = () => {
    try {
      // Keep this customer's cart for next time, like the login page does
      if (email && cartItems.length > 0) {
        localStorage.setItem(`teabox_saved_cart_${email.replace(/[^a-zA-Z0-9]/g, "_")}`, JSON.stringify(cartItems));
      }
      localStorage.removeItem("teabox_customer_user");
    } catch {}
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    clearCart();
    toast.info("Signed out");
    router.replace("/account/login");
  };

  if (orders === null) {
    return (
      <SiteLayoutWrapper>
        <div className="min-h-[60vh] flex items-center justify-center bg-[#fafafa]">
          <div className="w-8 h-8 border-3 border-[#02cb5a] border-t-transparent rounded-full animate-spin" />
        </div>
      </SiteLayoutWrapper>
    );
  }

  return (
    <SiteLayoutWrapper>
      <div className="min-h-[70vh] bg-[#fafafa] py-10 px-4 sm:px-6">
        <div className="max-w-[860px] mx-auto space-y-6">
          <nav aria-label="Breadcrumb" className="text-[13px] text-[#747576]">
            <Link href="/" className="text-[#1f3a2c] hover:underline">
              Home
            </Link>{" "}
            › <span className="text-[#202020] font-medium">My Account</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="font-stencil text-[28px] sm:text-[32px] font-bold text-[#202020]">My Orders</h1>
              <p className="text-[13.5px] text-[#5c5a52]">
                Signed in as <strong className="text-[#1f3a2c]">{email}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="self-start sm:self-auto flex items-center gap-1.5 border border-[#e7e2d8] hover:border-[#202020] bg-white text-[#5c5a52] font-semibold text-[13px] px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white border border-[#e7e2d8] rounded-2xl p-10 text-center space-y-3">
              <Package size={36} className="mx-auto text-[#a3c4b2]" />
              <h2 className="text-[18px] font-bold text-[#202020]">No orders yet</h2>
              <p className="text-[13.5px] text-[#5c5a52]">
                Orders you place with <strong>{email}</strong> will show up here.
              </p>
              <Link
                href="/collections/all"
                className="inline-block bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[14px] px-6 py-3 rounded-lg transition-colors"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {orders.map((o) => {
                const status = ORDER_STATUS[o.orderStatus] || { label: o.orderStatus, className: "bg-[#eef2f0] text-[#1f3a2c]" };
                const isOpen = open === o.orderNumber;
                const units = o.items.reduce((n, i) => n + i.quantity, 0);
                return (
                  <li key={o.orderNumber} className="bg-white border border-[#e7e2d8] rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : o.orderNumber)}
                      aria-expanded={isOpen}
                      className="w-full text-left p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 cursor-pointer hover:bg-[#fcfbf8] transition-colors"
                    >
                      <div className="flex -space-x-2 shrink-0">
                        {o.items.slice(0, 3).map((item, idx) =>
                          item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={idx}
                              src={item.image}
                              alt=""
                              className="w-12 h-12 rounded-lg border-2 border-white object-cover bg-[#f3f1ec]"
                            />
                          ) : (
                            <div key={idx} className="w-12 h-12 rounded-lg border-2 border-white bg-[#f3f1ec]" />
                          )
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-[15px] text-[#202020]">#{o.orderNumber}</span>
                          <span className={`text-[11.5px] font-bold px-2 py-0.5 rounded-md ${status.className}`}>{status.label}</span>
                        </div>
                        <div className="text-[12.5px] text-[#747576] mt-0.5">
                          {orderDate(o.createdAt)} · {units} {units === 1 ? "item" : "items"} · {paymentLabel(o)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:justify-end">
                        <span className="font-bold text-[16px] text-[#1f3a2c]">₹{o.totalAmount}</span>
                        <ChevronDown size={18} className={`text-[#747576] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-[#f0ede6] p-4 sm:p-5 grid gap-5 sm:grid-cols-[1fr_240px]">
                        <div>
                          <ul className="divide-y divide-[#f0ede6]">
                            {o.items.map((item, idx) => (
                              <li key={idx} className="py-2.5 flex justify-between gap-3 text-[13.5px]">
                                <span>
                                  <span className="font-semibold text-[#202020]">{item.title}</span>
                                  {item.weight && <span className="text-[#747576]"> · {item.weight}</span>}
                                  <span className="text-[#747576]"> ×{item.quantity}</span>
                                </span>
                                <span className="font-semibold">₹{item.price * item.quantity}</span>
                              </li>
                            ))}
                          </ul>
                          <dl className="mt-3 space-y-1 text-[13px] text-[#5c5a52]">
                            <div className="flex justify-between"><dt>Subtotal</dt><dd>₹{o.subtotal}</dd></div>
                            {o.discountAmount > 0 && (
                              <div className="flex justify-between text-[#016c2f]"><dt>Discount</dt><dd>-₹{o.discountAmount}</dd></div>
                            )}
                            <div className="flex justify-between"><dt>Shipping</dt><dd>{o.shippingFee ? `₹${o.shippingFee}` : "Free"}</dd></div>
                            {o.codFee > 0 && <div className="flex justify-between"><dt>COD fee</dt><dd>₹{o.codFee}</dd></div>}
                            <div className="flex justify-between font-bold text-[15px] text-[#1f3a2c] pt-1"><dt>Total</dt><dd>₹{o.totalAmount}</dd></div>
                          </dl>
                        </div>
                        <div className="space-y-3 text-[13px]">
                          <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-xl p-3 leading-relaxed">
                            <div className="font-bold text-[#202020] mb-0.5">Delivery address</div>
                            {o.customerName}
                            <br />
                            {o.address}
                            <br />
                            {o.city}, {o.state} - {o.pincode}
                          </div>
                          {o.trackingUrl ? (
                            <a
                              href={o.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 bg-[#1f3a2c] text-white font-semibold py-2.5 rounded-lg"
                            >
                              <Truck size={15} /> Track shipment
                            </a>
                          ) : (
                            o.trackingNumber && (
                              <div className="text-[#5c5a52]">
                                Tracking no. <strong>{o.trackingNumber}</strong>
                              </div>
                            )
                          )}
                          <Link
                            href={`/order/${o.orderNumber}`}
                            className="block text-center border border-[#e7e2d8] hover:border-[#1f3a2c] font-semibold text-[#1f3a2c] py-2.5 rounded-lg transition-colors"
                          >
                            Order status page
                          </Link>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </SiteLayoutWrapper>
  );
}

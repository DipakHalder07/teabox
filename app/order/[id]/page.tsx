"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Clock,
  Printer,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { StoredOrderData } from "@/lib/ordersDb";
import TopBar from "@/components/TopBar";
import ShippingBar from "@/components/ShippingBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function OrderTrackingContent() {
  const params = useParams();
  const orderId = params?.id as string;
  const router = useRouter();

  const [order, setOrder] = useState<StoredOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;

    async function fetchOrder() {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (data?.order) {
          setOrder(data.order);
        } else {
          setError(data?.error || "Order not found");
        }
      } catch (err) {
        setError("Unable to load order details. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col justify-between">
        <TopBar />
        <Header onOpenTeaFinder={() => {}} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
          <div className="w-12 h-12 border-4 border-[#1f3a2c]/20 border-t-[#02cb5a] rounded-full animate-spin" />
          <p className="text-[#5c5a52] text-[14px] font-medium">
            Fetching order details &amp; tracking info...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col justify-between">
        <TopBar />
        <Header onOpenTeaFinder={() => {}} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-[500px] mx-auto space-y-5">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <Package size={32} />
          </div>
          <h1 className="text-[24px] font-bold text-[#202020]">
            Order Not Found
          </h1>
          <p className="text-[#5c5a52] text-[14px]">
            We couldn't locate order reference <strong>{orderId}</strong>. It might be in processing or was placed with a different reference number.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/collections/all"
              className="px-6 py-2.5 bg-[#1f3a2c] hover:bg-[#14281e] text-white rounded-xl text-[14px] font-bold transition-colors"
            >
              Browse Teas
            </Link>
            <Link
              href="/account/login"
              className="px-6 py-2.5 bg-white border border-[#e7e2d8] hover:border-[#1f3a2c] text-[#202020] rounded-xl text-[14px] font-semibold transition-colors"
            >
              My Account
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Determine stage based on orderStatus
  const isDelivered = order.orderStatus === "DELIVERED";
  const isShipped = order.orderStatus === "SHIPPED" || isDelivered;
  const isProcessing = order.orderStatus === "PROCESSING" || isShipped;

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#202020] flex flex-col justify-between">
      <TopBar />
      <ShippingBar />
      <Header onOpenTeaFinder={() => {}} />

      <main className="flex-1 max-w-[1100px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#747576]">
            <Link href="/" className="hover:text-[#1f3a2c]">
              Home
            </Link>
            <ChevronRight size={14} />
            <Link href="/checkout" className="hover:text-[#1f3a2c]">
              Orders
            </Link>
            <ChevronRight size={14} />
            <span className="text-[#202020] font-semibold">{order.orderNumber}</span>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#e7e2d8] hover:border-[#1f3a2c] text-[#202020] rounded-lg text-[13px] font-medium transition-colors shadow-2xs print:hidden cursor-pointer"
          >
            <Printer size={15} />
            <span>Print Invoice</span>
          </button>
        </div>

        {/* Top Celebration & Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white border border-[#e7e2d8] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f0ede6] pb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#02cb5a]/20 border border-[#02cb5a] flex items-center justify-center text-[#016c2f] shrink-0 mt-1">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-[22px] sm:text-[26px] font-bold text-[#1f3a2c]">
                    Order Confirmed!
                  </h1>
                  <span className="bg-[#02cb5a]/20 text-[#016c2f] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {order.paymentStatus === "PAID"
                      ? "Paid & Verified"
                      : order.paymentMethod === "upi"
                        ? "Payment Pending"
                        : "COD Confirmed"}
                  </span>
                </div>
                <p className="text-[14px] text-[#5c5a52] mt-1">
                  Thank you, <strong>{order.customerName}</strong>. Your tea leaves are freshly batched direct from Darjeeling.
                </p>
                <p className="text-[12.5px] text-[#747576] mt-0.5">
                  Placed on {formattedDate} · Order ID: <strong className="text-[#202020]">{order.orderNumber}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:items-end justify-center bg-[#faf8f5] sm:bg-transparent p-3 sm:p-0 rounded-xl">
              <span className="text-[12px] text-[#747576]">Estimated Delivery</span>
              <span className="text-[16px] font-bold text-[#1f3a2c] flex items-center gap-1.5 mt-0.5">
                <Clock size={16} className="text-[#02cb5a]" />
                2 - 4 Business Days
              </span>
            </div>
          </div>

          {/* Interactive Fulfillment Timeline */}
          <div>
            <h3 className="text-[14px] font-bold text-[#202020] mb-4">
              Fulfillment &amp; Express Delivery Timeline
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {/* Step 1: Placed */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#02cb5a]/10 border border-[#02cb5a]/30">
                <div className="w-8 h-8 rounded-full bg-[#02cb5a] text-[#1f3a2c] flex items-center justify-center font-bold text-[13px] shrink-0">
                  ✓
                </div>
                <div>
                  <div className="font-bold text-[13.5px] text-[#1f3a2c]">Order Placed</div>
                  <div className="text-[11.5px] text-[#5c5a52] mt-0.5">
                    {order.paymentMethod === "upi"
                      ? order.paymentStatus === "PAID"
                        ? `Paid via UPI (${order.utrNumber ? `Ref: ${order.utrNumber}` : "Verified"})`
                        : `UPI payment awaiting bank confirmation${order.utrNumber ? ` (Ref: ${order.utrNumber})` : ""}`
                      : "Pay on Delivery (Cash / UPI)"}
                  </div>
                </div>
              </div>

              {/* Step 2: Fresh Packing */}
              <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${isProcessing ? "bg-[#02cb5a]/10 border-[#02cb5a]/30" : "bg-[#fcfbf9] border-[#e7e2d8]"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${isProcessing ? "bg-[#02cb5a] text-[#1f3a2c]" : "bg-[#e7e2d8] text-[#747576]"}`}>
                  2
                </div>
                <div>
                  <div className="font-bold text-[13.5px] text-[#202020]">Vacuum Sealed</div>
                  <div className="text-[11.5px] text-[#5c5a52] mt-0.5">
                    Packed fresh at Siliguri Garden Estate
                  </div>
                </div>
              </div>

              {/* Step 3: Dispatched */}
              <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${isShipped ? "bg-[#02cb5a]/10 border-[#02cb5a]/30" : "bg-[#fcfbf9] border-[#e7e2d8]"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${isShipped ? "bg-[#02cb5a] text-[#1f3a2c]" : "bg-[#e7e2d8] text-[#747576]"}`}>
                  3
                </div>
                <div>
                  <div className="font-bold text-[13.5px] text-[#202020]">Dispatched</div>
                  <div className="text-[11.5px] text-[#5c5a52] mt-0.5">
                    {order.trackingNumber ? (
                      <Link
                        href={order.trackingUrl || `/track?tracking_id=${order.trackingNumber}`}
                        className="text-[#016c2f] font-semibold underline flex items-center gap-1"
                      >
                        Track #{order.trackingNumber}
                        <ExternalLink size={11} />
                      </Link>
                    ) : (
                      "Express Air Courier assigned"
                    )}
                  </div>
                </div>
              </div>

              {/* Step 4: Delivered */}
              <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${isDelivered ? "bg-[#02cb5a]/15 border-[#02cb5a]" : "bg-[#fcfbf9] border-[#e7e2d8]"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${isDelivered ? "bg-[#02cb5a] text-[#1f3a2c]" : "bg-[#e7e2d8] text-[#747576]"}`}>
                  4
                </div>
                <div>
                  <div className="font-bold text-[13.5px] text-[#202020]">Delivered</div>
                  <div className="text-[11.5px] text-[#5c5a52] mt-0.5">
                    {isDelivered ? "Handed over safely" : "Doorstep delivery"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2-Column Detail Layout: Items & Shipping */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items Summary (2 Cols) */}
          <div className="lg:col-span-2 bg-white border border-[#e7e2d8] rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-[16px] font-bold text-[#202020] flex items-center gap-2">
              <ShoppingBag size={18} className="text-[#1f3a2c]" />
              Items in Your Order ({order.items?.length || 0})
            </h3>

            <div className="divide-y divide-[#f0ede6]">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-[#e7e2d8] bg-[#faf8f5] relative overflow-hidden shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-[#747576] m-auto mt-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[14px] text-[#202020] truncate">
                      {item.title}
                    </h4>
                    <p className="text-[12.5px] text-[#747576] mt-0.5">
                      Pack Size: {item.weight || "100G"} · Qty: {item.quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-[15px] text-[#202020]">
                      ₹{item.price * item.quantity}
                    </span>
                    <p className="text-[11.5px] text-[#747576]">
                      ₹{item.price} each
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="border-t border-[#e7e2d8] pt-4 space-y-2 text-[13.5px]">
              <div className="flex justify-between text-[#5c5a52]">
                <span>Items Subtotal</span>
                <span className="font-semibold text-[#202020]">₹{order.subtotal}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-[#016c2f] font-medium">
                  <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <span>- ₹{order.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-[#5c5a52]">
                <span>Express Courier Shipping</span>
                <span className="text-[#016c2f] font-semibold">
                  {order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee}`}
                </span>
              </div>
              {order.codFee > 0 && (
                <div className="flex justify-between text-[#5c5a52]">
                  <span>Cash on Delivery Handling</span>
                  <span>₹{order.codFee}</span>
                </div>
              )}
              <div className="border-t border-[#e7e2d8] pt-3 flex justify-between items-center text-[16px] font-bold text-[#1f3a2c]">
                <span>Total Amount Paid / Due</span>
                <span>₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Shipping & Payment Meta (1 Col) */}
          <div className="space-y-6">
            {/* Delivery Address */}
            <div className="bg-white border border-[#e7e2d8] rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-[15px] font-bold text-[#202020] flex items-center gap-2">
                <MapPin size={17} className="text-[#1f3a2c]" />
                Shipping Destination
              </h3>
              <div className="text-[13.5px] text-[#5c5a52] leading-relaxed">
                <p className="font-bold text-[#202020]">{order.customerName}</p>
                <p className="mt-0.5">{order.address}</p>
                {order.landmark && <p className="text-[12.5px] text-[#747576]">Landmark: {order.landmark}</p>}
                <p>
                  {order.city}, {order.state} - <strong>{order.pincode}</strong>
                </p>
                <p className="mt-2 text-[#202020] font-medium">
                  Phone: +91 {order.customerPhone}
                </p>
                {order.customerEmail && (
                  <p className="text-[#747576] text-[12.5px]">Email: {order.customerEmail}</p>
                )}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white border border-[#e7e2d8] rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-[15px] font-bold text-[#202020] flex items-center gap-2">
                <ShieldCheck size={17} className="text-[#02cb5a]" />
                Payment Information
              </h3>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#5c5a52]">Method:</span>
                  <span className="font-bold text-[#202020] uppercase">
                    {order.paymentMethod === "upi" ? "UPI" : "Cash On Delivery"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5c5a52]">Status:</span>
                  <span className="font-bold text-[#016c2f]">{order.paymentStatus}</span>
                </div>
                {order.utrNumber && (
                  <div className="flex justify-between">
                    <span className="text-[#5c5a52]">UTR / Ref:</span>
                    <span className="font-mono text-[12px] font-bold text-[#202020]">
                      {order.utrNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Need Help Banner */}
            <div className="bg-[#1f3a2c] text-white rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-[14px] flex items-center gap-2 text-white">
                <HelpCircle size={16} className="text-[#02cb5a]" />
                Need Support with Your Order?
              </h4>
              <p className="text-[12.5px] text-[#e0ded8]">
                Our tea sommeliers are ready to assist with shipping questions or brewing advice.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="https://wa.me/918617513004"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[12px] rounded-lg transition-colors inline-block"
                >
                  WhatsApp Support
                </a>
                <Link
                  href="/collections/all"
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-[12px] rounded-lg transition-colors inline-block"
                >
                  Shop More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#1f3a2c]/20 border-t-[#02cb5a] rounded-full animate-spin" />
        </div>
      }
    >
      <OrderTrackingContent />
    </Suspense>
  );
}

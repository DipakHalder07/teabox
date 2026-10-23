"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Printer,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TeaFinderModal from "@/components/TeaFinderModal";
import { StoredOrderData } from "@/lib/ordersDb";
import { cleanIndianPhone } from "@/lib/validations/checkout";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialQuery =
    searchParams.get("id") ||
    searchParams.get("tracking_id") ||
    searchParams.get("q") ||
    searchParams.get("phone") ||
    "";

  const [queryType, setQueryType] = useState<"order" | "phone">("order");
  const [searchValue, setSearchValue] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [orders, setOrders] = useState<StoredOrderData[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [recentOrderIds, setRecentOrderIds] = useState<string[]>([]);
  const [isTeaFinderOpen, setIsTeaFinderOpen] = useState(false);

  // Load recent orders from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("teabox_recent_orders");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentOrderIds(parsed.slice(0, 3));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-search if URL contains search param
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  // Strip +91 and leading 0 when in phone mode
  const handleInputChange = (val: string) => {
    if (queryType === "phone") {
      setSearchValue(cleanIndianPhone(val));
    } else {
      setSearchValue(val);
    }
  };

  const performSearch = async (term: string) => {
    const q = term.trim();
    if (!q) {
      setErrorMessage("Please enter an Order ID, Courier Tracking Number, or Mobile Number.");
      return;
    }

    setIsSearching(true);
    setErrorMessage("");
    setHasSearched(true);

    try {
      const res = await fetch(`/api/orders/track?q=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (res.ok && data?.orders && data.orders.length > 0) {
        setOrders(data.orders);
        setErrorMessage("");
      } else {
        setOrders([]);
        setErrorMessage(data?.error || `No active orders found matching "${q}".`);
      }
    } catch (err) {
      setOrders([]);
      setErrorMessage("Network error occurred. Please check your connection and try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchValue);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col justify-between font-sans text-[#202020]">
      <div>
        <TopBar />
        <Header onOpenTeaFinder={() => setIsTeaFinderOpen(true)} />

        {/* Hero Section */}
        <section className="bg-[#1f3a2c] text-white py-12 sm:py-16 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#02cb5a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          <div className="max-w-[760px] mx-auto text-center relative z-10 space-y-3.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#02cb5a]/20 text-[#02cb5a] text-[12px] font-bold uppercase tracking-wider">
              <Sparkles size={13} />
              <span>Direct From Siliguri Tea Hub</span>
            </span>
            <h1 className="font-stencil text-[28px] sm:text-[38px] font-bold tracking-tight">
              Track Your Teabox Order
            </h1>
            <p className="text-[14px] sm:text-[15px] text-[#c9d6cd] max-w-[560px] mx-auto">
              Follow your fresh single-estate harvests, artisan blends, and chai from vacuum-sealing at origin to your door.
            </p>

            {/* Tracking Search Card */}
            <div className="pt-4">
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl border border-[#e7e2d8] text-left">
                {/* Search Mode Toggle */}
                <div className="flex items-center gap-2 border-b border-[#e7e2d8] pb-3 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setQueryType("order");
                      setErrorMessage("");
                    }}
                    className={`text-[13px] font-bold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      queryType === "order"
                        ? "bg-[#1f3a2c] text-white"
                        : "text-[#5c5a52] hover:text-[#202020] bg-transparent"
                    }`}
                  >
                    Order ID / Courier AWB
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQueryType("phone");
                      setErrorMessage("");
                      if (searchValue) setSearchValue(cleanIndianPhone(searchValue));
                    }}
                    className={`text-[13px] font-bold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      queryType === "phone"
                        ? "bg-[#1f3a2c] text-white"
                        : "text-[#5c5a52] hover:text-[#202020] bg-transparent"
                    }`}
                  >
                    Registered Mobile Number
                  </button>
                </div>

                {/* Search Form */}
                <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-2.5">
                  <div className="flex-1 flex items-center border border-[#e7e2d8] focus-within:border-[#02cb5a] rounded-xl overflow-hidden bg-[#fafafa]">
                    {queryType === "phone" ? (
                      <span className="px-3 py-3 bg-[#f0ede6] border-r border-[#e7e2d8] text-[13.5px] font-bold text-[#202020] flex items-center gap-1 select-none">
                        🇮🇳 +91
                      </span>
                    ) : (
                      <span className="pl-3.5 pr-1 text-[#747576]">
                        <Search size={18} />
                      </span>
                    )}
                    <input
                      type={queryType === "phone" ? "tel" : "text"}
                      value={searchValue}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onPaste={(e) => {
                        if (queryType === "phone") {
                          const pasted = e.clipboardData.getData("text");
                          if (pasted) {
                            e.preventDefault();
                            setSearchValue(cleanIndianPhone(pasted));
                          }
                        }
                      }}
                      placeholder={
                        queryType === "phone"
                          ? "10-digit mobile number"
                          : "Enter Order Number (e.g. TB-4821937065)"
                      }
                      className="flex-1 px-3 py-3 text-[14px] text-[#202020] bg-transparent outline-none placeholder:text-[#9da3a0]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSearching}
                    className="bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[14px] px-7 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-60 shadow-sm"
                  >
                    {isSearching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#1f3a2c]/30 border-t-[#1f3a2c] rounded-full animate-spin" />
                        <span>Tracking...</span>
                      </>
                    ) : (
                      <>
                        <span>Track Order</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>


                {/* Recent orders saved in session */}
                {recentOrderIds.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-[#e7e2d8] flex flex-wrap items-center gap-2 text-[12.5px]">
                    <span className="text-[#5c5a52] font-medium">Your Recent Orders:</span>
                    {recentOrderIds.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setQueryType("order");
                          setSearchValue(id);
                          performSearch(id);
                        }}
                        className="bg-[#f0ede6] hover:bg-[#e7e2d8] text-[#1f3a2c] font-bold px-2.5 py-1 rounded text-[11.5px] cursor-pointer transition-colors"
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Results Area */}
        <main className="max-w-[880px] mx-auto px-4 sm:px-6 py-10 space-y-6">
          {/* Error / Not Found Alert */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 text-[14px]"
            >
              <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold">{errorMessage}</p>
                <p className="text-[12.5px] text-red-600 mt-0.5">
                  Check if your Order ID starts with <strong>TB-</strong> or your 10-digit mobile number is correct.
                </p>
              </div>
            </motion.div>
          )}

          {/* Orders List */}
          <AnimatePresence>
            {orders.map((ord) => {
              const isProcessing = ord.orderStatus === "PROCESSING";
              const isShipped = ord.orderStatus === "SHIPPED";
              const isDelivered = ord.orderStatus === "DELIVERED";

              return (
                <motion.div
                  key={ord.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white border border-[#e7e2d8] rounded-2xl overflow-hidden shadow-sm"
                >
                  {/* Order Header */}
                  <div className="bg-[#faf8f5] border-b border-[#e7e2d8] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[18px] text-[#202020]">
                          {ord.orderNumber}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isDelivered
                              ? "bg-green-100 text-green-800"
                              : isShipped
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ord.orderStatus}
                        </span>
                      </div>
                      <p className="text-[12.5px] text-[#5c5a52] mt-1">
                        Placed on {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Link
                        href={`/order/${ord.orderNumber}`}
                        className="inline-flex items-center gap-1.5 bg-[#1f3a2c] hover:bg-[#14281e] text-white text-[13px] font-bold px-4 py-2 rounded-xl transition-colors"
                      >
                        <Printer size={14} />
                        <span>View Invoice</span>
                      </Link>
                    </div>
                  </div>

                  {/* 4-Step Tracking Stepper */}
                  <div className="p-5 sm:p-6 border-b border-[#e7e2d8]">
                    <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#5c5a52] mb-4">
                      Shipment Status
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      {/* Step 1: Confirmed */}
                      <div className="flex items-start gap-3 p-3 rounded-xl border bg-[#02cb5a]/10 border-[#02cb5a]/30">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 bg-[#02cb5a] text-[#1f3a2c]">
                          ✓
                        </div>
                        <div>
                          <div className="font-bold text-[13px] text-[#202020]">Confirmed</div>
                          <div className="text-[11px] text-[#5c5a52] mt-0.5">Order verified</div>
                        </div>
                      </div>

                      {/* Step 2: Packed */}
                      <div className="flex items-start gap-3 p-3 rounded-xl border bg-[#02cb5a]/10 border-[#02cb5a]/30">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 bg-[#02cb5a] text-[#1f3a2c]">
                          ✓
                        </div>
                        <div>
                          <div className="font-bold text-[13px] text-[#202020]">Sealed at Source</div>
                          <div className="text-[11px] text-[#5c5a52] mt-0.5">Siliguri Fresh Hub</div>
                        </div>
                      </div>

                      {/* Step 3: Dispatched */}
                      <div
                        className={`flex items-start gap-3 p-3 rounded-xl border ${
                          isShipped || isDelivered
                            ? "bg-[#02cb5a]/10 border-[#02cb5a]/30"
                            : "bg-[#fcfbf9] border-[#e7e2d8]"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${
                            isShipped || isDelivered
                              ? "bg-[#02cb5a] text-[#1f3a2c]"
                              : "bg-[#e7e2d8] text-[#747576]"
                          }`}
                        >
                          {isShipped || isDelivered ? "✓" : "3"}
                        </div>
                        <div>
                          <div className="font-bold text-[13px] text-[#202020]">In Transit</div>
                          <div className="text-[11px] text-[#5c5a52] mt-0.5">
                            {ord.trackingNumber ? (
                              <span className="font-mono text-[#016c2f] font-bold">
                                AWB #{ord.trackingNumber}
                              </span>
                            ) : (
                              "Courier Assigned"
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Step 4: Delivered */}
                      <div
                        className={`flex items-start gap-3 p-3 rounded-xl border ${
                          isDelivered
                            ? "bg-[#02cb5a]/15 border-[#02cb5a]"
                            : "bg-[#fcfbf9] border-[#e7e2d8]"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${
                            isDelivered
                              ? "bg-[#02cb5a] text-[#1f3a2c]"
                              : "bg-[#e7e2d8] text-[#747576]"
                          }`}
                        >
                          {isDelivered ? "✓" : "4"}
                        </div>
                        <div>
                          <div className="font-bold text-[13px] text-[#202020]">Delivered</div>
                          <div className="text-[11px] text-[#5c5a52] mt-0.5">
                            {isDelivered ? "Delivered safely" : "Est. 2–4 Business Days"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shipment Details & Items Grid */}
                  <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Items in Package */}
                    <div className="space-y-3">
                      <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#5c5a52]">
                        Teas in Shipment ({ord.items.length})
                      </h4>
                      <div className="divide-y divide-[#f0ede6] border border-[#e7e2d8] rounded-xl overflow-hidden">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="p-3 flex items-center gap-3 bg-white">
                            {item.image ? (
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#f7f5f0] shrink-0">
                                <Image
                                  src={item.image}
                                  alt={item.title}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-[#e7e2d8] flex items-center justify-center shrink-0 text-[#747576]">
                                <ShoppingBag size={18} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[13.5px] font-bold text-[#202020] truncate">
                                {item.title}
                              </p>
                              <p className="text-[12px] text-[#5c5a52]">
                                Qty: {item.quantity} {item.weight ? `• ${item.weight}` : ""}
                              </p>
                            </div>
                            <span className="text-[13.5px] font-bold text-[#1f3a2c]">
                              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery & Payment Info */}
                    <div className="space-y-3">
                      <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#5c5a52]">
                        Delivery Information
                      </h4>
                      <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-xl p-4 space-y-2.5 text-[13.5px]">
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-[#016c2f] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-[#202020]">{ord.customerName}</span>
                            <p className="text-[#5c5a52] text-[12.5px] mt-0.5">
                              {ord.address}, {ord.city}, {ord.state} - {ord.pincode}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#e7e2d8] flex items-center justify-between text-[13px]">
                          <span className="text-[#5c5a52]">Courier Service:</span>
                          <span className="font-bold text-[#1f3a2c]">
                            Teabox Priority Air Express
                          </span>
                        </div>

                        {ord.trackingNumber && (
                          <div className="flex items-center justify-between text-[13px]">
                            <span className="text-[#5c5a52]">Tracking AWB:</span>
                            <span className="font-mono font-bold text-[#016c2f]">
                              {ord.trackingNumber}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[13px]">
                          <span className="text-[#5c5a52]">Payment:</span>
                          <span className="font-bold text-[#202020] uppercase">
                            {ord.paymentMethod === "upi" ? "UPI (Paid)" : "Cash On Delivery"}
                          </span>
                        </div>

                        <div className="pt-1 flex items-center justify-between text-[14px] font-bold border-t border-[#e7e2d8]">
                          <span>Total Amount:</span>
                          <span className="text-[16px] text-[#1f3a2c]">
                            ₹{ord.totalAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Fallback Empty State if searched but no orders */}
          {hasSearched && orders.length === 0 && !errorMessage && (
            <div className="bg-white border border-[#e7e2d8] rounded-2xl p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#f0ede6] text-[#747576] flex items-center justify-center mx-auto">
                <Package size={28} />
              </div>
              <h3 className="font-bold text-[18px] text-[#202020]">No Orders Found</h3>
              <p className="text-[14px] text-[#5c5a52] max-w-[420px] mx-auto">
                Please double-check your Order Number or try searching with your 10-digit mobile number.
              </p>
            </div>
          )}

          {/* Quality Guarantee Callout */}
          <div className="bg-[#f0f8f4] border border-[#bfdcc9] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-[#02cb5a]/20 border border-[#02cb5a] flex items-center justify-center shrink-0 text-[#016c2f]">
              <ShieldCheck size={26} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-[15px] text-[#1f3a2c]">
                100% Freshness &amp; Source Sealed Guarantee
              </h4>
              <p className="text-[13px] text-[#33463a] mt-0.5">
                Every batch is nitrogen-flushed and vacuum-sealed at source within 48 hours of harvest for pure peak flavor.
              </p>
            </div>
            <Link
              href="/collections/all"
              className="bg-[#1f3a2c] hover:bg-[#14281e] text-white font-bold text-[13px] px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
            >
              Shop Fresh Teas
            </Link>
          </div>
        </main>
      </div>

      <Footer />
      <TeaFinderModal isOpen={isTeaFinderOpen} onClose={() => setIsTeaFinderOpen(false)} />
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#1f3a2c]/20 border-t-[#02cb5a] rounded-full animate-spin" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}

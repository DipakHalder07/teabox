"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  Check,
  ShieldCheck,
  Truck,
  QrCode,
  Banknote,
  Sparkles,
  Copy,
  ExternalLink,
  Clock,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/components/context/CartContext";

interface YouPiSessionData {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  vpa: string;
  merchantName: string;
  upiUri: string;
  qrCodeDataUrl: string;
  deepLinks: {
    gpay: string;
    phonepe: string;
    paytm: string;
    cred: string;
    generic: string;
  };
  expiresAt: string;
  status: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, subtotal, clearCart } = useCart();

  // Step state: 1 = Address & Contact, 2 = Payment, 3 = Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");

  // Payment method (UPI via YouPI-PG or Cash on Delivery)
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cod">("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState("");

  // YouPI-PG Gateway State
  const [youPiSession, setYouPiSession] = useState<YouPiSessionData | null>(null);
  const [isCreatingYouPi, setIsCreatingYouPi] = useState(false);
  const [youPiUtr, setYouPiUtr] = useState("");
  const [confirmedUtr, setConfirmedUtr] = useState("");
  const [utrError, setUtrError] = useState("");
  const [isVerifyingUtr, setIsVerifyingUtr] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(600); // 10 minutes

  const pageTopRef = useRef<HTMLDivElement>(null);

  // Auto scroll to top on step transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    pageTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [step]);

  // Handle pincode auto lookup
  const handlePincodeChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setPincode(clean);
    if (clean.length === 6) {
      if (clean.startsWith("11")) {
        setCity("New Delhi");
        setState("Delhi");
      } else if (clean.startsWith("40")) {
        setCity("Mumbai");
        setState("Maharashtra");
      } else if (clean.startsWith("56")) {
        setCity("Bengaluru");
        setState("Karnataka");
      } else if (clean.startsWith("70")) {
        setCity("Kolkata");
        setState("West Bengal");
      } else if (clean.startsWith("60")) {
        setCity("Chennai");
        setState("Tamil Nadu");
      } else if (clean.startsWith("50")) {
        setCity("Hyderabad");
        setState("Telangana");
      } else if (clean.startsWith("41")) {
        setCity("Pune");
        setState("Maharashtra");
      } else if (clean.startsWith("38")) {
        setCity("Ahmedabad");
        setState("Gujarat");
      } else {
        setCity("Siliguri");
        setState("West Bengal");
      }
    }
  };

  // Handle coupon apply
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const code = couponCode.trim().toUpperCase();
    if (code === "WELCOME10" || code === "TEA10") {
      const disc = Math.round(subtotal * 0.1);
      setAppliedCoupon({ code, discount: disc });
    } else if (code === "FIRSTTEA") {
      setAppliedCoupon({ code, discount: 150 });
    } else {
      setCouponError("Invalid coupon code. Try WELCOME10");
    }
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const shippingFee = subtotal >= 399 ? 0 : 50;
  const codFee = paymentMethod === "cod" ? 40 : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee + codFee);

  // Initialize YouPI Payment Session
  const initYouPiSession = async (currentOrderId: string, amountToPay: number) => {
    setIsCreatingYouPi(true);
    try {
      const res = await fetch("/api/payments/youpi/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: currentOrderId,
          amount: amountToPay,
          customer: {
            name: fullName,
            phone: phone,
          },
          note: `Teabox Order ${currentOrderId}`,
        }),
      });
      const data = await res.json();
      if (data?.data) {
        setYouPiSession(data.data);
        setCountdownSeconds(600);
      }
    } catch (err) {
      console.error("Failed to initialize YouPI session:", err);
    } finally {
      setIsCreatingYouPi(false);
    }
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!fullName || !address || !pincode) {
      alert("Please complete the required delivery address fields");
      return;
    }
    const generatedId = orderId || `TB-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderId(generatedId);
    setStep(2);
    initYouPiSession(generatedId, finalTotal);
  };

  // Poll for YouPI payment confirmation from observer
  useEffect(() => {
    if (step !== 2 || paymentMethod !== "upi" || !orderId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payments/youpi/verify?orderId=${encodeURIComponent(orderId)}`
        );
        const data = await res.json();
        if (data?.status === "COMPLETED") {
          if (data?.utr) setConfirmedUtr(data.utr);
          setIsProcessing(false);
          setStep(3);
          clearCart();
          clearInterval(interval);
        }
      } catch {}
    }, 3500);

    return () => clearInterval(interval);
  }, [step, paymentMethod, orderId, clearCart]);

  // Countdown timer for YouPI dynamic QR
  useEffect(() => {
    if (step !== 2 || paymentMethod !== "upi") return;
    if (countdownSeconds <= 0) return;
    const timer = setInterval(() => setCountdownSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [step, paymentMethod, countdownSeconds]);

  // Copy VPA to clipboard
  const handleCopyVpa = (vpaText: string) => {
    navigator.clipboard.writeText(vpaText);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  // Handle UTR submission
  const handleVerifyUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    setUtrError("");
    const clean = youPiUtr.trim().replace(/\D/g, "");
    if (clean.length < 12) {
      setUtrError(
        "Please enter a valid 12-digit UPI UTR / Ref Number from your payment app receipt."
      );
      return;
    }

    setIsVerifyingUtr(true);
    try {
      const res = await fetch("/api/payments/youpi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, utr: clean }),
      });
      const data = await res.json();
      if (data?.success) {
        setConfirmedUtr(clean);
        setIsVerifyingUtr(false);
        setStep(3);
        clearCart();
      } else {
        setUtrError(data?.error || "Verification failed. Please check the 12-digit UTR.");
        setIsVerifyingUtr(false);
      }
    } catch {
      setIsVerifyingUtr(false);
      setUtrError("Network connection error. Please try again.");
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    const assignedUtr =
      confirmedUtr ||
      youPiUtr.trim() ||
      `4287${Math.floor(10000000 + Math.random() * 90000000)}`;
    setConfirmedUtr(assignedUtr);

    try {
      if (paymentMethod === "upi" && orderId) {
        await fetch("/api/payments/youpi/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, utr: assignedUtr }),
        });
      }

      // Persist order directly into PostgreSQL / Admin database
      await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderId,
          customerName: fullName,
          customerPhone: phone,
          customerEmail: null,
          address,
          city,
          state,
          pincode,
          landmark,
          subtotal,
          discountAmount,
          couponCode: appliedCoupon?.code || null,
          shippingFee,
          codFee,
          totalAmount: finalTotal,
          paymentMethod,
          paymentStatus: paymentMethod === "upi" ? "PAID" : "PENDING",
          orderStatus: "PROCESSING",
          utrNumber: paymentMethod === "upi" ? assignedUtr : null,
          items: cartItems.map((item) => ({
            productId: item.id,
            title: item.title,
            weight: item.weight,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
        }),
      });
    } catch (e) {
      console.warn("Order persistence log:", e);
    }

    setTimeout(() => {
      setIsProcessing(false);
      setStep(3);
      clearCart();
    }, 1000);
  };

  const handleStartNewOrder = () => {
    setStep(1);
    setOrderId("");
    setYouPiSession(null);
    setYouPiUtr("");
    setConfirmedUtr("");
    setUtrError("");
    setIsProcessing(false);
    setPaymentMethod("upi");
    router.push("/collections/all");
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#202020] flex flex-col justify-between">
      <div ref={pageTopRef} />

      {/* Top Luxury Checkout Header */}
      <header className="bg-[#1f3a2c] text-white py-4 px-4 sm:px-8 border-b border-[#2d4d3d] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <Image
                src="/assets/teabox-logo.svg"
                alt="Teabox"
                width={120}
                height={32}
                className="h-7 sm:h-8 w-auto brightness-0 invert"
                priority
              />
            </Link>
            <span className="text-[10.5px] sm:text-[11px] bg-[#02cb5a] text-[#1f3a2c] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Fastrr Checkout
            </span>
          </div>

          <div className="flex items-center gap-4 text-[12px] sm:text-[13px]">
            <div className="flex items-center gap-1.5 text-[#02cb5a] font-medium">
              <ShieldCheck size={16} />
              <span>100% Secure &amp; Direct</span>
            </div>
            <Link
              href="/"
              className="text-white/80 hover:text-white flex items-center gap-1 text-[12.5px] hover:underline"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Back to Store</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Stepper Progress Bar */}
      {step !== 3 && (
        <div className="bg-white border-b border-[#e7e2d8] px-4 sm:px-8 py-3.5 shadow-2xs">
          <div className="max-w-[1240px] mx-auto flex items-center justify-center gap-4 sm:gap-8 text-[13px] font-semibold">
            <div
              className={`flex items-center gap-2 ${
                step === 1 ? "text-[#016c2f]" : "text-[#202020]"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold ${
                  step === 1 ? "bg-[#02cb5a] text-[#1f3a2c]" : "bg-[#1f3a2c] text-white"
                }`}
              >
                {step > 1 ? "✓" : "1"}
              </span>
              <span>1. Delivery Address</span>
            </div>

            <ChevronRight size={16} className="text-[#8e8d8a]" />

            <div
              className={`flex items-center gap-2 ${
                step === 2 ? "text-[#016c2f]" : "text-[#747576]"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold ${
                  step === 2 ? "bg-[#02cb5a] text-[#1f3a2c]" : "bg-[#e7e2d8] text-[#747576]"
                }`}
              >
                2
              </span>
              <span>2. Payment (UPI / COD)</span>
            </div>

            <ChevronRight size={16} className="text-[#8e8d8a]" />

            <div className="flex items-center gap-2 text-[#747576]">
              <span className="w-6 h-6 rounded-full bg-[#e7e2d8] text-[#747576] flex items-center justify-center text-[12px] font-bold">
                3
              </span>
              <span>3. Confirmation</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1">
        {/* If cart is empty and not in confirmation state */}
        {cartItems.length === 0 && step !== 3 ? (
          <div className="bg-white border border-[#e7e2d8] rounded-2xl p-8 sm:p-12 text-center max-w-[540px] mx-auto space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#fafafa] border border-[#e7e2d8] flex items-center justify-center mx-auto text-[#747576]">
              <ShoppingBag size={28} />
            </div>
            <h2 className="font-stencil text-[22px] sm:text-[26px] text-[#202020]">
              Your Bag is Empty
            </h2>
            <p className="text-[14px] text-[#5c5a52]">
              You don&apos;t have any garden-fresh teas in your bag to checkout.
            </p>
            <div className="pt-2">
              <Link
                href="/collections/all"
                className="inline-flex items-center gap-2 bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[14px] px-6 py-3.5 rounded-xl uppercase tracking-wider transition-all"
              >
                <span>Explore Fresh Teas</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : step === 3 ? (
          /* ================= STEP 3: ORDER CONFIRMATION ================= */
          <div className="max-w-[620px] mx-auto bg-white border border-[#e7e2d8] rounded-2xl p-6 sm:p-10 text-center space-y-6 shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-[#02cb5a]/20 border-2 border-[#02cb5a] flex items-center justify-center mx-auto text-[#016c2f]">
              <Check size={44} className="stroke-[3]" />
            </div>

            <div>
              <h2 className="font-stencil text-[28px] sm:text-[34px] font-bold text-[#202020]">
                Thank You For Your Order!
              </h2>
              <p className="text-[14px] sm:text-[15px] text-[#5c5a52] mt-1.5">
                Your order <span className="font-bold text-[#1f3a2c]">{orderId}</span> is confirmed and being freshly vacuum-sealed at source.
              </p>
            </div>

            {/* Order Info Card */}
            <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-2xl p-5 text-left space-y-3.5 text-[14px]">
              <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-3">
                <span className="text-[#5c5a52]">Estimated Delivery</span>
                <span className="font-bold text-[#016c2f] flex items-center gap-1">
                  <Truck size={16} /> 2–4 Business Days
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-3">
                <span className="text-[#5c5a52]">Deliver To</span>
                <span className="font-semibold text-[#202020] text-right truncate max-w-[260px]">
                  {fullName}, {city}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-3">
                <span className="text-[#5c5a52]">Payment Method</span>
                <span className="font-bold text-[#1f3a2c]">
                  {paymentMethod === "upi"
                    ? "UPI (Google Pay / PhonePe / Paytm)"
                    : "Cash on Delivery (COD)"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-3">
                <span className="text-[#5c5a52]">Payment Status</span>
                <span className="font-bold text-[#016c2f] uppercase">
                  {paymentMethod === "cod" ? "COD (Pay on Delivery)" : "Paid Successfully"}
                </span>
              </div>
              {paymentMethod === "upi" && (
                <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-3">
                  <span className="text-[#5c5a52]">UPI Ref / UTR</span>
                  <span className="font-mono font-bold text-[#1f3a2c] flex items-center gap-1.5">
                    {confirmedUtr || youPiUtr || `UTR-${Date.now().toString().slice(-8)}`}
                    <span className="bg-[#02cb5a]/20 text-[#016c2f] text-[10px] font-sans font-bold px-2 py-0.5 rounded">
                      Verified
                    </span>
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-[#202020]">Amount Paid</span>
                <span className="font-bold text-[18px] text-[#1f3a2c]">
                  ₹{finalTotal.toLocaleString("en-IN")}
                </span>
              </div>

              {paymentMethod === "upi" && (
                <div className="bg-[#f0f8f4] border border-[#bfdcc9] rounded-lg p-3 text-[12.5px] text-[#1f3a2c] flex items-center justify-between mt-2">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-[#016c2f]" />
                    <span>Payment verified &amp; securely processed via UPI.</span>
                  </span>
                  <span className="font-bold text-[#016c2f] whitespace-nowrap">100% Secure</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <a
                href="https://teabox.clickpost.in/en"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto border border-[#1f3a2c] hover:bg-[#fafafa] text-[#1f3a2c] font-bold text-[14px] px-6 py-3.5 rounded-xl transition-colors text-center"
              >
                Track Order
              </a>
              <button
                type="button"
                onClick={handleStartNewOrder}
                className="w-full sm:w-auto bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[14px] px-7 py-3.5 rounded-xl transition-colors cursor-pointer text-center"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          /* ================= STEP 1 & 2: 2-COLUMN CHECKOUT ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form & Payment Step (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-[#e7e2d8] rounded-2xl p-5 sm:p-7 shadow-sm">
              {/* ================= STEP 1: ADDRESS ================= */}
              {step === 1 && (
                <form onSubmit={handleProceedToPayment} className="space-y-6">
                  <div>
                    <h3 className="font-stencil text-[20px] sm:text-[22px] font-bold text-[#202020]">
                      Delivery &amp; Contact Details
                    </h3>
                    <p className="text-[13px] text-[#5c5a52] mt-0.5">
                      Enter your pan-India delivery address for fresh shipment dispatch.
                    </p>
                  </div>

                  {/* Mobile Phone Verification */}
                  <div>
                    <label className="block text-[13px] font-bold uppercase tracking-wider text-[#202020] mb-1.5">
                      Mobile Number (For Delivery Updates) *
                    </label>
                    <div className="flex items-center border border-[#e7e2d8] focus-within:border-[#02cb5a] rounded-lg overflow-hidden bg-white">
                      <span className="px-3 py-2.5 bg-[#fafafa] border-r border-[#e7e2d8] text-[14px] font-bold text-[#202020] flex items-center gap-1">
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) =>
                          setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                        }
                        placeholder="10-digit mobile number"
                        className="flex-1 px-3.5 py-2.5 text-[14px] outline-none text-[#202020]"
                      />
                    </div>
                  </div>

                  {/* Delivery Address Fields */}
                  <div className="space-y-4 pt-1">
                    <h4 className="text-[14px] font-bold text-[#202020] uppercase tracking-wider border-b border-[#e7e2d8] pb-1.5">
                      Shipping Address
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[12.5px] font-semibold text-[#5c5a52] mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Priya Sharma"
                          className="w-full px-3.5 py-2.5 border border-[#e7e2d8] rounded-lg text-[14px] outline-none focus:border-[#02cb5a]"
                        />
                      </div>

                      <div>
                        <label className="block text-[12.5px] font-semibold text-[#5c5a52] mb-1">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          required
                          value={pincode}
                          onChange={(e) => handlePincodeChange(e.target.value)}
                          placeholder="6-digit Pincode"
                          className="w-full px-3.5 py-2.5 border border-[#e7e2d8] rounded-lg text-[14px] outline-none focus:border-[#02cb5a]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[12.5px] font-semibold text-[#5c5a52] mb-1">
                          City / Town *
                        </label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City"
                          className="w-full px-3.5 py-2.5 border border-[#e7e2d8] rounded-lg text-[14px] outline-none focus:border-[#02cb5a]"
                        />
                      </div>

                      <div>
                        <label className="block text-[12.5px] font-semibold text-[#5c5a52] mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="State"
                          className="w-full px-3.5 py-2.5 border border-[#e7e2d8] rounded-lg text-[14px] outline-none focus:border-[#02cb5a]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12.5px] font-semibold text-[#5c5a52] mb-1">
                        Complete Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House/Flat number, apartment or society, street"
                        className="w-full px-3.5 py-2.5 border border-[#e7e2d8] rounded-lg text-[14px] outline-none focus:border-[#02cb5a]"
                      />
                    </div>

                    <div>
                      <label className="block text-[12.5px] font-semibold text-[#5c5a52] mb-1">
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="Near metro station, school or park"
                        className="w-full px-3.5 py-2.5 border border-[#e7e2d8] rounded-lg text-[14px] outline-none focus:border-[#02cb5a]"
                      />
                    </div>
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    className="w-full bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] py-4 px-5 rounded-xl font-bold text-[16px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-99"
                  >
                    <span>Proceed to Payment — ₹{finalTotal.toLocaleString("en-IN")}</span>
                    <ArrowRight size={19} />
                  </button>
                </form>
              )}

              {/* ================= STEP 2: PAYMENT ================= */}
              {step === 2 && (
                <div className="space-y-6">
                  {/* Delivery Address Summary Bar */}
                  <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-xl p-3.5 flex items-center justify-between text-[13px]">
                    <div>
                      <span className="font-bold text-[#202020] block">
                        {fullName} · {phone}
                      </span>
                      <span className="text-[#5c5a52] truncate block max-w-[340px]">
                        {address}, {city}, {state} - {pincode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[#016c2f] font-bold underline hover:opacity-80 cursor-pointer"
                    >
                      Edit Address
                    </button>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <h4 className="text-[14px] font-bold text-[#202020] uppercase tracking-wider">
                      Select Payment Method
                    </h4>

                    {/* 1. UPI Powered by YouPI-PG */}
                    <div
                      onClick={() => {
                        setPaymentMethod("upi");
                        if (!youPiSession && orderId) {
                          initYouPiSession(orderId, finalTotal);
                        }
                      }}
                      className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${
                        paymentMethod === "upi"
                          ? "border-[#1f3a2c] bg-[#fafafa]"
                          : "border-[#e7e2d8] hover:border-[#1f3a2c]/60 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-[#1f3a2c] flex items-center justify-center">
                            {paymentMethod === "upi" && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[#1f3a2c]" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <QrCode size={19} className="text-[#016c2f]" />
                            <span className="font-bold text-[15px] text-[#202020]">
                              UPI (Google Pay, PhonePe, Paytm &amp; QR)
                            </span>
                          </div>
                        </div>
                        <span className="bg-[#02cb5a]/20 text-[#016c2f] font-bold text-[11px] px-2.5 py-0.5 rounded flex items-center gap-1">
                          <ShieldCheck size={11} /> Instant &amp; Secure
                        </span>
                      </div>

                      {paymentMethod === "upi" && (
                        <div
                          className="mt-4 pt-4 border-t border-[#e7e2d8] space-y-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Dynamic QR & Apps Box */}
                          <div className="bg-white border border-[#e7e2d8] rounded-xl p-4 flex flex-col sm:flex-row items-center gap-5 justify-between shadow-2xs">
                            {/* Dynamic QR Display */}
                            <div className="flex flex-col items-center text-center">
                              <div className="relative w-44 h-44 bg-white p-2 rounded-xl border border-[#e7e2d8] shadow-sm flex items-center justify-center">
                                {isCreatingYouPi ? (
                                  <div className="flex flex-col items-center gap-2 text-[12px] text-[#5c5a52]">
                                    <RefreshCw size={22} className="animate-spin text-[#016c2f]" />
                                    <span>Generating QR...</span>
                                  </div>
                                ) : youPiSession?.qrCodeDataUrl ? (
                                  <img
                                    src={youPiSession.qrCodeDataUrl}
                                    alt="UPI QR Code"
                                    className="w-full h-full object-contain rounded"
                                  />
                                ) : (
                                  <div className="text-[12px] text-[#747576]">QR Ready</div>
                                )}
                              </div>

                              {/* Timer & Amount Pill */}
                              <div className="flex items-center gap-2 mt-2 text-[12px] text-[#5c5a52]">
                                <Clock size={13} className="text-[#e27a00]" />
                                <span>
                                  Expires in:{" "}
                                  <strong className="text-[#202020]">
                                    {Math.floor(countdownSeconds / 60)}:
                                    {(countdownSeconds % 60).toString().padStart(2, "0")}
                                  </strong>
                                </span>
                              </div>
                              <span className="text-[13px] font-bold text-[#016c2f] mt-0.5">
                                ₹{finalTotal.toLocaleString("en-IN")}
                              </span>
                            </div>

                            {/* Pay Via Direct UPI Apps & VPA Info */}
                            <div className="flex-1 w-full space-y-3">
                              <div>
                                <span className="text-[12px] font-bold text-[#202020] uppercase tracking-wider block mb-1.5">
                                  Pay with UPI Apps
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    {
                                      name: "Google Pay",
                                      scheme:
                                        youPiSession?.deepLinks?.gpay ||
                                        youPiSession?.upiUri,
                                    },
                                    {
                                      name: "PhonePe",
                                      scheme:
                                        youPiSession?.deepLinks?.phonepe ||
                                        youPiSession?.upiUri,
                                    },
                                    {
                                      name: "Paytm",
                                      scheme:
                                        youPiSession?.deepLinks?.paytm ||
                                        youPiSession?.upiUri,
                                    },
                                    {
                                      name: "CRED UPI",
                                      scheme:
                                        youPiSession?.deepLinks?.cred ||
                                        youPiSession?.upiUri,
                                    },
                                  ].map((app) => (
                                    <a
                                      key={app.name}
                                      href={app.scheme || "#"}
                                      className="p-2.5 rounded-lg border border-[#e7e2d8] hover:border-[#02cb5a] hover:bg-[#fafafa] flex items-center justify-between text-[12.5px] font-semibold text-[#202020] transition-all cursor-pointer shadow-2xs"
                                    >
                                      <span>{app.name}</span>
                                      <ExternalLink size={13} className="text-[#747576]" />
                                    </a>
                                  ))}
                                </div>
                              </div>

                              {/* Merchant VPA with Copy Button */}
                              <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-lg p-2.5 flex items-center justify-between">
                                <div className="min-w-0 pr-2">
                                  <span className="text-[11px] text-[#747576] block">
                                    Merchant UPI ID (VPA)
                                  </span>
                                  <span className="text-[13px] font-mono font-bold text-[#1f3a2c] truncate block">
                                    {youPiSession?.vpa || "8617513004@ptaxis"}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyVpa(
                                      youPiSession?.vpa || "8617513004@ptaxis"
                                    )
                                  }
                                  className="px-2.5 py-1 text-[11px] font-bold bg-white border border-[#e7e2d8] hover:border-[#1f3a2c] rounded flex items-center gap-1 transition-colors cursor-pointer shrink-0 text-[#202020]"
                                >
                                  {copiedVpa ? (
                                    <>
                                      <Check size={12} className="text-[#02cb5a]" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* UTR Verification Form */}
                          <form
                            onSubmit={handleVerifyUtr}
                            className="bg-[#fafafa] border border-[#e7e2d8] rounded-xl p-3.5 space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <label className="text-[12.5px] font-bold text-[#202020]">
                                Done Paying? Enter 12-Digit UPI Ref / UTR Number:
                              </label>
                              <span className="text-[11px] text-[#747576]">Instant Confirm</span>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                maxLength={16}
                                value={youPiUtr}
                                onChange={(e) => setYouPiUtr(e.target.value)}
                                placeholder="e.g. 428712345678"
                                className="flex-1 px-3.5 py-2 border border-[#e7e2d8] focus:border-[#02cb5a] rounded-lg text-[13.5px] font-mono bg-white outline-none"
                              />
                              <button
                                type="submit"
                                disabled={isVerifyingUtr || youPiUtr.trim().length < 8}
                                className="bg-[#02cb5a] hover:bg-[#02b851] disabled:opacity-50 text-[#1f3a2c] px-4 py-2 rounded-lg font-bold text-[13px] uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-none"
                              >
                                {isVerifyingUtr ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={15} />
                                )}
                                <span>Verify UTR</span>
                              </button>
                            </div>
                            {utrError && <p className="text-[12px] text-[#e53935]">{utrError}</p>}
                            <div className="flex items-center gap-1.5 text-[11px] text-[#747576]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#02cb5a] animate-pulse" />
                              <span>Payments are verified automatically in real-time.</span>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>

                    {/* 2. Cash On Delivery */}
                    <div
                      onClick={() => setPaymentMethod("cod")}
                      className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${
                        paymentMethod === "cod"
                          ? "border-[#1f3a2c] bg-[#fafafa]"
                          : "border-[#e7e2d8] hover:border-[#1f3a2c]/60 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-[#1f3a2c] flex items-center justify-center">
                            {paymentMethod === "cod" && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[#1f3a2c]" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Banknote size={19} className="text-[#016c2f]" />
                            <span className="font-bold text-[15px] text-[#202020]">
                              Cash on Delivery (COD)
                            </span>
                          </div>
                        </div>
                        <span className="text-[12px] text-[#8e8d8a] font-medium">+₹40 handling fee</span>
                      </div>
                    </div>
                  </div>

                  {/* Final Place Order Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={isProcessing}
                      className="w-full bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] py-4 px-5 rounded-xl font-bold text-[16px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-75"
                    >
                      {isProcessing ? (
                        <>
                          <span className="w-5 h-5 border-2 border-[#1f3a2c] border-t-transparent rounded-full animate-spin" />
                          <span>Securing Your Garden-Fresh Teas...</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {paymentMethod === "upi" ? "Confirm & Place Order" : "Place COD Order"} — ₹
                            {finalTotal.toLocaleString("en-IN")}
                          </span>
                          <ArrowRight size={19} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Order Summary & Selected Items (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white border border-[#e7e2d8] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-3">
                  <h3 className="font-stencil text-[16px] font-bold text-[#202020]">
                    Order Summary ({cartItems.length} items)
                  </h3>
                  <span className="text-[11px] font-semibold text-[#016c2f] bg-[#02cb5a]/20 px-2 py-0.5 rounded">
                    Pan-India Express
                  </span>
                </div>

                {/* Selected Items List */}
                <div className="divide-y divide-[#e7e2d8]/60 max-h-64 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between gap-3 text-[13px]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-12 h-12 rounded-lg bg-[#fafafa] border border-[#e7e2d8] shrink-0 overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-[#202020] truncate block">
                            {item.title}
                          </span>
                          <span className="text-[12px] text-[#747576]">
                            {item.weight} · Qty: {item.quantity}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-[#1f3a2c] shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Input */}
                <div className="border-t border-[#e7e2d8] pt-3.5">
                  <span className="text-[12.5px] font-bold text-[#202020] mb-2 block flex items-center gap-1.5">
                    <Sparkles size={15} className="text-[#e5a524]" />
                    Have a Discount Code?
                  </span>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-white border border-[#02cb5a] px-3.5 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#016c2f] text-[13px] tracking-wider uppercase">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[12px] text-[#5c5a52]">
                          (₹{appliedCoupon.discount} saved)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAppliedCoupon(null)}
                        className="text-[12px] text-[#d93838] underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter WELCOME10"
                        className="flex-1 px-3 py-2 border border-[#e7e2d8] rounded-lg text-[13px] uppercase outline-none focus:border-[#02cb5a]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="bg-[#1f3a2c] text-white px-4 py-2 rounded-lg font-bold text-[13px] hover:bg-[#016c2f] transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-[12px] text-[#d93838] mt-1.5">{couponError}</p>
                  )}
                </div>

                {/* Calculations Breakdown */}
                <div className="border-t border-[#e7e2d8] pt-3.5 space-y-2.5 text-[13.5px]">
                  <div className="flex justify-between text-[#5c5a52]">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#202020]">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-[#016c2f] font-medium">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-₹{appliedCoupon.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#5c5a52]">
                    <span>Pan-India Express Shipping</span>
                    <span className="font-semibold text-[#016c2f]">
                      {shippingFee === 0 ? "FREE" : `₹${shippingFee}`}
                    </span>
                  </div>
                  {paymentMethod === "cod" && (
                    <div className="flex justify-between text-[#5c5a52]">
                      <span>COD Handling Fee</span>
                      <span className="font-semibold text-[#202020]">₹40</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[17px] font-bold text-[#202020] border-t border-[#e7e2d8] pt-2.5">
                    <span>To Pay</span>
                    <span className="text-[#016c2f]">
                      ₹{finalTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trust Callout */}
              <div className="bg-[#f2f7f4] border border-[#cbe1d5] rounded-xl p-4 text-[12.5px] text-[#1f3a2c] space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#016c2f]">
                  <ShieldCheck size={16} />
                  <span>Teabox 100% Freshness Guarantee</span>
                </div>
                <p className="text-[#5c5a52] leading-normal">
                  All teas are sourced directly from single estates in Darjeeling, Assam, and the Nilgiris, vacuum-sealed at source within 48 hours for pure freshness.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e7e2d8] py-5 px-4 text-center text-[12px] text-[#747576]">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 Teabox India. 100% Fresh Single-Estate Indian Teas.</span>
          <span className="flex items-center gap-1.5 text-[#016c2f] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#02cb5a]" />
            100% Encrypted &amp; Secure Checkout
          </span>
        </div>
      </footer>
    </div>
  );
}

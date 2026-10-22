"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Check,
  ShieldCheck,
  Truck,
  QrCode,
  Smartphone,
  Banknote,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Copy,
  ExternalLink,
  Clock,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { useCart } from "./context/CartContext";

interface FastrrCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export default function FastrrCheckoutModal({ isOpen, onClose }: FastrrCheckoutModalProps) {
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
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");

  // Payment method (UPI via YouPI-PG or Cash on Delivery)
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cod">("upi");
  const [upiApp, setUpiApp] = useState<"qr" | "gpay" | "phonepe" | "paytm" | "cred">("qr");
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
    if (!isOpen || step !== 2 || paymentMethod !== "upi" || !orderId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/youpi/verify?orderId=${encodeURIComponent(orderId)}`);
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
  }, [isOpen, step, paymentMethod, orderId, clearCart]);

  // Countdown timer for YouPI dynamic QR
  useEffect(() => {
    if (!isOpen || step !== 2 || paymentMethod !== "upi") return;
    if (countdownSeconds <= 0) return;
    const timer = setInterval(() => setCountdownSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [isOpen, step, paymentMethod, countdownSeconds]);

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
      setUtrError("Please enter a valid 12-digit UPI UTR / Ref Number from your payment app receipt.");
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

  const modalBodyRef = useRef<HTMLDivElement>(null);

  const resetCheckout = () => {
    setStep(1);
    setOrderId("");
    setYouPiSession(null);
    setYouPiUtr("");
    setConfirmedUtr("");
    setUtrError("");
    setIsProcessing(false);
    setPaymentMethod("upi");
  };

  // Reset state whenever modal opens if previous checkout was completed
  useEffect(() => {
    if (isOpen && step === 3) {
      resetCheckout();
    }
  }, [isOpen]);

  const handleClose = () => {
    if (step === 3) {
      resetCheckout();
    }
    onClose();
  };

  // Auto scroll to top on step transition
  useEffect(() => {
    modalBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

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
    } catch {}

    setTimeout(() => {
      setIsProcessing(false);
      setStep(3);
      clearCart();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!isProcessing) handleClose();
        }}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-[760px] bg-white rounded-2xl shadow-2xl border border-[#e7e2d8] overflow-hidden z-50 my-auto flex flex-col max-h-[92vh]">
        {/* Header with Fastrr / Shiprocket Branding */}
        <div className="bg-[#1f3a2c] text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/teabox-logo.svg"
              alt="Teabox"
              width={100}
              height={26}
              className="h-6 w-auto brightness-0 invert"
            />
            <span className="text-[11px] bg-[#02cb5a] text-[#1f3a2c] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Fastrr Checkout
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[12px] text-[#02cb5a] font-medium">
              <ShieldCheck size={16} />
              <span>100% Safe &amp; Encrypted</span>
            </div>
            {step !== 3 && (
              <button
                type="button"
                onClick={handleClose}
                className="text-white/80 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
                aria-label="Close checkout"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Stepper Progress Bar */}
        {step !== 3 && (
          <div className="bg-[#fafafa] border-b border-[#e7e2d8] px-5 sm:px-6 py-3 flex items-center justify-between text-[13px] font-semibold">
            <div className={`flex items-center gap-2 ${step === 1 ? "text-[#016c2f]" : "text-[#202020]"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 1 ? "bg-[#02cb5a] text-[#1f3a2c]" : "bg-[#1f3a2c] text-white"
              }`}>
                {step > 1 ? "✓" : "1"}
              </span>
              <span>1. Delivery Address</span>
            </div>

            <ChevronRight size={16} className="text-[#8e8d8a]" />

            <div className={`flex items-center gap-2 ${step === 2 ? "text-[#016c2f]" : "text-[#747576]"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 2 ? "bg-[#02cb5a] text-[#1f3a2c]" : "bg-[#e7e2d8] text-[#747576]"
              }`}>
                2
              </span>
              <span>2. Payment</span>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div ref={modalBodyRef} className="flex-1 overflow-y-auto p-5 sm:p-7">
          {/* ================= STEP 1: ADDRESS & CONTACT ================= */}
          {step === 1 && (
            <form onSubmit={handleProceedToPayment} className="space-y-6">
              {/* Cart Items Mini Preview */}
              {cartItems.length > 0 && (
                <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[12px] font-bold text-[#202020] uppercase tracking-wider">
                    <span>Selected Teas ({cartItems.length})</span>
                    <span className="text-[#016c2f] font-semibold normal-case">Vacuum-Sealed Fresh</span>
                  </div>
                  <div className="divide-y divide-[#e7e2d8]/70 max-h-32 overflow-y-auto pr-1">
                    {cartItems.map((item) => (
                      <div key={item.id} className="py-2 flex items-center justify-between gap-3 text-[13px]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative w-8 h-8 rounded bg-white border border-[#e7e2d8] shrink-0 overflow-hidden">
                            <Image src={item.image} alt={item.title} fill className="object-contain p-0.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-[#202020] truncate block">{item.title}</span>
                            <span className="text-[11px] text-[#747576]">{item.weight} × {item.quantity}</span>
                          </div>
                        </div>
                        <span className="font-bold text-[#1f3a2c] shrink-0">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
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
                      City *
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
                    Flat / House No. / Building / Street *
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

              {/* Coupon Code Section */}
              <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-xl p-4">
                <span className="text-[13px] font-bold text-[#202020] mb-2 block flex items-center gap-1.5">
                  <Sparkles size={16} className="text-[#e5a524]" />
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
                      className="text-[12px] text-[#d93838] underline"
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

              {/* Order Summary Mini Box */}
              <div className="border-t border-[#e7e2d8] pt-4 space-y-2 text-[13.5px]">
                <div className="flex justify-between text-[#5c5a52]">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="font-semibold text-[#202020]">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-[#016c2f] font-medium">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-₹{appliedCoupon.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#5c5a52]">
                  <span>Express Delivery (Pan-India)</span>
                  <span className="font-semibold text-[#016c2f]">
                    {shippingFee === 0 ? "FREE" : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-[16px] font-bold text-[#202020] border-t border-[#e7e2d8] pt-2">
                  <span>To Pay</span>
                  <span className="text-[#016c2f]">₹{finalTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] py-3.5 px-5 rounded-xl font-bold text-[15px] sm:text-[16px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-99"
              >
                <span>Proceed to Payment — ₹{finalTotal.toLocaleString("en-IN")}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* ================= STEP 2: PAYMENT METHODS ================= */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Delivery Address Summary Bar */}
              <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-xl p-3.5 flex items-center justify-between text-[13px]">
                <div>
                  <span className="font-bold text-[#202020] block">{fullName} · {phone}</span>
                  <span className="text-[#5c5a52] truncate block max-w-[340px]">
                    {address}, {city}, {state} - {pincode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[#016c2f] font-bold underline hover:opacity-80"
                >
                  Edit
                </button>
              </div>

              {/* Payment Methods Accordion */}
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
                    <div className="mt-4 pt-4 border-t border-[#e7e2d8] space-y-4" onClick={(e) => e.stopPropagation()}>
                      {/* UPI Info Sub-banner */}
                      <div className="bg-[#f0f8f4] border border-[#bfdcc9] rounded-lg p-3 text-[12.5px] text-[#1f3a2c] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#02cb5a] animate-ping" />
                          <span>Pay seamlessly using any UPI app or scan the QR code.</span>
                        </div>
                        <span className="text-[11px] font-bold text-[#016c2f] bg-white px-2 py-0.5 rounded border border-[#bfdcc9]">
                          Instant
                        </span>
                      </div>

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
                                  scheme: youPiSession?.deepLinks?.gpay || youPiSession?.upiUri,
                                  color: "#1a73e8",
                                },
                                {
                                  name: "PhonePe",
                                  scheme: youPiSession?.deepLinks?.phonepe || youPiSession?.upiUri,
                                  color: "#5f259f",
                                },
                                {
                                  name: "Paytm",
                                  scheme: youPiSession?.deepLinks?.paytm || youPiSession?.upiUri,
                                  color: "#00b9f5",
                                },
                                {
                                  name: "CRED UPI",
                                  scheme: youPiSession?.deepLinks?.cred || youPiSession?.upiUri,
                                  color: "#000000",
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
                              <span className="text-[11px] text-[#747576] block">Merchant UPI ID (VPA)</span>
                              <span className="text-[13px] font-mono font-bold text-[#1f3a2c] truncate block">
                                {youPiSession?.vpa || "8617513004@ptaxis"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyVpa(youPiSession?.vpa || "8617513004@ptaxis")}
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
                      <form onSubmit={handleVerifyUtr} className="bg-[#fafafa] border border-[#e7e2d8] rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[12.5px] font-bold text-[#202020]">
                            Done Paying? Enter 12-Digit UPI Ref / UTR Number:
                          </label>
                          <span className="text-[11px] text-[#747576]">Instant Auto-Confirm</span>
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

              {/* Final Amount & Pay Button */}
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
                  ) : paymentMethod === "upi" ? (
                    <>
                      <span>Confirm &amp; Place Order — ₹{finalTotal.toLocaleString("en-IN")}</span>
                      <ArrowRight size={19} />
                    </>
                  ) : (
                    <>
                      <span>Pay &amp; Place Order — ₹{finalTotal.toLocaleString("en-IN")}</span>
                      <ArrowRight size={19} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: ORDER SUCCESS ================= */}
          {step === 3 && (
            <div className="text-center py-6 sm:py-8 space-y-5">
              <div className="w-16 h-16 rounded-full bg-[#02cb5a]/20 border-2 border-[#02cb5a] flex items-center justify-center mx-auto text-[#016c2f]">
                <Check size={36} className="stroke-[3]" />
              </div>

              <div>
                <h3 className="font-stencil text-[26px] sm:text-[32px] font-bold text-[#202020]">
                  Thank You For Your Order!
                </h3>
                <p className="text-[14px] sm:text-[15px] text-[#5c5a52] mt-1.5">
                  Your order <span className="font-bold text-[#1f3a2c]">{orderId}</span> is confirmed and being freshly vacuum-sealed at source.
                </p>
              </div>

              {/* Order Info Card */}
              <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-2xl p-5 max-w-[480px] mx-auto text-left space-y-3 text-[13.5px]">
                <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-2.5">
                  <span className="text-[#5c5a52]">Estimated Delivery</span>
                  <span className="font-bold text-[#016c2f] flex items-center gap-1">
                    <Truck size={15} /> 2–4 Business Days
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-2.5">
                  <span className="text-[#5c5a52]">Deliver To</span>
                  <span className="font-semibold text-[#202020] text-right truncate max-w-[220px]">
                    {fullName}, {city}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-2.5">
                  <span className="text-[#5c5a52]">Payment Method</span>
                  <span className="font-bold text-[#1f3a2c]">
                    {paymentMethod === "upi"
                      ? "UPI (Google Pay / PhonePe / Paytm)"
                      : "Cash on Delivery (COD)"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-2.5">
                  <span className="text-[#5c5a52]">Payment Status</span>
                  <span className="font-bold text-[#016c2f] uppercase">
                    {paymentMethod === "cod" ? "COD (Pay on Delivery)" : "Paid Successfully"}
                  </span>
                </div>
                {paymentMethod === "upi" && (
                  <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-2.5">
                    <span className="text-[#5c5a52]">UPI Ref / UTR</span>
                    <span className="font-mono font-bold text-[#1f3a2c] flex items-center gap-1.5">
                      {confirmedUtr || youPiUtr || `UTR-${Date.now().toString().slice(-8)}`}
                      <span className="bg-[#02cb5a]/20 text-[#016c2f] text-[10px] font-sans font-bold px-1.5 py-0.5 rounded">
                        Verified
                      </span>
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-[#202020]">Amount Paid</span>
                  <span className="font-bold text-[16px] text-[#1f3a2c]">
                    ₹{finalTotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {paymentMethod === "upi" && (
                  <div className="bg-[#f0f8f4] border border-[#bfdcc9] rounded-lg p-2.5 text-[12px] text-[#1f3a2c] flex items-center justify-between mt-1">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-[#016c2f]" />
                      <span>Payment verified &amp; securely processed via UPI.</span>
                    </span>
                    <span className="font-bold text-[#016c2f] whitespace-nowrap">100% Secure</span>
                  </div>
                )}
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="https://teabox.clickpost.in/en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto border border-[#1f3a2c] hover:bg-[#fafafa] text-[#1f3a2c] font-bold text-[14px] px-6 py-3 rounded-lg transition-colors"
                >
                  Track Order
                </a>
                <button
                  type="button"
                  onClick={() => {
                    resetCheckout();
                    onClose();
                  }}
                  className="w-full sm:w-auto bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[14px] px-6 py-3 rounded-lg transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Check,
  ShieldCheck,
  Truck,
  CreditCard,
  QrCode,
  Smartphone,
  Building2,
  Banknote,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useCart } from "./context/CartContext";

interface FastrrCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
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

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking" | "cod">("upi");
  const [upiApp, setUpiApp] = useState<"gpay" | "phonepe" | "paytm" | "qr">("qr");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState("");

  if (!isOpen) return null;

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
    setStep(2);
  };

  const handlePlaceOrder = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const generatedId = `TB-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderId(generatedId);
      setIsProcessing(false);
      setStep(3);
      clearCart();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (step !== 3 && !isProcessing) onClose();
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
                onClick={onClose}
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
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {/* ================= STEP 1: ADDRESS & CONTACT ================= */}
          {step === 1 && (
            <form onSubmit={handleProceedToPayment} className="space-y-6">
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

                {/* 1. UPI */}
                <div
                  onClick={() => setPaymentMethod("upi")}
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
                          UPI (Instant &amp; Zero Fee)
                        </span>
                      </div>
                    </div>
                    <span className="bg-[#02cb5a]/20 text-[#016c2f] font-bold text-[11px] px-2 py-0.5 rounded">
                      Fastest
                    </span>
                  </div>

                  {paymentMethod === "upi" && (
                    <div className="mt-4 pt-4 border-t border-[#e7e2d8] grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: "qr", label: "Scan QR", icon: QrCode },
                        { id: "gpay", label: "Google Pay", icon: Smartphone },
                        { id: "phonepe", label: "PhonePe", icon: Smartphone },
                        { id: "paytm", label: "Paytm", icon: Smartphone },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUpiApp(item.id as any);
                            }}
                            className={`p-3 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                              upiApp === item.id
                                ? "border-[#02cb5a] bg-[#02cb5a]/10 font-bold text-[#1f3a2c]"
                                : "border-[#e7e2d8] bg-white text-[#5c5a52]"
                            }`}
                          >
                            <Icon size={18} />
                            <span className="text-[12px]">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Cards */}
                <div
                  onClick={() => setPaymentMethod("card")}
                  className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${
                    paymentMethod === "card"
                      ? "border-[#1f3a2c] bg-[#fafafa]"
                      : "border-[#e7e2d8] hover:border-[#1f3a2c]/60 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-[#1f3a2c] flex items-center justify-center">
                      {paymentMethod === "card" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#1f3a2c]" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard size={19} className="text-[#016c2f]" />
                      <span className="font-bold text-[15px] text-[#202020]">
                        Credit / Debit Cards
                      </span>
                    </div>
                  </div>

                  {paymentMethod === "card" && (
                    <div className="mt-4 pt-4 border-t border-[#e7e2d8] space-y-3">
                      <input
                        type="text"
                        placeholder="Card Number (XXXX XXXX XXXX XXXX)"
                        className="w-full px-3.5 py-2 border border-[#e7e2d8] rounded-lg text-[13.5px] outline-none"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="MM / YY"
                          className="w-full px-3.5 py-2 border border-[#e7e2d8] rounded-lg text-[13.5px] outline-none"
                        />
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="CVV"
                          className="w-full px-3.5 py-2 border border-[#e7e2d8] rounded-lg text-[13.5px] outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. NetBanking */}
                <div
                  onClick={() => setPaymentMethod("netbanking")}
                  className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${
                    paymentMethod === "netbanking"
                      ? "border-[#1f3a2c] bg-[#fafafa]"
                      : "border-[#e7e2d8] hover:border-[#1f3a2c]/60 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-[#1f3a2c] flex items-center justify-center">
                      {paymentMethod === "netbanking" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#1f3a2c]" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 size={19} className="text-[#016c2f]" />
                      <span className="font-bold text-[15px] text-[#202020]">
                        NetBanking
                      </span>
                    </div>
                  </div>
                  {paymentMethod === "netbanking" && (
                    <div className="mt-3 text-[12.5px] text-[#5c5a52]">
                      Supports SBI, HDFC, ICICI, Axis, Kotak, and 50+ other Indian banks.
                    </div>
                  )}
                </div>

                {/* 4. Cash On Delivery */}
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
              <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-2xl p-5 max-w-[460px] mx-auto text-left space-y-3 text-[13.5px]">
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
                  <span className="text-[#5c5a52]">Payment Status</span>
                  <span className="font-bold text-[#016c2f] uppercase">
                    {paymentMethod === "cod" ? "COD (Pay on Delivery)" : "Paid Successfully"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-[#202020]">Amount Paid</span>
                  <span className="font-bold text-[16px] text-[#1f3a2c]">
                    ₹{finalTotal.toLocaleString("en-IN")}
                  </span>
                </div>
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
                  onClick={onClose}
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

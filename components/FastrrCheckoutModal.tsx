"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Check,
  ShieldCheck,
  Truck,
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
import { cleanIndianPhone } from "@/lib/validations/checkout";
import TeaPayPanel, { cancelTeaPaySession, PaymentLeaveDialog, TeaPaySessionView } from "./TeaPayPanel";

interface FastrrCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// "native": the shop's own UPI gateway (TeaPay). "manual": shop QR + typed UTR (used without a database).
interface UpiSessionData extends Partial<Omit<TeaPaySessionView, "status">> {
  mode: "native" | "manual";
  status: string;
  paymentId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  vpa?: string;
  merchantName?: string;
  expiresAt?: string;
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

  // Payment method (UPI via TeaPay or Cash on Delivery)
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cod">("upi");
  const [upiApp, setUpiApp] = useState<"qr" | "gpay" | "phonepe" | "paytm" | "cred">("qr");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState("");

  // UPI payment state
  const [upiSession, setUpiSession] = useState<UpiSessionData | null>(null);
  const [isCreatingUpi, setIsCreatingUpi] = useState(false);
  const [upiUtr, setUpiUtr] = useState("");
  const [confirmedUtr, setConfirmedUtr] = useState("");
  const [utrError, setUtrError] = useState("");
  const [isVerifyingUtr, setIsVerifyingUtr] = useState(false);
  // paymentConfirmed: the bank credit was matched (the order was created on the server). utrSubmitted: manual-UPI UTR, unverified.
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [utrSubmitted, setUtrSubmitted] = useState(false);
  const persistOrderRef = useRef<(utr: string | null) => Promise<void>>(async () => {});
  // Leaving while the UPI payment is open asks first (PaymentLeaveDialog).
  const [leaveAction, setLeaveAction] = useState<null | (() => void)>(null);
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(600); // 10 minutes

  // Handle phone number input & autofill sanitization (+91 or leading 0 removal)
  const handlePhoneChange = (val: string) => {
    const cleaned = cleanIndianPhone(val);
    setPhone(cleaned);
  };

  // Automatically clean phone when browser autofills (+91 or leading 0)
  useEffect(() => {
    if (phone) {
      const cleaned = cleanIndianPhone(phone);
      if (cleaned !== phone) {
        setPhone(cleaned);
      }
    }
  }, [phone]);

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

  // If previous order was completed (step === 3) but user now has items in their cart,
  // ensure we display the active checkout flow (step 1) rather than the old confirmation.
  const isConfirmation = step === 3 && cartItems.length === 0;
  const effectiveStep = isConfirmation ? 3 : step === 3 ? 1 : step;

  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null);
  const latestTotalRef = useRef(finalTotal);
  useEffect(() => {
    if (finalTotal > 0 && cartItems.length > 0) {
      latestTotalRef.current = finalTotal;
    }
  }, [finalTotal, cartItems.length]);

  // Starts the UPI step: the shop's own gateway first, manual UPI if it is unavailable.
  const initUpiSession = async (currentOrderId: string, amountToPay: number) => {
    setIsCreatingUpi(true);
    try {
      const startRes = await fetch("/api/pay/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: fullName,
          customerPhone: phone,
          customerEmail: null,
          address,
          city,
          state,
          pincode,
          landmark: landmark || null,
          couponCode: appliedCoupon?.code || null,
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
      const started = await startRes.json().catch(() => ({}));
      if (startRes.ok) {
        setUpiSession({ mode: "native", ...started });
        setOrderId(started.orderNumber);
        if (typeof started.orderTotal === "number") {
          setConfirmedTotal(started.orderTotal);
        }
        return;
      }
      if (started?.fallback !== "manual") {
        alert(started?.error || "Could not start UPI payment. Please try again or choose Cash on Delivery.");
        return;
      }

      // Manual UPI fallback (no database)
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
        setUpiSession(data.data);
        setCountdownSeconds(600);
      }
    } catch (err) {
      console.error("Failed to start UPI payment:", err);
    } finally {
      setIsCreatingUpi(false);
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
    initUpiSession(generatedId, finalTotal);
  };

  // Manual UPI: poll payment status
  useEffect(() => {
    if (!isOpen || step !== 2 || paymentMethod !== "upi" || !orderId) return;
    if (upiSession?.mode === "native") return; // TeaPayPanel watches the payment itself

    let done = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/youpi/verify?orderId=${encodeURIComponent(orderId)}`);
        const data = await res.json();
        if (data?.status === "COMPLETED" && !done) {
          done = true;
          clearInterval(interval);
          if (data?.utr) setConfirmedUtr(data.utr);
          setPaymentConfirmed(true);
          const currentTotal = latestTotalRef.current > 0 ? latestTotalRef.current : finalTotal;
          setConfirmedTotal(currentTotal);
          await persistOrderRef.current(data?.utr || null);
          setIsProcessing(false);
          setStep(3);
          clearCart();
        }
      } catch {}
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, step, paymentMethod, orderId, clearCart, upiSession?.mode]);

  // Countdown timer for the manual-UPI QR
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
    const clean = upiUtr.trim().replace(/\D/g, "");
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
        setUtrSubmitted(true);
        setIsVerifyingUtr(false);
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
    setUpiSession(null);
    setUpiUtr("");
    setConfirmedUtr("");
    setUtrError("");
    setPaymentConfirmed(false);
    setUtrSubmitted(false);
    setIsProcessing(false);
    setPaymentMethod("upi");
    setConfirmedTotal(null);
  };

  // Reset state whenever modal opens if previous checkout was completed
  useEffect(() => {
    if (isOpen && step === 3) {
      resetCheckout();
    }
  }, [isOpen]);

  // Reset state whenever new items are added to cart after a completed order
  useEffect(() => {
    if (cartItems.length > 0 && step === 3) {
      resetCheckout();
    }
  }, [cartItems.length, step]);

  const closeNow = () => {
    if (step === 3) {
      resetCheckout();
    }
    onClose();
  };
  // Leaving mid-payment starts the checkout over next time.
  const leaveCheckout = () => {
    if (paymentInProgress) resetCheckout();
    closeNow();
  };
  const handleClose = () => guardLeave(leaveCheckout);

  // Auto scroll to top on step transition
  useEffect(() => {
    modalBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Saves the order. The server decides the payment status; the browser only reports the UTR it knows.
  const persistOrder = async (utr: string | null) => {
    try {
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
          utrNumber: paymentMethod === "upi" ? utr : null,
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
  };
  useEffect(() => {
    persistOrderRef.current = persistOrder;
  });

  // The bank credit was matched and the server created the order: show the confirmation.
  const handleUpiPaid = (view: TeaPaySessionView) => {
    setPaymentConfirmed(true);
    if (view.utr) setConfirmedUtr(view.utr);
    setOrderId(view.orderNumber);
    const verifiedTotal = view.orderTotal || (latestTotalRef.current > 0 ? latestTotalRef.current : finalTotal);
    setConfirmedTotal(verifiedTotal);
    setStep(3);
    clearCart();
  };

  const paymentInProgress =
    step === 2 && paymentMethod === "upi" && upiSession?.mode === "native" && !paymentConfirmed;
  const guardLeave = (proceed: () => void) => {
    if (paymentInProgress) setLeaveAction(() => proceed);
    else proceed();
  };

  // Start over with a fresh payment (and order number).
  const restartUpiSession = () => {
    if (upiSession?.mode === "native" && upiSession.sessionId) cancelTeaPaySession(upiSession.sessionId);
    const newOrderId = `TB-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderId(newOrderId);
    setUpiSession(null);
    initUpiSession(newOrderId, finalTotal);
  };

  const handleSelectCod = () => {
    if (upiSession?.mode === "native" && !paymentConfirmed) {
      if (upiSession.sessionId) cancelTeaPaySession(upiSession.sessionId);
      setUpiSession(null);
      setOrderId(`TB-${Math.floor(100000 + Math.random() * 900000)}`);
    }
    setPaymentMethod("cod");
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === "upi" && !paymentConfirmed && !utrSubmitted) {
      const msg =
        upiSession?.mode === "native"
          ? "Please complete the UPI payment above. Your order is placed automatically once it is received."
          : "Please pay using the QR / UPI app, then enter your 12-digit UTR to place the order.";
      setUtrError(msg);
      alert(msg);
      return;
    }

    const currentTotal = latestTotalRef.current > 0 ? latestTotalRef.current : finalTotal;
    setConfirmedTotal(currentTotal);
    setIsProcessing(true);
    await persistOrder(confirmedUtr || null);

    setTimeout(() => {
      setIsProcessing(false);
      setStep(3);
      clearCart();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <>
    {leaveAction && upiSession?.sessionId && (
      <PaymentLeaveDialog
        sessionId={upiSession.sessionId}
        payAmount={upiSession.payAmount || String(finalTotal)}
        onStay={() => setLeaveAction(null)}
        onLeave={() => {
          const proceed = leaveAction;
          setLeaveAction(null);
          setUpiSession(null);
          proceed();
        }}
      />
    )}
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
            <span className="font-stencil text-[20px] sm:text-[22px] font-bold tracking-wider text-white">
              DEMOBOX
            </span>
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
        {effectiveStep !== 3 && (
          <div className="bg-[#fafafa] border-b border-[#e7e2d8] px-5 sm:px-6 py-3 flex items-center justify-between text-[13px] font-semibold">
            <div className={`flex items-center gap-2 ${effectiveStep === 1 ? "text-[#016c2f]" : "text-[#202020]"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                effectiveStep === 1 ? "bg-[#02cb5a] text-[#1f3a2c]" : "bg-[#1f3a2c] text-white"
              }`}>
                {effectiveStep > 1 ? "✓" : "1"}
              </span>
              <span>1. Delivery Address</span>
            </div>

            <ChevronRight size={16} className="text-[#8e8d8a]" />

            <div className={`flex items-center gap-2 ${effectiveStep === 2 ? "text-[#016c2f]" : "text-[#747576]"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                effectiveStep === 2 ? "bg-[#02cb5a] text-[#1f3a2c]" : "bg-[#e7e2d8] text-[#747576]"
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
          {effectiveStep === 1 && (
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
                            <Image src={item.image} alt={item.title} fill sizes="32px" className="object-cover" />
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
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData("text");
                      if (pasted) {
                        e.preventDefault();
                        handlePhoneChange(pasted);
                      }
                    }}
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
          {effectiveStep === 2 && (
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
                  onClick={() => guardLeave(() => setStep(1))}
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

                {/* 1. UPI (TeaPay) */}
                <div
                  onClick={() => {
                    setPaymentMethod("upi");
                    if (!upiSession && orderId) {
                      initUpiSession(orderId, finalTotal);
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
                        <Image src="/assets/upi/upi.svg" alt="UPI" width={44} height={16} className="h-4 w-auto" />
                        <span className="font-bold text-[15px] text-[#202020]">Pay by UPI</span>
                        <span className="hidden sm:flex items-center gap-1 ml-1">
                          {["gpay", "phonepe", "paytm", "cred", "bhim"].map((app) => (
                            <Image key={app} src={`/assets/upi/${app}.png`} alt="" width={20} height={20} className="rounded" />
                          ))}
                        </span>
                      </div>
                    </div>
                    <span className="bg-[#02cb5a]/20 text-[#016c2f] font-bold text-[11px] px-2.5 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck size={11} /> Instant &amp; Secure
                    </span>
                  </div>

                  {paymentMethod === "upi" && upiSession?.mode === "native" && (
                    <div className="mt-4 pt-4 border-t border-[#e7e2d8]" onClick={(e) => e.stopPropagation()}>
                      <TeaPayPanel
                        key={upiSession.sessionId}
                        session={upiSession as TeaPaySessionView}
                        onPaid={handleUpiPaid}
                        onRestart={restartUpiSession}
                        onBackPressed={() => guardLeave(leaveCheckout)}
                      />
                    </div>
                  )}

                  {paymentMethod === "upi" && upiSession?.mode !== "native" && (
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
                            {isCreatingUpi ? (
                              <div className="flex flex-col items-center gap-2 text-[12px] text-[#5c5a52]">
                                <RefreshCw size={22} className="animate-spin text-[#016c2f]" />
                                <span>Generating QR...</span>
                              </div>
                            ) : upiSession?.qrCodeDataUrl ? (
                              <img
                                src={upiSession.qrCodeDataUrl}
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
                                  scheme: upiSession?.deepLinks?.gpay || upiSession?.upiUri,
                                  color: "#1a73e8",
                                },
                                {
                                  name: "PhonePe",
                                  scheme: upiSession?.deepLinks?.phonepe || upiSession?.upiUri,
                                  color: "#5f259f",
                                },
                                {
                                  name: "Paytm",
                                  scheme: upiSession?.deepLinks?.paytm || upiSession?.upiUri,
                                  color: "#00b9f5",
                                },
                                {
                                  name: "CRED UPI",
                                  scheme: upiSession?.deepLinks?.cred || upiSession?.upiUri,
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
                                {upiSession?.vpa || ""}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyVpa(upiSession?.vpa || "")}
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
                          <span className="text-[11px] text-[#747576]">Matched with our bank record</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={16}
                            value={upiUtr}
                            onChange={(e) => setUpiUtr(e.target.value)}
                            placeholder="e.g. 428712345678"
                            className="flex-1 px-3.5 py-2 border border-[#e7e2d8] focus:border-[#02cb5a] rounded-lg text-[13.5px] font-mono bg-white outline-none"
                          />
                          <button
                            type="submit"
                            disabled={isVerifyingUtr || upiUtr.trim().length < 8}
                            className="bg-[#02cb5a] hover:bg-[#02b851] disabled:opacity-50 text-[#1f3a2c] px-4 py-2 rounded-lg font-bold text-[13px] uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-none"
                          >
                            {isVerifyingUtr ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={15} />
                            )}
                            <span>Submit UTR</span>
                          </button>
                        </div>
                        {utrError && <p className="text-[12px] text-[#e53935]">{utrError}</p>}
                        {utrSubmitted && (
                          <p className="text-[12px] text-[#016c2f] font-semibold">
                            UTR received. Tap &ldquo;Confirm &amp; Place Order&rdquo; below. We dispatch once your payment is matched with our bank record.
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 text-[11px] text-[#747576]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#02cb5a] animate-pulse" />
                          <span>Waiting for your payment. This screen updates when it is received.</span>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

                {/* 2. Cash On Delivery */}
                <div
                  onClick={handleSelectCod}
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
          {effectiveStep === 3 && (
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
                    {paymentMethod === "cod"
                      ? "COD (Pay on Delivery)"
                      : paymentConfirmed
                        ? "Paid Successfully"
                        : "Pending Bank Confirmation"}
                  </span>
                </div>
                {paymentMethod === "upi" && confirmedUtr && (
                  <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-2.5">
                    <span className="text-[#5c5a52]">UPI Ref / UTR</span>
                    <span className="font-mono font-bold text-[#1f3a2c] flex items-center gap-1.5">
                      {confirmedUtr}
                      <span className="bg-[#02cb5a]/20 text-[#016c2f] text-[10px] font-sans font-bold px-1.5 py-0.5 rounded">
                        {paymentConfirmed ? "Verified" : "Awaiting check"}
                      </span>
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-[#202020]">{paymentConfirmed ? "Amount Paid" : "Order Total"}</span>
                  <span className="font-bold text-[16px] text-[#1f3a2c]">
                    ₹{(confirmedTotal ?? (latestTotalRef.current > 0 ? latestTotalRef.current : finalTotal)).toLocaleString("en-IN")}
                  </span>
                </div>

                {paymentMethod === "upi" && (
                  <div className="bg-[#f0f8f4] border border-[#bfdcc9] rounded-lg p-2.5 text-[12px] text-[#1f3a2c] flex items-center justify-between mt-1">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-[#016c2f]" />
                      <span>{paymentConfirmed ? "Payment verified & securely processed via UPI." : "We will confirm your UPI payment against our bank record, then dispatch your order."}</span>
                    </span>
                    <span className="font-bold text-[#016c2f] whitespace-nowrap">100% Secure</span>
                  </div>
                )}
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/order/${orderId}`}
                  onClick={() => {
                    resetCheckout();
                    onClose();
                  }}
                  className="w-full sm:w-auto bg-[#1f3a2c] hover:bg-[#14281e] text-white font-bold text-[14px] px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Track Live Order &amp; Invoice</span>
                  <ArrowRight size={14} />
                </Link>
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
    </>
  );
}

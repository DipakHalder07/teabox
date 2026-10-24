"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  ArrowRight,
  ChevronRight,
  Check,
  ShieldCheck,
  Truck,
  Banknote,
  Sparkles,
  ArrowLeft,
  ShoppingBag,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { useCart } from "@/components/context/CartContext";
import {
  checkoutShippingSchema,
  CheckoutShippingFormData,
  cleanIndianPhone,
} from "@/lib/validations/checkout";
import ManualUpiPanel from "@/components/ManualUpiPanel";
import TeaPayPanel, { cancelTeaPaySession, PaymentLeaveDialog, TeaPaySessionView } from "@/components/TeaPayPanel";
import { newOrderNumber } from "@/lib/orderNumber";
import { useCodAvailable } from "@/lib/useCodAvailable";

// "native": the shop's own UPI gateway (TeaPay). "manual": shop QR, confirmed by the shop against the bank (used without a database).
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

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, subtotal, clearCart, hasHydrated } = useCart();

  // Step state: 1 = Address & Contact, 2 = Payment, 3 = Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");

  // Payment method (UPI via TeaPay or Cash on Delivery)
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cod">("upi");
  const [codAvailable, setCodAvailable] = useCodAvailable();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState("");

  // UPI payment state
  const [upiSession, setUpiSession] = useState<UpiSessionData | null>(null);
  const [isCreatingUpi, setIsCreatingUpi] = useState(false);
  const [confirmedUtr, setConfirmedUtr] = useState("");
  // paymentConfirmed: the bank credit was matched (the order was created on the server).
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const persistOrderRef = useRef<(utr: string | null) => Promise<string | null>>(async () => null);
  // Leaving while the UPI payment is open asks first (PaymentLeaveDialog).
  const [leaveAction, setLeaveAction] = useState<null | (() => void)>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(600); // 10 minutes

  const pageTopRef = useRef<HTMLDivElement>(null);

  // React Hook Form with Zod Resolver
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutShippingFormData>({
    resolver: zodResolver(checkoutShippingSchema) as any,
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      pincode: "",
      address: "",
      city: "",
      state: "",
      landmark: "",
      paymentMethod: "upi",
    },
  });

  const formValues = watch();

  // Signed-in customer: fill their account email so the order appears under My Orders
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("teabox_customer_user") || "null");
      if (saved?.email) setValue("email", saved.email);
    } catch {}
  }, [setValue]);

  // Auto scroll to top on step transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    pageTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [step]);

  // Handle phone number input & autofill sanitization
  const handlePhoneChange = (val: string) => {
    const cleaned = cleanIndianPhone(val);
    setValue("phone", cleaned, { shouldValidate: true });
  };

  // Automatically clean phone when browser autofills (+91 or leading 0)
  useEffect(() => {
    if (formValues.phone) {
      const cleaned = cleanIndianPhone(formValues.phone);
      if (cleaned !== formValues.phone) {
        setValue("phone", cleaned, { shouldValidate: true });
      }
    }
  }, [formValues.phone, setValue]);

  // Handle pincode auto lookup
  const handlePincodeChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setValue("pincode", clean, { shouldValidate: true });

    if (clean.length === 6) {
      if (clean.startsWith("11")) {
        setValue("city", "New Delhi", { shouldValidate: true });
        setValue("state", "Delhi", { shouldValidate: true });
      } else if (clean.startsWith("40")) {
        setValue("city", "Mumbai", { shouldValidate: true });
        setValue("state", "Maharashtra", { shouldValidate: true });
      } else if (clean.startsWith("56")) {
        setValue("city", "Bengaluru", { shouldValidate: true });
        setValue("state", "Karnataka", { shouldValidate: true });
      } else if (clean.startsWith("70")) {
        setValue("city", "Kolkata", { shouldValidate: true });
        setValue("state", "West Bengal", { shouldValidate: true });
      } else if (clean.startsWith("60")) {
        setValue("city", "Chennai", { shouldValidate: true });
        setValue("state", "Tamil Nadu", { shouldValidate: true });
      } else if (clean.startsWith("50")) {
        setValue("city", "Hyderabad", { shouldValidate: true });
        setValue("state", "Telangana", { shouldValidate: true });
      } else if (clean.startsWith("41")) {
        setValue("city", "Pune", { shouldValidate: true });
        setValue("state", "Maharashtra", { shouldValidate: true });
      } else if (clean.startsWith("38")) {
        setValue("city", "Ahmedabad", { shouldValidate: true });
        setValue("state", "Gujarat", { shouldValidate: true });
      } else {
        setValue("city", "Siliguri", { shouldValidate: true });
        setValue("state", "West Bengal", { shouldValidate: true });
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
      toast.success("Coupon Applied!", {
        description: `₹${disc} discount applied with code ${code}`,
      });
    } else if (code === "FIRSTTEA") {
      setAppliedCoupon({ code, discount: 150 });
      toast.success("Coupon Applied!", {
        description: "₹150 discount applied with code FIRSTTEA",
      });
    } else {
      setCouponError("Invalid coupon code. Try WELCOME10 or FIRSTTEA");
      toast.error("Invalid coupon code", {
        description: "Please check your code or try WELCOME10",
      });
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
          customerName: formValues.fullName,
          customerPhone: formValues.phone,
          customerEmail: formValues.email || null,
          address: formValues.address,
          city: formValues.city,
          state: formValues.state,
          pincode: formValues.pincode,
          landmark: formValues.landmark || null,
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
        toast.error("UPI unavailable", {
          description: started?.error || "Please try again or choose Cash on Delivery.",
        });
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
            name: formValues.fullName,
            phone: formValues.phone,
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

  // Step 1 Form Submission (Validated by Zod via React Hook Form)
  const onShippingSubmit = (data: CheckoutShippingFormData) => {
    const generatedId = orderId || newOrderNumber();
    setOrderId(generatedId);
    setStep(2);
    initUpiSession(generatedId, finalTotal);
    toast.success("Address Saved", {
      description: "Proceed to payment selection",
    });
  };

  // Manual UPI: poll payment status
  useEffect(() => {
    if (step !== 2 || paymentMethod !== "upi" || !orderId) return;
    if (upiSession?.mode === "native") return; // TeaPayPanel watches the payment itself

    let done = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payments/youpi/verify?orderId=${encodeURIComponent(orderId)}`
        );
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
          toast.success("UPI Payment Confirmed!", {
            description: `Order #${orderId} verified successfully.`,
          });
        }
      } catch {}
    }, 3500);

    return () => clearInterval(interval);
  }, [step, paymentMethod, orderId, clearCart, upiSession?.mode]);

  // Countdown timer for the manual-UPI QR
  useEffect(() => {
    if (step !== 2 || paymentMethod !== "upi") return;
    if (countdownSeconds <= 0) return;
    const timer = setInterval(() => setCountdownSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [step, paymentMethod, countdownSeconds]);

  // Saves the order. The server decides the payment status; the browser only reports the UTR it knows.
  // Returns an error message when the order was not saved.
  const persistOrder = async (utr: string | null): Promise<string | null> => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderId,
          customerName: formValues.fullName,
          customerPhone: formValues.phone,
          customerEmail: formValues.email || null,
          address: formValues.address,
          city: formValues.city,
          state: formValues.state,
          pincode: formValues.pincode,
          landmark: formValues.landmark || null,
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return data?.error || "Could not place the order. Please try again.";
      }
      return null;
    } catch (e) {
      console.warn("Order persistence log:", e);
      return "Network error. Please check your connection and try again.";
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
    toast.success("UPI Payment Confirmed!", {
      description: `Order #${view.orderNumber} verified successfully.`,
    });
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
    const newOrderId = newOrderNumber();
    setOrderId(newOrderId);
    setUpiSession(null);
    initUpiSession(newOrderId, finalTotal);
  };

  const handleSelectCod = () => {
    if (upiSession?.mode === "native" && !paymentConfirmed) {
      if (upiSession.sessionId) cancelTeaPaySession(upiSession.sessionId);
      setUpiSession(null);
      setOrderId(newOrderNumber());
    }
    setPaymentMethod("cod");
  };

  const handlePlaceOrder = async () => {
    // Gateway UPI orders are created by the server when the money arrives; nothing to place by hand.
    if (paymentMethod === "upi" && upiSession?.mode === "native" && !paymentConfirmed) return;

    const currentTotal = latestTotalRef.current > 0 ? latestTotalRef.current : finalTotal;
    setConfirmedTotal(currentTotal);
    setIsProcessing(true);
    const error = await persistOrder(confirmedUtr || null);
    if (error) {
      setIsProcessing(false);
      if (paymentMethod === "cod" && /cash on delivery/i.test(error)) {
        setCodAvailable(false);
        setPaymentMethod("upi");
      }
      toast.error("Order not placed", { description: error });
      return;
    }

    toast.success("Order Placed Successfully!", {
      description: `Order #${orderId} has been received.`,
    });

    setTimeout(() => {
      setIsProcessing(false);
      setStep(3);
      clearCart();
    }, 800);
  };

  const resetOrderState = () => {
    setStep(1);
    setOrderId("");
    setUpiSession(null);
    setConfirmedUtr("");
    setPaymentConfirmed(false);
    setIsProcessing(false);
    setPaymentMethod("upi");
    setConfirmedTotal(null);
  };

  const handleStartNewOrder = () => {
    resetOrderState();
    router.push("/collections/all");
  };

  // If previous order is completed (step === 3) but user now has items in cart,
  // automatically reset back to step 1 for the new order.
  useEffect(() => {
    if (cartItems.length > 0 && step === 3) {
      resetOrderState();
    }
  }, [cartItems.length, step]);

  // Clean up completed order state when navigating away so returning starts clean
  useEffect(() => {
    return () => {
      if (step === 3) {
        resetOrderState();
      }
    };
  }, [step]);

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#202020] flex flex-col justify-between">
      <div ref={pageTopRef} />
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

      {/* Top Luxury Checkout Header */}
      <header className="bg-[#1f3a2c] text-white py-3.5 sm:py-4 px-3.5 sm:px-8 border-b border-[#2d4d3d] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/"
              onClick={() => {
                if (step === 3) resetOrderState();
              }}
              className="hover:opacity-90 transition-opacity shrink-0"
            >
              <span className="font-stencil text-[20px] sm:text-[24px] font-bold tracking-wider text-white">
                DEMOBOX
              </span>
            </Link>
            <span className="hidden sm:inline-block text-[10.5px] sm:text-[11px] bg-[#02cb5a] text-[#1f3a2c] font-bold px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
              Fastrr 1-Click Checkout
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[13px] text-[#bfdcc9] shrink-0">
            <span className="hidden sm:flex items-center gap-1.5 text-[#02cb5a] font-semibold">
              <ShieldCheck size={16} /> 256-Bit SSL Encrypted
            </span>
            <Link
              href="/collections/all"
              onClick={(e) => {
                if (step === 3) resetOrderState();
                if (paymentInProgress) {
                  e.preventDefault();
                  guardLeave(() => router.push("/collections/all"));
                }
              }}
              className="text-white hover:text-[#02cb5a] text-[12.5px] sm:text-[13px] flex items-center gap-1 font-medium transition-colors whitespace-nowrap"
            >
              <ArrowLeft size={14} />
              <span>Back to Store</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Checkout Progress Stepper (Only for Step 1 & 2) */}
      {effectiveStep !== 3 && (
        <div className="bg-white border-b border-[#e7e2d8] py-2.5 sm:py-3.5 px-3 sm:px-4">
          <div className="max-w-[700px] mx-auto flex items-center justify-between text-[12px] sm:text-[13px] font-semibold">
            <div
              className={`flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
                effectiveStep === 1 ? "text-[#016c2f]" : "text-[#202020]"
              }`}
              onClick={() => guardLeave(() => setStep(1))}
            >
              <span
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[11px] sm:text-[12px] font-bold shrink-0 ${
                  effectiveStep === 1 ? "bg-[#02cb5a] text-[#1f3a2c]" : "bg-[#e7e2d8] text-[#202020]"
                }`}
              >
                1
              </span>
              <span>
                <span className="hidden sm:inline">1. Delivery </span>Address
              </span>
            </div>

            <ChevronRight size={14} className="text-[#8e8d8a] shrink-0" />

            <div
              className={`flex items-center gap-1.5 sm:gap-2 ${
                effectiveStep === 2 ? "text-[#016c2f]" : "text-[#747576]"
              }`}
            >
              <span
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[11px] sm:text-[12px] font-bold shrink-0 ${
                  effectiveStep === 2 ? "bg-[#02cb5a] text-[#1f3a2c]" : "bg-[#e7e2d8] text-[#747576]"
                }`}
              >
                2
              </span>
              <span>
                <span className="hidden sm:inline">2. </span>Payment<span className="hidden sm:inline">{codAvailable ? " (UPI / COD)" : " (UPI)"}</span>
              </span>
            </div>

            <ChevronRight size={14} className="text-[#8e8d8a] shrink-0" />

            <div className="flex items-center gap-1.5 sm:gap-2 text-[#747576]">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#e7e2d8] text-[#747576] flex items-center justify-center text-[11px] sm:text-[12px] font-bold shrink-0">
                3
              </span>
              <span>
                <span className="hidden sm:inline">3. </span>Confirm<span className="hidden sm:inline">ation</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="max-w-[1240px] mx-auto w-full px-3.5 sm:px-6 lg:px-8 py-5 sm:py-10 flex-1">
        {/* While hydration is loading */}
        {!hasHydrated && !isConfirmation ? (
          <div className="bg-white border border-[#e7e2d8] rounded-2xl p-12 text-center max-w-[540px] mx-auto space-y-4 shadow-sm">
            <div className="w-10 h-10 border-3 border-[#02cb5a] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[14px] text-[#747576]">Restoring your checkout session...</p>
          </div>
        ) : cartItems.length === 0 && !isConfirmation ? (
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
        ) : isConfirmation ? (
          /* ================= STEP 3: ORDER CONFIRMATION ================= */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-[660px] mx-auto bg-white border border-[#e7e2d8] rounded-2xl p-6 sm:p-10 text-center space-y-6 shadow-sm"
          >
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
              <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-3 gap-2">
                <span className="text-[#5c5a52] shrink-0">Deliver To</span>
                <span className="font-semibold text-[#202020] text-right truncate min-w-0 max-w-[200px] sm:max-w-[260px]">
                  {formValues.fullName}, {formValues.city}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-3 gap-2">
                <span className="text-[#5c5a52] shrink-0">Payment Method</span>
                <span className="font-bold text-[#1f3a2c] text-right text-[13px] sm:text-[14px]">
                  {paymentMethod === "upi"
                    ? "UPI (GPay / PhonePe / Paytm)"
                    : "Cash on Delivery (COD)"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-3">
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
                <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-3">
                  <span className="text-[#5c5a52]">UPI Ref / UTR</span>
                  <span className="font-mono font-bold text-[#1f3a2c] flex items-center gap-1.5">
                    {confirmedUtr}
                    <span className="bg-[#02cb5a]/20 text-[#016c2f] text-[10px] font-sans font-bold px-2 py-0.5 rounded">
                      {paymentConfirmed ? "Verified" : "Awaiting check"}
                    </span>
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-[#202020]">{paymentMethod === "upi" && paymentConfirmed ? "Amount Paid" : "Order Total"}</span>
                <span className="font-bold text-[18px] text-[#1f3a2c]">
                  ₹{(confirmedTotal ?? (latestTotalRef.current > 0 ? latestTotalRef.current : finalTotal)).toLocaleString("en-IN")}
                </span>
              </div>

              {paymentMethod === "upi" && (
                <div className="bg-[#f0f8f4] border border-[#bfdcc9] rounded-lg p-3 text-[12.5px] text-[#1f3a2c] flex items-center justify-between mt-2">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-[#016c2f]" />
                    <span>{paymentConfirmed ? "Payment verified & securely processed via UPI." : "We will confirm your UPI payment against our bank record, then dispatch your order."}</span>
                  </span>
                  <span className="font-bold text-[#016c2f] whitespace-nowrap">100% Secure</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href={`/order/${orderId}`}
                onClick={() => resetOrderState()}
                className="w-full sm:w-auto bg-[#1f3a2c] hover:bg-[#14281e] text-white font-bold text-[14px] px-6 py-3.5 rounded-xl transition-colors text-center flex items-center justify-center gap-1.5"
              >
                <span>Track Live Order &amp; Invoice</span>
                <ArrowRight size={15} />
              </Link>
              <button
                type="button"
                onClick={handleStartNewOrder}
                className="w-full sm:w-auto bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[14px] px-7 py-3.5 rounded-xl transition-colors cursor-pointer text-center"
              >
                Continue Shopping
              </button>
            </div>
          </motion.div>
        ) : (
          /* ================= STEP 1 & 2: 2-COLUMN CHECKOUT ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form & Payment Step (7 cols) */}
            <div className="lg:col-span-7 bg-transparent sm:bg-white border-0 sm:border border-[#e7e2d8] rounded-none sm:rounded-2xl p-0 sm:p-7 shadow-none sm:shadow-sm">
              <AnimatePresence mode="wait">
                {/* ================= STEP 1: ADDRESS ================= */}
                {effectiveStep === 1 && (
                  <motion.form
                    key="step-1"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleSubmit(onShippingSubmit)}
                    className="space-y-6"
                  >
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
                        Mobile Number (For Courier Updates) *
                      </label>
                      <div className={`flex items-center border rounded-lg overflow-hidden bg-white ${
                        errors.phone ? "border-red-500" : "border-[#e7e2d8] focus-within:border-[#02cb5a]"
                      }`}>
                        <span className="px-3 py-2.5 bg-[#fafafa] border-r border-[#e7e2d8] text-[14px] font-bold text-[#202020] flex items-center gap-1 select-none shrink-0">
                          🇮🇳 +91
                        </span>
                        <input
                          type="tel"
                          {...register("phone")}
                          value={formValues.phone || ""}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          onPaste={(e) => {
                            const pasted = e.clipboardData.getData("text");
                            if (pasted) {
                              e.preventDefault();
                              handlePhoneChange(pasted);
                            }
                          }}
                          placeholder="10-digit mobile number"
                          className="flex-1 min-w-0 px-3.5 py-2.5 text-[14px] outline-none text-[#202020]"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-[12px] text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.phone.message}
                        </p>
                      )}
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
                            {...register("fullName")}
                            placeholder="e.g. Priya Sharma"
                            className={`w-full px-3.5 py-2.5 border rounded-lg text-[14px] outline-none ${
                              errors.fullName ? "border-red-500" : "border-[#e7e2d8] focus:border-[#02cb5a]"
                            }`}
                          />
                          {errors.fullName && (
                            <p className="text-[12px] text-red-600 mt-1">
                              {errors.fullName.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[12.5px] font-semibold text-[#5c5a52] mb-1">
                            Email (For Order Invoices)
                          </label>
                          <input
                            type="email"
                            {...register("email")}
                            placeholder="priya@example.com"
                            className="w-full px-3.5 py-2.5 border border-[#e7e2d8] rounded-lg text-[14px] outline-none focus:border-[#02cb5a]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-[12.5px] font-semibold text-[#5c5a52] mb-1">
                            Pincode *
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={formValues.pincode}
                            onChange={(e) => handlePincodeChange(e.target.value)}
                            placeholder="6-digit PIN"
                            className={`w-full px-3.5 py-2.5 border rounded-lg text-[14px] outline-none ${
                              errors.pincode ? "border-red-500" : "border-[#e7e2d8] focus:border-[#02cb5a]"
                            }`}
                          />
                          {errors.pincode && (
                            <p className="text-[12px] text-red-600 mt-1">
                              {errors.pincode.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[12.5px] font-semibold text-[#5c5a52] mb-1">
                            City / Town *
                          </label>
                          <input
                            type="text"
                            {...register("city")}
                            placeholder="City"
                            className={`w-full px-3.5 py-2.5 border rounded-lg text-[14px] outline-none ${
                              errors.city ? "border-red-500" : "border-[#e7e2d8] focus:border-[#02cb5a]"
                            }`}
                          />
                          {errors.city && (
                            <p className="text-[12px] text-red-600 mt-1">
                              {errors.city.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[12.5px] font-semibold text-[#5c5a52] mb-1">
                            State *
                          </label>
                          <input
                            type="text"
                            {...register("state")}
                            placeholder="State"
                            className={`w-full px-3.5 py-2.5 border rounded-lg text-[14px] outline-none ${
                              errors.state ? "border-red-500" : "border-[#e7e2d8] focus:border-[#02cb5a]"
                            }`}
                          />
                          {errors.state && (
                            <p className="text-[12px] text-red-600 mt-1">
                              {errors.state.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[12.5px] font-semibold text-[#5c5a52] mb-1">
                          Complete Street Address *
                        </label>
                        <input
                          type="text"
                          {...register("address")}
                          placeholder="House/Flat number, apartment, colony, street"
                          className={`w-full px-3.5 py-2.5 border rounded-lg text-[14px] outline-none ${
                            errors.address ? "border-red-500" : "border-[#e7e2d8] focus:border-[#02cb5a]"
                          }`}
                        />
                        {errors.address && (
                          <p className="text-[12px] text-red-600 mt-1">
                            {errors.address.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[12.5px] font-semibold text-[#5c5a52] mb-1">
                          Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          {...register("landmark")}
                          placeholder="Near metro, park or school"
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
                  </motion.form>
                )}

                {/* ================= STEP 2: PAYMENT ================= */}
                {effectiveStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    {/* Delivery Address Summary Bar */}
                    <div className="bg-white border border-[#e7e2d8] rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-2.5 sm:gap-3 text-[13px]">
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-[#202020] block truncate">
                          {formValues.fullName} · {formValues.phone}
                        </span>
                        <span className="text-[#5c5a52] text-[12px] sm:text-[13px] truncate block w-full">
                          {formValues.address}, {formValues.city}, {formValues.state} - {formValues.pincode}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => guardLeave(() => setStep(1))}
                        className="text-[#016c2f] font-bold text-[12px] sm:text-[13px] underline hover:opacity-80 cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        Edit Address
                      </button>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-3">
                      <h4 className="text-[13.5px] sm:text-[14px] font-bold text-[#202020] uppercase tracking-wider">
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
                        className={`border-2 rounded-xl p-3 sm:p-4 transition-all cursor-pointer ${
                          paymentMethod === "upi"
                            ? "border-[#1f3a2c] bg-[#fafafa]"
                            : "border-[#e7e2d8] hover:border-[#1f3a2c]/60 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="w-5 h-5 rounded-full border-2 border-[#1f3a2c] flex items-center justify-center shrink-0">
                              {paymentMethod === "upi" && (
                                <div className="w-2.5 h-2.5 rounded-full bg-[#1f3a2c]" />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                              <Image src="/assets/upi/upi.svg" alt="UPI" width={40} height={15} className="h-3.5 sm:h-4 w-auto shrink-0" />
                              <span className="font-bold text-[14px] sm:text-[15px] text-[#202020] whitespace-nowrap">Pay by UPI</span>
                              <span className="hidden sm:flex items-center gap-1 ml-1">
                                {["gpay", "phonepe", "paytm", "cred", "bhim"].map((app) => (
                                  <Image key={app} src={`/assets/upi/${app}.png`} alt="" width={20} height={20} className="rounded" />
                                ))}
                              </span>
                            </div>
                          </div>
                          <span className="bg-[#02cb5a]/20 text-[#016c2f] font-bold text-[10.5px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 rounded flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <ShieldCheck size={11} /> Instant &amp; Secure
                          </span>
                        </div>

                        {paymentMethod === "upi" && upiSession?.mode === "native" && (
                          <div
                            className="mt-4 pt-4 border-t border-[#e7e2d8]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <TeaPayPanel
                              key={upiSession.sessionId}
                              session={upiSession as TeaPaySessionView}
                              onPaid={handleUpiPaid}
                              onRestart={restartUpiSession}
                              onBackPressed={() => guardLeave(() => window.history.go(-2))}
                            />
                          </div>
                        )}

                        {paymentMethod === "upi" && upiSession?.mode !== "native" && (
                          <div
                            className="mt-4 pt-4 border-t border-[#e7e2d8]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ManualUpiPanel
                              loading={isCreatingUpi || !upiSession}
                              amount={upiSession?.amount ?? finalTotal}
                              vpa={upiSession?.vpa || ""}
                              payeeName={upiSession?.merchantName || "Teabox India"}
                              qrCodeDataUrl={upiSession?.qrCodeDataUrl ?? undefined}
                              deepLinks={upiSession?.deepLinks ?? undefined}
                              upiUri={upiSession?.upiUri ?? undefined}
                              secondsLeft={countdownSeconds}
                              busy={isProcessing}
                              onConfirm={handlePlaceOrder}
                              onRestart={restartUpiSession}
                            />
                          </div>
                        )}
                      </div>

                      {/* 2. Cash On Delivery (can be switched off in Admin → Payment Gateway) */}
                      {codAvailable && (
                        <div
                          onClick={handleSelectCod}
                          className={`border-2 rounded-xl p-3 sm:p-4 transition-all cursor-pointer ${
                            paymentMethod === "cod"
                              ? "border-[#1f3a2c] bg-[#fafafa]"
                              : "border-[#e7e2d8] hover:border-[#1f3a2c]/60 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                              <div className="w-5 h-5 rounded-full border-2 border-[#1f3a2c] flex items-center justify-center shrink-0">
                                {paymentMethod === "cod" && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#1f3a2c]" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 min-w-0">
                                <Banknote size={19} className="text-[#016c2f] shrink-0" />
                                <span className="font-bold text-[14px] sm:text-[15px] text-[#202020] whitespace-nowrap">
                                  Cash on Delivery (COD)
                                </span>
                              </div>
                            </div>
                            <span className="text-[11.5px] sm:text-[12px] text-[#8e8d8a] font-medium shrink-0 whitespace-nowrap">+₹40 fee</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* UPI orders are placed by the payment panel itself; only COD needs a button */}
                    {paymentMethod === "cod" && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handlePlaceOrder}
                        disabled={isProcessing}
                        className="w-full bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] py-3.5 sm:py-4 px-4 sm:px-5 rounded-xl font-bold text-[14.5px] sm:text-[16px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-75"
                      >
                        {isProcessing ? (
                          <>
                            <span className="w-5 h-5 border-2 border-[#1f3a2c] border-t-transparent rounded-full animate-spin shrink-0" />
                            <span className="truncate">Securing Your Fresh Teas...</span>
                          </>
                        ) : (
                          <>
                            <span className="truncate">
                              Place COD Order — ₹
                              {finalTotal.toLocaleString("en-IN")}
                            </span>
                            <ArrowRight size={18} className="shrink-0" />
                          </>
                        )}
                      </button>
                    </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column: Order Summary & Selected Items (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white border border-[#e7e2d8] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
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
                            sizes="48px"
                            className="object-cover"
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
                        onClick={() => {
                          setAppliedCoupon(null);
                          toast.info("Coupon Removed");
                        }}
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

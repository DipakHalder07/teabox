"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ArrowRight, Mail, Lock, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SiteLayoutWrapper from "@/components/SiteLayoutWrapper";
import {
  emailOtpSchema,
  customerLoginSchema,
  customerRegisterSchema,
} from "@/lib/validations/account";
import { useCart } from "@/components/context/CartContext";

export default function LoginPage() {
  const { mergeCartItems, clearCart, cartItems } = useCart();

  // Mode: "quick" (Instant Email Verification Code), "password" (traditional), "register", "forgot"
  const [viewMode, setViewMode] = useState<"quick" | "password" | "register" | "forgot">("quick");

  // Email Quick OTP state
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Refs for 6-digit OTP auto-focus
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Password & Register state
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // Check saved customer session on initial load
  useEffect(() => {
    try {
      const saved = localStorage.getItem("teabox_customer_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email) {
          setIsLoggedIn(true);
          setLoggedInUser(parsed.email);
        }
      }
    } catch {}
  }, []);

  // Cooldown countdown timer for Resend Code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Restore saved cart from previous customer sessions
  const restoreCustomerCart = (userKey: string) => {
    try {
      const sanitizedKey = `teabox_saved_cart_${userKey.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const savedRaw = localStorage.getItem(sanitizedKey);
      if (savedRaw) {
        const savedItems = JSON.parse(savedRaw);
        if (Array.isArray(savedItems) && savedItems.length > 0) {
          mergeCartItems(savedItems);
          toast.success("Saved Cart Restored", {
            description: "Your previous customer cart was synced without duplicates.",
          });
        }
      }
    } catch (e) {
      console.warn("Customer cart merge error:", e);
    }
  };

  // Step 1: Send 6-Digit Verification Code to Email (Server-Side Dispatch via Nodemailer / Gmail)
  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    const cleanEmail = email.trim().toLowerCase();
    setEmail(cleanEmail);

    const result = emailOtpSchema.safeParse({ email: cleanEmail });
    if (!result.success) {
      setInlineError("Please enter a valid email address.");
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setInlineError(data.error || "Failed to send verification code.");
        if (data.remainingCooldown) {
          setResendCooldown(data.remainingCooldown);
        }
        return;
      }

      setOtpSent(true);
      setOtpCode(["", "", "", "", "", ""]);
      setDevCode(data.devCode || null);
      setResendCooldown(30); // 30-second resend cooldown
      toast.success("Verification Code Sent", {
        description: `We've sent a 6-digit code to ${cleanEmail}. Please check your inbox.`,
      });

      // Focus first input box shortly after render
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch {
      setInlineError("Network error. Please check your connection and try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify Code & Authenticate (Server-Side Verification)
  const handleVerifyEmailOtp = async (e?: React.FormEvent, codeOverride?: string) => {
    if (e) e.preventDefault();
    setInlineError(null);
    const entered = (codeOverride || otpCode.join("")).trim();

    if (entered.length < 6) {
      setInlineError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: entered }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setInlineError(data.error || "Incorrect verification code. Please check your inbox.");
        setOtpCode(["", "", "", "", "", ""]);
        setTimeout(() => {
          otpInputsRef.current[0]?.focus();
        }, 100);
        return;
      }

      // Success
      const authenticatedEmail = data.user?.email || email;
      setIsLoggedIn(true);
      setLoggedInUser(authenticatedEmail);

      try {
        localStorage.setItem(
          "teabox_customer_user",
          JSON.stringify(data.user || { email: authenticatedEmail })
        );
      } catch {}

      restoreCustomerCart(authenticatedEmail);
      toast.success("Welcome to Teabox!", {
        description: `Signed in as ${authenticatedEmail}`,
      });
    } catch {
      setInlineError("Verification service error. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend Verification Code with 30s Cooldown
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSendingOtp) return;
    setInlineError(null);
    setIsSendingOtp(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setInlineError(data.error || "Failed to resend code.");
        if (data.remainingCooldown) {
          setResendCooldown(data.remainingCooldown);
        }
        return;
      }

      setOtpCode(["", "", "", "", "", ""]);
      if (data.devCode) setDevCode(data.devCode);
      setResendCooldown(30);
      toast.success("New Code Dispatched", {
        description: `A fresh 6-digit code was sent to ${email}`,
      });
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch {
      setInlineError("Network error while resending. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Traditional Password Login
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const result = customerLoginSchema.safeParse({ email, password });
    if (!result.success) {
      toast.error("Login failed", {
        description: result.error.issues[0]?.message || "Please check your credentials.",
      });
      return;
    }

    setIsLoggedIn(true);
    setLoggedInUser(email);
    try {
      localStorage.setItem("teabox_customer_user", JSON.stringify({ email }));
    } catch {}
    restoreCustomerCart(email);
    toast.success("Welcome back!", {
      description: `Logged in as ${email}`,
    });
  };

  // Traditional Registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const result = customerRegisterSchema.safeParse({ name, email, password });
    if (!result.success) {
      toast.error("Registration incomplete", {
        description: result.error.issues[0]?.message || "Please fill all required fields.",
      });
      return;
    }

    toast.success("Account created successfully!");
    setTimeout(() => {
      setIsLoggedIn(true);
      setLoggedInUser(email);
      try {
        localStorage.setItem("teabox_customer_user", JSON.stringify({ email, name }));
      } catch {}
      restoreCustomerCart(email);
    }, 600);
  };

  // Secure Logout
  const handleLogout = () => {
    if (loggedInUser && cartItems.length > 0) {
      try {
        const sanitizedKey = `teabox_saved_cart_${loggedInUser.replace(/[^a-zA-Z0-9]/g, "_")}`;
        localStorage.setItem(sanitizedKey, JSON.stringify(cartItems));
      } catch {}
    }
    try {
      localStorage.removeItem("teabox_customer_user");
      document.cookie = "teabox_customer_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    } catch {}
    setIsLoggedIn(false);
    setLoggedInUser("");
    setOtpSent(false);
    setEmail("");
    setOtpCode(["", "", "", "", "", ""]);
    setDevCode(null);
    setViewMode("quick");
    clearCart();
    toast.info("Logged Out", {
      description: "Session closed and cart secured.",
    });
  };

  return (
    <SiteLayoutWrapper>
      <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 bg-[#fafafa]">
        {/* Breadcrumb */}
        <div className="w-full max-w-[480px] text-center mb-6">
          <nav aria-label="Breadcrumb" className="text-[13px] text-[#747576]">
            <Link href="/" className="text-[#1f3a2c] hover:underline">
              Home
            </Link>{" "}
            › <span className="text-[#202020] font-medium">Account</span>
          </nav>
        </div>

        {/* LOGGED IN DASHBOARD */}
        {isLoggedIn ? (
          <div className="w-full max-w-[480px] bg-white border border-[#e7e2d8] rounded-2xl p-8 sm:p-10 shadow-xl text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-[#02cb5a]/20 border-2 border-[#02cb5a] flex items-center justify-center mx-auto text-[#016c2f]">
              <Check size={36} className="stroke-[3]" />
            </div>
            <div>
              <h2 className="font-stencil text-[26px] font-bold text-[#202020]">
                Welcome to Teabox
              </h2>
              <p className="text-[14px] text-[#5c5a52] mt-1">
                Logged in as <strong className="text-[#1f3a2c]">{loggedInUser}</strong>
              </p>
            </div>

            <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-xl p-4 text-left space-y-2.5 text-[13.5px]">
              <div className="flex justify-between py-1 border-b border-[#e7e2d8]">
                <span className="text-[#5c5a52]">Member Tier</span>
                <span className="font-bold text-[#016c2f]">Teabox Connoisseur</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e7e2d8]">
                <span className="text-[#5c5a52]">Reward Points</span>
                <span className="font-bold text-[#202020]">250 Pts</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#5c5a52]">Order History</span>
                <Link href="/track" className="font-bold text-[#1f3a2c] underline">
                  Track Past Orders →
                </Link>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href="/collections/all"
                className="w-full bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[14px] py-3 rounded-lg transition-colors block text-center"
              >
                Shop Fresh Harvests
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full border border-[#e7e2d8] hover:border-[#202020] text-[#5c5a52] font-semibold text-[13px] py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* 1. QUICK LOGIN OR REGISTER (EMAIL ONLY - NO PHONE NUMBER)                 */
          /* ========================================================================= */
          viewMode === "quick" ? (
            <div className="relative w-full max-w-[440px] bg-white border border-[#e7e2d8] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-7 sm:p-9 text-center">
                {/* Brand Logo: Clean text format */}
                <div className="flex justify-center mb-6">
                  <Link href="/" className="inline-block">
                    <span className="font-stencil text-[28px] font-bold tracking-wider text-[#02cb5a]">
                      DEMOBOX
                    </span>
                  </Link>
                </div>

                {!otpSent ? (
                  /* STEP 1: Enter Email (No Phone Number) */
                  <form onSubmit={handleSendEmailOtp} className="space-y-4">
                    <div className="text-center mb-5">
                      <h3 className="text-[19px] font-bold text-[#202020]">
                        Quick Login or Register
                      </h3>
                      <p className="text-[13px] text-[#5c5a52] mt-1">
                        Enter your email for an instant verification code
                      </p>
                    </div>

                    {/* Email Input Field */}
                    <div className="space-y-1.5 text-left">
                      <label className="block text-[12px] font-bold uppercase tracking-wider text-[#5c5a52]">
                        Email Address
                      </label>
                      <div className="flex items-center border-2 border-[#1f3a2c] focus-within:border-[#02cb5a] rounded-xl overflow-hidden bg-white shadow-2xs transition-colors">
                        <Mail size={18} className="text-[#5c5a52] ml-3.5 mr-2 shrink-0" />
                        <input
                          type="email"
                          required
                          autoFocus
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="flex-1 px-2 py-3 text-[14.5px] outline-none text-[#202020]"
                        />
                      </div>
                    </div>

                    {inlineError && (
                      <p className="text-[12.5px] font-semibold text-[#c53030] bg-[#fff5f5] border border-[#feb2b2] rounded-lg p-2.5 text-center">
                        {inlineError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full bg-[#1f3a2c] hover:bg-[#14281e] disabled:opacity-75 text-white font-bold text-[14.5px] py-3.5 rounded-xl transition-all cursor-pointer shadow-sm tracking-wide flex items-center justify-center gap-2 mt-2"
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Sending Verification Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue with Email</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>

                    <p className="text-[11.5px] text-[#747576] leading-tight pt-1">
                      By proceeding, you agree to Teabox&apos;s{" "}
                      <Link href="#terms" className="underline font-medium text-[#202020]">
                        Terms
                      </Link>{" "}
                      and{" "}
                      <Link href="#privacy" className="underline font-medium text-[#202020]">
                        Privacy Policy
                      </Link>.
                    </p>

                    <div className="pt-3 border-t border-[#e7e2d8] mt-4 flex items-center justify-between text-[13px]">
                      <button
                        type="button"
                        onClick={() => setViewMode("password")}
                        className="text-[#5c5a52] hover:text-[#202020] hover:underline font-medium cursor-pointer"
                      >
                        Use Password
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("register")}
                        className="text-[#016c2f] hover:underline font-bold cursor-pointer"
                      >
                        Create Password Account
                      </button>
                    </div>
                  </form>
                ) : (
                  /* STEP 2: Enter Verification Code */
                  <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-[#02cb5a]/15 text-[#016c2f] flex items-center justify-center mx-auto mb-2">
                        <KeyRound size={22} />
                      </div>
                      <h3 className="text-[19px] font-bold text-[#202020]">
                        Enter Verification Code
                      </h3>
                      <p className="text-[13px] text-[#5c5a52] mt-0.5">
                        We sent a 6-digit code to <strong className="text-[#1f3a2c]">{email}</strong>
                      </p>
                      <p className="text-[11.5px] text-[#747576] mt-1">
                        Please check your email inbox (and spam folder)
                      </p>
                    </div>

                    {/* Developer Mock Helper (visible in dev mode when credentials aren't configured yet) */}
                    {devCode && (
                      <div className="bg-[#f0fdf4] border border-[#86efac] rounded-xl p-3 text-left text-[12.5px] text-[#166534] flex items-center justify-between shadow-2xs">
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>🧪 Development Code:</span>
                            <span className="font-mono text-[16px] font-extrabold tracking-widest text-[#059669]">
                              {devCode}
                            </span>
                          </div>
                          <span className="block text-[11px] text-[#15803d] mt-0.5">
                            Set GMAIL_USER &amp; GMAIL_APP_PASSWORD in .env for live inbox delivery
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const digits = devCode.split("").slice(0, 6);
                            setOtpCode(digits);
                            handleVerifyEmailOtp(undefined, devCode);
                          }}
                          className="shrink-0 text-[11.5px] font-bold bg-[#166534] text-white px-2.5 py-1.5 rounded-lg hover:bg-[#14532d] transition-colors cursor-pointer"
                        >
                          Auto Fill
                        </button>
                      </div>
                    )}

                    {/* 6-Digit Code Inputs */}
                    <div className="flex justify-center gap-2 sm:gap-2.5 my-5">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            otpInputsRef.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          required
                          disabled={isVerifying}
                          value={otpCode[index]}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            const newOtp = [...otpCode];
                            newOtp[index] = val ? val.slice(-1) : "";
                            setOtpCode(newOtp);

                            // Auto-focus next box
                            if (val && index < 5) {
                              otpInputsRef.current[index + 1]?.focus();
                            }

                            // If 6th digit entered and all slots filled, auto submit
                            if (val && index === 5 && newOtp.slice(0, 5).every((d) => d !== "")) {
                              handleVerifyEmailOtp(undefined, newOtp.join(""));
                            }
                          }}
                          onKeyDown={(e) => {
                            // Backspace moves to previous box
                            if (e.key === "Backspace" && !otpCode[index] && index > 0) {
                              otpInputsRef.current[index - 1]?.focus();
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                            if (pasted.length > 0) {
                              const newOtp = [...otpCode];
                              for (let i = 0; i < pasted.length; i++) {
                                newOtp[i] = pasted[i];
                              }
                              setOtpCode(newOtp);
                              if (pasted.length === 6) {
                                handleVerifyEmailOtp(undefined, pasted);
                              } else {
                                const focusIndex = Math.min(pasted.length, 5);
                                otpInputsRef.current[focusIndex]?.focus();
                              }
                            }
                          }}
                          className="w-11 h-14 sm:w-13 sm:h-15 text-center text-[22px] sm:text-[24px] font-bold border-2 border-[#1f3a2c] focus:border-[#02cb5a] rounded-xl outline-none focus:ring-2 focus:ring-[#02cb5a]/20 bg-white shadow-2xs transition-all disabled:opacity-60"
                        />
                      ))}
                    </div>

                    {inlineError && (
                      <p className="text-[12.5px] font-semibold text-[#c53030] bg-[#fff5f5] border border-[#feb2b2] rounded-lg p-2.5 text-center">
                        {inlineError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="w-full bg-[#02cb5a] hover:bg-[#02b851] disabled:opacity-75 text-[#1f3a2c] font-bold text-[15px] py-3.5 rounded-xl transition-all cursor-pointer shadow-sm tracking-wide flex items-center justify-center gap-2"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Verifying Code...</span>
                        </>
                      ) : (
                        <>
                          <Check size={18} className="stroke-[3]" />
                          <span>Verify & Sign In</span>
                        </>
                      )}
                    </button>

                    <div className="flex justify-between items-center text-[12.5px] pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode(["", "", "", "", "", ""]);
                          setDevCode(null);
                          setInlineError(null);
                        }}
                        className="text-[#747576] hover:text-[#202020] underline cursor-pointer"
                      >
                        Change Email
                      </button>
                      <button
                        type="button"
                        disabled={resendCooldown > 0 || isSendingOtp}
                        onClick={handleResendOtp}
                        className={
                          resendCooldown > 0 || isSendingOtp
                            ? "text-[#8a8984] font-medium cursor-not-allowed"
                            : "text-[#016c2f] font-bold hover:underline cursor-pointer"
                        }
                      >
                        {isSendingOtp
                          ? "Sending..."
                          : resendCooldown > 0
                          ? `Resend Code (${resendCooldown}s)`
                          : "Resend Code"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : viewMode === "password" ? (
            /* ========================================================================= */
            /* 2. Traditional Email & Password View                                      */
            /* ========================================================================= */
            <div className="w-full max-w-[440px] bg-white border border-[#e7e2d8] rounded-2xl shadow-xl p-8 sm:p-10 space-y-6 animate-in fade-in duration-200">
              <div className="text-center">
                <h1 className="font-stencil text-[30px] font-bold text-[#202020]">
                  Login
                </h1>
                <p className="text-[14px] text-[#5c5a52] mt-1">
                  Enter your email and password to log in:
                </p>
              </div>

              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold uppercase tracking-wider text-[#202020] mb-1">
                    Email *
                  </label>
                  <div className="flex items-center border border-[#e7e2d8] focus-within:border-[#02cb5a] rounded-lg px-3 py-2.5 bg-white">
                    <Mail size={18} className="text-[#747576] mr-2 shrink-0" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@example.com"
                      className="w-full text-[14px] outline-none text-[#202020]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[13px] font-bold uppercase tracking-wider text-[#202020]">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setViewMode("forgot")}
                      className="text-[12px] text-[#5c5a52] hover:text-[#016c2f] underline cursor-pointer"
                    >
                      Forgot your password?
                    </button>
                  </div>
                  <div className="flex items-center border border-[#e7e2d8] focus-within:border-[#02cb5a] rounded-lg px-3 py-2.5 bg-white">
                    <Lock size={18} className="text-[#747576] mr-2 shrink-0" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-[14px] outline-none text-[#202020]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[15px] py-3.5 rounded-lg uppercase tracking-wider transition-colors cursor-pointer shadow-sm mt-2"
                >
                  Sign In
                </button>
              </form>

              <div className="pt-4 border-t border-[#e7e2d8] flex flex-col items-center gap-3 text-[13.5px]">
                <button
                  type="button"
                  onClick={() => setViewMode("quick")}
                  className="w-full border border-[#1f3a2c] text-[#1f3a2c] hover:bg-[#1f3a2c]/5 font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mail size={16} />
                  <span>Use Quick Email Code</span>
                </button>

                <p className="text-[#5c5a52]">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setViewMode("register")}
                    className="font-bold text-[#016c2f] hover:underline cursor-pointer"
                  >
                    Create account
                  </button>
                </p>
              </div>
            </div>
          ) : viewMode === "register" ? (
            /* ========================================================================= */
            /* 3. Register Account View (Email Only - No Phone)                          */
            /* ========================================================================= */
            <div className="w-full max-w-[440px] bg-white border border-[#e7e2d8] rounded-2xl shadow-xl p-8 sm:p-10 space-y-6 animate-in fade-in duration-200">
              <div className="text-center">
                <h1 className="font-stencil text-[30px] font-bold text-[#202020]">
                  Create Account
                </h1>
                <p className="text-[14px] text-[#5c5a52] mt-1">
                  Join Teabox Rewards for free shipping &amp; harvest alerts.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold uppercase tracking-wider text-[#202020] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3.5 py-2.5 border border-[#e7e2d8] rounded-lg text-[14px] outline-none focus:border-[#02cb5a]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold uppercase tracking-wider text-[#202020] mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 border border-[#e7e2d8] rounded-lg text-[14px] outline-none focus:border-[#02cb5a]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold uppercase tracking-wider text-[#202020] mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 border border-[#e7e2d8] rounded-lg text-[14px] outline-none focus:border-[#02cb5a]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[15px] py-3.5 rounded-lg uppercase tracking-wider transition-colors cursor-pointer shadow-sm mt-2"
                >
                  Create Account
                </button>
              </form>

              <div className="pt-4 border-t border-[#e7e2d8] flex flex-col items-center gap-2 text-center text-[13.5px] text-[#5c5a52]">
                <button
                  type="button"
                  onClick={() => setViewMode("quick")}
                  className="font-bold text-[#016c2f] hover:underline cursor-pointer"
                >
                  ← Quick Email Login
                </button>
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setViewMode("password")}
                    className="font-bold text-[#1f3a2c] hover:underline cursor-pointer"
                  >
                    Log In
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 4. Forgot Password View                                                   */
            /* ========================================================================= */
            <div className="w-full max-w-[440px] bg-white border border-[#e7e2d8] rounded-2xl shadow-xl p-8 sm:p-10 space-y-6 animate-in fade-in duration-200">
              <div className="text-center">
                <h1 className="font-stencil text-[28px] font-bold text-[#202020]">
                  Reset Password
                </h1>
                <p className="text-[14px] text-[#5c5a52] mt-1">
                  We will send you an email to reset your password.
                </p>
              </div>

              {forgotSent ? (
                <div className="bg-[#02cb5a]/10 border border-[#02cb5a] rounded-xl p-4 text-center space-y-2">
                  <Check size={28} className="text-[#016c2f] mx-auto" />
                  <p className="text-[14px] font-bold text-[#202020]">
                    Password reset link sent!
                  </p>
                  <p className="text-[12.5px] text-[#5c5a52]">
                    Please check your inbox for instructions to reset your password.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotSent(false);
                      setViewMode("quick");
                    }}
                    className="text-[13px] font-bold text-[#016c2f] underline pt-2 block mx-auto cursor-pointer"
                  >
                    Return to Login
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setForgotSent(true);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-[13px] font-bold uppercase tracking-wider text-[#202020] mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 border border-[#e7e2d8] rounded-lg text-[14px] outline-none focus:border-[#02cb5a]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[15px] py-3.5 rounded-lg uppercase tracking-wider transition-colors cursor-pointer shadow-sm mt-2"
                  >
                    Submit
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("quick")}
                    className="w-full text-center text-[13px] text-[#5c5a52] hover:text-[#202020] underline pt-1 block cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          )
        )}
      </div>
    </SiteLayoutWrapper>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Check, ArrowRight, ShieldCheck, Mail, Lock, Phone } from "lucide-react";
import { toast } from "sonner";
import SiteLayoutWrapper from "@/components/SiteLayoutWrapper";
import {
  fastrrOtpSchema,
  customerLoginSchema,
  customerRegisterSchema,
} from "@/lib/validations/account";
import { cleanIndianPhone } from "@/lib/validations/checkout";
import { useCart } from "@/components/context/CartContext";

export default function LoginPage() {
  const { mergeCartItems, clearCart, cartItems } = useCart();
  // Mode: "fastrr" (the Shiprocket 1-click modal overlay), "password" (traditional email/password), "register", "forgot"
  const [viewMode, setViewMode] = useState<"fastrr" | "password" | "register" | "forgot">("fastrr");

  // Fastrr OTP form state
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState("");

  // Email/password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Automatically clean mobile number when browser autofills (+91, 91, or leading 0s)
  React.useEffect(() => {
    if (mobileNumber) {
      const cleaned = cleanIndianPhone(mobileNumber);
      if (cleaned !== mobileNumber) {
        setMobileNumber(cleaned);
      }
    }
  }, [mobileNumber]);

  // Handle Fastrr OTP submission
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = cleanIndianPhone(mobileNumber);
    setMobileNumber(cleanPhone);
    const result = fastrrOtpSchema.safeParse({ phone: cleanPhone });
    if (!result.success) {
      toast.error("Invalid mobile number", {
        description: "Please enter a valid 10-digit Indian mobile number",
      });
      return;
    }

    setOtpSent(true);
    toast.success("OTP Sent!", {
      description: `4-digit verification code sent to +91 ${cleanPhone}`,
    });
  };

  const restoreCustomerCart = (userKey: string) => {
    try {
      const sanitizedKey = `teabox_saved_cart_${userKey.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const savedRaw = localStorage.getItem(sanitizedKey);
      if (savedRaw) {
        const savedItems = JSON.parse(savedRaw);
        if (Array.isArray(savedItems) && savedItems.length > 0) {
          mergeCartItems(savedItems);
          toast.success("Saved Cart Restored", {
            description: "Previous customer cart synced without duplicates.",
          });
        }
      }
    } catch (e) {
      console.warn("Customer cart merge error:", e);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsLoggedIn(true);
      const userKey = `+91 ${mobileNumber}`;
      setLoggedInUser(userKey);
      restoreCustomerCart(userKey);
      toast.success("Welcome back!", {
        description: `Logged in as +91 ${mobileNumber}`,
      });
    }, 600);
  };

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
    restoreCustomerCart(email);
    toast.success("Welcome back!", {
      description: `Logged in as ${email}`,
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const result = customerRegisterSchema.safeParse({ name, email, password });
    if (!result.success) {
      toast.error("Registration incomplete", {
        description: result.error.issues[0]?.message || "Please fill all required fields.",
      });
      return;
    }

    setRegisterSuccess(true);
    toast.success("Account created successfully!");
    setTimeout(() => {
      const userKey = name || email;
      setIsLoggedIn(true);
      setLoggedInUser(userKey);
      restoreCustomerCart(userKey);
    }, 800);
  };

  const handleLogout = () => {
    // Secure current user's cart to their private key before logout
    if (loggedInUser && cartItems.length > 0) {
      try {
        const sanitizedKey = `teabox_saved_cart_${loggedInUser.replace(/[^a-zA-Z0-9]/g, "_")}`;
        localStorage.setItem(sanitizedKey, JSON.stringify(cartItems));
      } catch {}
    }
    setIsLoggedIn(false);
    setLoggedInUser("");
    setOtpSent(false);
    setMobileNumber("");
    setViewMode("fastrr");
    clearCart();
    toast.info("Logged Out", {
      description: "Cart state cleared to prevent leaking data.",
    });
  };

  return (
    <SiteLayoutWrapper>
      <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 bg-[#fafafa]">
        {/* Breadcrumb */}
        <div className="w-full max-w-[500px] text-center mb-6">
          <nav aria-label="Breadcrumb" className="text-[13px] text-[#747576]">
            <Link href="/" className="text-[#1f3a2c] hover:underline">
              Home
            </Link>{" "}
            › <span className="text-[#202020] font-medium">Account</span>
          </nav>
        </div>

        {/* LOGGED IN STATE */}
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
          /* 1. Fastrr / Shiprocket 1-Click Mobile OTP View (Live Site Default)        */
          /* ========================================================================= */
          viewMode === "fastrr" ? (
            <div className="relative w-full max-w-[420px] bg-white border border-[#e7e2d8] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Close / Switch to Traditional Email Button */}
              <button
                type="button"
                onClick={() => setViewMode("password")}
                className="absolute top-4 right-4 p-1.5 text-[#5c5a52] hover:text-[#202020] rounded-full hover:bg-[#f0f0f0] transition-colors cursor-pointer z-10"
                title="Switch to Email Login"
              >
                <X size={20} />
              </button>

              <div className="p-7 sm:p-9 text-center">
                {/* Brand Logo */}
                <div className="flex justify-center mb-6">
                  <Image
                    src="/assets/teabox-logo.svg"
                    alt="Teabox"
                    width={130}
                    height={34}
                    style={{ width: "auto" }}
                    className="h-8 w-auto object-contain"
                  />
                </div>

                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-[17px] font-bold text-[#202020]">
                        Quick Login or Register
                      </h3>
                      <p className="text-[13px] text-[#5c5a52] mt-0.5">
                        Get instant access with a 1-click mobile OTP
                      </p>
                    </div>

                    {/* India Mobile Number Input with integrated button */}
                    <div className="flex items-center border-2 border-[#594ee6] rounded-xl overflow-hidden bg-white shadow-xs focus-within:ring-2 focus-within:ring-[#594ee6]/20">
                      <div className="flex items-center gap-1 px-3 py-3 bg-[#fafafa] border-r border-[#e7e2d8] text-[14px] font-bold text-[#202020]">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        required
                        autoFocus
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(cleanIndianPhone(e.target.value))}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData("text");
                          if (pasted) {
                            e.preventDefault();
                            setMobileNumber(cleanIndianPhone(pasted));
                          }
                        }}
                        placeholder="10-digit mobile number"
                        className="flex-1 px-3 py-3 text-[14px] outline-none text-[#202020]"
                      />
                      <button
                        type="submit"
                        className="bg-[#594ee6] hover:bg-[#4d40db] text-white font-bold text-[14px] px-4 py-3 transition-colors cursor-pointer tracking-wide"
                      >
                        Login
                      </button>
                    </div>

                    <p className="text-[11px] text-[#747576] leading-tight pt-1">
                      ⓘ By proceeding, you are agreeing to our{" "}
                      <Link href="#terms" className="underline font-medium text-[#202020]">
                        T&amp;C
                      </Link>{" "}
                      and{" "}
                      <Link href="#privacy" className="underline font-medium text-[#202020]">
                        Privacy Policy
                      </Link>{" "}
                      and Shiprocket&apos;s Terms.
                    </p>

                    <div className="pt-3 border-t border-[#e7e2d8] mt-4 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setViewMode("password")}
                        className="text-[13px] text-[#1f3a2c] hover:underline font-medium cursor-pointer"
                      >
                        Use Email &amp; Password
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("register")}
                        className="text-[13px] text-[#016c2f] hover:underline font-bold cursor-pointer"
                      >
                        Create Account
                      </button>
                    </div>
                  </form>
                ) : (
                  /* OTP Entry Form */
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <h3 className="text-[17px] font-bold text-[#202020]">
                      Enter Verification Code
                    </h3>
                    <p className="text-[13px] text-[#5c5a52]">
                      Sent 4-digit OTP to +91 {mobileNumber}
                    </p>

                    {/* 4 Digit OTP Inputs */}
                    <div className="flex justify-center gap-3 my-4">
                      {[0, 1, 2, 3].map((index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength={1}
                          required
                          value={otpCode[index]}
                          onChange={(e) => {
                            const newOtp = [...otpCode];
                            newOtp[index] = e.target.value;
                            setOtpCode(newOtp);
                            // auto focus next
                            if (e.target.value && e.target.nextElementSibling) {
                              (e.target.nextElementSibling as HTMLInputElement).focus();
                            }
                          }}
                          className="w-12 h-14 text-center text-[22px] font-bold border-2 border-[#594ee6] rounded-xl outline-none focus:ring-2 focus:ring-[#594ee6]/20 bg-white"
                        />
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="w-full bg-[#594ee6] hover:bg-[#4d40db] text-white font-bold text-[15px] py-3.5 rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      {isVerifying ? "Verifying..." : "Verify & Sign In"}
                    </button>

                    <div className="flex justify-between items-center text-[12px] pt-2">
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-[#747576] hover:text-[#202020] underline"
                      >
                        Change Number
                      </button>
                      <button
                        type="button"
                        onClick={() => alert("New OTP sent to +91 " + mobileNumber)}
                        className="text-[#594ee6] font-bold hover:underline"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Shiprocket Footer Banner */}
              <div className="bg-[#f5f4fe] border-t border-[#e2dffc] py-2.5 px-4 text-center flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#594ee6]">
                <span>Powered by</span>
                <span className="font-extrabold tracking-tight">Shiprocket</span>
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
                      className="text-[12px] text-[#5c5a52] hover:text-[#016c2f] underline"
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
                  onClick={() => setViewMode("fastrr")}
                  className="w-full border border-[#594ee6] text-[#594ee6] hover:bg-[#594ee6]/5 font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Phone size={16} />
                  <span>Sign In with Mobile OTP</span>
                </button>

                <p className="text-[#5c5a52]">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setViewMode("register")}
                    className="font-bold text-[#016c2f] hover:underline"
                  >
                    Create account
                  </button>
                </p>
              </div>
            </div>
          ) : viewMode === "register" ? (
            /* ========================================================================= */
            /* 3. Register Account View                                                  */
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

              <div className="pt-4 border-t border-[#e7e2d8] text-center text-[13.5px] text-[#5c5a52]">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setViewMode("password")}
                  className="font-bold text-[#016c2f] hover:underline"
                >
                  Log In
                </button>
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
                      setViewMode("password");
                    }}
                    className="text-[13px] font-bold text-[#016c2f] underline pt-2 block mx-auto"
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
                    onClick={() => setViewMode("password")}
                    className="w-full text-center text-[13px] text-[#5c5a52] hover:text-[#202020] underline pt-1 block"
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

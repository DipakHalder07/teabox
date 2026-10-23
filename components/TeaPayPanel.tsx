"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  MessageCircle,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Clock,
  TriangleAlert,
} from "lucide-react";

/** Payment view returned by /api/pay/start and /api/pay/status. */
export interface TeaPaySessionView {
  sessionId: string;
  orderNumber: string;
  status: "PENDING" | "VERIFYING" | "PAID" | "EXPIRED" | "CANCELLED";
  payAmount: string;
  orderTotal: number;
  adjustmentPaise: number;
  upiId: string;
  payeeName: string;
  secondsLeft: number;
  otpRequired: boolean;
  phoneVerified: boolean;
  phoneMasked: string;
  upiUri: string | null;
  qrCodeDataUrl: string | null;
  deepLinks: { gpay: string; phonepe: string; paytm: string; cred: string; generic: string } | null;
  utr: string | null;
}

/** Ends an unpaid checkout (e.g. the customer switched to Cash on Delivery). Fire-and-forget. */
export function cancelTeaPaySession(sessionId: string) {
  fetch("/api/pay/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
    keepalive: true,
  }).catch(() => {});
}

/**
 * Shown when the customer tries to leave during payment: did you pay, keep paying, or cancel.
 * "Yes, I've paid" tells the server to start checking with the bank (the order is never marked
 * paid by this alone).
 */
export function PaymentLeaveDialog({
  sessionId,
  payAmount,
  onStay,
  onLeave,
}: {
  sessionId: string;
  payAmount: string;
  onStay: () => void;
  onLeave: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const amount = `₹${Number(payAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const paid = async () => {
    setBusy(true);
    await postJson("/api/pay/paid", { sessionId }).catch(() => null);
    setBusy(false);
    onStay();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="teapay-leave-title">
      <div className="absolute inset-0 bg-black/55" onClick={onStay} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[380px] p-5 space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-[#fff8e6] text-[#9a5b00] flex items-center justify-center mx-auto">
          <TriangleAlert size={22} />
        </div>
        <div>
          <h3 id="teapay-leave-title" className="font-bold text-[17px] text-[#1f3a2c]">
            Have you paid {amount}?
          </h3>
          <p className="text-[13px] text-[#5c5a52] mt-1">
            Your payment is still open. If you leave now and have not paid, your order will not be placed.
          </p>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={paid}
            disabled={busy}
            className="w-full bg-[#02cb5a] hover:bg-[#02b851] disabled:opacity-60 text-[#1f3a2c] py-3 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 cursor-pointer"
          >
            {busy ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Yes, I&apos;ve paid. Check it.
          </button>
          <button
            type="button"
            onClick={onStay}
            className="w-full bg-[#1f3a2c] hover:bg-[#14281e] text-white py-3 rounded-xl font-bold text-[14px] cursor-pointer"
          >
            No, continue paying
          </button>
          <button
            type="button"
            onClick={() => {
              cancelTeaPaySession(sessionId);
              onLeave();
            }}
            className="w-full text-[#c62828] py-2 font-semibold text-[13px] cursor-pointer hover:underline"
          >
            Cancel payment and leave
          </button>
        </div>
      </div>
    </div>
  );
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

const UPI_APPS = [
  { key: "gpay", label: "Google Pay", icon: "/assets/upi/gpay.png" },
  { key: "phonepe", label: "PhonePe", icon: "/assets/upi/phonepe.png" },
  { key: "paytm", label: "Paytm", icon: "/assets/upi/paytm.png" },
  { key: "cred", label: "CRED", icon: "/assets/upi/cred.png" },
  { key: "generic", label: "Any App", icon: "/assets/upi/bhim.png" },
] as const;

function formatClock(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * The shop's own UPI checkout: (WhatsApp code) → exact-amount QR → automatic confirmation when
 * the bank alert arrives. The parent remounts it per payment session (key = sessionId).
 */
export default function TeaPayPanel({
  session,
  onPaid,
  onRestart,
  onBackPressed,
}: {
  session: TeaPaySessionView;
  onPaid: (view: TeaPaySessionView) => void;
  onRestart: () => void;
  /** Browser Back during an open payment: the parent shows PaymentLeaveDialog. */
  onBackPressed?: () => void;
}) {
  const [view, setView] = useState<TeaPaySessionView>(session);
  const [secondsLeft, setSecondsLeft] = useState(session.secondsLeft);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [devCode, setDevCode] = useState<string | undefined>();
  const [resendIn, setResendIn] = useState(0);
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const paidFired = useRef(false);
  const onPaidRef = useRef(onPaid);
  useEffect(() => {
    onPaidRef.current = onPaid;
  }, [onPaid]);

  const applyView = useCallback((next: TeaPaySessionView) => {
    setView(next);
    setSecondsLeft(next.secondsLeft);
    if (next.status === "PAID" && !paidFired.current) {
      paidFired.current = true;
      onPaidRef.current(next);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/pay/status?sessionId=${encodeURIComponent(session.sessionId)}`);
      if (res.ok) applyView(await res.json());
    } catch {}
  }, [session.sessionId, applyView]);

  // Watch for the bank credit. After the window closes keep checking slowly: a late payment still confirms.
  const needsOtp = view.otpRequired && !view.phoneVerified;
  const settled = view.status === "PAID";
  const pollMs = view.status === "EXPIRED" || view.status === "CANCELLED" ? 10000 : 3000;
  useEffect(() => {
    if (needsOtp || settled) return;
    const interval = setInterval(refresh, pollMs);
    return () => clearInterval(interval);
  }, [needsOtp, settled, pollMs, refresh]);

  // While the payment is open: ask before Back, and warn before closing / reloading the tab.
  const paymentOpen = (view.status === "PENDING" || view.status === "VERIFYING") && Boolean(view.upiUri);
  const onBackRef = useRef(onBackPressed);
  useEffect(() => {
    onBackRef.current = onBackPressed;
  }, [onBackPressed]);
  useEffect(() => {
    if (!paymentOpen) return;
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.history.pushState({ teapayGuard: true }, "");
    const onPop = () => {
      window.history.pushState({ teapayGuard: true }, "");
      onBackRef.current?.();
    };
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", onPop);
    };
  }, [paymentOpen]);

  // Smooth countdowns between polls.
  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
      setResendIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const sendOtp = async () => {
    setBusy(true);
    setError("");
    const { ok, data } = await postJson("/api/pay/otp", { sessionId: session.sessionId, action: "send" });
    setBusy(false);
    if (!ok) {
      setError(data?.error || "Could not send the code. Please try again.");
      refresh(); // if WhatsApp is down, verification is skipped and the QR appears
      return;
    }
    setOtpSent(true);
    setOtpCode("");
    setResendIn(30);
    setDevCode(data?.devCode);
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpCode)) {
      setError("Enter the 6-digit code from WhatsApp.");
      return;
    }
    setBusy(true);
    setError("");
    const { ok, data } = await postJson("/api/pay/otp", { sessionId: session.sessionId, action: "verify", code: otpCode });
    setBusy(false);
    if (!ok) {
      setError(data?.error || "That code did not work. Please try again.");
      return;
    }
    applyView(data);
  };

  const markPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utr.replace(/\D/g, "");
    if (cleanUtr && cleanUtr.length !== 12) {
      setError("The UPI reference has 12 digits. You can also leave it empty.");
      return;
    }
    setBusy(true);
    setError("");
    const { ok, data } = await postJson("/api/pay/paid", { sessionId: session.sessionId, utr: cleanUtr || undefined });
    setBusy(false);
    if (!ok) setError(data?.error || "Please try again.");
    else applyView(data);
  };

  const amountLabel = `₹${Number(view.payAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  if (needsOtp) {
    return (
      <div className="bg-white border border-[#e7e2d8] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#25d366]/15 text-[#128c4a] flex items-center justify-center shrink-0">
            <MessageCircle size={18} />
          </div>
          <div>
            <div className="font-bold text-[14px] text-[#202020]">Verify your WhatsApp number</div>
            <div className="text-[12.5px] text-[#5c5a52]">
              We&apos;ll send a 6-digit code to <strong>+91 {view.phoneMasked}</strong>
            </div>
          </div>
        </div>

        {!otpSent ? (
          <button
            type="button"
            onClick={sendOtp}
            disabled={busy}
            className="w-full bg-[#25d366] hover:bg-[#1fbe5b] disabled:opacity-60 text-white py-2.5 rounded-lg font-bold text-[13.5px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {busy ? <RefreshCw size={15} className="animate-spin" /> : <MessageCircle size={15} />}
            <span>Send code on WhatsApp</span>
          </button>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-2.5">
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit code"
                className="flex-1 min-w-0 px-3.5 py-2 border border-[#e7e2d8] focus:border-[#02cb5a] rounded-lg text-[15px] tracking-[0.3em] font-mono bg-white outline-none"
              />
              <button
                type="submit"
                disabled={busy || otpCode.length !== 6}
                className="bg-[#02cb5a] hover:bg-[#02b851] disabled:opacity-50 text-[#1f3a2c] px-4 py-2 rounded-lg font-bold text-[13px] uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                {busy ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={15} />}
                <span>Verify</span>
              </button>
            </div>
            <div className="flex items-center justify-between text-[12px] text-[#747576]">
              <span>Code expires in 5 minutes.</span>
              {resendIn > 0 ? (
                <span>Resend in {resendIn}s</span>
              ) : (
                <button type="button" onClick={sendOtp} className="font-bold text-[#016c2f] cursor-pointer">
                  Resend code
                </button>
              )}
            </div>
            {devCode && (
              <div className="text-[11.5px] text-[#9a5b00] bg-[#fff8e6] rounded px-2 py-1">
                Dev mode code: <span className="font-mono font-bold">{devCode}</span>
              </div>
            )}
          </form>
        )}
        {error && <p className="text-[12.5px] text-[#e53935]">{error}</p>}
      </div>
    );
  }

  if (view.status === "PAID") {
    return (
      <div className="bg-[#f0f8f4] border border-[#bfdcc9] rounded-xl p-5 text-center space-y-1.5">
        <ShieldCheck size={24} className="mx-auto text-[#016c2f]" />
        <div className="font-bold text-[15px] text-[#1f3a2c]">Payment received</div>
        <p className="text-[12.5px] text-[#5c5a52]">Order #{view.orderNumber} is confirmed.</p>
      </div>
    );
  }

  if (view.status === "EXPIRED" || view.status === "CANCELLED") {
    return (
      <div className="bg-white border border-[#e7e2d8] rounded-xl p-5 text-center space-y-3">
        <TriangleAlert size={22} className="mx-auto text-[#c62828]" />
        <p className="text-[13px] text-[#202020]">
          {view.status === "EXPIRED"
            ? "The payment window has closed."
            : "This payment was cancelled."}{" "}
          If you already paid {amountLabel}, keep this page open: it confirms automatically when your bank
          reports it.
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] px-5 py-2 rounded-lg font-bold text-[13px] uppercase tracking-wider cursor-pointer"
        >
          Start a new payment
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e7e2d8] rounded-xl p-3 sm:p-4 space-y-3.5 sm:space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4">
        {view.qrCodeDataUrl && (
          <img
            src={view.qrCodeDataUrl}
            alt="UPI payment QR code"
            className="w-[152px] h-[152px] sm:w-[168px] sm:h-[168px] object-contain rounded-lg border border-[#e7e2d8] shrink-0"
          />
        )}
        <div className="flex-1 w-full space-y-1.5 sm:space-y-2 text-center sm:text-left min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Image src="/assets/upi/upi.svg" alt="UPI" width={44} height={16} className="h-4 w-auto" />
            <span className="text-[12px] text-[#747576] uppercase tracking-wider font-bold">Scan &amp; pay exactly</span>
          </div>
          <div className="text-[24px] sm:text-[26px] font-bold text-[#1f3a2c]">{amountLabel}</div>
          {view.adjustmentPaise > 0 && (
            <div className="text-[11.5px] text-[#5c5a52]">
              Gateway Fee: ₹{(view.adjustmentPaise / 100).toFixed(2)}
            </div>
          )}
          <div className="text-[12px] sm:text-[12.5px] text-[#5c5a52] break-all sm:break-normal">
            To <strong>{view.payeeName}</strong> <span className="font-mono">· {view.upiId}</span>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 text-[12px] sm:text-[12.5px] font-bold px-2.5 py-1 rounded-full ${
              secondsLeft <= 60 ? "bg-[#e53935]/10 text-[#c62828]" : "bg-[#f0f8f4] text-[#016c2f]"
            }`}
          >
            <Clock size={13} />
            <span>{formatClock(secondsLeft)} left to pay</span>
          </div>
        </div>
      </div>

      {view.deepLinks && (
        <div>
          <div className="text-[11.5px] text-[#747576] font-semibold mb-1.5">Or pay in your app (on this phone)</div>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {UPI_APPS.map((app) => (
              <a
                key={app.key}
                href={view.deepLinks?.[app.key]}
                className="flex flex-col items-center justify-center gap-1 border border-[#e7e2d8] hover:border-[#1f3a2c] hover:bg-[#fafafa] rounded-lg sm:rounded-xl py-2 px-0.5 sm:px-1 text-[10px] sm:text-[11.5px] font-semibold text-[#202020] transition-colors"
              >
                <Image src={app.icon} alt="" width={28} height={28} className="rounded-lg sm:w-8 sm:h-8" />
                <span className="text-center leading-tight truncate max-w-full px-0.5">{app.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {view.status === "VERIFYING" ? (
        <div className="bg-[#f0f8f4] border border-[#bfdcc9] rounded-lg p-3 flex items-center gap-2 text-[13px] text-[#1f3a2c]">
          <RefreshCw size={15} className="animate-spin text-[#016c2f] shrink-0" />
          <span>Checking with the bank. This usually takes under a minute; keep this page open.</span>
        </div>
      ) : (
        <form onSubmit={markPaid} className="space-y-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={16}
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            placeholder="UPI reference / UTR (optional, 12 digits)"
            className="w-full px-3.5 py-2 border border-[#e7e2d8] focus:border-[#02cb5a] rounded-lg text-[13px] font-mono bg-white outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#1f3a2c] hover:bg-[#14281e] disabled:opacity-60 text-white py-3 rounded-lg font-bold text-[14px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {busy ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={16} />}
            <span>I&apos;ve completed the payment</span>
          </button>
        </form>
      )}

      <p className="text-[11.5px] text-[#747576] text-center">
        Your order is placed automatically as soon as our bank receives the money.
      </p>
      {error && <p className="text-[12.5px] text-[#e53935]">{error}</p>}
    </div>
  );
}

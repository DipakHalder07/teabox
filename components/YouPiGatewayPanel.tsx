"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Clock,
  TriangleAlert,
  Smartphone,
} from "lucide-react";

export interface GatewayHealthInfo {
  isWorking: boolean;
  label?: string;
  warning?: string | null;
}

interface GatewayState {
  status: string;
  queuePosition: number;
  timeRemainingSeconds: number | null;
  canClickPaymentDone: boolean;
  payeeVpa: string | null;
  payeeName: string | null;
  amount: string;
  qrCodeDataUrl: string | null;
  deepLinks: { gpay: string; phonepe: string; paytm: string; cred: string; generic: string } | null;
  health: GatewayHealthInfo | null;
  reason: string | null;
}

const TERMINAL = new Set(["SUCCESS", "FAILED", "EXPIRED", "CANCELLED", "SUSPICIOUS", "BLOCKED"]);

const FAILURE_COPY: Record<string, string> = {
  FAILED: "We could not confirm this payment. If money left your account, contact us with your UPI reference.",
  EXPIRED: "The payment window closed before we received your payment.",
  CANCELLED: "This payment was cancelled.",
  SUSPICIOUS: "This payment is held for a security review. We will contact you.",
  BLOCKED: "UPI payment is not available for this number. Please choose Cash on Delivery.",
};

/** Ends an unfinished gateway session so it stops holding the UPI queue slot. Fire-and-forget. */
export function cancelYouPiGatewaySession(paymentId: string) {
  fetch("/api/payments/youpi/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "cancel", paymentId }),
    keepalive: true,
  }).catch(() => {});
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

function formatClock(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * YouPI-PG checkout in the shop's own design: WhatsApp OTP → queue → QR → "I've paid" →
 * bank verification. The gateway confirms the payment; the shop server re-checks it before
 * marking the order PAID.
 */
export default function YouPiGatewayPanel({
  paymentId,
  phone,
  name,
  amount,
  initialHealth,
  onPaid,
  onRetry,
}: {
  paymentId: string;
  phone: string;
  name: string;
  amount: number;
  initialHealth?: GatewayHealthInfo | null;
  onPaid: () => void;
  onRetry: () => void;
}) {
  const [checkingSession, setCheckingSession] = useState(true);
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [devOtp, setDevOtp] = useState<string | undefined>();
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [state, setState] = useState<GatewayState | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const paidFired = useRef(false);
  const onPaidRef = useRef(onPaid);
  useEffect(() => {
    onPaidRef.current = onPaid;
  }, [onPaid]);

  const bind = useCallback(async () => {
    const { ok, data } = await postJson("/api/payments/youpi/session", { action: "bind", paymentId, phone });
    if (ok) {
      setNeedsOtp(false);
      return true;
    }
    if (data?.needsOtp) {
      setNeedsOtp(true);
    } else {
      setError(data?.error || "Could not start the payment. Please try again.");
    }
    return false;
  }, [paymentId, phone]);

  // A customer who verified recently skips the OTP. (The parent remounts this panel per session.)
  // Started from a timer so a dev-mode double mount binds only once.
  useEffect(() => {
    let active = true;
    const start = setTimeout(async () => {
      await bind();
      if (active) setCheckingSession(false);
    }, 0);
    return () => {
      active = false;
      clearTimeout(start);
    };
  }, [bind]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/payments/youpi/session?paymentId=${encodeURIComponent(paymentId)}`);
      if (!res.ok) return;
      const data: GatewayState = await res.json();
      setState(data);
      setSecondsLeft(data.timeRemainingSeconds);
      if (data.status === "SUCCESS" && !paidFired.current) {
        paidFired.current = true;
        onPaidRef.current();
      }
    } catch {}
  }, [paymentId]);

  // Poll the gateway once the customer is bound to the session.
  const isTerminal = state ? TERMINAL.has(state.status) : false;
  useEffect(() => {
    if (checkingSession || needsOtp || isTerminal) return;
    const first = setTimeout(refresh, 0);
    const interval = setInterval(refresh, 2500);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [checkingSession, needsOtp, isTerminal, refresh]);

  // Smooth countdowns between polls.
  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((s) => (s === null ? s : Math.max(0, s - 1)));
      setResendIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const sendOtp = async () => {
    setBusy(true);
    setError("");
    const { ok, data } = await postJson("/api/payments/youpi/otp/send", { phone, name });
    setBusy(false);
    if (!ok) {
      setError(data?.error || "Could not send the code. Please try again.");
      return;
    }
    setOtpSent(true);
    setOtpCode("");
    setResendIn(30);
    setDevOtp(data?.devOtp);
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpCode)) {
      setError("Enter the 6-digit code from WhatsApp.");
      return;
    }
    setBusy(true);
    setError("");
    const { ok, data } = await postJson("/api/payments/youpi/otp/verify", { phone, otp: otpCode });
    if (!ok) {
      setBusy(false);
      setError(data?.error || "That code did not work. Please try again.");
      return;
    }
    await bind();
    setBusy(false);
  };

  const markDone = async () => {
    setBusy(true);
    setError("");
    const { ok, data } = await postJson("/api/payments/youpi/session", { action: "done", paymentId });
    setBusy(false);
    if (!ok) setError(data?.error || "Could not start verification.");
    refresh();
  };

  const health = state?.health || initialHealth || null;
  const status = state?.status;

  return (
    <div className="space-y-4">
      {health && !health.isWorking && (
        <div className="bg-[#fff8e6] border border-[#f5d58a] rounded-lg p-3 text-[12.5px] text-[#6b4a00] flex gap-2">
          <TriangleAlert size={15} className="shrink-0 mt-0.5" />
          <span>
            {health.warning || "UPI confirmation may be delayed right now."} You can also choose Cash on Delivery.
          </span>
        </div>
      )}

      {checkingSession ? (
        <div className="flex items-center gap-2 text-[13px] text-[#5c5a52] py-6 justify-center">
          <RefreshCw size={15} className="animate-spin" />
          <span>Starting secure payment…</span>
        </div>
      ) : needsOtp ? (
        /* Step 1: WhatsApp verification */
        <div className="bg-white border border-[#e7e2d8] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#25d366]/15 text-[#128c4a] flex items-center justify-center shrink-0">
              <MessageCircle size={18} />
            </div>
            <div>
              <div className="font-bold text-[14px] text-[#202020]">Verify your WhatsApp number</div>
              <div className="text-[12.5px] text-[#5c5a52]">
                We&apos;ll send a 6-digit code to <strong>+91 {phone}</strong>
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
              {devOtp && (
                <div className="text-[11.5px] text-[#9a5b00] bg-[#fff8e6] rounded px-2 py-1">
                  Dev mode code: <span className="font-mono font-bold">{devOtp}</span>
                </div>
              )}
            </form>
          )}
        </div>
      ) : !state || status === "INITIATED" ? (
        <div className="flex items-center gap-2 text-[13px] text-[#5c5a52] py-6 justify-center">
          <RefreshCw size={15} className="animate-spin" />
          <span>Preparing your QR code…</span>
        </div>
      ) : status === "QUEUED" ? (
        <div className="bg-white border border-[#e7e2d8] rounded-xl p-5 text-center space-y-2">
          <Clock size={22} className="mx-auto text-[#016c2f]" />
          <div className="font-bold text-[14.5px] text-[#202020]">
            You&apos;re #{Math.max(1, state.queuePosition)} in line
          </div>
          <p className="text-[12.5px] text-[#5c5a52]">
            Another customer is paying right now. Your QR code appears here automatically. Please keep this
            page open.
          </p>
        </div>
      ) : status === "ACTIVE" ? (
        <div className="bg-white border border-[#e7e2d8] rounded-xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {state.qrCodeDataUrl && (
              <img
                src={state.qrCodeDataUrl}
                alt="UPI payment QR code"
                className="w-[168px] h-[168px] object-contain rounded-lg border border-[#e7e2d8] shrink-0"
              />
            )}
            <div className="flex-1 w-full space-y-2 text-center sm:text-left">
              <div className="text-[12px] text-[#747576] uppercase tracking-wider font-bold">Scan &amp; pay exactly</div>
              <div className="text-[26px] font-bold text-[#1f3a2c]">₹{Number(state.amount || amount).toLocaleString("en-IN")}</div>
              {state.payeeName && (
                <div className="text-[12.5px] text-[#5c5a52]">
                  To <strong>{state.payeeName}</strong>
                  {state.payeeVpa && <span className="font-mono"> · {state.payeeVpa}</span>}
                </div>
              )}
              {secondsLeft !== null && (
                <div
                  className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold px-2.5 py-1 rounded-full ${
                    secondsLeft <= 60 ? "bg-[#e53935]/10 text-[#c62828]" : "bg-[#f0f8f4] text-[#016c2f]"
                  }`}
                >
                  <Clock size={13} />
                  <span>{formatClock(secondsLeft)} left to pay</span>
                </div>
              )}
            </div>
          </div>

          {state.deepLinks && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Google Pay", href: state.deepLinks.gpay },
                { label: "PhonePe", href: state.deepLinks.phonepe },
                { label: "Paytm", href: state.deepLinks.paytm },
                { label: "CRED", href: state.deepLinks.cred },
              ].map((app) => (
                <a
                  key={app.label}
                  href={app.href}
                  className="flex items-center justify-center gap-1.5 border border-[#e7e2d8] hover:border-[#1f3a2c] rounded-lg py-2 text-[12.5px] font-semibold text-[#202020] transition-colors"
                >
                  <Smartphone size={13} />
                  {app.label}
                </a>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={markDone}
            disabled={busy || !state.canClickPaymentDone}
            className="w-full bg-[#1f3a2c] hover:bg-[#14281e] disabled:opacity-60 text-white py-3 rounded-lg font-bold text-[14px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {busy ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={16} />}
            <span>I&apos;ve completed the payment</span>
          </button>
          <p className="text-[11.5px] text-[#747576] text-center">
            Your order is confirmed automatically as soon as our bank receives the money.
          </p>
        </div>
      ) : status === "PROCESSING" ? (
        <div className="bg-white border border-[#e7e2d8] rounded-xl p-5 text-center space-y-2">
          <RefreshCw size={22} className="mx-auto text-[#016c2f] animate-spin" />
          <div className="font-bold text-[14.5px] text-[#202020]">Checking with the bank…</div>
          <p className="text-[12.5px] text-[#5c5a52]">This usually takes under 30 seconds. Please don&apos;t close this page.</p>
        </div>
      ) : status === "SUCCESS" ? (
        <div className="bg-[#f0f8f4] border border-[#bfdcc9] rounded-xl p-5 text-center space-y-1.5">
          <ShieldCheck size={24} className="mx-auto text-[#016c2f]" />
          <div className="font-bold text-[15px] text-[#1f3a2c]">Payment received</div>
          <p className="text-[12.5px] text-[#5c5a52]">Placing your order…</p>
        </div>
      ) : (
        <div className="bg-white border border-[#e7e2d8] rounded-xl p-5 text-center space-y-3">
          <TriangleAlert size={22} className="mx-auto text-[#c62828]" />
          <p className="text-[13px] text-[#202020]">{FAILURE_COPY[status || ""] || "This payment could not be completed."}</p>
          {status !== "BLOCKED" && status !== "SUSPICIOUS" && (
            <button
              type="button"
              onClick={onRetry}
              className="bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] px-5 py-2 rounded-lg font-bold text-[13px] uppercase tracking-wider cursor-pointer"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {error && <p className="text-[12.5px] text-[#e53935]">{error}</p>}
    </div>
  );
}

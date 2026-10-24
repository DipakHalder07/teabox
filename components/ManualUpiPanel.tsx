"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Check, Clock, Copy, RefreshCw } from "lucide-react";
import { formatClock, PaymentStatusBar, UPI_APPS, UpiExpiredNotice } from "./TeaPayPanel";

/**
 * UPI checkout used when the TeaPay gateway is unavailable (no database). It looks and behaves like
 * TeaPayPanel; the difference is that nothing can be matched automatically, so "Confirm my order"
 * places the order as pending and the shop confirms it against the bank record.
 */
export default function ManualUpiPanel({
  loading,
  amount,
  vpa,
  payeeName,
  qrCodeDataUrl,
  deepLinks,
  upiUri,
  secondsLeft,
  busy,
  onConfirm,
  onRestart,
}: {
  loading: boolean;
  amount: number;
  vpa: string;
  payeeName: string;
  qrCodeDataUrl?: string;
  deepLinks?: Partial<Record<(typeof UPI_APPS)[number]["key"], string>>;
  upiUri?: string;
  secondsLeft: number;
  busy: boolean;
  onConfirm: () => void;
  onRestart: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const amountLabel = `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="bg-white border border-[#e7e2d8] rounded-xl p-8 flex flex-col items-center gap-2 text-[13px] text-[#5c5a52]">
        <RefreshCw size={22} className="animate-spin text-[#016c2f]" />
        <span>Generating your secure payment QR...</span>
      </div>
    );
  }

  if (secondsLeft <= 0) {
    return <UpiExpiredNotice amountLabel={amountLabel} onRestart={onRestart} />;
  }

  const copyVpa = () => {
    navigator.clipboard?.writeText(vpa).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-[#e7e2d8] rounded-xl p-3 sm:p-4 space-y-3.5 sm:space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4">
        {qrCodeDataUrl && (
          <img
            src={qrCodeDataUrl}
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
          <div className="text-[12px] sm:text-[12.5px] text-[#5c5a52] break-all sm:break-normal">
            To <strong>{payeeName}</strong>
          </div>
          <button
            type="button"
            onClick={copyVpa}
            className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[#1f3a2c] bg-[#fafafa] border border-[#e7e2d8] hover:border-[#1f3a2c] rounded-md px-2 py-1 cursor-pointer max-w-full"
            aria-label="Copy UPI ID"
          >
            <span className="truncate">{vpa}</span>
            {copied ? <Check size={12} className="text-[#02cb5a] shrink-0" /> : <Copy size={12} className="shrink-0" />}
          </button>
          <div>
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
      </div>

      <div>
        <div className="text-[11.5px] text-[#747576] font-semibold mb-1.5">Or pay in your app (on this phone)</div>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {UPI_APPS.map((app) => (
            <a
              key={app.key}
              href={deepLinks?.[app.key] || upiUri || "#"}
              className="flex flex-col items-center justify-center gap-1 border border-[#e7e2d8] hover:border-[#1f3a2c] hover:bg-[#fafafa] rounded-lg sm:rounded-xl py-2 px-0.5 sm:px-1 text-[10px] sm:text-[11.5px] font-semibold text-[#202020] transition-colors"
            >
              <Image src={app.icon} alt="" width={28} height={28} className="rounded-lg sm:w-8 sm:h-8" />
              <span className="text-center leading-tight truncate max-w-full px-0.5">{app.label}</span>
            </a>
          ))}
        </div>
      </div>

      <PaymentStatusBar />

      <p className="text-[12px] text-[#5c5a52] text-center">
        Paid already?{" "}
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="font-bold text-[#016c2f] hover:underline cursor-pointer disabled:opacity-60 inline-flex items-center gap-1"
        >
          {busy && <RefreshCw size={12} className="animate-spin" />}
          Confirm my order
        </button>
      </p>
    </div>
  );
}

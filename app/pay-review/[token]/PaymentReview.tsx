"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CircleX, Clock, RefreshCw, TriangleAlert } from "lucide-react";

interface Review {
  orderNumber: string;
  status: "PENDING" | "VERIFYING" | "PAID" | "EXPIRED" | "CANCELLED";
  customerName: string;
  customerPhone: string;
  address: string;
  items: Array<{ title: string; weight: string | null; quantity: number; price: number }>;
  payAmount: string;
  orderTotal: number;
  upiId: string;
  secondsLeft: number;
  customerUtr: string | null;
  utr: string | null;
  paidVia: string | null;
}

const STATUS_TEXT: Record<Review["status"], string> = {
  PENDING: "Customer is on the payment screen",
  VERIFYING: "Customer says they paid. Check your bank app.",
  PAID: "Paid. The order is confirmed.",
  EXPIRED: "Payment time is over",
  CANCELLED: "Cancelled",
};

function formatClock(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** One payment, for the shop owner: same 10-minute timer as the customer, and Paid / Not paid buttons. */
export default function PaymentReview({ token }: { token: string }) {
  const [data, setData] = useState<Review | null>(null);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/pay/review?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Could not load this payment.");
        return;
      }
      setData(json);
      setSecondsLeft(json.secondsLeft);
      if (json.customerUtr) setUtr((u) => u || json.customerUtr);
    } catch {
      setError("Network error. Pull down to refresh.");
    }
  }, [token]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const poll = setInterval(load, 5000);
    const tick = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [load]);

  const act = async (action: "paid" | "cancel") => {
    if (action === "cancel" && !window.confirm("Mark as NOT paid and cancel this order?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/pay/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action, utr }),
      });
      const json = await res.json();
      if (!res.ok) window.alert(json?.error || "Could not update.");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const open = data && (data.status === "PENDING" || data.status === "VERIFYING");
  const settled = data && data.status === "PAID";

  return (
    <div className="min-h-screen bg-[#f7f6f2] px-4 py-6 text-[#202020]">
      <div className="max-w-[460px] mx-auto space-y-4">
        <div className="text-center">
          <div className="text-[12px] font-bold uppercase tracking-wider text-[#747576]">Teabox · Confirm payment</div>
          {data && <h1 className="text-[22px] font-bold text-[#1f3a2c] font-mono">{data.orderNumber}</h1>}
        </div>

        {error && (
          <div className="bg-[#fdecea] border border-[#f5c2bf] rounded-2xl p-4 text-[13.5px] text-[#8e1c1a] flex gap-2">
            <TriangleAlert size={18} className="shrink-0" /> {error}
          </div>
        )}

        {!data && !error && (
          <div className="bg-white border border-[#e7e2d8] rounded-2xl p-6 text-center text-[13px] text-[#5c5a52]">
            <RefreshCw size={18} className="animate-spin mx-auto mb-2" /> Loading…
          </div>
        )}

        {data && (
          <>
            <div
              className={`rounded-2xl p-4 text-center border ${
                settled
                  ? "bg-[#f0f8f4] border-[#bfdcc9]"
                  : open
                    ? "bg-white border-[#e7e2d8]"
                    : "bg-[#f3f1ec] border-[#e7e2d8]"
              }`}
            >
              <div className="text-[30px] font-bold text-[#1f3a2c]">₹{Number(data.payAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
              <div className="text-[12.5px] text-[#5c5a52]">to {data.upiId} · order total ₹{data.orderTotal.toLocaleString("en-IN")}</div>
              {open && (
                <div
                  className={`inline-flex items-center gap-1.5 mt-2 text-[14px] font-bold px-3 py-1 rounded-full ${
                    secondsLeft <= 60 ? "bg-[#e53935]/10 text-[#c62828]" : "bg-[#f0f8f4] text-[#016c2f]"
                  }`}
                >
                  <Clock size={14} /> {formatClock(secondsLeft)} left
                </div>
              )}
              <div className={`mt-2 text-[13.5px] font-semibold ${settled ? "text-[#016c2f]" : "text-[#202020]"}`}>
                {settled && <CheckCircle2 size={16} className="inline mr-1 -mt-0.5" />}
                {STATUS_TEXT[data.status]}
              </div>
              {data.utr && <div className="text-[12px] text-[#5c5a52] mt-1 font-mono">UTR {data.utr}</div>}
            </div>

            <div className="bg-white border border-[#e7e2d8] rounded-2xl p-4 space-y-2 text-[13.5px]">
              <div>
                <strong>{data.customerName}</strong> ·{" "}
                <a href={`tel:+91${data.customerPhone}`} className="text-[#016c2f] font-semibold">
                  +91 {data.customerPhone}
                </a>
              </div>
              <div className="text-[#5c5a52]">{data.address}</div>
              <ul className="border-t border-[#efece5] pt-2 space-y-1">
                {data.items.map((item, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>
                      {item.title}
                      {item.weight && <span className="text-[#747576]"> ({item.weight})</span>} ×{item.quantity}
                    </span>
                    <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                  </li>
                ))}
              </ul>
            </div>

            {!settled && (
              <div className="bg-white border border-[#e7e2d8] rounded-2xl p-4 space-y-3">
                <p className="text-[13px] text-[#5c5a52]">
                  Open your bank / UPI app and check if <strong>₹{data.payAmount}</strong> arrived.
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="UTR / UPI reference (optional)"
                  className="w-full px-3.5 py-2.5 border border-[#e7e2d8] focus:border-[#02cb5a] rounded-lg text-[14px] font-mono outline-none"
                />
                {data.customerUtr && (
                  <p className="text-[12px] text-[#747576]">Customer entered UTR {data.customerUtr} (not checked yet).</p>
                )}
                <button
                  onClick={() => act("paid")}
                  disabled={busy}
                  className="w-full bg-[#02cb5a] hover:bg-[#02b851] disabled:opacity-60 text-[#1f3a2c] py-3.5 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={18} /> Yes, payment received
                </button>
                {data.status !== "CANCELLED" && (
                  <button
                    onClick={() => act("cancel")}
                    disabled={busy}
                    className="w-full bg-white border border-[#e7e2d8] hover:border-[#c62828] disabled:opacity-60 text-[#c62828] py-3 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CircleX size={17} /> No, not received
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

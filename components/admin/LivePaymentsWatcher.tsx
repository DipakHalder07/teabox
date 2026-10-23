"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, ChevronDown, ChevronUp } from "lucide-react";

interface LivePayment {
  id: string;
  orderNumber: string;
  customerName: string;
  payAmount: string;
  status: "PENDING" | "VERIFYING";
  stage: string | null;
  expiresAt: string;
}

interface PaidPayment {
  id: string;
  orderNumber: string;
  customerName: string;
  payAmount: string;
  paidVia: string | null;
}

const rupees = (amount: string) => `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

function clock(seconds: number) {
  const s = Math.max(0, seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Short two-tone chime (no audio file needed). Browsers allow it after the admin has clicked once. */
let audioCtx: AudioContext | null = null;
function chime() {
  try {
    audioCtx = audioCtx || new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    [880, 1320].forEach((freq, i) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, audioCtx!.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, audioCtx!.currentTime + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx!.currentTime + i * 0.18 + 0.3);
      osc.connect(gain).connect(audioCtx!.destination);
      osc.start(audioCtx!.currentTime + i * 0.18);
      osc.stop(audioCtx!.currentTime + i * 0.18 + 0.32);
    });
  } catch {}
}

/**
 * On every admin page: shows UPI payments in progress with the same live timer the customer sees,
 * and alerts the admin (pop-up, chime, desktop notification) when a payment starts, when the
 * customer says they paid, and when the money arrives.
 */
export default function LivePaymentsWatcher() {
  const router = useRouter();
  const [live, setLive] = useState<LivePayment[]>([]);
  const [offsetMs, setOffsetMs] = useState(0); // server clock minus this computer's clock
  const [now, setNow] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");

  const seen = useRef<Map<string, string> | null>(null); // id -> status (null until first load)
  const paidSeen = useRef<Set<string>>(new Set());

  const notify = useCallback(
    (title: string, body: string, tone: "info" | "warning" | "success") => {
      chime();
      const open = { label: "Open", onClick: () => router.push("/admin/payment-gateway") };
      if (tone === "success") toast.success(title, { description: body, action: open, duration: 10000 });
      else if (tone === "warning") toast.warning(title, { description: body, action: open, duration: 15000 });
      else toast.info(title, { description: body, action: open, duration: 10000 });
      if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
        const n = new Notification(title, { body, tag: `teapay-${title}-${body}` });
        n.onclick = () => {
          window.focus();
          router.push("/admin/payment-gateway");
        };
      }
    },
    [router]
  );

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/gateway/live", { cache: "no-store" });
      if (!res.ok) return;
      const data: { serverNow: string; live: LivePayment[]; recentPaid: PaidPayment[] } = await res.json();
      setOffsetMs(new Date(data.serverNow).getTime() - Date.now());
      setLive(data.live);

      const first = seen.current === null;
      const previous = seen.current || new Map<string, string>();
      if (!first) {
        for (const p of data.live) {
          const before = previous.get(p.id);
          if (!before) notify("💳 Payment started", `${p.customerName} · ${rupees(p.payAmount)} · ${p.orderNumber}`, "info");
          else if (before !== "VERIFYING" && p.status === "VERIFYING") {
            notify("🔔 Customer says they paid", `${p.customerName} · check your bank for ${rupees(p.payAmount)}`, "warning");
          }
        }
        for (const p of data.recentPaid) {
          if (!paidSeen.current.has(p.id)) {
            notify("✅ Payment received", `${p.customerName} · ${rupees(p.payAmount)} · ${p.orderNumber}`, "success");
          }
        }
      }
      seen.current = new Map(data.live.map((p) => [p.id, p.status]));
      for (const p of data.recentPaid) paidSeen.current.add(p.id);
    } catch {}
  }, [notify]);

  useEffect(() => {
    const first = setTimeout(() => {
      poll();
      setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    }, 0);
    const interval = setInterval(poll, 3000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
      clearInterval(tick);
    };
  }, [poll]);

  // Browser tab shows how many payments are live, e.g. "(2) 💳 Admin".
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) 💳 /, "");
    document.title = live.length ? `(${live.length}) 💳 ${base}` : base;
  }, [live.length]);

  const enableAlerts = async () => {
    chime(); // this click also unlocks sound
    if (typeof Notification !== "undefined") setPermission(await Notification.requestPermission());
  };

  const serverNow = now ? now + offsetMs : 0;

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[320px] max-w-[calc(100vw-2rem)] space-y-2">
      {permission === "default" && (
        <button
          onClick={enableAlerts}
          className="ml-auto flex items-center gap-1.5 bg-[#1f3a2c] text-white text-[12px] font-semibold px-3 py-2 rounded-full shadow-lg cursor-pointer hover:bg-[#14281e]"
        >
          <Bell size={14} /> Turn on payment alerts
        </button>
      )}

      {live.length > 0 && (
        <div className="bg-white border border-[#bfdcc9] rounded-2xl shadow-xl overflow-hidden">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-between gap-2 bg-[#1f3a2c] text-white px-3.5 py-2.5 cursor-pointer"
          >
            <span className="flex items-center gap-2 text-[13px] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#02cb5a] animate-pulse" />
              {live.length} payment{live.length > 1 ? "s" : ""} in progress
            </span>
            {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {!collapsed && (
            <ul className="max-h-[280px] overflow-y-auto divide-y divide-[#efece5]">
              {live.map((p) => {
                const left = serverNow ? Math.max(0, Math.round((new Date(p.expiresAt).getTime() - serverNow) / 1000)) : null;
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => router.push("/admin/payment-gateway")}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[#fafafa] cursor-pointer"
                    >
                      <span
                        className={`shrink-0 font-mono font-bold text-[16px] w-[56px] text-center rounded-lg py-1 ${
                          left !== null && left <= 60 ? "bg-[#e53935]/10 text-[#c62828]" : "bg-[#f0f8f4] text-[#016c2f]"
                        }`}
                      >
                        {left === null ? "--:--" : clock(left)}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-bold text-[#202020] truncate">
                          {p.customerName} · {rupees(p.payAmount)}
                        </span>
                        <span className={`block text-[11.5px] truncate ${p.status === "VERIFYING" ? "text-[#9a5b00] font-semibold" : "text-[#747576]"}`}>
                          {p.stage} · {p.orderNumber}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

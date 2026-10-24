"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  RefreshCw,
  MessageCircle,
  Mail,
  Smartphone,
  Download,
  CircleCheck,
  CircleX,
  TriangleAlert,
  QrCode,
  Send,
  Trash,
  IndianRupee,
  Clock,
  Banknote,
  Radio,
  ExternalLink,
} from "lucide-react";
import { istDateTime, istTime } from "@/lib/istTime";

interface Overview {
  toggles: { whatsapp: boolean; sms: boolean; gmail: boolean; cod: boolean };
  database: boolean;
  databaseHost?: string | null;
  databaseLocal?: boolean;
  databaseLocalOnServer?: boolean;
  upi: { upiId: string | null; payeeName: string };
  whatsapp: {
    provider: "qr" | "cloud" | null;
    configured: boolean;
    otpRequired: boolean;
    service: { status: string; connected: boolean; phone: string | null; qrDataUrl: string | null; error?: string } | null;
    alerts: { enabled: boolean; number: string };
  };
  cronConfigured: boolean;
  publicBaseUrl: string;
  apkUrl: string;
  gmail?: { configured: boolean; connected: boolean; email: string | null; lastPollAt: string | null; lastError: string | null };
  gmailSender?: { configured: boolean; connected: boolean; email: string | null; lastError: string | null };
  devices?: Array<{
    id: string;
    name: string;
    model: string | null;
    batteryPercent: number | null;
    lastHeartbeatAt: string | null;
    lastEventAt: string | null;
    lastTestAt: string | null;
    online: boolean;
  }>;
  phoneFeed?: Array<{ id: string; source: string; amount: string; utr: string | null; receivedAt: string; orderNumber: string | null }>;
  sessions?: Array<{
    id: string;
    orderNumber: string;
    status: string;
    customerName: string;
    customerPhone: string;
    payAmount: string;
    orderTotal: number;
    customerUtr: string | null;
    utr: string | null;
    paidVia: string | null;
    phoneVerified: boolean;
    stage: string | null;
    expiresAt: string;
    createdAt: string;
    paidAt: string | null;
  }>;
  unmatchedCredits?: Array<{
    id: string;
    source: string;
    amount: string;
    utr: string | null;
    payerVpa: string | null;
    sender: string | null;
    text: string;
    observedAt: string;
  }>;
  stats?: { paidToday: number; waiting: number };
  serverNow?: string;
}

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-[#02cb5a]/15 text-[#016c2f]",
  PENDING: "bg-[#f5a623]/15 text-[#9a5b00]",
  VERIFYING: "bg-[#2563eb]/12 text-[#1d4ed8]",
  EXPIRED: "bg-[#ece9e1] text-[#5c5a52]",
  CANCELLED: "bg-[#ece9e1] text-[#5c5a52]",
};

const SOURCE_LABEL: Record<string, string> = {
  ANDROID_SMS: "Phone SMS",
  ANDROID_NOTIFICATION: "Phone app",
  GMAIL: "Gmail",
  MANUAL: "Admin",
};

function timeAgo(iso: string | null) {
  if (!iso) return "never";
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString("en-IN");
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border border-[#e7e2d8] rounded-2xl p-5 shadow-2xs ${className}`}>{children}</div>;
}

function CardTitle({ icon: Icon, title, right }: { icon: React.ElementType; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-[#016c2f]" />
        <h2 className="font-bold text-[16px] text-[#1f3a2c]">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function Pill({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
        ok ? "bg-[#02cb5a]/15 text-[#016c2f]" : "bg-[#ece9e1] text-[#5c5a52]"
      }`}
    >
      {children}
    </span>
  );
}

function Switch({ on, label, disabled, onChange }: { on: boolean; label: string; disabled?: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-60 ${
        on ? "bg-[#02cb5a]" : "bg-[#d6d2c8]"
      }`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
    </button>
  );
}

type Act = (action: string, payload?: Record<string, unknown>, success?: string) => Promise<Record<string, unknown> | null>;

/** Lets customers choose Cash on Delivery at checkout, or not. */
function CodCard({ data, busy, act }: { data: Overview; busy: string; act: Act }) {
  const on = data.toggles.cod;
  return (
    <Card>
      <CardTitle
        icon={Banknote}
        title="Cash on Delivery (COD)"
        right={
          <Switch
            on={on}
            label="Cash on Delivery"
            disabled={busy !== ""}
            onChange={(next) =>
              act("toggle", { key: "cod", enabled: next }, next ? "Cash on Delivery turned on" : "Cash on Delivery turned off")
            }
          />
        }
      />
      <div className="mb-2">
        <Pill ok={on}>{on ? "On" : "Off"}</Pill>
      </div>
      <p className="text-[12.5px] text-[#5c5a52]">
        {on ? (
          <>
            <strong>On.</strong> Customers can choose Cash on Delivery at checkout (+₹40 fee).
          </>
        ) : (
          <>
            <strong>Off.</strong> Checkout shows UPI only. COD orders already placed are not affected.
          </>
        )}
      </p>
    </Card>
  );
}

/** Log the shop's WhatsApp in (scan QR / pairing code) and send a test. */
function WhatsAppCard({ data, busy, act }: { data: Overview; busy: string; act: Act }) {
  const [phone, setPhone] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState("");
  const wa = data.whatsapp;
  const svc = wa.service;
  const connected = wa.provider === "cloud" || Boolean(svc?.connected);
  const shownQr = svc?.connected ? null : qr || svc?.qrDataUrl;

  const getQr = async () => {
    const r = await act("whatsapp-qr");
    if (r) setQr((r.qrDataUrl as string) || null);
  };
  const getPairingCode = async () => {
    const r = await act("whatsapp-pairing-code", { phone });
    if (r?.code) setPairingCode(String(r.code));
  };
  const sendTest = async () => {
    const r = await act("whatsapp-test", { phone });
    if (r?.code) toast.success("Test code sent on WhatsApp", { description: `Code: ${r.code}` });
  };

  const statusLabel = !wa.provider
    ? "Not configured"
    : connected
    ? "Connected"
    : svc?.status === "offline"
    ? "Service offline"
    : "Waiting for scan";

  const on = data.toggles.whatsapp;

  return (
    <Card>
      <CardTitle
        icon={MessageCircle}
        title="WhatsApp Gateway & Login"
        right={
          <Switch
            on={on}
            label="Require WhatsApp code at checkout"
            disabled={busy !== ""}
            onChange={(next) =>
              act(
                "toggle",
                { key: "whatsapp", enabled: next },
                next ? "WhatsApp checkout code turned on" : "WhatsApp checkout code turned off"
              )
            }
          />
        }
      />

      {!on && (
        <p className="text-[12.5px] text-[#5c5a52]">
          <strong>Off.</strong> Customers go straight to the payment QR. Turn on to send them a WhatsApp code first:
          you will scan a QR with your phone&apos;s WhatsApp once.
        </p>
      )}

      {on && (
        <>
          <div className="flex items-center justify-between mb-3">
            <Pill ok={connected}>{statusLabel}</Pill>
            <span className="text-[11.5px] text-[#747576]">
              Checkout OTP: <strong>Required</strong>
            </span>
          </div>

          {!wa.provider && (
            <p className="text-[12.5px] text-[#5c5a52]">
              Run the WhatsApp service (<code>npm run whatsapp</code>) and verify <code>WHATSAPP_SERVICE_URL</code> and{" "}
              <code>WHATSAPP_SERVICE_TOKEN</code> in <code>.env</code>.
            </p>
          )}

          {wa.provider === "qr" && svc?.status === "offline" && (
            <div className="text-[12.5px] text-[#5c5a52] space-y-1.5">
              <p>
                The WhatsApp service on port 7071 is offline. Start it in terminal with <code>npm run whatsapp</code> or{" "}
                <code>npm run dev</code>.
              </p>
              {svc.error && <p className="text-[11.5px] text-[#9a5b00]">{svc.error}</p>}
            </div>
          )}

          {wa.provider === "qr" && svc && svc.status !== "offline" && !svc.connected && (
            <div className="space-y-3">
              <ol className="list-decimal pl-5 text-[12.5px] text-[#202020] space-y-0.5">
                <li>On your phone, open WhatsApp.</li>
                <li>
                  Tap <strong>Settings → Linked devices → Link a device</strong>.
                </li>
                <li>Scan this QR code. It will link as a companion device.</li>
              </ol>
              <div className="flex items-center justify-center bg-[#fafafa] border border-[#e7e2d8] rounded-xl w-[232px] h-[232px] mx-auto p-2">
                {shownQr ? (
                  <img src={shownQr} alt="WhatsApp login QR" className="w-[220px] h-[220px] object-contain" />
                ) : (
                  <span className="text-[12.5px] text-[#747576] text-center px-4">Preparing QR… tap “Refresh QR” if it does not appear</span>
                )}
              </div>
              <div className="flex justify-center">
                <button onClick={getQr} disabled={busy !== ""} className={buttonDark}>
                  <QrCode size={14} /> Refresh QR
                </button>
              </div>
              <div className="border-t border-[#e7e2d8] pt-3 space-y-2">
                <p className="text-[12px] text-[#5c5a52]">
                  <strong>Can&apos;t scan?</strong> WhatsApp → Linked devices → Link a device →{" "}
                  <strong>Link with phone number instead</strong>, then enter this code:
                </p>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit phone number"
                    className="flex-1 min-w-0 px-3 py-2 border border-[#e7e2d8] focus:border-[#02cb5a] rounded-lg text-[13px] outline-none"
                  />
                  <button onClick={getPairingCode} disabled={busy !== ""} className={buttonLight}>
                    Get code
                  </button>
                </div>
                {pairingCode && (
                  <div className="text-[24px] font-mono font-bold tracking-[0.15em] text-[#1f3a2c] text-center bg-[#fafafa] py-2 rounded-lg border border-[#e7e2d8]">
                    {pairingCode}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-[#9a5b00]">
                Uses WhatsApp Web linking. Linked device stays logged in and automatically sends verification codes.
              </p>
            </div>
          )}

          {connected && (
            <div className="space-y-3">
              <p className="text-[12.5px] text-[#5c5a52]">
                {wa.provider === "qr" ? (
                  <>
                    Logged in as <strong>+{svc?.phone}</strong>. Customers receive checkout codes from this WhatsApp.
                  </>
                ) : (
                  "Codes are sent with official WhatsApp Cloud API."
                )}
              </p>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit number to test"
                  className="flex-1 min-w-0 px-3 py-2 border border-[#e7e2d8] focus:border-[#02cb5a] rounded-lg text-[13px] outline-none"
                />
                <button onClick={sendTest} disabled={busy !== ""} className={buttonDark}>
                  <Send size={14} /> Test Send
                </button>
              </div>
              {wa.provider === "qr" && <OrderAlerts data={data} busy={busy} act={act} />}
              {wa.provider === "qr" && (
                <button
                  onClick={() =>
                    window.confirm("Log out this WhatsApp? You can scan a new QR code to link again.") &&
                    act("whatsapp-logout", {}, "WhatsApp logged out")
                  }
                  disabled={busy !== ""}
                  className={buttonLight}
                >
                  Log out
                </button>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}



/** WhatsApp alert to the shop for every new UPI order (with a link to confirm it). */
function OrderAlerts({ data, busy, act }: { data: Overview; busy: string; act: Act }) {
  const [number, setNumber] = useState(data.whatsapp.alerts.number);
  const enabled = data.whatsapp.alerts.enabled;
  const sender = (data.whatsapp.service?.phone || "").replace(/^91/, "");
  const target = data.whatsapp.alerts.number || sender;
  return (
    <div className="border-t border-[#e7e2d8] pt-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[13px] font-semibold text-[#202020]">Send me each new order on WhatsApp</div>
        <Switch
          on={enabled}
          label="Order alerts"
          disabled={busy !== ""}
          onChange={(on) => act("alerts", { enabled: on, number }, on ? "Order alerts on" : "Order alerts off")}
        />
      </div>
      {enabled && (
        <>
          <div className="text-[13px] text-[#202020]">
            Alerts go to <strong>+91 {target || "—"}</strong>
          </div>
          <div className="flex gap-2">
            <input
              type="tel"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="WhatsApp number for alerts (10 digits)"
              className="flex-1 min-w-0 px-3 py-2 border border-[#e7e2d8] focus:border-[#02cb5a] rounded-lg text-[13px] outline-none"
            />
            <button onClick={() => act("alerts", { enabled: true, number }, "Alert number saved")} disabled={busy !== ""} className={buttonLight}>
              Save
            </button>
          </div>
          {target && target === sender && (
            <p className="text-[11.5px] text-[#9a5b00] bg-[#fff8e6] rounded-lg px-2.5 py-1.5">
              This is the same number that sends the messages, so alerts appear in your WhatsApp chat{" "}
              <strong>“You” (Message yourself)</strong> without a notification sound. For a ringing alert, enter a
              different number (e.g. your personal WhatsApp).
            </p>
          )}
          <p className="text-[11.5px] text-[#747576]">
            Each alert has the order, amount, 10-minute timer and a link to confirm it.
          </p>
        </>
      )}
    </div>
  );
}

const buttonDark =
  "bg-[#1f3a2c] hover:bg-[#14281e] disabled:opacity-60 text-white px-3.5 py-2 rounded-lg font-bold text-[12.5px] inline-flex items-center gap-1.5 cursor-pointer";
const buttonLight =
  "bg-white border border-[#e7e2d8] hover:border-[#1f3a2c] disabled:opacity-60 text-[#202020] px-3.5 py-2 rounded-lg font-bold text-[12.5px] inline-flex items-center gap-1.5 cursor-pointer";

export default function AdminPaymentGatewayPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [clockOffset, setClockOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [pairing, setPairing] = useState<{
    qrDataUrl: string;
    expiresAt: string;
    serverUrl: string;
    enrollmentToken: string;
  } | null>(null);
  const [assignTo, setAssignTo] = useState<Record<string, string>>({});
  const [markingSession, setMarkingSession] = useState<{
    id: string;
    orderNumber: string;
    customerName?: string;
    amount?: string;
  } | null>(null);
  const [confirmUtr, setConfirmUtr] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/gateway/overview");
      if (res.ok) {
        const json: Overview = await res.json();
        setData(json);
        // Timers follow the server clock, so they match the customer's to the second.
        if (json.serverNow) setClockOffset(new Date(json.serverNow).getTime() - Date.now());
      }
    } catch (err) {
      console.error("Failed to load gateway overview:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(() => {
      load();
      // Result of "Sign in with Google" (redirected back here)
      const params = new URLSearchParams(window.location.search);
      const gmail = params.get("gmail");
      if (gmail === "connected") toast.success("Gmail connected", { description: params.get("email") || undefined });
      if (gmail === "error") toast.error("Gmail was not connected", { description: params.get("message") || undefined });
      if (gmail === "not-configured") toast.error("Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first");
      const gmailSend = params.get("gmailSend");
      if (gmailSend === "connected") toast.success("Sending Gmail connected", { description: params.get("email") || undefined });
      if (gmailSend === "error") toast.error("Sending Gmail was not connected", { description: params.get("message") || undefined });
      if (gmail || gmailSend) window.history.replaceState(null, "", window.location.pathname);
    }, 0);
    return () => clearTimeout(first);
  }, [load]);

  // Refresh every 10 s, or every 3 s while WhatsApp waits to be scanned or customers are paying.
  const waitingForScan = Boolean(data?.whatsapp.service && !data.whatsapp.service.connected && data.whatsapp.service.status !== "offline");
  const customersPaying = (data?.stats?.waiting ?? 0) > 0;
  useEffect(() => {
    const interval = setInterval(load, waitingForScan || customersPaying ? 3000 : 10000);
    return () => clearInterval(interval);
  }, [load, waitingForScan, customersPaying]);

  // Live countdowns (same 10-minute timer the customer sees)
  // Starts after load (reading the clock while the page is pre-rendered is not allowed).
  const [now, setNow] = useState(0);
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(tick);
    };
  }, []);

  const act = async (action: string, payload: Record<string, unknown> = {}, success?: string) => {
    setBusy(action);
    try {
      const res = await fetch("/api/admin/gateway/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result?.error || "Action failed");
        return null;
      }
      if (success) toast.success(success);
      load();
      return result;
    } catch {
      toast.error("Network error");
      return null;
    } finally {
      setBusy("");
    }
  };

  const showPairingQr = async () => {
    const result = await act("pairing-qr");
    if (result) setPairing(result);
  };

  const openMarkPaidModal = (s: { id: string; orderNumber: string; customerName?: string; payAmount?: string }) => {
    setMarkingSession({
      id: s.id,
      orderNumber: s.orderNumber,
      customerName: s.customerName,
      amount: s.payAmount,
    });
    setConfirmUtr("");
  };

  const submitMarkPaid = async () => {
    if (!markingSession) return;
    const s = markingSession;
    const utr = confirmUtr.trim() || null;
    setMarkingSession(null);
    await act("mark-paid", { sessionId: s.id, utr }, `${s.orderNumber} marked paid`);
  };

  const openSessions = (data?.sessions || []).filter((s) => s.status !== "PAID");
  const isLocalUrl = /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(data?.publicBaseUrl || "");
  const gmailRedirect = `${data?.publicBaseUrl || ""}/api/admin/gateway/gmail/callback`;
  const phoneOnline = (data?.devices || []).some((d) => d.online);

  const checklist = data
    ? [
        { done: data.database, env: "DATABASE_URL", label: "Database (Neon / Vercel Postgres), then npm run db:push" },
        { done: Boolean(data.upi.upiId), env: "UPI_ID", label: "UPI ID that receives the money" },
        { done: data.whatsapp.otpRequired, env: "WHATSAPP_SERVICE_URL, WHATSAPP_SERVICE_TOKEN", label: "WhatsApp service running and logged in (customer verification)" },
        { done: Boolean(data.gmail?.configured), env: "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET", label: "Google OAuth app (Gmail alerts)" },
        { done: data.cronConfigured, env: "CRON_SECRET", label: "Daily clean-up job (vercel.json cron)" },
        { done: !isLocalUrl, env: "NEXT_PUBLIC_APP_URL", label: "Public https address (needed for phone pairing)" },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-[#1f3a2c]">Payment Gateway</h1>
          <p className="text-[13.5px] text-[#5c5a52]">
            TeaPay: your own UPI gateway. Money goes straight to your bank and orders confirm automatically from
            your bank&apos;s SMS or email.
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            load();
          }}
          className="px-4 py-2 bg-white border border-[#e7e2d8] hover:border-[#1f3a2c] rounded-xl text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {!data && <Card>Loading…</Card>}

      {data && !data.database && (
        <div className="bg-[#fff8e6] border border-[#f5d58a] rounded-2xl p-4 flex gap-3 text-[13px] text-[#6b4a00]">
          <TriangleAlert size={18} className="shrink-0 mt-0.5" />
          {data.databaseLocalOnServer ? (
            <span>
              <strong>DATABASE_URL on Vercel points to 127.0.0.1</strong>, the database on your own computer, which
              Vercel cannot reach. In Vercel → Storage, create a Neon database for this project, delete the old{" "}
              <code>DATABASE_URL</code>, and redeploy. Until then checkout uses manual UPI.
            </span>
          ) : data.databaseLocal ? (
            <span>
              <strong>The local database is not running.</strong> Stop the shop (Ctrl+C) and start it again with{" "}
              <code>npm run dev</code>: it now starts the database and WhatsApp too. Until then checkout uses
              manual UPI.
            </span>
          ) : data.databaseHost ? (
            <span>
              <strong>Cannot reach the database</strong> at <code>{data.databaseHost}</code>. Check{" "}
              <code>DATABASE_URL</code>. Until then checkout uses manual UPI.
            </span>
          ) : (
            <span>
              <strong>No database connected</strong>, so checkout uses manual UPI (customers type their UTR and you
              confirm). Add <code>DATABASE_URL</code> and run <code>npm run db:push</code> to turn on automatic
              confirmation.
            </span>
          )}
        </div>
      )}

      {data && !data.database && (
        <div className="max-w-[460px]">
          <WhatsAppCard data={data} busy={busy} act={act} />
        </div>
      )}

      {data?.database && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <div className="text-[12px] font-bold text-[#747576] uppercase tracking-wider">Receiving UPI</div>
              <div className="font-mono font-bold text-[15px] text-[#1f3a2c] mt-1">{data.upi.upiId || "Not set (UPI_ID)"}</div>
              <div className="text-[12px] text-[#5c5a52]">{data.upi.payeeName}</div>
            </Card>
            <Card>
              <div className="text-[12px] font-bold text-[#747576] uppercase tracking-wider">Paying right now</div>
              <div className="text-[26px] font-bold text-[#1f3a2c]">{data.stats?.waiting ?? 0}</div>
            </Card>
            <Card>
              <div className="text-[12px] font-bold text-[#747576] uppercase tracking-wider">Paid today</div>
              <div className="text-[26px] font-bold text-[#1f3a2c]">{data.stats?.paidToday ?? 0}</div>
            </Card>
          </div>

          <CodCard data={data} busy={busy} act={act} />

          {/* Customers on the checkout right now */}
          <Card>
            <CardTitle icon={Clock} title="Customers paying now" right={<Pill ok={customersPaying}>{data.stats?.waiting ?? 0} live</Pill>} />
            {(data.sessions || []).filter((s) => s.status === "PENDING" || s.status === "VERIFYING").length === 0 ? (
              <p className="text-[12.5px] text-[#747576]">Nobody is on the UPI payment screen right now.</p>
            ) : (
              <div className="space-y-2">
                {(data.sessions || [])
                  .filter((s) => s.status === "PENDING" || s.status === "VERIFYING")
                  .map((s) => {
                    const left = now ? Math.max(0, Math.round((new Date(s.expiresAt).getTime() - (now + clockOffset)) / 1000)) : 0;
                    return (
                      <div key={s.id} className="border border-[#e7e2d8] rounded-xl p-3 flex flex-col md:flex-row md:items-center gap-3">
                        <div
                          className={`shrink-0 w-[74px] text-center font-mono font-bold text-[18px] rounded-lg py-1.5 ${
                            left <= 60 ? "bg-[#e53935]/10 text-[#c62828]" : "bg-[#f0f8f4] text-[#016c2f]"
                          }`}
                        >
                          {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-bold text-[#1f3a2c]">
                            {s.customerName} <span className="font-mono font-semibold text-[#747576]">· {s.orderNumber}</span>
                          </div>
                          <div className="text-[12px] text-[#5c5a52]">
                            Started {istTime(s.createdAt)} · ₹{s.payAmount} · {s.customerPhone} · <strong>{s.stage}</strong>
                            {s.customerUtr && ` · UTR typed: ${s.customerUtr}`}
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => openMarkPaidModal(s)} disabled={busy !== ""} className={buttonDark}>
                            Mark paid
                          </button>
                          <button onClick={() => act("cancel-session", { sessionId: s.id }, "Cancelled")} disabled={busy !== ""} className={buttonLight}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>

          {(data.devices || []).length === 0 && !data.gmail?.connected && (
            <div className="bg-[#fdecea] border border-[#f5c2bf] rounded-2xl p-4 flex gap-3 text-[13px] text-[#8e1c1a]">
              <TriangleAlert size={18} className="shrink-0 mt-0.5" />
              <span>
                No bank alert source yet, so payments cannot confirm automatically. Pair a phone or connect Gmail
                below. Until then, confirm payments with <strong>Mark paid</strong>.
              </span>
            </div>
          )}

          {/* Bank alert sources + WhatsApp */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardTitle
                icon={Smartphone}
                title="SMS verification (phone)"
                right={
                  <Switch
                    on={data.toggles.sms}
                    label="SMS verification"
                    disabled={busy !== ""}
                    onChange={(on) => act("toggle", { key: "sms", enabled: on }, on ? "SMS verification turned on" : "SMS verification turned off")}
                  />
                }
              />
              {!data.toggles.sms ? (
                <p className="text-[12.5px] text-[#5c5a52]">
                  <strong>Off.</strong> The phone&apos;s bank SMS and payment notifications are ignored. Turn on to
                  confirm payments automatically with the Android app.
                </p>
              ) : (
              <>
              <div className="mb-2">
                <Pill ok={phoneOnline}>{phoneOnline ? "Phone online" : "No phone online"}</Pill>
              </div>
              <p className="text-[12.5px] text-[#5c5a52] mb-3">
                Install the app on the phone that gets your bank SMS / UPI notifications. When money arrives it is
                matched to the order here automatically. Only bank credit alerts are kept.
              </p>
              <div className="space-y-2 mb-3">
                {(data.devices || []).length === 0 && <div className="text-[12.5px] text-[#747576]">No phone paired yet.</div>}
                {(data.devices || []).map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-2 bg-[#fafafa] border border-[#e7e2d8] rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[#202020] flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${d.online ? "bg-[#02cb5a]" : "bg-[#c9c6bd]"}`} />
                        {d.name}
                      </div>
                      <div className="text-[11.5px] text-[#747576]">
                        seen {timeAgo(d.lastHeartbeatAt)}
                        {d.batteryPercent !== null && ` · ${d.batteryPercent}% battery`}
                      </div>
                      {d.lastTestAt && (
                        <div className="text-[11.5px] text-[#016c2f] font-semibold">✓ Test SMS received {timeAgo(d.lastTestAt)}</div>
                      )}
                    </div>
                    <button
                      onClick={() => window.confirm(`Remove ${d.name}? It will stop reporting payments.`) && act("remove-device", { deviceId: d.id }, "Phone removed")}
                      className="p-1.5 rounded-lg border border-[#e7e2d8] hover:bg-white text-[#c62828] cursor-pointer"
                      title="Remove phone"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={showPairingQr} disabled={busy !== ""} className={buttonDark}>
                  <QrCode size={14} /> Pair a phone
                </button>
                <a href={data.apkUrl} download className={buttonLight}>
                  <Download size={14} /> Android app
                </a>
              </div>
              {isLocalUrl && (
                <p className="text-[11.5px] text-[#9a5b00] mt-2">
                  Pairing needs your public https address. It works once the shop is live on Vercel.
                </p>
              )}
              {(data.devices || []).length > 0 && (
                <p className="text-[11.5px] text-[#5c5a52] mt-2">
                  Check the link: in the app tap <strong>Dispatch Test Bank Credit SMS</strong>; “Test SMS received”
                  appears above.
                </p>
              )}
              {(data.phoneFeed || []).length > 0 && (
                <div className="mt-3 border-t border-[#e7e2d8] pt-3">
                  <div className="text-[12px] font-bold text-[#747576] uppercase tracking-wider mb-1.5">From the phone</div>
                  <ul className="space-y-1">
                    {(data.phoneFeed || []).map((f) => (
                      <li key={f.id} className="flex items-center justify-between gap-2 text-[12px]">
                        <span className="font-semibold text-[#202020]">
                          ₹{f.amount} <span className="font-normal text-[#747576]">· {timeAgo(f.receivedAt)}</span>
                        </span>
                        {f.orderNumber ? (
                          <span className="text-[#016c2f] font-semibold">✓ {f.orderNumber}</span>
                        ) : (
                          <span className="text-[#9a5b00]">not matched</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {pairing && (
                <div className="mt-3 border-t border-[#e7e2d8] pt-3 space-y-2">
                  <img src={pairing.qrDataUrl} alt="Phone pairing QR" className="w-[200px] h-[200px] mx-auto" />
                  <ol className="list-decimal pl-5 text-[12px] text-[#202020] space-y-0.5">
                    <li>Install the Android app on the payment phone; allow SMS and notification access.</li>
                    <li>In the app tap <strong>Scan QR</strong> and scan this code.</li>
                  </ol>
                  <p className="text-[11px] text-[#747576]">
                    One-time code, valid until {new Date(pairing.expiresAt).toLocaleTimeString("en-IN")}. Can&apos;t
                    scan? Use manual pairing in the app with:
                  </p>
                  <div className="text-[11px] font-mono bg-[#fafafa] border border-[#e7e2d8] rounded-lg px-2 py-1.5 break-all space-y-0.5">
                    <div>Server: {pairing.serverUrl}</div>
                    <div>Code: {pairing.enrollmentToken}</div>
                  </div>
                </div>
              )}
              </>
              )}
            </Card>

            <Card>
              <CardTitle
                icon={Mail}
                title="Gmail verification"
                right={
                  <Switch
                    on={data.toggles.gmail}
                    label="Gmail verification"
                    disabled={busy !== ""}
                    onChange={(on) => act("toggle", { key: "gmail", enabled: on }, on ? "Gmail verification turned on" : "Gmail verification turned off")}
                  />
                }
              />
              {!data.toggles.gmail ? (
                <p className="text-[12.5px] text-[#5c5a52]">
                  <strong>Off.</strong> Bank emails are not checked. Turn on to also confirm payments from your bank&apos;s
                  alert emails.
                </p>
              ) : !data.gmail?.configured ? (
                <div className="text-[12.5px] text-[#5c5a52] space-y-2">
                  <p>
                    Create a Google OAuth app (Gmail API, read-only), then set <code>GOOGLE_CLIENT_ID</code> and{" "}
                    <code>GOOGLE_CLIENT_SECRET</code>. Add this redirect URI:
                  </p>
                  <code className="block break-all bg-[#fafafa] border border-[#e7e2d8] rounded-lg px-2 py-1.5 text-[11.5px]">{gmailRedirect}</code>
                </div>
              ) : data.gmail.connected ? (
                <div className="space-y-3">
                  <div className="text-[13px] text-[#202020]">
                    Reading bank alerts in <strong>{data.gmail.email}</strong>
                  </div>
                  <div className="text-[12px] text-[#747576]">Last checked {timeAgo(data.gmail.lastPollAt)}</div>
                  {data.gmail.lastError && <div className="text-[12px] text-[#c62828]">{data.gmail.lastError}</div>}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => act("gmail-check", {}, "Gmail checked")} disabled={busy !== ""} className={buttonDark}>
                      <RefreshCw size={14} /> Check now
                    </button>
                    <button
                      onClick={() => window.confirm("Disconnect Gmail?") && act("gmail-disconnect", {}, "Gmail disconnected")}
                      disabled={busy !== ""}
                      className={buttonLight}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[12.5px] text-[#5c5a52]">
                    Sign in with the Gmail account that receives your bank&apos;s credit alerts. Read-only; only
                    DKIM-verified bank emails are used.
                  </p>
                  <a href="/api/admin/gateway/gmail/connect" className={buttonDark}>
                    <Mail size={14} /> Sign in with Google
                  </a>
                </div>
              )}
            </Card>

            <Card>
              <CardTitle icon={Send} title="Login code emails" />
              {!data.gmailSender?.configured ? (
                <div className="text-[12.5px] text-[#5c5a52] space-y-2">
                  <p>
                    Create a Google OAuth app with the Gmail API enabled, then set <code>GOOGLE_CLIENT_ID</code> and{" "}
                    <code>GOOGLE_CLIENT_SECRET</code>. Add this redirect URI:
                  </p>
                  <code className="block break-all bg-[#fafafa] border border-[#e7e2d8] rounded-lg px-2 py-1.5 text-[11.5px]">{gmailRedirect}</code>
                </div>
              ) : data.gmailSender.connected ? (
                <div className="space-y-3">
                  <div className="text-[13px] text-[#202020]">
                    Login codes and order emails are sent from <strong>{data.gmailSender.email}</strong>
                  </div>
                  {data.gmailSender.lastError && <div className="text-[12px] text-[#c62828]">{data.gmailSender.lastError}</div>}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={async () => {
                        const result = await act("gmail-sender-test");
                        if (result?.to) toast.success("Test email sent", { description: result.to });
                      }}
                      disabled={busy !== ""}
                      className={buttonDark}
                    >
                      <Send size={14} /> Send test email
                    </button>
                    <button
                      onClick={() => window.confirm("Stop sending emails from this Gmail?") && act("gmail-sender-disconnect", {}, "Sending Gmail disconnected")}
                      disabled={busy !== ""}
                      className={buttonLight}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[12.5px] text-[#5c5a52]">
                    Sign in with the Gmail account that should send customers their login codes. No password is
                    stored; this permission can only send email, not read your inbox.
                  </p>
                  <a href="/api/admin/gateway/gmail/connect?purpose=send" className={buttonDark}>
                    <Mail size={14} /> Sign in with Google
                  </a>
                </div>
              )}
            </Card>

            <WhatsAppCard data={data} busy={busy} act={act} />
          </div>

          {/* Unmatched credits */}
          {(data.unmatchedCredits || []).length > 0 && (
            <Card>
              <CardTitle icon={IndianRupee} title="Money received but not matched" />
              <p className="text-[12.5px] text-[#5c5a52] mb-3">
                Usually a customer paid a different amount than shown. Link it to their payment to create the order.
              </p>
              <div className="space-y-2">
                {(data.unmatchedCredits || []).map((c) => (
                  <div key={c.id} className="border border-[#e7e2d8] rounded-xl p-3 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold text-[#1f3a2c]">
                        ₹{c.amount}{" "}
                        <span className="text-[11.5px] font-semibold text-[#747576]">
                          · {SOURCE_LABEL[c.source] || c.source} · {timeAgo(c.observedAt)}
                          {c.utr && ` · UTR ${c.utr}`}
                          {c.payerVpa && ` · from ${c.payerVpa}`}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-[#5c5a52] truncate">{c.text}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <select
                        value={assignTo[c.id] || ""}
                        onChange={(e) => setAssignTo({ ...assignTo, [c.id]: e.target.value })}
                        className="px-2 py-2 border border-[#e7e2d8] rounded-lg text-[12.5px] bg-white max-w-[220px]"
                      >
                        <option value="">Choose payment…</option>
                        {openSessions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.orderNumber} · ₹{s.payAmount} · {s.customerName}
                          </option>
                        ))}
                      </select>
                      <button
                        disabled={!assignTo[c.id] || busy !== ""}
                        onClick={() => act("assign-credit", { creditId: c.id, sessionId: assignTo[c.id] }, "Payment linked and order created")}
                        className={buttonDark}
                      >
                        Link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Payments */}
          <Card className="p-0 overflow-hidden">
            <div className="p-5 pb-3">
              <CardTitle icon={Clock} title="Recent UPI payments" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead className="bg-[#fafafa] text-[#747576] text-left">
                  <tr>
                    <th className="px-4 py-2 font-bold">Order</th>
                    <th className="px-4 py-2 font-bold">Customer</th>
                    <th className="px-4 py-2 font-bold">Amount</th>
                    <th className="px-4 py-2 font-bold">Status</th>
                    <th className="px-4 py-2 font-bold">Reference</th>
                    <th className="px-4 py-2 font-bold">Started</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {(data.sessions || []).length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-[#747576]">
                        No UPI payments yet.
                      </td>
                    </tr>
                  )}
                  {(data.sessions || []).map((s) => (
                    <tr key={s.id} className="border-t border-[#efece5]">
                      <td className="px-4 py-2.5 font-mono font-semibold text-[#1f3a2c]">{s.orderNumber}</td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-[#202020]">{s.customerName}</div>
                        <div className="text-[#747576]">
                          {s.customerPhone} {s.phoneVerified && <CircleCheck size={11} className="inline text-[#02cb5a]" />}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-semibold">₹{s.payAmount}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${STATUS_STYLE[s.status] || ""}`}>{s.status}</span>
                        {s.paidVia && <div className="text-[11px] text-[#747576] mt-0.5">via {SOURCE_LABEL[s.paidVia] || s.paidVia}</div>}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11.5px]">
                        {s.utr || (s.customerUtr ? <span title="Typed by the customer, not verified">{s.customerUtr} (customer)</span> : "—")}
                      </td>
                      <td className="px-4 py-2.5 text-[#747576] whitespace-nowrap" title={timeAgo(s.createdAt)}>
                        {istDateTime(s.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        {s.status !== "PAID" && (
                          <div className="inline-flex gap-1.5">
                            <button onClick={() => openMarkPaidModal(s)} disabled={busy !== ""} className={buttonLight}>
                              Mark paid
                            </button>
                            {(s.status === "PENDING" || s.status === "VERIFYING") && (
                              <button onClick={() => act("cancel-session", { sessionId: s.id }, "Cancelled")} disabled={busy !== ""} className={buttonLight}>
                                Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {data && (
        <Card>
          <h2 className="font-bold text-[16px] text-[#1f3a2c] mb-3">Setup checklist</h2>
          <ul className="space-y-2.5">
            {checklist.map((item) => (
              <li key={item.env} className="flex items-start gap-2.5">
                {item.done ? (
                  <CircleCheck size={17} className="text-[#02cb5a] shrink-0 mt-0.5" />
                ) : (
                  <CircleX size={17} className="text-[#c9c6bd] shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-[#202020]">{item.label}</div>
                  <code className="text-[11.5px] text-[#5c5a52] break-all">{item.env}</code>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Mark Paid Confirmation Modal */}
      {markingSession && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#e7e2d8] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#efece5] pb-3">
              <div className="flex items-center gap-2">
                <CircleCheck size={20} className="text-[#016c2f]" />
                <h3 className="font-bold text-[17px] text-[#1f3a2c]">Confirm Order Payment</h3>
              </div>
              <button
                type="button"
                onClick={() => setMarkingSession(null)}
                className="text-[#747576] hover:text-[#202020] p-1 rounded-lg text-[18px] leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#f7f6f2] rounded-xl p-3.5 space-y-1.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[#747576]">Order:</span>
                <span className="font-mono font-bold text-[#1f3a2c]">{markingSession.orderNumber}</span>
              </div>
              {markingSession.customerName && (
                <div className="flex justify-between">
                  <span className="text-[#747576]">Customer:</span>
                  <span className="font-semibold text-[#202020]">{markingSession.customerName}</span>
                </div>
              )}
              {markingSession.amount && (
                <div className="flex justify-between">
                  <span className="text-[#747576]">Amount:</span>
                  <span className="font-bold text-[#016c2f]">₹{markingSession.amount}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12.5px] font-semibold text-[#202020]">
                UPI Reference / UTR Number <span className="text-[#747576] font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={confirmUtr}
                onChange={(e) => setConfirmUtr(e.target.value)}
                placeholder="12-digit UTR from your bank (or leave blank)"
                className="w-full px-3 py-2 border border-[#e7e2d8] focus:border-[#02cb5a] rounded-lg text-[13px] outline-none"
                autoFocus
              />
              <p className="text-[11.5px] text-[#747576]">
                Leave blank to mark paid immediately without UTR.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMarkingSession(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[#e7e2d8] hover:bg-[#fafafa] font-semibold text-[13px] text-[#202020] cursor-pointer"
                disabled={busy !== ""}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitMarkPaid}
                disabled={busy !== ""}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#016c2f] hover:bg-[#1f3a2c] text-white font-bold text-[13px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {busy === "mark-paid" ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Confirming…</span>
                  </>
                ) : (
                  <span>Confirm Paid</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

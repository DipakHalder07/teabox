"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  RefreshCw,
  ExternalLink,
  Server,
  MessageCircle,
  Mail,
  Smartphone,
  Download,
  Webhook,
  Copy,
  Check,
  CircleCheck,
  CircleX,
  TriangleAlert,
  QrCode,
  Send,
  KeyRound,
} from "lucide-react";

interface GatewayStatus {
  configured: {
    gateway: boolean;
    hub: boolean;
    adminToken: boolean;
    webhookSecret: boolean;
    merchantVpa: boolean;
  };
  gateway: { url: string; reachable: boolean; latencyMs: number | null; error: string | null } | null;
  observers: {
    tier: string;
    label: string;
    isWorking: boolean;
    reason: string | null;
    sms: boolean;
    gmail: boolean;
  } | null;
  whatsapp: {
    status?: string;
    isConnected?: boolean;
    phoneNumber?: string | null;
    qrCode?: string | null;
    error?: string;
  } | null;
  receivingUpi: { upiId: string; payeeName: string } | null;
  shopUpi: string | null;
  youpiWebhookUrl: string | null;
  androidPairing: {
    serverUrl: string | null;
    devices: Array<{ name: string; isActive: boolean; lastHeartbeatAt: string | null }>;
  } | null;
  apk: { available: boolean; sizeBytes?: number; sha256?: string };
  hubUrl: string | null;
  webhookUrl: string;
  checkedAt: string;
}

type Tone = "ok" | "warn" | "bad" | "off";

const toneStyles: Record<Tone, string> = {
  ok: "bg-[#02cb5a]/15 text-[#016c2f]",
  warn: "bg-[#f5a623]/15 text-[#9a5b00]",
  bad: "bg-[#e53935]/12 text-[#c62828]",
  off: "bg-[#ece9e1] text-[#5c5a52]",
};

function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${toneStyles[tone]}`}>
      {children}
    </span>
  );
}

function StatusCard({
  icon: Icon,
  title,
  tone,
  state,
  detail,
  action,
}: {
  icon: React.ElementType;
  title: string;
  tone: Tone;
  state: string;
  detail: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[#e7e2d8] rounded-2xl p-4 shadow-2xs flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#f0f8f4] text-[#016c2f] flex items-center justify-center shrink-0">
            <Icon size={17} />
          </div>
          <span className="font-bold text-[14px] text-[#202020]">{title}</span>
        </div>
        <Badge tone={tone}>{state}</Badge>
      </div>
      <div className="text-[12.5px] text-[#5c5a52] leading-relaxed">{detail}</div>
      {action && <div className="mt-auto pt-1">{action}</div>}
    </div>
  );
}

function HubLink({ hubUrl, section, label }: { hubUrl: string | null; section: string; label: string }) {
  if (!hubUrl) {
    return <span className="text-[12px] text-[#8e8d8a]">Set YOUPI_ADMIN_URL to get a direct link.</span>;
  }
  return (
    <a
      href={`${hubUrl}/#${section}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#1f3a2c] border border-[#e7e2d8] hover:border-[#1f3a2c] rounded-lg px-3 py-1.5 transition-colors"
    >
      {label}
      <ExternalLink size={13} />
    </a>
  );
}

export default function AdminPaymentGatewayPage() {
  const [status, setStatus] = useState<GatewayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [waBusy, setWaBusy] = useState<"" | "qr" | "pairing-code" | "test">("");
  const [waQr, setWaQr] = useState<string | null>(null);
  const [waPhone, setWaPhone] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [waError, setWaError] = useState("");

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/youpi/status");
      if (res.ok) setStatus(await res.json());
    } catch (err) {
      console.error("Failed to load gateway status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh faster while WhatsApp waits to be scanned, so the page flips to Connected quickly.
  const waitingForWhatsApp = Boolean(status?.whatsapp && !status.whatsapp.error && !status.whatsapp.isConnected);
  useEffect(() => {
    const first = setTimeout(fetchStatus, 0);
    const interval = setInterval(fetchStatus, waitingForWhatsApp ? 5000 : 15000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [fetchStatus, waitingForWhatsApp]);

  const runWhatsAppAction = async (action: "qr" | "pairing-code" | "test") => {
    setWaBusy(action);
    setWaError("");
    try {
      const res = await fetch("/api/admin/youpi/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, phone: waPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWaError(data?.error || "WhatsApp request failed");
      } else if (action === "qr") {
        setWaQr(data.qrCode);
        if (!data.qrCode) setWaError("No QR yet. Wait a few seconds and try again.");
      } else if (action === "pairing-code") {
        setPairingCode(data.pairingCode);
      } else if (data.delivered) {
        toast.success("Test message sent", { description: `Check WhatsApp on +91 ${waPhone}` });
      } else {
        setWaError("The message was not delivered. Check the number and the WhatsApp connection.");
      }
    } catch {
      setWaError("Network error. Please try again.");
    } finally {
      setWaBusy("");
    }
  };

  const copyWebhookUrl = () => {
    if (!status) return;
    navigator.clipboard.writeText(status.webhookUrl);
    setCopied(true);
    toast.success("Webhook URL copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const hubUrl = status?.hubUrl || null;
  const whatsappQr = waQr || status?.whatsapp?.qrCode || null;
  const upiMismatch = Boolean(
    status?.receivingUpi && status.shopUpi && status.receivingUpi.upiId !== status.shopUpi
  );
  const pairingUrl = status?.androidPairing?.serverUrl || "";
  const pairingIsLocal = /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(pairingUrl);
  const gatewayUp = Boolean(status?.gateway?.reachable);
  const observers = status?.observers;

  const setupItems = status
    ? [
        { done: status.configured.gateway, label: "Gateway URL", env: "YOUPI_PG_BASE_URL", hint: "YouPI payment core, e.g. http://localhost:6100" },
        { done: status.configured.webhookSecret, label: "Webhook secret", env: "YOUPI_WEBHOOK_SECRET", hint: "Same value as YouPI Store Settings → Webhook Secret" },
        { done: status.configured.hub, label: "Hub URL", env: "YOUPI_ADMIN_URL", hint: "YouPI merchant hub, e.g. http://localhost:6001" },
        { done: status.configured.merchantVpa, label: "Fallback UPI ID", env: "YOUPI_MERCHANT_VPA", hint: "Used for manual UPI when the gateway is offline" },
        { done: status.configured.adminToken, label: "Admin token (optional)", env: "YOUPI_ADMIN_TOKEN", hint: "Shows WhatsApp status here. Read-only use." },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-[#1f3a2c]">Payment Gateway</h1>
          <p className="text-[13.5px] text-[#5c5a52]">
            YouPI-PG connection: WhatsApp OTP, bank observers (SMS &amp; Gmail) and the Android app.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {hubUrl && (
            <a
              href={`${hubUrl}/#developerHub`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#1f3a2c] hover:bg-[#14281e] text-white rounded-xl text-[13px] font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Open YouPI Hub</span>
              <ExternalLink size={14} />
            </a>
          )}
          <button
            onClick={() => {
              setLoading(true);
              fetchStatus();
            }}
            className="px-4 py-2 bg-white border border-[#e7e2d8] hover:border-[#1f3a2c] rounded-xl text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {!status && loading && (
        <div className="bg-white border border-[#e7e2d8] rounded-2xl p-6 text-[13.5px] text-[#5c5a52]">
          Checking the gateway…
        </div>
      )}

      {status && (
        <>
          {/* Overall banner */}
          {!status.configured.gateway ? (
            <div className="bg-[#fff8e6] border border-[#f5d58a] rounded-2xl p-4 flex gap-3 text-[13px] text-[#6b4a00]">
              <TriangleAlert size={18} className="shrink-0 mt-0.5" />
              <span>
                The gateway is not connected, so checkout uses <strong>manual UPI</strong>: customers type their
                UTR and you confirm each payment against your bank. Set <code>YOUPI_PG_BASE_URL</code> to turn on
                WhatsApp OTP and automatic confirmation.
              </span>
            </div>
          ) : !gatewayUp ? (
            <div className="bg-[#fdecea] border border-[#f5c2bf] rounded-2xl p-4 flex gap-3 text-[13px] text-[#8e1c1a]">
              <CircleX size={18} className="shrink-0 mt-0.5" />
              <span>
                The gateway at <code>{status.gateway?.url}</code> is not reachable. Checkout has fallen back to
                manual UPI until it is back. Start YouPI-PG on that machine.
              </span>
            </div>
          ) : observers && !observers.isWorking ? (
            <div className="bg-[#fdecea] border border-[#f5c2bf] rounded-2xl p-4 flex gap-3 text-[13px] text-[#8e1c1a]">
              <TriangleAlert size={18} className="shrink-0 mt-0.5" />
              <span>
                <strong>{observers.label}.</strong> {observers.reason} Payments cannot be confirmed automatically
                until the SMS gateway and Gmail are both connected. Customers will see a warning at checkout.
              </span>
            </div>
          ) : (
            <div className="bg-[#f0f8f4] border border-[#bfdcc9] rounded-2xl p-4 flex gap-3 text-[13px] text-[#1f3a2c]">
              <CircleCheck size={18} className="shrink-0 mt-0.5 text-[#016c2f]" />
              <span>Gateway is working. UPI payments are confirmed automatically.</span>
            </div>
          )}

          {/* Live status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatusCard
              icon={Server}
              title="Gateway"
              tone={!status.configured.gateway ? "off" : gatewayUp ? "ok" : "bad"}
              state={!status.configured.gateway ? "Not set" : gatewayUp ? "Online" : "Offline"}
              detail={
                !status.configured.gateway
                  ? "Add YOUPI_PG_BASE_URL to your environment."
                  : gatewayUp
                    ? (
                        <>
                          {status.gateway?.url} · {status.gateway?.latencyMs} ms
                          {status.receivingUpi && (
                            <span className="block mt-1">
                              Customers pay <strong className="font-mono">{status.receivingUpi.upiId}</strong>
                            </span>
                          )}
                          {upiMismatch && (
                            <span className="block mt-1 text-[#c62828]">
                              Shop fallback UPI is {status.shopUpi}. Make both the same.
                            </span>
                          )}
                        </>
                      )
                    : status.gateway?.error || "Not reachable"
              }
            />

            <StatusCard
              icon={MessageCircle}
              title="WhatsApp (OTP)"
              tone={
                !status.whatsapp
                  ? "off"
                  : status.whatsapp.error
                    ? "warn"
                    : status.whatsapp.isConnected
                      ? "ok"
                      : "bad"
              }
              state={
                !status.whatsapp
                  ? "Unknown"
                  : status.whatsapp.error
                    ? "Check hub"
                    : status.whatsapp.isConnected
                      ? "Connected"
                      : status.whatsapp.status || "Disconnected"
              }
              detail={
                !status.whatsapp
                  ? "Add YOUPI_ADMIN_TOKEN to see the status here. Customers get their OTP from this number."
                  : status.whatsapp.error
                    ? status.whatsapp.error
                    : status.whatsapp.isConnected
                      ? `Sending OTPs from +${(status.whatsapp.phoneNumber || "—").replace(/^\+/, "")}`
                      : "Scan the WhatsApp QR in the YouPI hub to send OTPs."
              }
              action={!status.whatsapp?.isConnected && <HubLink hubUrl={hubUrl} section="developerHub" label="Connect WhatsApp" />}
            />

            <StatusCard
              icon={Smartphone}
              title="SMS observer"
              tone={!observers ? "off" : observers.sms ? "ok" : "bad"}
              state={!observers ? "Unknown" : observers.sms ? "Live" : "Offline"}
              detail="Reads bank credit SMS. On this Mac, link Google Messages for Web in the YouPI hub (scan with your phone's Messages app)."
              action={observers && !observers.sms && <HubLink hubUrl={hubUrl} section="developerHub" label="Pair phone" />}
            />

            <StatusCard
              icon={Mail}
              title="Gmail observer"
              tone={!observers ? "off" : observers.gmail ? "ok" : "bad"}
              state={!observers ? "Unknown" : observers.gmail ? "Live" : "Offline"}
              detail="Reads bank credit alert emails. Sign in with the Gmail that gets your bank alerts in the YouPI hub."
              action={observers && !observers.gmail && <HubLink hubUrl={hubUrl} section="developerHub" label="Connect Gmail" />}
            />
          </div>

          {/* WhatsApp OTP sender */}
          {status.whatsapp && !status.whatsapp.error && (
            <div className="bg-white border border-[#e7e2d8] rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} className="text-[#016c2f]" />
                  <h2 className="font-bold text-[16px] text-[#1f3a2c]">WhatsApp OTP sender</h2>
                </div>
                <Badge tone={status.whatsapp.isConnected ? "ok" : "bad"}>
                  {status.whatsapp.isConnected ? "Connected" : "Not logged in"}
                </Badge>
              </div>

              {status.whatsapp.isConnected ? (
                <div className="space-y-3">
                  <p className="text-[13px] text-[#5c5a52]">
                    Customers receive their checkout code from{" "}
                    <strong>+{(status.whatsapp.phoneNumber || "your linked number").replace(/^\+/, "")}</strong>. Send yourself a test to
                    confirm messages arrive.
                  </p>
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="tel"
                      value={waPhone}
                      onChange={(e) => setWaPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="flex-1 min-w-0 px-3.5 py-2 border border-[#e7e2d8] focus:border-[#02cb5a] rounded-lg text-[13.5px] bg-white outline-none"
                    />
                    <button
                      onClick={() => runWhatsAppAction("test")}
                      disabled={waBusy !== ""}
                      className="bg-[#1f3a2c] hover:bg-[#14281e] disabled:opacity-60 text-white px-4 py-2 rounded-lg font-bold text-[13px] flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {waBusy === "test" ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                      Send test
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <ol className="list-decimal pl-5 space-y-1 text-[13px] text-[#202020]">
                      <li>On the phone whose WhatsApp should send OTPs, open WhatsApp.</li>
                      <li>
                        Go to <strong>Settings → Linked devices → Link a device</strong>.
                      </li>
                      <li>Scan the QR. This page turns green within a few seconds.</li>
                    </ol>
                    <div className="flex items-center justify-center bg-[#fafafa] border border-[#e7e2d8] rounded-xl w-[232px] h-[232px]">
                      {whatsappQr ? (
                        <img src={whatsappQr} alt="WhatsApp login QR" className="w-[220px] h-[220px] object-contain" />
                      ) : (
                        <span className="text-[12.5px] text-[#747576] text-center px-4">Tap “Get QR” to show the login code</span>
                      )}
                    </div>
                    <button
                      onClick={() => runWhatsAppAction("qr")}
                      disabled={waBusy !== ""}
                      className="bg-[#25d366] hover:bg-[#1fbe5b] disabled:opacity-60 text-white px-4 py-2 rounded-lg font-bold text-[13px] flex items-center gap-1.5 cursor-pointer"
                    >
                      {waBusy === "qr" ? <RefreshCw size={14} className="animate-spin" /> : <QrCode size={14} />}
                      {whatsappQr ? "Get new QR" : "Get QR"}
                    </button>
                  </div>

                  <div className="space-y-3 md:border-l md:border-[#e7e2d8] md:pl-5">
                    <p className="text-[13px] text-[#202020]">
                      <strong>Can&apos;t scan?</strong> Link with a code instead: WhatsApp →{" "}
                      <strong>Linked devices → Link a device → Link with phone number</strong>.
                    </p>
                    <div className="flex gap-2 max-w-sm">
                      <input
                        type="tel"
                        value={waPhone}
                        onChange={(e) => setWaPhone(e.target.value)}
                        placeholder="That phone's 10-digit number"
                        className="flex-1 min-w-0 px-3.5 py-2 border border-[#e7e2d8] focus:border-[#02cb5a] rounded-lg text-[13.5px] bg-white outline-none"
                      />
                      <button
                        onClick={() => runWhatsAppAction("pairing-code")}
                        disabled={waBusy !== ""}
                        className="bg-[#1f3a2c] hover:bg-[#14281e] disabled:opacity-60 text-white px-4 py-2 rounded-lg font-bold text-[13px] flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {waBusy === "pairing-code" ? <RefreshCw size={14} className="animate-spin" /> : <KeyRound size={14} />}
                        Get code
                      </button>
                    </div>
                    {pairingCode && (
                      <div className="text-[26px] font-mono font-bold tracking-[0.2em] text-[#1f3a2c]">{pairingCode}</div>
                    )}
                  </div>
                </div>
              )}

              {waError && <p className="text-[12.5px] text-[#e53935]">{waError}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Android app */}
            <div className="bg-white border border-[#e7e2d8] rounded-2xl p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-[#016c2f]" />
                <h2 className="font-bold text-[16px] text-[#1f3a2c]">Android payment app</h2>
              </div>
              <p className="text-[13px] text-[#5c5a52]">
                Install this on the phone that receives your UPI money. It reads the bank&apos;s payment
                notification and reports it to the gateway, so orders confirm on their own.
              </p>

              {status.apk.available ? (
                <a
                  href="/api/admin/youpi/apk"
                  className="inline-flex items-center gap-2 bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] px-4 py-2.5 rounded-xl font-bold text-[13.5px] transition-colors"
                >
                  <Download size={16} />
                  Download APK
                  {status.apk.sizeBytes ? (
                    <span className="font-medium opacity-80">({(status.apk.sizeBytes / 1024).toFixed(0)} KB)</span>
                  ) : null}
                </a>
              ) : (
                <div className="text-[12.5px] text-[#8e1c1a]">
                  The app file is not available. Make sure the gateway is running.
                </div>
              )}

              {status.apk.sha256 && (
                <div className="text-[11.5px] text-[#747576] break-all">
                  SHA-256: <span className="font-mono">{status.apk.sha256}</span>
                </div>
              )}

              {status.androidPairing && (
                <div className="text-[12.5px] text-[#202020]">
                  Paired phones: <strong>{status.androidPairing.devices.length}</strong>
                  {status.androidPairing.devices.map((d) => (
                    <span key={d.name} className="block text-[#5c5a52]">
                      {d.name} · {d.isActive ? "active" : "inactive"}
                    </span>
                  ))}
                </div>
              )}

              {pairingIsLocal && (
                <div className="bg-[#fff8e6] border border-[#f5d58a] rounded-lg p-3 text-[12.5px] text-[#6b4a00] flex gap-2">
                  <TriangleAlert size={15} className="shrink-0 mt-0.5" />
                  <span>
                    YouPI&apos;s pairing QR points to <code>{pairingUrl}</code>, which a phone cannot reach. The app
                    can pair only after YouPI has a public URL (its Cloudflare tunnel). Until then, use{" "}
                    <strong>Google Messages for Web</strong> for the SMS observer.
                  </span>
                </div>
              )}

              <ol className="list-decimal pl-5 space-y-1 text-[12.5px] text-[#202020]">
                <li>Open this admin page on the payment phone and tap <strong>Download APK</strong>.</li>
                <li>Allow &ldquo;Install unknown apps&rdquo; for your browser when Android asks, then install.</li>
                <li>Open the app and give it <strong>Notification access</strong>.</li>
                <li>
                  In the YouPI hub, open the SMS gateway pairing QR and scan it with the app. The phone must be
                  able to reach the gateway (same Wi-Fi, or your public gateway URL).
                </li>
              </ol>
              <HubLink hubUrl={hubUrl} section="developerHub" label="Open pairing in YouPI hub" />
            </div>

            {/* Webhook + setup */}
            <div className="space-y-4">
              <div className="bg-white border border-[#e7e2d8] rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <Webhook size={18} className="text-[#016c2f]" />
                  <h2 className="font-bold text-[16px] text-[#1f3a2c]">Webhook</h2>
                </div>
                <p className="text-[13px] text-[#5c5a52]">
                  Optional. Your shop already confirms every payment directly with YouPI. The webhook only adds a
                  backup notice. To use it, paste this into YouPI <strong>Store Settings → Webhook URL</strong>.
                </p>
                {status.youpiWebhookUrl !== null && status.youpiWebhookUrl !== status.webhookUrl && (
                  <p className="text-[12.5px] text-[#6b4a00] bg-[#fff8e6] rounded-lg px-3 py-2">
                    YouPI currently sends its webhook to{" "}
                    <code>{status.youpiWebhookUrl || "nowhere"}</code>. YouPI holds one webhook URL, so changing it
                    disconnects that app.
                  </p>
                )}
                <div className="flex items-center gap-2 bg-[#fafafa] border border-[#e7e2d8] rounded-xl px-3 py-2">
                  <span className="font-mono text-[12.5px] text-[#1f3a2c] break-all flex-1">{status.webhookUrl}</span>
                  <button
                    onClick={copyWebhookUrl}
                    className="p-1.5 rounded-lg border border-[#e7e2d8] hover:bg-white text-[#202020] transition-colors cursor-pointer shrink-0"
                  >
                    {copied ? <Check size={14} className="text-[#02cb5a]" /> : <Copy size={14} />}
                  </button>
                </div>
                <HubLink hubUrl={hubUrl} section="storeSettings" label="Open Store Settings" />
              </div>

              <div className="bg-white border border-[#e7e2d8] rounded-2xl p-5 shadow-2xs">
                <h2 className="font-bold text-[16px] text-[#1f3a2c] mb-3">Setup checklist</h2>
                <ul className="space-y-2.5">
                  {setupItems.map((item) => (
                    <li key={item.env} className="flex items-start gap-2.5">
                      {item.done ? (
                        <CircleCheck size={17} className="text-[#02cb5a] shrink-0 mt-0.5" />
                      ) : (
                        <CircleX size={17} className="text-[#c9c6bd] shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[#202020]">
                          {item.label} <code className="text-[11.5px] font-normal text-[#5c5a52]">{item.env}</code>
                        </div>
                        <div className="text-[12px] text-[#747576]">{item.hint}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <p className="text-[11.5px] text-[#8e8d8a]">
            Last checked {new Date(status.checkedAt).toLocaleTimeString("en-IN")} · refreshes every 15 seconds
          </p>
        </>
      )}
    </div>
  );
}

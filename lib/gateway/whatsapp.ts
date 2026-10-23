import {
  getWhatsAppConfig,
  getWhatsAppServiceConfig,
  isCloudApiConfigured,
  isWhatsAppServiceConfigured,
  whatsAppProvider,
} from "./config";
import { getToggles } from "./toggles";

// Two ways to send the checkout code:
//  - "qr":    our WhatsApp service (whatsapp-service/), logged in by scanning a QR with the shop's WhatsApp
//  - "cloud": the official WhatsApp Cloud API (Meta), with an approved Authentication template

export interface WhatsAppServiceStatus {
  status: string;
  connected: boolean;
  phone: string | null;
  qrDataUrl: string | null;
  error?: string;
}

async function serviceCall<T>(path: string, init: { method?: "GET" | "POST"; body?: unknown; timeoutMs?: number } = {}): Promise<T> {
  const { url, token } = getWhatsAppServiceConfig();
  const res = await fetch(`${url}${path}`, {
    method: init.method || "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(init.timeoutMs ?? 5000),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `WhatsApp service error ${res.status}`);
  return data as T;
}

let statusCache: { at: number; value: WhatsAppServiceStatus } | null = null;

/** Live login state of the WhatsApp service (cached 10 s for checkout; admin can bypass). */
export async function getWhatsAppServiceStatus({ fresh = false } = {}): Promise<WhatsAppServiceStatus> {
  if (!fresh && statusCache && Date.now() - statusCache.at < 10000) return statusCache.value;
  let value: WhatsAppServiceStatus;
  try {
    value = await serviceCall<WhatsAppServiceStatus>("/status", { timeoutMs: 3000 });
  } catch (err) {
    value = { status: "offline", connected: false, phone: null, qrDataUrl: null, error: err instanceof Error ? err.message : String(err) };
  }
  statusCache = { at: Date.now(), value };
  return value;
}

/**
 * Should checkout ask for a WhatsApp code right now? Only when sending can actually work, so a
 * logged-out WhatsApp never blocks payments: checkout then goes straight to the QR.
 */
export async function isOtpRequired() {
  if (process.env.GATEWAY_REQUIRE_OTP === "false") return false;
  const provider = whatsAppProvider();
  if (provider && !(await getToggles()).whatsapp) return false; // switched off in admin
  if (provider === "qr") return (await getWhatsAppServiceStatus()).connected;
  if (provider === "cloud") return true;
  return process.env.NODE_ENV !== "production" && process.env.GATEWAY_DEV_OTP === "true";
}

export async function sendWhatsAppCode(phone10: string, code: string): Promise<{ ok: boolean; error?: string }> {
  if (isWhatsAppServiceConfigured()) {
    try {
      await serviceCall("/send", {
        method: "POST",
        body: {
          to: `91${phone10}`,
          text: `${code} is your Teabox verification code. It expires in 5 minutes. Do not share it with anyone.`,
        },
        timeoutMs: 15000,
      });
      return { ok: true };
    } catch (err) {
      statusCache = null; // re-check the login state next time
      return { ok: false, error: err instanceof Error ? err.message : "WhatsApp service is unreachable" };
    }
  }
  if (!isCloudApiConfigured()) return { ok: false, error: "WhatsApp is not configured" };

  const c = getWhatsAppConfig();
  try {
    const res = await fetch(`${c.apiBase}/${c.apiVersion}/${c.phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${c.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: `91${phone10}`,
        type: "template",
        template: {
          name: c.template,
          language: { code: c.language },
          components: [
            { type: "body", parameters: [{ type: "text", text: code }] },
            { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
          ],
        },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data?.error?.message || `WhatsApp API error ${res.status}` };
  } catch {
    return { ok: false, error: "WhatsApp API is unreachable" };
  }
}

/** Free-text message through the WhatsApp service (used for the shop's own order alerts). */
export async function sendWhatsAppText(toDigits: string, text: string) {
  await serviceCall("/send", { method: "POST", body: { to: toDigits, text }, timeoutMs: 15000 });
}

// ---- Admin: log the shop's WhatsApp in / out ----

export async function requestWhatsAppQr() {
  statusCache = null;
  return serviceCall<WhatsAppServiceStatus>("/qr", { method: "POST", timeoutMs: 15000 });
}

export async function requestWhatsAppPairingCode(phone10: string) {
  statusCache = null;
  return serviceCall<{ code: string }>("/pairing-code", { method: "POST", body: { phone: `91${phone10}` }, timeoutMs: 15000 });
}

export async function logoutWhatsApp() {
  statusCache = null;
  return serviceCall<{ loggedOut: boolean }>("/logout", { method: "POST", timeoutMs: 15000 });
}

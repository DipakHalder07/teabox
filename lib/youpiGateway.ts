import { getYouPiConfig } from "./youpiConfig";

/**
 * Server-side client for a self-hosted YouPI-PG payment core (apps/payment-api).
 * The browser never talks to YouPI directly: the shop's API routes call these helpers,
 * so the gateway URL and merchant key stay on the server.
 */

export class YouPiGatewayError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
  }
}

export type GatewayStatus =
  | "INITIATED"
  | "QUEUED"
  | "ACTIVE"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED"
  | "SUSPICIOUS"
  | "BLOCKED";

export interface GatewayHealth {
  status: string;
  tier: "GREEN" | "YELLOW" | "RED" | string;
  label: string;
  isWorking: boolean;
  reason?: string;
  warning?: string | null;
  smsHealthy?: boolean;
  gmailHealthy?: boolean;
}

export interface CheckoutStateResponse {
  status: GatewayStatus;
  queuePosition?: number;
  timeRemainingSeconds?: number | null;
  canClickPaymentDone?: boolean;
  payeeVpa?: string | null;
  payeeName?: string | null;
  amount: string;
  upiUri?: string | null;
  upiServerIndicator?: GatewayHealth | null;
  cancelledReason?: string | null;
}

interface BindResponse {
  status: GatewayStatus;
  queuePosition?: number;
  hasActiveSessionConflict?: boolean;
}

/** HTTP status + message for an API route to return. */
export function describeError(error: unknown, fallback: string) {
  return {
    status: error instanceof YouPiGatewayError ? error.status : 500,
    message: error instanceof Error && error.message ? error.message : fallback,
  };
}

export function isGatewayConfigured() {
  return Boolean(getYouPiConfig().baseUrl);
}

async function call<T>(
  path: string,
  init: {
    method?: "GET" | "POST";
    body?: unknown;
    headers?: Record<string, string>;
    timeoutMs?: number;
    baseUrl?: string;
  } = {}
): Promise<T> {
  const baseUrl = init.baseUrl ?? getYouPiConfig().baseUrl;
  if (!baseUrl) throw new YouPiGatewayError("YouPI gateway is not configured", 503);

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method: init.method || "GET",
      headers: { "Content-Type": "application/json", ...init.headers },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(init.timeoutMs ?? 6000),
      cache: "no-store",
    });
  } catch {
    throw new YouPiGatewayError("YouPI gateway is unreachable", 503);
  }

  const data = (await res.json().catch(() => ({}))) as T & { error?: string; message?: string };
  if (!res.ok) {
    throw new YouPiGatewayError(
      data?.message || data?.error || `YouPI gateway error ${res.status}`,
      res.status,
      data
    );
  }
  return data;
}

function merchantHeaders(): Record<string, string> {
  const { merchantKey, merchantId } = getYouPiConfig();
  const headers: Record<string, string> = {};
  if (merchantKey) headers["X-Merchant-Key"] = merchantKey;
  if (merchantId) headers["X-Merchant-Id"] = merchantId;
  return headers;
}

function customerHeaders(token?: string): Record<string, string> {
  return token ? { "X-Customer-Token": token } : {};
}

export async function createGatewaySession(input: {
  orderId: string;
  amount: number;
  note?: string;
}): Promise<{ paymentId: string; orderId: string; amountPaise: string; status: GatewayStatus }> {
  return call("/api/v1/payments", {
    method: "POST",
    headers: {
      ...merchantHeaders(),
      "Idempotency-Key": `teabox-${input.orderId}-${Math.round(input.amount * 100)}`,
    },
    body: {
      orderId: input.orderId,
      amount: input.amount.toFixed(2),
      currency: "INR",
      method: "UPI",
      metadata: { source: "teabox", note: input.note || `Teabox Order ${input.orderId}` },
    },
  });
}

/** Sends a 6-digit OTP to the customer's WhatsApp (works for new and returning customers). */
export async function sendWhatsAppOtp(
  mobileNumber: string,
  name?: string
): Promise<{ expiresInSeconds?: number; devOtp?: string; dispatch?: { delivered?: boolean } }> {
  return call("/api/v1/customer/send-otp", {
    method: "POST",
    body: { mobileNumber, name: name || undefined },
  });
}

export async function verifyWhatsAppOtp(
  mobileNumber: string,
  otp: string
): Promise<{ token: string; customerId: string; phoneNumber: string; fullName: string }> {
  return call("/api/v1/customer/verify-otp", { method: "POST", body: { mobileNumber, otp } });
}

/** Ties the verified customer to the payment session; YouPI then queues it and starts the timer. */
export async function bindCustomer(paymentId: string, token: string): Promise<BindResponse> {
  return call(`/api/v1/checkout/${encodeURIComponent(paymentId)}/bind-customer`, {
    method: "POST",
    headers: customerHeaders(token),
    body: { token },
  });
}

export async function getCheckoutState(paymentId: string, token?: string): Promise<CheckoutStateResponse> {
  return call(`/api/v1/checkout/${encodeURIComponent(paymentId)}/state`, {
    headers: customerHeaders(token),
  });
}

/** The customer left an unfinished payment earlier: end it and activate this one (as the YouPI modal does). */
export async function retryNewPayment(paymentId: string, token?: string): Promise<BindResponse> {
  return call(`/api/v1/checkout/${encodeURIComponent(paymentId)}/retry-new-payment`, {
    method: "POST",
    headers: customerHeaders(token),
    body: {},
  });
}

/** Customer pressed "I've paid": YouPI opens its short verification window. */
export async function markPaymentDone(paymentId: string, token?: string): Promise<{ status: GatewayStatus }> {
  return call(`/api/v1/checkout/${encodeURIComponent(paymentId)}/payment-done`, {
    method: "POST",
    headers: customerHeaders(token),
    body: {},
  });
}

export async function cancelGatewaySession(paymentId: string, token?: string): Promise<unknown> {
  return call(`/api/v1/checkout/${encodeURIComponent(paymentId)}/cancel`, {
    method: "POST",
    headers: customerHeaders(token),
    body: {},
  });
}

/** Server-to-server status read. Used to decide PAID; never trust the browser for this. */
export async function getGatewayPayment(paymentId: string): Promise<{
  paymentId: string;
  orderId: string;
  amountPaise: string;
  status: string;
}> {
  return call(`/api/v1/payments/${encodeURIComponent(paymentId)}`, { headers: merchantHeaders() });
}

export async function getGatewayHealth(): Promise<GatewayHealth> {
  const { merchantId } = getYouPiConfig();
  const query = merchantId ? `?merchantId=${encodeURIComponent(merchantId)}` : "";
  return call(`/api/v1/checkout/server-health${query}`, { timeoutMs: 4000 });
}

// ---- Admin calls (need YOUPI_ADMIN_TOKEN). Used only by the shop's admin-authenticated routes.

async function adminCall<T>(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown; timeoutMs?: number } = {}
): Promise<T> {
  const { adminToken } = getYouPiConfig();
  if (!adminToken) throw new YouPiGatewayError("YOUPI_ADMIN_TOKEN is not set", 401);
  return call<T>(path, { ...init, headers: { Authorization: `Bearer ${adminToken}` }, timeoutMs: init.timeoutMs ?? 6000 });
}

export interface WhatsAppStatus {
  status: string;
  isConnected: boolean;
  phoneNumber: string | null;
  /** Login QR (data URL) while not connected */
  qrCode: string | null;
}

export async function getWhatsAppStatus(): Promise<WhatsAppStatus> {
  const data = await adminCall<{ status: string; isConnected?: boolean; phoneNumber?: string | null; qrCode?: string | null }>(
    "/api/v1/admin/whatsapp/status",
    { timeoutMs: 4000 }
  );
  const isConnected = Boolean(data.isConnected);
  const qr = typeof data.qrCode === "string" && data.qrCode.startsWith("data:image/") ? data.qrCode : null;
  return { status: data.status, isConnected, phoneNumber: data.phoneNumber || null, qrCode: isConnected ? null : qr };
}

/** Restarts the WhatsApp link and waits (up to ~8s) for a fresh login QR. */
export async function reconnectWhatsApp() {
  return adminCall<{ status: string; qrCode?: string | null }>("/api/v1/admin/whatsapp/reconnect", {
    method: "POST",
    body: {},
    timeoutMs: 20000,
  });
}

/** 8-digit code for WhatsApp → Linked devices → Link with phone number. */
export async function requestWhatsAppPairingCode(phoneNumber: string) {
  return adminCall<{ pairingCode: string; phoneNumber: string }>("/api/v1/admin/whatsapp/pairing-code", {
    method: "POST",
    body: { phoneNumber },
    timeoutMs: 20000,
  });
}

export async function sendWhatsAppTestMessage(to: string, message: string) {
  return adminCall<{ success?: boolean; delivered?: boolean }>("/api/v1/admin/whatsapp/test-message", {
    method: "POST",
    body: { to, message },
    timeoutMs: 15000,
  });
}

/** Active receiving UPI account, YouPI's webhook target and paired phones. Never returns secrets. */
export async function getGatewayAdminOverview() {
  const [accounts, settings, pairing] = await Promise.all([
    adminCall<{ accounts: Array<{ upiId: string; payeeName: string; isActive: boolean }> }>("/api/v1/admin/upi-accounts").catch(
      () => null
    ),
    adminCall<{ webhookUrl?: string | null }>("/api/v1/admin/merchant-settings").catch(() => null),
    adminCall<{ serverUrl?: string; devices?: Array<{ deviceName: string; isActive: boolean; lastHeartbeatAt: string | null }> }>(
      "/api/v1/admin/sms-gateway/pair-qr"
    ).catch(() => null),
  ]);

  const active = accounts?.accounts.find((a) => a.isActive) || null;
  return {
    receivingUpi: active ? { upiId: active.upiId, payeeName: active.payeeName } : null,
    webhookUrl: settings ? settings.webhookUrl || null : undefined,
    androidPairing: pairing
      ? {
          serverUrl: pairing.serverUrl || null,
          devices: (pairing.devices || []).map((d) => ({
            name: d.deviceName,
            isActive: d.isActive,
            lastHeartbeatAt: d.lastHeartbeatAt,
          })),
        }
      : null,
  };
}

/** Public on the payment core; used to proxy the Android observer app download. */
export async function fetchObserverApk(): Promise<Response> {
  const { baseUrl, adminUrl } = getYouPiConfig();
  const candidates = [
    baseUrl && `${baseUrl}/api/v1/admin/sms-gateway/download-apk`,
    adminUrl && `${adminUrl}/youpi-sms-gateway.apk`,
  ].filter(Boolean) as string[];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000), cache: "no-store" });
      if (res.ok) return res;
    } catch {}
  }
  throw new YouPiGatewayError("Android app file is not available from YouPI", 503);
}

// TeaPay: the shop's own UPI gateway. All settings come from environment variables.

export const PAYMENT_WINDOW_MS = 10 * 60 * 1000; // time shown to the customer
export const LATE_MATCH_MS = 30 * 60 * 1000; // a late payment still matches after the window
export const VERIFYING_EXTENSION_MS = 3 * 60 * 1000; // extra time after "I've paid"

export function getUpiConfig() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    upiId: process.env.UPI_ID || process.env.YOUPI_MERCHANT_VPA || (isProduction ? "" : "demo@upi"),
    payeeName: process.env.UPI_PAYEE_NAME || process.env.YOUPI_MERCHANT_NAME || "Teabox India",
  };
}

export function getWhatsAppConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    template: process.env.WHATSAPP_OTP_TEMPLATE || "",
    language: process.env.WHATSAPP_TEMPLATE_LANG || "en",
    apiVersion: process.env.WHATSAPP_API_VERSION || "v22.0",
    apiBase: (process.env.WHATSAPP_API_BASE || "https://graph.facebook.com").replace(/\/+$/, ""),
  };
}

/** Official WhatsApp Cloud API (Meta): no QR, set up in Meta Business. */
export function isCloudApiConfigured() {
  const c = getWhatsAppConfig();
  return Boolean(c.accessToken && c.phoneNumberId && c.template);
}

/** Our WhatsApp service (whatsapp-service/): logged in by scanning a QR, runs outside Vercel. */
export function getWhatsAppServiceConfig() {
  return {
    url: (process.env.WHATSAPP_SERVICE_URL || "").replace(/\/+$/, ""),
    token: process.env.WHATSAPP_SERVICE_TOKEN || "",
  };
}

export function isWhatsAppServiceConfigured() {
  const c = getWhatsAppServiceConfig();
  return Boolean(c.url && c.token);
}

export function whatsAppProvider(): "qr" | "cloud" | null {
  if (isWhatsAppServiceConfigured()) return "qr";
  if (isCloudApiConfigured()) return "cloud";
  return null;
}

export function isWhatsAppConfigured() {
  return whatsAppProvider() !== null;
}

export function getGoogleConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    // Overridable for tests
    authBase: (process.env.GOOGLE_AUTH_BASE || "https://accounts.google.com").replace(/\/+$/, ""),
    tokenUrl: process.env.GOOGLE_TOKEN_URL || "https://oauth2.googleapis.com/token",
    gmailBase: (process.env.GMAIL_API_BASE || "https://gmail.googleapis.com").replace(/\/+$/, ""),
  };
}

export function isGmailConfigured() {
  const c = getGoogleConfig();
  return Boolean(c.clientId && c.clientSecret);
}

// Bank alert email domains. A credit email counts only if it passes DKIM for one of these.
const DEFAULT_BANK_EMAIL_DOMAINS = [
  "hdfcbank.net", "hdfcbank.com", "hdfcbank.bank.in",
  "icicibank.com", "icici.bank.in",
  "sbi.co.in", "sbi.bank.in",
  "axisbank.com", "axis.bank.in",
  "kotak.com", "kotak.bank.in",
  "yesbank.in", "idfcfirstbank.com", "indusind.com", "federalbank.co.in", "aubank.in",
  "pnb.co.in", "pnb.bank.in", "bankofbaroda.com", "bankofbaroda.co.in", "bankofbaroda.bank.in",
  "canarabank.com", "canarabank.bank.in", "unionbankofindia.co.in", "unionbankofindia.bank.in",
  "paytm.com", "paytmbank.com", "phonepe.com",
];

export function getBankEmailDomains() {
  const extra = (process.env.GMAIL_ALERT_DOMAINS || "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return [...DEFAULT_BANK_EMAIL_DOMAINS, ...extra];
}

// UPI / bank / SMS apps whose notifications the Android app reports (same list as the app).
export const PAYMENT_APP_PACKAGES = new Set([
  "com.axis.mobile",
  "com.bankofbaroda.mconnect",
  "com.bankofbaroda.upi",
  "com.canarabank.mobility",
  "com.csam.icici.bank.imobile",
  "com.dreamplug.androidapp",
  "com.epifi.paisa",
  "com.fampay.in",
  "com.fedmobile",
  "com.fisglobal.bandhanupi.app",
  "com.freecharge.android",
  "com.google.android.apps.messaging",
  "com.google.android.apps.nbu.paisa.user",
  "com.hdfcbank.payzapp",
  "com.icicibank.pockets",
  "com.idfcfirstbank.optimus",
  "com.infrasoft.uboi",
  "com.infrasofttech.indianbank",
  "com.mgs.induspsp",
  "com.mobikwik_new",
  "com.msf.kbank.mobile",
  "com.myairtelapp",
  "com.nextbillion.groww",
  "com.phonepe.app",
  "com.samsung.android.messaging",
  "com.samsung.android.spay",
  "com.sbi.lotusintouch",
  "com.sbi.upi",
  "com.snapwork.hdfc",
  "com.tatadigital.tcp",
  "com.truecaller",
  "com.upi.axispay",
  "in.amazon.mshop.android.shopping",
  "in.gokiwi.kiwitpap",
  "in.org.npci.upiapp",
  "indwin.c3.shareapp",
  "money.jupiter",
  "net.one97.paytm",
]);

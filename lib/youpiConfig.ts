export const getYouPiConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    // YouPI-PG payment core (apps/payment-api), e.g. http://localhost:6100. Empty = manual UPI mode.
    baseUrl: (process.env.YOUPI_PG_BASE_URL || "").replace(/\/+$/, ""),
    // YouPI-PG merchant hub (apps/merchant-admin), e.g. http://localhost:6001. Used for admin links.
    adminUrl: (process.env.YOUPI_ADMIN_URL || "").replace(/\/+$/, ""),
    // Optional read-only use: lets the shop admin show WhatsApp connection status.
    adminToken: process.env.YOUPI_ADMIN_TOKEN || "",
    merchantId: process.env.YOUPI_MERCHANT_ID || "",
    // No real UPI ID or secret is hardcoded. Production must set these env vars.
    merchantVpa: process.env.YOUPI_MERCHANT_VPA || (isProduction ? "" : "demo@upi"),
    merchantName: process.env.YOUPI_MERCHANT_NAME || "Teabox India",
    // YouPI accepts the merchant's webhook secret as its API key (X-Merchant-Key).
    merchantKey: process.env.YOUPI_MERCHANT_KEY || process.env.YOUPI_WEBHOOK_SECRET || "",
    webhookSecret: process.env.YOUPI_WEBHOOK_SECRET || "",
  };
};

import nodemailer from "nodemailer";
import { sendViaGmailApi } from "@/lib/gateway/gmailSender";
import { getToggles } from "@/lib/gateway/toggles";

/**
 * Transactional & Admin Order Notification Email Dispatcher for Teabox
 * Automatically routes order notifications to dipakh810@gmail.com
 * Supports Gmail API (Sign in with Google), Nodemailer (Gmail / SMTP), Resend API, and fallback development logging.
 */

export const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_ORDER_NOTIFICATION_EMAIL || "dipakh810@gmail.com";

export interface OrderEmailDetails {
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  items: Array<{
    title: string;
    weight?: string | null;
    quantity: number;
    price: number;
    image?: string | null;
  }>;
  subtotal?: number;
  discountAmount?: number;
  shippingFee?: number;
  codFee?: number;
  totalAmount: number;
  paymentMethod: "upi" | "cod";
  paymentStatus: string;
  utrNumber?: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string | null;
}

const STORE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://teabox-by-dipak.vercel.app";

/** Customer-typed text (name, address…) is escaped before it goes into an email. */
function esc(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface CheckoutStartedDetails {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  address: string;
  items: string[];
  payAmount: string;
  orderTotal: string;
  startedAt: string; // e.g. "10:38 pm, 24 Oct 2026"
  expiresAt: string; // e.g. "10:48 pm"
  windowMinutes: number;
  reviewUrl: string;
}

/**
 * Creates Nodemailer Transporter if credentials are configured.
 * Specifically optimized for Gmail (Google App Passwords) and custom SMTP servers.
 */
function getSmtpTransporter() {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER;
  const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

  if (!user || !rawPass) return null;

  // Google App Passwords often contain spaces when copied (e.g. "abcd efgh ijkl mnop")
  const pass = rawPass.trim().replace(/\s+/g, "");

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });
  }

  // Default: Gmail SMTP service via Nodemailer
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

/**
 * Generate Admin Order Notification HTML
 */
function buildAdminOrderNotificationHtml(order: OrderEmailDetails): string {
  const isUpi = order.paymentMethod === "upi";
  const statusColor = isUpi ? "#016c2f" : "#8a5a18";
  const statusBg = isUpi ? "#eaf8ef" : "#fbf4e8";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Order Alert: ${esc(order.orderNumber)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f5f0; margin: 0; padding: 24px; color: #202020; }
          .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e7e2d8; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
          .header { background: #1f3a2c; color: #ffffff; padding: 28px; text-align: center; }
          .header h1 { margin: 0 0 6px; font-size: 22px; letter-spacing: 1.5px; font-weight: 800; }
          .header p { margin: 0; font-size: 13px; color: #a3c4b2; }
          .body { padding: 28px; }
          .badge-row { display: flex; gap: 8px; margin-bottom: 20px; }
          .badge { display: inline-block; padding: 6px 14px; border-radius: 6px; font-size: 12.5px; font-weight: bold; }
          .customer-box { background: #fafafa; border: 1px solid #e7e2d8; border-radius: 8px; padding: 16px; margin: 18px 0; font-size: 13.5px; line-height: 1.6; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13.5px; }
          .items-table th { text-align: left; padding: 10px; border-bottom: 2px solid #e7e2d8; color: #5c5a52; font-size: 12px; text-transform: uppercase; }
          .items-table td { padding: 12px 10px; border-bottom: 1px solid #f0ede6; }
          .total-box { margin-top: 20px; padding-top: 14px; border-top: 2px solid #1f3a2c; text-align: right; }
          .total-amount { font-size: 22px; font-weight: 800; color: #1f3a2c; }
          .cta-btn { display: inline-block; background: #02cb5a; color: #1f3a2c; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin-top: 22px; text-align: center; }
          .footer { background: #fafafa; border-top: 1px solid #e7e2d8; color: #747576; padding: 18px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TEABOX ORDER ALERT</h1>
            <p>New customer purchase received</p>
          </div>
          <div class="body">
            <div style="margin-bottom: 14px;">
              <span class="badge" style="background: ${statusBg}; color: ${statusColor};">
                ${order.paymentMethod.toUpperCase()} — ${order.paymentStatus}
              </span>
              <span class="badge" style="background: #eef2f0; color: #1f3a2c; margin-left: 6px;">
                Order #${esc(order.orderNumber)}
              </span>
            </div>

            <h2 style="font-size: 20px; margin: 10px 0 6px; color: #1f3a2c;">
              Order Details & Dispatch Summary
            </h2>
            <p style="font-size: 14px; color: #5c5a52; margin: 0 0 16px;">
              A new order has been confirmed on the Teabox storefront. Please review customer and shipment details:
            </p>

            <div class="customer-box">
              <strong style="color: #1f3a2c; font-size: 14px;">👤 Customer Information:</strong><br>
              <strong>Name:</strong> ${esc(order.customerName)}<br>
              <strong>Phone:</strong> ${esc(order.customerPhone || "Not provided")}<br>
              <strong>Email:</strong> ${esc(order.customerEmail || "Not provided")}<br>
              <br>
              <strong style="color: #1f3a2c; font-size: 14px;">📍 Shipping Address:</strong><br>
              ${esc(order.address)}<br>
              ${order.landmark ? `Landmark: ${esc(order.landmark)}<br>` : ""}
              ${esc(order.city)}, ${esc(order.state)} - <strong>${esc(order.pincode)}</strong><br>
              ${order.utrNumber ? `<br><strong style="color: #016c2f;">💳 UPI UTR / Ref No:</strong> ${esc(order.utrNumber)}` : ""}
            </div>

            <h3 style="font-size: 15px; margin: 20px 0 8px; color: #1f3a2c; text-transform: uppercase; letter-spacing: 0.5px;">
              Items Ordered (${order.items.reduce((acc, i) => acc + i.quantity, 0)} units):
            </h3>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Weight</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  .map(
                    (item) => `
                  <tr>
                    <td><strong>${esc(item.title)}</strong></td>
                    <td style="color: #5c5a52;">${esc(item.weight || "")}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right; font-weight: bold;">₹${item.price * item.quantity}</td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>

            <div class="total-box">
              ${order.subtotal ? `<div style="font-size: 13px; color: #5c5a52;">Subtotal: ₹${order.subtotal}</div>` : ""}
              ${order.discountAmount ? `<div style="font-size: 13px; color: #016c2f;">Discount: -₹${order.discountAmount}</div>` : ""}
              ${order.shippingFee ? `<div style="font-size: 13px; color: #5c5a52;">Shipping Fee: ₹${order.shippingFee}</div>` : ""}
              ${order.codFee ? `<div style="font-size: 13px; color: #8a5a18;">COD Fee: ₹${order.codFee}</div>` : ""}
              <div class="total-amount">Grand Total: ₹${order.totalAmount}</div>
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="${STORE_URL}/admin/orders" class="cta-btn">
                Open Admin Orders Dashboard →
              </a>
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0;">Automated Teabox Store Notification · Sent to ${ADMIN_NOTIFICATION_EMAIL}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Dispatch an email to a recipient via Gmail API, Nodemailer (Gmail / SMTP), Resend, or Dev Fallback
 */
export async function dispatchEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<{ success: boolean; messageId?: string; isDevMock?: boolean; error?: string }> {
  // 1. Try Gmail connected with "Sign in with Google" (admin → Payment Gateway, no password needed)
  try {
    const sent = await sendViaGmailApi({ to, subject, html, text, replyTo, fromName: "Teabox" });
    if (sent) {
      console.log(`[Email / Gmail API] Successfully sent to ${to} from ${sent.from}: ${sent.id}`);
      return { success: true, messageId: sent.id, isDevMock: false };
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[Email / Gmail API] Failed to send to ${to}:`, errorMessage);
    return {
      success: false,
      error: `Gmail sending failed: ${errorMessage}. Reconnect the sending Gmail in Admin → Payment Gateway.`,
      isDevMock: false,
    };
  }

  // 2. Try Nodemailer / Gmail SMTP
  const smtpTransporter = getSmtpTransporter();
  if (smtpTransporter) {
    try {
      const fromAddress = process.env.GMAIL_USER || process.env.SMTP_USER || "orders@teabox.com";
      const info = await smtpTransporter.sendMail({
        from: `Teabox <${fromAddress}>`,
        to,
        subject,
        html,
        text,
        replyTo,
      });
      console.log(`[Email / Gmail SMTP] Successfully sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId, isDevMock: false };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[Email / Gmail SMTP] Failed to send to ${to}:`, errorMessage);
      return {
        success: false,
        error: `Gmail sending failed: ${errorMessage}. Please check GMAIL_USER and GMAIL_APP_PASSWORD in .env.`,
        isDevMock: false,
      };
    }
  }

  // 3. Try Resend API if configured
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Teabox <onboarding@resend.dev>",
          to: [to],
          subject,
          html,
          text,
          ...(replyTo ? { reply_to: replyTo } : {}),
        }),
      });
      const data = await response.json();
      if (data?.id) {
        console.log(`[Email / Resend] Successfully sent to ${to}: ${data.id}`);
        return { success: true, messageId: data.id, isDevMock: false };
      }
    } catch (err) {
      console.warn(`[Email / Resend] Failed to send via Resend to ${to}:`, err);
    }
  }

  // 4. Graceful Dev Fallback (When Gmail credentials are not yet configured in local development)
  console.log(
    `[Email / Dev Mode] Email prepared for ${to} | Subject: "${subject}" (no Gmail connected and GMAIL_USER / GMAIL_APP_PASSWORD not set in .env)`
  );
  return { success: true, messageId: `mock_${Date.now()}`, isDevMock: true };
}

/**
 * Shop owner alert: a customer reached the payment QR. Gmail on the phone shows it as a notification.
 */
export async function sendCheckoutStartedEmail(c: CheckoutStartedDetails) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Checkout started: ${esc(c.orderNumber)}</title></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f7f5f0; margin: 0; padding: 24px; color: #202020;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e2d8; border-radius: 12px; overflow: hidden;">
          <div style="background: #1f3a2c; color: #ffffff; padding: 22px 24px;">
            <div style="font-size: 12px; letter-spacing: 1px; color: #a3c4b2; text-transform: uppercase; font-weight: 700;">Checkout started · QR shown</div>
            <div style="font-size: 22px; font-weight: 800; margin-top: 4px;">Order #${esc(c.orderNumber)}</div>
          </div>
          <div style="padding: 22px 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 6px 0; color: #5c5a52;">Started</td><td style="padding: 6px 0; text-align: right; font-weight: 700;">${esc(c.startedAt)}</td></tr>
              <tr><td style="padding: 6px 0; color: #5c5a52;">Payment window</td><td style="padding: 6px 0; text-align: right; font-weight: 700;">${c.windowMinutes} min · ends ${esc(c.expiresAt)}</td></tr>
              <tr><td style="padding: 6px 0; color: #5c5a52;">Customer pays</td><td style="padding: 6px 0; text-align: right; font-weight: 800; font-size: 18px; color: #016c2f;">${esc(c.payAmount)}</td></tr>
              <tr><td style="padding: 6px 0; color: #5c5a52;">Order total</td><td style="padding: 6px 0; text-align: right;">${esc(c.orderTotal)}</td></tr>
            </table>
            <div style="background: #fafafa; border: 1px solid #e7e2d8; border-radius: 8px; padding: 14px; margin-top: 16px; font-size: 13.5px; line-height: 1.6;">
              <strong>${esc(c.customerName)}</strong> · +91 ${esc(c.customerPhone)}${c.customerEmail ? ` · ${esc(c.customerEmail)}` : ""}<br>
              ${esc(c.address)}<br><br>
              ${c.items.map((i) => `• ${esc(i)}`).join("<br>")}
            </div>
            <div style="text-align: center; margin-top: 20px;">
              <a href="${esc(c.reviewUrl)}" style="display: inline-block; background: #02cb5a; color: #1f3a2c; font-weight: 800; font-size: 14px; padding: 13px 26px; border-radius: 8px; text-decoration: none;">Review &amp; confirm payment →</a>
            </div>
            <p style="font-size: 12px; color: #747576; text-align: center; margin: 14px 0 0;">The order confirms automatically when the money arrives. You'll get another email then.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  const text = [
    `Checkout started: order #${c.orderNumber}`,
    `Started: ${c.startedAt}`,
    `Payment window: ${c.windowMinutes} min (ends ${c.expiresAt})`,
    `Customer pays: ${c.payAmount} (order total ${c.orderTotal})`,
    `${c.customerName}, +91 ${c.customerPhone}`,
    c.address,
    ...c.items.map((i) => `- ${i}`),
    `Review: ${c.reviewUrl}`,
  ].join("\n");

  return dispatchEmail({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `🛒 Checkout started #${c.orderNumber} · ${c.payAmount} · pay by ${c.expiresAt}`,
    html,
    text,
  });
}

export interface ContactMessage {
  name: string;
  email: string;
  phone?: string | null;
  orderNumber?: string | null;
  topic: string;
  message: string;
}

/**
 * A Contact Us form message, sent to the shop owner. Replying in Gmail answers the customer directly.
 */
export async function sendContactMessageEmail(m: ContactMessage) {
  const rows = [
    ["Name", m.name],
    ["Email", m.email],
    ["Phone", m.phone || "Not given"],
    ["Order", m.orderNumber || "Not given"],
    ["Topic", m.topic],
  ];
  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Contact message from ${esc(m.name)}</title></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f7f5f0; margin: 0; padding: 24px; color: #202020;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e2d8; border-radius: 12px; overflow: hidden;">
          <div style="background: #1f3a2c; color: #ffffff; padding: 20px 24px;">
            <div style="font-size: 12px; letter-spacing: 1px; color: #a3c4b2; text-transform: uppercase; font-weight: 700;">Contact Us · ${esc(m.topic)}</div>
            <div style="font-size: 20px; font-weight: 800; margin-top: 4px;">${esc(m.name)}</div>
          </div>
          <div style="padding: 22px 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              ${rows.map(([k, v]) => `<tr><td style="padding: 5px 0; color: #5c5a52; width: 90px;">${k}</td><td style="padding: 5px 0; font-weight: 600;">${esc(v)}</td></tr>`).join("")}
            </table>
            <div style="background: #fafafa; border: 1px solid #e7e2d8; border-radius: 8px; padding: 14px; margin-top: 16px; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${esc(m.message)}</div>
            <p style="font-size: 12px; color: #747576; margin: 14px 0 0;">Hit Reply to answer ${esc(m.email)} directly.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  return dispatchEmail({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `💬 ${m.topic}: message from ${m.name}${m.orderNumber ? ` (#${m.orderNumber})` : ""}`,
    html,
    text: `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${m.message}`,
    replyTo: m.email,
  });
}

/**
 * The customer's own order confirmation (no admin links or internal notes).
 */
function buildCustomerOrderConfirmationHtml(order: OrderEmailDetails): string {
  const paid = order.paymentStatus === "PAID";
  const paymentLine =
    order.paymentMethod === "cod"
      ? `Cash on Delivery: please keep ₹${order.totalAmount} ready when your order arrives.`
      : paid
        ? `Payment received${order.utrNumber ? ` (UPI ref ${esc(order.utrNumber)})` : ""}. Thank you!`
        : "We are verifying your UPI payment and will update you shortly.";

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Order confirmed: ${esc(order.orderNumber)}</title></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f7f5f0; margin: 0; padding: 24px; color: #202020;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e2d8; border-radius: 12px; overflow: hidden;">
          <div style="background: #1f3a2c; padding: 26px 24px; text-align: center;">
            <div style="color: #02cb5a; font-size: 24px; font-weight: 800; letter-spacing: 3px; font-family: Georgia, serif;">TEABOX</div>
          </div>
          <div style="padding: 26px 24px;">
            <h1 style="font-size: 21px; margin: 0 0 6px; color: #1f3a2c;">Thank you, ${esc(order.customerName.split(" ")[0])}! Your order is confirmed.</h1>
            <p style="font-size: 14px; color: #5c5a52; margin: 0 0 18px;">Order <strong>#${esc(order.orderNumber)}</strong>. We'll email you again when it ships.</p>
            <div style="background: ${paid || order.paymentMethod === "cod" ? "#eaf8ef" : "#fbf4e8"}; border-radius: 8px; padding: 12px 14px; font-size: 13.5px; color: #1f3a2c;">${paymentLine}</div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 14px;">
              ${order.items
                .map(
                  (item) => `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0ede6;"><strong>${esc(item.title)}</strong>${item.weight ? `<br><span style="color: #747576; font-size: 12.5px;">${esc(item.weight)}</span>` : ""}</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0ede6; text-align: center; color: #5c5a52;">×${item.quantity}</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0ede6; text-align: right; font-weight: 700;">₹${item.price * item.quantity}</td>
                </tr>`
                )
                .join("")}
            </table>
            <table style="width: 100%; font-size: 13.5px; margin-top: 10px; color: #5c5a52;">
              ${order.subtotal ? `<tr><td>Subtotal</td><td style="text-align: right;">₹${order.subtotal}</td></tr>` : ""}
              ${order.discountAmount ? `<tr><td>Discount</td><td style="text-align: right; color: #016c2f;">-₹${order.discountAmount}</td></tr>` : ""}
              <tr><td>Shipping</td><td style="text-align: right;">${order.shippingFee ? `₹${order.shippingFee}` : "Free"}</td></tr>
              ${order.codFee ? `<tr><td>COD fee</td><td style="text-align: right;">₹${order.codFee}</td></tr>` : ""}
              <tr><td style="padding-top: 8px; font-size: 16px; font-weight: 800; color: #1f3a2c;">Total</td><td style="padding-top: 8px; text-align: right; font-size: 16px; font-weight: 800; color: #1f3a2c;">₹${order.totalAmount}</td></tr>
            </table>

            <div style="background: #fafafa; border: 1px solid #e7e2d8; border-radius: 8px; padding: 14px; margin-top: 18px; font-size: 13.5px; line-height: 1.6;">
              <strong>Delivering to</strong><br>
              ${esc(order.customerName)}<br>
              ${esc(order.address)}${order.landmark ? `, near ${esc(order.landmark)}` : ""}<br>
              ${esc(order.city)}, ${esc(order.state)} - ${esc(order.pincode)}
            </div>

            <div style="text-align: center; margin-top: 22px;">
              <a href="${STORE_URL}/account" style="display: inline-block; background: #02cb5a; color: #1f3a2c; font-weight: 800; font-size: 14px; padding: 13px 26px; border-radius: 8px; text-decoration: none;">View my orders →</a>
            </div>
          </div>
          <div style="background: #fafafa; border-top: 1px solid #e7e2d8; color: #747576; padding: 16px; text-align: center; font-size: 12px;">
            Questions? Just reply to this email.
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send order notification to admin (dipakh810@gmail.com) AND to the customer (if customer email provided)
 */
export async function sendOrderConfirmationEmail(
  order: OrderEmailDetails
): Promise<{ success: boolean }> {
  try {
    // Each email can be switched off in Admin → Payment Gateway → Email notifications
    const toggles = await getToggles();

    // 1. Dispatch to admin
    if (toggles.emailOrderAdmin) {
      await dispatchEmail({
        to: ADMIN_NOTIFICATION_EMAIL,
        subject: `🚨 New Teabox Order Received: #${order.orderNumber} (₹${order.totalAmount} - ${order.paymentMethod.toUpperCase()})`,
        html: buildAdminOrderNotificationHtml(order),
      });
    }

    // 2. If customer provided an email address, also dispatch confirmation to them
    if (toggles.emailOrderCustomer && order.customerEmail && order.customerEmail.includes("@")) {
      await dispatchEmail({
        to: order.customerEmail,
        subject: `Order Confirmed: #${order.orderNumber} - Teabox`,
        html: buildCustomerOrderConfirmationHtml(order),
        text: `Thank you! Your Teabox order #${order.orderNumber} (₹${order.totalAmount}) is confirmed. View your orders: ${STORE_URL}/account`,
      });
    }

    return { success: true };
  } catch (err) {
    console.error("[Email Dispatch] Error in sendOrderConfirmationEmail:", err);
    return { success: false };
  }
}

/**
 * Generate Teabox Branded 6-Digit OTP Login Verification Email HTML
 */
function buildOtpNotificationHtml(code: string, email: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Teabox Verification Code: ${code}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; margin: 0; padding: 32px 12px; color: #1f2937; }
          .wrapper { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e2d8; box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
          .header { background: #1f3a2c; padding: 28px 24px; text-align: center; }
          .header h1 { margin: 0; color: #02cb5a; font-size: 26px; font-weight: 800; letter-spacing: 3px; font-family: Georgia, serif; }
          .header p { margin: 6px 0 0; color: #a3c4b2; font-size: 11.5px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600; }
          .content { padding: 36px 28px; text-align: center; }
          .title { font-size: 22px; font-weight: 800; color: #1f3a2c; margin: 0 0 10px; }
          .subtitle { font-size: 14px; color: #5c5a52; line-height: 1.6; margin: 0 0 24px; }
          .code-container { background: #f0fdf4; border: 2px dashed #02cb5a; border-radius: 14px; padding: 22px 16px; margin: 24px 0; }
          .code-label { font-size: 11px; font-weight: 700; color: #016c2f; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; }
          .code { display: inline-block; padding: 10px 18px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1f3a2c; background: #ffffff; border: 1.5px solid #a3c4b2; border-radius: 10px; -webkit-user-select: all; user-select: all; }
          .copy-hint { font-size: 11.5px; color: #5c5a52; margin-top: 10px; }
          .expiry-note { font-size: 12.5px; color: #747576; line-height: 1.5; margin: 20px 0 0; }
          .security-alert { background: #fafafa; border-radius: 10px; padding: 14px; margin-top: 24px; font-size: 12px; color: #5c5a52; border: 1px solid #e7e2d8; text-align: left; }
          .footer { background: #fafafa; border-top: 1px solid #f0ede6; padding: 20px; text-align: center; font-size: 11.5px; color: #9c9a94; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>TEABOX</h1>
            <p>Fresh from the Source · Est. 2012</p>
          </div>
          <div class="content">
            <h2 class="title">Customer Sign-In Verification</h2>
            <p class="subtitle">
              Hello,<br>
              We received a request to access your Teabox account for <strong>${email}</strong>.<br>
              Use the 6-digit code below to complete your login:
            </p>
            <div class="code-container">
              <div class="code-label">One-Time Verification Code</div>
              <div class="code">${code}</div>
              <div class="copy-hint">Tap and hold (or double-click) the code to copy it</div>
            </div>
            <p class="expiry-note">
              ⏱️ This code will expire in <strong>10 minutes</strong>.
            </p>
            <div class="security-alert">
              <strong>🔒 Security Reminder:</strong><br>
              Never share this verification code with anyone. Teabox staff will never ask for your one-time password over phone, email, or WhatsApp.
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0 0 4px;">Teabox Storefront · Automated Account Verification</p>
            <p style="margin: 0;">If you did not request this login code, you can safely ignore this message.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Dispatch 6-digit OTP login verification code to customer's email via Nodemailer (Gmail / SMTP)
 */
export async function sendOtpVerificationEmail(
  email: string,
  code: string
): Promise<{ success: boolean; isDevMock?: boolean; error?: string }> {
  try {
    const html = buildOtpNotificationHtml(code, email);
    const result = await dispatchEmail({
      to: email,
      subject: `${code} is your Teabox login verification code`,
      html,
      // Plain-text part: what phone notifications show, and what Gmail / iOS read to offer "Copy code"
      text: `Your Teabox verification code is ${code}\n\nIt expires in 10 minutes. Never share this code with anyone.`,
    });
    return {
      success: result.success,
      isDevMock: result.isDevMock,
      error: result.error,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[Email Dispatch] Error in sendOtpVerificationEmail:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

export interface AbandonedCheckoutEmailDetails {
  checkoutNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    title: string;
    weight?: string | null;
    quantity: number;
    price: number;
    image?: string | null;
  }>;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  recoveryUrl: string;
  couponCode?: string | null;
}

/**
 * Sends a Shopify-style Abandoned Cart Recovery email to the customer with
 * their saved cart items, recovery button, and freshness guarantee.
 */
export async function sendAbandonedCheckoutRecoveryEmail(
  details: AbandonedCheckoutEmailDetails
): Promise<{ success: boolean; isDevMock?: boolean; error?: string }> {
  try {
    const itemsRows = details.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0ede6;">
            <div style="font-weight: 700; color: #1f3a2c; font-size: 14px;">${esc(item.title)}</div>
            ${item.weight ? `<div style="font-size: 12px; color: #5c5a52;">Size: ${esc(item.weight)}</div>` : ""}
            <div style="font-size: 12px; color: #747576;">Qty: ${item.quantity}</div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0ede6; text-align: right; font-weight: 700; color: #202020; font-size: 14px;">
            ₹${(item.price * item.quantity).toLocaleString("en-IN")}
          </td>
        </tr>`
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Did you leave something behind?</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f7f5f0; margin: 0; padding: 24px; color: #202020;">
          <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e2d8; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
            <div style="background: #1f3a2c; color: #ffffff; padding: 28px 24px; text-align: center;">
              <div style="font-size: 20px; font-weight: 900; letter-spacing: 2px;">DEMOBOX</div>
              <div style="font-size: 11px; letter-spacing: 1.5px; color: #a3c4b2; text-transform: uppercase; margin-top: 4px;">100% Fresh Single-Estate Teas</div>
            </div>
            <div style="padding: 28px 24px;">
              <h2 style="margin: 0 0 10px; font-size: 22px; color: #1f3a2c; font-weight: 800;">
                You left something fresh in your cart!
              </h2>
              <p style="margin: 0 0 20px; color: #5c5a52; font-size: 14.5px; line-height: 1.6;">
                Hi ${esc(details.customerName || "there")},<br>
                We noticed you started your checkout at Demobox, but didn't finish. Your selected single-estate teas are safely reserved for you.
              </p>

              <div style="background: #faf8f5; border: 1px solid #ede8de; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #5c5a52; margin-bottom: 10px;">
                  Your Saved Items (${details.items.length})
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  ${itemsRows}
                </table>
                <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #ded8cc; font-size: 13.5px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #5c5a52;">
                    <span>Subtotal</span>
                    <span>₹${details.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  ${
                    details.discountAmount > 0
                      ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #016c2f;">
                          <span>Discount (${details.couponCode || "Coupon"})</span>
                          <span>-₹${details.discountAmount.toLocaleString("en-IN")}</span>
                        </div>`
                      : ""
                  }
                  <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #5c5a52;">
                    <span>Shipping</span>
                    <span>${details.shippingFee === 0 ? "FREE" : `₹${details.shippingFee}`}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 16px; color: #1f3a2c; border-top: 1px solid #ded8cc; padding-top: 8px;">
                    <span>Total</span>
                    <span style="color: #016c2f;">₹${details.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${esc(details.recoveryUrl)}" style="display: inline-block; background: #02cb5a; color: #1f3a2c; font-weight: 800; font-size: 16px; padding: 16px 36px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 14px rgba(2, 203, 90, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                  Complete Your Order Now →
                </a>
                <div style="font-size: 12px; color: #747576; margin-top: 10px;">
                  Your address and cart will be restored automatically in 1 click.
                </div>
              </div>

              <div style="background: #f0f7f3; border: 1px solid #c9e4d4; border-radius: 10px; padding: 14px 18px; margin-top: 24px;">
                <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #1f3a2c; font-size: 13.5px; margin-bottom: 4px;">
                  <span>✨ 100% Freshness Guarantee</span>
                </div>
                <p style="margin: 0; font-size: 12.5px; color: #2e5440; line-height: 1.5;">
                  All teas are sourced directly from single estates in Darjeeling, Assam, and the Nilgiris, vacuum-sealed at source within 48 hours for pure freshness.
                </p>
              </div>
            </div>

            <div style="background: #faf8f5; border-top: 1px solid #e7e2d8; padding: 18px 24px; text-align: center; font-size: 12px; color: #747576;">
              <p style="margin: 0 0 6px;">Need help? Reply directly to this email or WhatsApp us at +91 8617513004</p>
              <p style="margin: 0;">Demobox Tea · Direct from tea gardens to your cup</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await dispatchEmail({
      to: details.customerEmail,
      subject: `Complete your Demobox order (${details.items.length} items waiting in your cart)`,
      html,
      text: `Hi ${details.customerName || "there"},\n\nYou left ${details.items.length} items in your cart at Demobox. Total: ₹${details.totalAmount}.\n\nComplete your order here: ${details.recoveryUrl}\n\nThank you,\nDemobox`,
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[Email Dispatch] Error in sendAbandonedCheckoutRecoveryEmail:", error);
    return { success: false, error };
  }
}


import nodemailer from "nodemailer";

/**
 * Transactional & Admin Order Notification Email Dispatcher for Teabox
 * Automatically routes order notifications to dipakh810@gmail.com
 * Supports Nodemailer (Gmail / SMTP), Resend API, and fallback development logging.
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
        <title>New Order Alert: ${order.orderNumber}</title>
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
                Order #${order.orderNumber}
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
              <strong>Name:</strong> ${order.customerName}<br>
              <strong>Phone:</strong> ${order.customerPhone || "Not provided"}<br>
              <strong>Email:</strong> ${order.customerEmail || "Not provided"}<br>
              <br>
              <strong style="color: #1f3a2c; font-size: 14px;">📍 Shipping Address:</strong><br>
              ${order.address}<br>
              ${order.landmark ? `Landmark: ${order.landmark}<br>` : ""}
              ${order.city}, ${order.state} - <strong>${order.pincode}</strong><br>
              ${order.utrNumber ? `<br><strong style="color: #016c2f;">💳 UPI UTR / Ref No:</strong> ${order.utrNumber}` : ""}
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
                    <td><strong>${item.title}</strong></td>
                    <td style="color: #5c5a52;">${item.weight || "100G"}</td>
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
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://teabox-by-dipak.vercel.app"}/admin/orders" class="cta-btn">
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
 * Dispatch an email to a recipient via Nodemailer (Gmail / SMTP), Resend, or Dev Fallback
 */
export async function dispatchEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; messageId?: string; isDevMock?: boolean; error?: string }> {
  // 1. Try Nodemailer / Gmail SMTP
  const smtpTransporter = getSmtpTransporter();
  if (smtpTransporter) {
    try {
      const fromAddress = process.env.GMAIL_USER || process.env.SMTP_USER || "orders@teabox.com";
      const info = await smtpTransporter.sendMail({
        from: `Teabox <${fromAddress}>`,
        to,
        subject,
        html,
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

  // 2. Try Resend API if configured
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

  // 3. Graceful Dev Fallback (When Gmail credentials are not yet configured in local development)
  console.log(
    `[Email / Dev Mode] Email prepared for ${to} | Subject: "${subject}" (GMAIL_USER or GMAIL_APP_PASSWORD not set in .env)`
  );
  return { success: true, messageId: `mock_${Date.now()}`, isDevMock: true };
}

/**
 * Send order notification to admin (dipakh810@gmail.com) AND to the customer (if customer email provided)
 */
export async function sendOrderConfirmationEmail(
  order: OrderEmailDetails
): Promise<{ success: boolean }> {
  try {
    const adminHtml = buildAdminOrderNotificationHtml(order);

    // 1. ALWAYS dispatch to admin
    await dispatchEmail({
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `🚨 New Teabox Order Received: #${order.orderNumber} (₹${order.totalAmount} - ${order.paymentMethod.toUpperCase()})`,
      html: adminHtml,
    });

    // 2. If customer provided an email address, also dispatch confirmation to them
    if (order.customerEmail && order.customerEmail.includes("@")) {
      await dispatchEmail({
        to: order.customerEmail,
        subject: `Order Confirmed: #${order.orderNumber} - Teabox`,
        html: adminHtml,
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
  const digits = code.split("");

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
          .digits-grid { display: flex; justify-content: center; gap: 8px; margin: 0 auto; max-width: 340px; }
          .digit-box { display: inline-block; width: 44px; height: 52px; line-height: 52px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 28px; font-weight: 800; color: #1f3a2c; background: #ffffff; border: 1.5px solid #a3c4b2; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); text-align: center; margin: 0 3px; }
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
              <div class="digits-grid">
                ${digits.map((d) => `<span class="digit-box">${d}</span>`).join("")}
              </div>
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


/**
 * Transactional Email Dispatcher for Teabox
 * Supports Resend API with graceful local development fallback logging.
 */

export interface OrderEmailDetails {
  orderNumber: string;
  customerName: string;
  customerEmail?: string | null;
  items: Array<{
    title: string;
    weight?: string | null;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  paymentMethod: "upi" | "cod";
  paymentStatus: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export async function sendOrderConfirmationEmail(order: OrderEmailDetails): Promise<{ success: boolean; messageId?: string }> {
  const recipient = order.customerEmail;
  if (!recipient) {
    console.log(`[Email] No customer email provided for order ${order.orderNumber}. Skipping email dispatch.`);
    return { success: false };
  }

  const resendApiKey = process.env.RESEND_API_KEY;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmed - Teabox</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f5f0; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: #1f3a2c; color: #ffffff; padding: 30px; text-align: center; }
          .header h1 { margin: 0 0 8px; font-size: 24px; letter-spacing: 1px; }
          .body { padding: 30px; }
          .status-badge { display: inline-block; background: #02cb5a; color: #1f3a2c; font-weight: bold; padding: 6px 14px; border-radius: 20px; font-size: 13px; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .items-table th { text-align: left; padding: 10px; border-bottom: 2px solid #e7e2d8; font-size: 13px; color: #747576; }
          .items-table td { padding: 12px 10px; border-bottom: 1px solid #f0ede6; font-size: 14px; }
          .total { margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; color: #1f3a2c; }
          .footer { background: #14281e; color: #9da3a0; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TEABOX</h1>
            <p>Direct from Indian Tea Gardens to Your Cup</p>
          </div>
          <div class="body">
            <span class="status-badge">Order Confirmed</span>
            <h2>Thank you, ${order.customerName}!</h2>
            <p>Your order <strong>${order.orderNumber}</strong> has been received and is being prepared with garden-fresh teas in Darjeeling.</p>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>Tea Selection</th>
                  <th>Qty</th>
                  <th style="text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  .map(
                    (item) => `
                  <tr>
                    <td><strong>${item.title}</strong><br><small style="color: #747576;">${item.weight || "100G"}</small></td>
                    <td>${item.quantity}</td>
                    <td style="text-align: right;">₹${item.price * item.quantity}</td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>

            <div class="total">
              Total Amount: ₹${order.totalAmount}
            </div>

            <div style="margin-top: 25px; background: #faf8f5; padding: 15px; border-radius: 6px; font-size: 13px;">
              <strong>Delivery Address:</strong><br>
              ${order.customerName}<br>
              ${order.address}<br>
              ${order.city}, ${order.state} - ${order.pincode}
            </div>

            <div style="margin-top: 25px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/track?id=${order.orderNumber}" style="display: inline-block; background: #1f3a2c; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Track Order Live at Teabox →</a>
            </div>
          </div>
          <div class="footer">
            <p>© 2026 Teabox India. Siliguri, West Bengal. 100% Freshness Guarantee.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Teabox <orders@teabox.com>",
          to: [recipient],
          subject: `Order Confirmed: ${order.orderNumber} - Teabox`,
          html: htmlContent,
        }),
      });
      const data = await response.json();
      return { success: true, messageId: data?.id };
    } catch (err) {
      console.warn("[Resend] Failed to send email via API, logged locally:", err);
    }
  }

  // Graceful local logging during dev / when RESEND_API_KEY is not set
  console.log(`[Resend Mock] Order confirmation email prepared for ${recipient} (Order #${order.orderNumber})`);
  return { success: true, messageId: `mock_${Date.now()}` };
}

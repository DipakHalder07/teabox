import { NextRequest, NextResponse } from "next/server";
import {
  bindCustomer,
  cancelGatewaySession,
  describeError,
  getCheckoutState,
  markPaymentDone,
  retryNewPayment,
  YouPiGatewayError,
} from "@/lib/youpiGateway";
import { buildUpiDeepLinks, buildUpiQrDataUrl } from "@/lib/youpi";
import { clearCustomerSession, readCustomerSession } from "@/lib/youpiCustomerSession";
import { cleanIndianPhone } from "@/lib/validations/checkout";

const PAYMENT_ID = /^[A-Za-z0-9-]{8,64}$/;

function errorResponse(error: unknown) {
  const { status, message } = describeError(error, "Payment gateway error");
  return NextResponse.json({ error: message }, { status });
}

// Polled by the checkout page. Only what the shop UI needs is passed through; the QR is
// rendered here from YouPI's UPI URI so it matches the shop design.
export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("paymentId") || "";
  if (!PAYMENT_ID.test(paymentId)) {
    return NextResponse.json({ error: "Invalid paymentId" }, { status: 400 });
  }

  try {
    const customer = readCustomerSession(req);
    const state = await getCheckoutState(paymentId, customer?.token);
    const upiUri: string | null = state.status === "ACTIVE" && state.upiUri ? state.upiUri : null;

    return NextResponse.json({
      paymentId,
      status: state.status,
      queuePosition: state.queuePosition || 0,
      timeRemainingSeconds: typeof state.timeRemainingSeconds === "number" ? state.timeRemainingSeconds : null,
      canClickPaymentDone: Boolean(state.canClickPaymentDone),
      payeeVpa: state.payeeVpa || null,
      payeeName: state.payeeName || null,
      amount: state.amount,
      upiUri,
      qrCodeDataUrl: upiUri ? await buildUpiQrDataUrl(upiUri) : null,
      deepLinks: upiUri ? buildUpiDeepLinks(upiUri) : null,
      health: state.upiServerIndicator || null,
      reason: state.cancelledReason || null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// action: "bind" (after WhatsApp OTP), "done" (customer says they paid), "cancel"
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const paymentId = String(body.paymentId || "");
  const action = String(body.action || "");
  if (!PAYMENT_ID.test(paymentId)) {
    return NextResponse.json({ error: "Invalid paymentId" }, { status: 400 });
  }

  const customer = readCustomerSession(req);

  try {
    if (action === "bind") {
      // The WhatsApp number that was verified must be the number on the order.
      const phone = cleanIndianPhone(String(body.phone || ""));
      if (!customer || customer.phone !== phone) {
        return NextResponse.json({ needsOtp: true, error: "Verify your WhatsApp number first." }, { status: 401 });
      }

      let result;
      try {
        result = await bindCustomer(paymentId, customer.token);
      } catch (err) {
        if (err instanceof YouPiGatewayError && err.status === 401) {
          const res = NextResponse.json({ needsOtp: true, error: "Your verification expired. Please verify again." }, { status: 401 });
          clearCustomerSession(res);
          return res;
        }
        throw err;
      }

      if (result.hasActiveSessionConflict) {
        result = await retryNewPayment(paymentId, customer.token);
      }

      if (result.status === "INITIATED") {
        return NextResponse.json(
          { error: "The payment gateway has no active receiving UPI account. Please pay by Cash on Delivery for now." },
          { status: 503 }
        );
      }
      return NextResponse.json({ success: true, status: result.status, queuePosition: result.queuePosition || 0 });
    }

    if (action === "done") {
      const result = await markPaymentDone(paymentId, customer?.token);
      return NextResponse.json({ success: true, status: result.status });
    }

    if (action === "cancel") {
      await cancelGatewaySession(paymentId, customer?.token);
      return NextResponse.json({ success: true, status: "CANCELLED" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}

import { jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { getJwtSecret } from "./auth";

// Customers sign in with a 6-digit email code (/api/auth/verify-otp), which sets this cookie.
export const CUSTOMER_COOKIE_NAME = "teabox_customer_session";

/** The signed-in customer, or null. The email in the token was proven by the email code. */
export async function getCustomerFromRequest(req: NextRequest): Promise<{ email: string; name: string } | null> {
  const token = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { audience: "teabox-customer" });
    if (payload.role !== "CUSTOMER" || typeof payload.email !== "string") return null;
    return { email: payload.email.toLowerCase(), name: typeof payload.name === "string" ? payload.name : "" };
  } catch {
    return null;
  }
}

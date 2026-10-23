import { NextRequest, NextResponse } from "next/server";

// The YouPI customer token (issued after WhatsApp OTP) lives in an httpOnly cookie, so page
// scripts never see it. Only the shop's payment routes read it.
const COOKIE_NAME = "teabox_youpi_customer";
const COOKIE_PATH = "/api/payments/youpi";

export interface YouPiCustomerSession {
  token: string;
  phone: string;
}

export function readCustomerSession(req: NextRequest): YouPiCustomerSession | null {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed?.t === "string" && typeof parsed?.p === "string") {
      return { token: parsed.t, phone: parsed.p };
    }
  } catch {}
  return null;
}

export function writeCustomerSession(res: NextResponse, session: YouPiCustomerSession) {
  const value = Buffer.from(JSON.stringify({ t: session.token, p: session.phone })).toString("base64url");
  res.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function clearCustomerSession(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", { path: COOKIE_PATH, maxAge: 0 });
}

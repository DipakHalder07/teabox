import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth";
import { isGmailConfigured } from "@/lib/gateway/config";
import { randomToken } from "@/lib/gateway/crypto";
import { gmailAuthUrl } from "@/lib/gateway/gmail";
import { publicBaseUrl } from "@/lib/gateway/http";

// Starts "Sign in with Google" for the inbox that receives bank alerts (read-only access).
export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  const back = new URL("/admin/payment-gateway", publicBaseUrl(req));
  if (!admin) return NextResponse.redirect(new URL("/admin/login", publicBaseUrl(req)));
  if (!isGmailConfigured()) {
    back.searchParams.set("gmail", "not-configured");
    return NextResponse.redirect(back);
  }

  const state = randomToken(16);
  const redirectUri = `${publicBaseUrl(req)}/api/admin/gateway/gmail/callback`;
  const res = NextResponse.redirect(gmailAuthUrl(redirectUri, state));
  res.cookies.set("teabox_gmail_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin/gateway/gmail",
    maxAge: 600,
  });
  return res;
}

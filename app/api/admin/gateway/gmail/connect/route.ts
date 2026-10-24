import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth";
import { isGmailConfigured } from "@/lib/gateway/config";
import { randomToken } from "@/lib/gateway/crypto";
import { gmailAuthUrl } from "@/lib/gateway/gmail";
import { gmailSenderAuthUrl } from "@/lib/gateway/gmailSender";
import { publicBaseUrl } from "@/lib/gateway/http";

// Starts "Sign in with Google" for the inbox that receives bank alerts (read-only access),
// or with ?purpose=send for the account that sends login codes and order emails (send-only).
export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  const back = new URL("/admin/payment-gateway", publicBaseUrl(req));
  if (!admin) return NextResponse.redirect(new URL("/admin/login", publicBaseUrl(req)));
  if (!isGmailConfigured()) {
    back.searchParams.set("gmail", "not-configured");
    return NextResponse.redirect(back);
  }

  const purpose = req.nextUrl.searchParams.get("purpose") === "send" ? "send" : "read";
  const state = randomToken(16);
  const redirectUri = `${publicBaseUrl(req)}/api/admin/gateway/gmail/callback`;
  const authUrl = purpose === "send" ? gmailSenderAuthUrl(redirectUri, state) : gmailAuthUrl(redirectUri, state);
  const res = NextResponse.redirect(authUrl);
  res.cookies.set("teabox_gmail_state", `${purpose}.${state}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin/gateway/gmail",
    maxAge: 600,
  });
  return res;
}

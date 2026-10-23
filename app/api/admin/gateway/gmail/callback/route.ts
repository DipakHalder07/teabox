import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth";
import { connectGmail } from "@/lib/gateway/gmail";
import { publicBaseUrl } from "@/lib/gateway/http";

// Google redirects here after the admin allows read-only Gmail access.
export async function GET(req: NextRequest) {
  const base = publicBaseUrl(req);
  const back = new URL("/admin/payment-gateway", base);
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.redirect(new URL("/admin/login", base));

  const state = req.nextUrl.searchParams.get("state") || "";
  const code = req.nextUrl.searchParams.get("code") || "";
  const expected = req.cookies.get("teabox_gmail_state")?.value || "";

  if (!code || !state || state !== expected) {
    back.searchParams.set("gmail", "error");
    back.searchParams.set("message", req.nextUrl.searchParams.get("error") || "Sign-in was cancelled or expired.");
  } else {
    try {
      const email = await connectGmail(code, `${base}/api/admin/gateway/gmail/callback`);
      back.searchParams.set("gmail", "connected");
      back.searchParams.set("email", email);
    } catch (err) {
      back.searchParams.set("gmail", "error");
      back.searchParams.set("message", err instanceof Error ? err.message : "Google sign-in failed");
    }
  }

  const res = NextResponse.redirect(back);
  res.cookies.set("teabox_gmail_state", "", { path: "/api/admin/gateway/gmail", maxAge: 0 });
  return res;
}

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth";
import { describeError, fetchObserverApk } from "@/lib/youpiGateway";

// Streams the YouPI Android observer app from the gateway, so the admin can install it on
// the phone that receives the shop's UPI payments.
export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const upstream = await fetchObserverApk();
    const headers = new Headers({
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": 'attachment; filename="youpi-sms-gateway.apk"',
      "Cache-Control": "no-store",
    });
    const length = upstream.headers.get("content-length");
    if (length) headers.set("Content-Length", length);
    return new Response(upstream.body, { status: 200, headers });
  } catch (error) {
    return NextResponse.json({ error: describeError(error, "APK not available").message }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { pairDevice } from "@/lib/gateway/android";

// Android observer app: pairs using the one-time token from the admin's QR code.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const result = await pairDevice(body);
  if (!result) {
    return NextResponse.json({ error: "Pairing code is invalid or expired. Show a new QR in the admin." }, { status: 401 });
  }
  return NextResponse.json({ paired: true, ...result });
}

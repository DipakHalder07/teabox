import { NextRequest, NextResponse } from "next/server";
import { authenticateDevice, handleSms } from "@/lib/gateway/android";

// Android observer app: a received SMS, signed with the device key.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const device = await authenticateDevice(req.headers, rawBody);
  if (!device) return NextResponse.json({ error: "Invalid device signature" }, { status: 401 });

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  return NextResponse.json(await handleSms(device, body, rawBody));
}

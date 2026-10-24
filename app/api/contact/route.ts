import { NextRequest, NextResponse } from "next/server";
import { contactSchema, CONTACT_TOPICS } from "@/lib/validations/contact";
import { sendContactMessageEmail } from "@/lib/email";
import { clientIp } from "@/lib/gateway/http";

// Contact Us form: emails the message to the shop owner (reply goes straight to the customer).

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const recent = new Map<string, number[]>(); // per server instance; enough to stop casual spam

function rateLimited(key: string) {
  const now = Date.now();
  const hits = (recent.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) return true;
  hits.push(now);
  recent.set(key, hits);
  return false;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Please check the form." }, { status: 400 });
  }
  const data = parsed.data;

  // Bot filled the hidden field: pretend it worked
  if (data.website) return NextResponse.json({ success: true });

  if (rateLimited(`ip:${clientIp(req) || "unknown"}`) || rateLimited(`email:${data.email.toLowerCase()}`)) {
    return NextResponse.json(
      { error: "You've sent a few messages already. Please wait a few minutes, or email us directly." },
      { status: 429 }
    );
  }

  const sent = await sendContactMessageEmail({
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    orderNumber: data.orderNumber || null,
    topic: CONTACT_TOPICS.find((t) => t.id === data.topic)?.label || "Other",
    message: data.message,
  });

  // Without an email provider in production the message would be lost, so say so
  if (!sent.success || (sent.isDevMock && process.env.NODE_ENV === "production")) {
    return NextResponse.json(
      { error: "We couldn't send your message right now. Please email us directly." },
      { status: 502 }
    );
  }
  return NextResponse.json({ success: true });
}

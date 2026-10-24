import { NextRequest, NextResponse } from "next/server";
import { clientIp } from "@/lib/gateway/http";

// Simple per-visitor limits for public forms (checkout, orders, contact, newsletter). Counts are
// kept per server instance, which is enough to stop scripts flooding the shop with fake requests.

const hits = new Map<string, number[]>();

/** True when `key` has already been used `max` times in the last `windowMs`; otherwise counts this use. */
export function rateLimited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, list] of hits) if (list.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return false;
}

/** A 429 response when this visitor's IP is over the limit for `name`, otherwise null. */
export function limitByIp(req: NextRequest, name: string, max: number, windowMs: number) {
  if (!rateLimited(`${name}:${clientIp(req) || "unknown"}`, max, windowMs)) return null;
  return NextResponse.json({ error: "Too many requests. Please wait a few minutes and try again." }, { status: 429 });
}

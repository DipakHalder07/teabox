import { NextRequest, NextResponse } from "next/server";
import { priceCartLines } from "@/lib/orderPricing";
import { limitByIp } from "@/lib/rateLimit";

// Live catalog prices for the cart lines, so the cart and checkout show what UPI will charge.
export async function POST(req: NextRequest) {
  const limited = limitByIp(req, "cart-price", 120, 10 * 60 * 1000);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  const prices = await priceCartLines(
    items.map((it: { id?: unknown; weight?: unknown }) => ({
      productId: typeof it?.id === "string" ? it.id : null,
      weight: typeof it?.weight === "string" ? it.weight : null,
    }))
  );
  return NextResponse.json({ prices }, { headers: { "Cache-Control": "no-store" } });
}

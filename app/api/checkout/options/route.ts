import { NextResponse } from "next/server";
import { getToggles } from "@/lib/gateway/toggles";

// Which payment options the checkout shows (set in Admin → Payment Gateway).
export async function GET() {
  const toggles = await getToggles();
  return NextResponse.json({ cod: toggles.cod }, { headers: { "Cache-Control": "no-store" } });
}

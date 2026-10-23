import { NextRequest, NextResponse } from "next/server";
import { searchOrders, getOrderById } from "@/lib/ordersDb";
import { toPublicOrder } from "@/lib/publicOrder";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query =
      searchParams.get("q") ||
      searchParams.get("query") ||
      searchParams.get("id") ||
      searchParams.get("tracking_id") ||
      searchParams.get("phone") ||
      "";

    const trimmed = query.trim();
    if (!trimmed || trimmed.length > 64) {
      return NextResponse.json(
        { error: "Please provide an Order ID, Courier Tracking Number, or Registered Mobile Number." },
        { status: 400 }
      );
    }

    // Direct single order lookup
    const single = await getOrderById(trimmed);
    if (single) {
      return NextResponse.json({
        status: "success",
        orders: [toPublicOrder(single)],
      });
    }

    // Multi-attribute search (OrderNumber, TrackingNumber, or Customer Phone)
    const results = await searchOrders(trimmed);
    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: "No order found. Please check your Order ID, tracking number or 10-digit mobile number." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      orders: results.map(toPublicOrder),
    });
  } catch (error) {
    if ((error as { digest?: string })?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    console.error("Tracking API error:", error);
    return NextResponse.json(
      { error: "Failed to search order tracking info" },
      { status: 500 }
    );
  }
}

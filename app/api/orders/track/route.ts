import { NextRequest, NextResponse } from "next/server";
import { searchOrders, getOrderById } from "@/lib/ordersDb";
import { cleanIndianPhone } from "@/lib/validations/checkout";

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
    if (!trimmed) {
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
        orders: [single],
      });
    }

    // Multi-attribute search (OrderNumber, TrackingNumber, or Customer Phone)
    const results = await searchOrders(trimmed);
    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: `No active order found matching "${trimmed}". Please check your details.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      orders: results,
    });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    console.error("Tracking API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to search order tracking info" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/ordersDb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: "success",
      order,
    });
  } catch (error: any) {
    console.error("Order lookup error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to lookup order" },
      { status: 500 }
    );
  }
}

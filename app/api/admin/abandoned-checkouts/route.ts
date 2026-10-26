import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth";
import {
  getAllAbandonedCheckouts,
  getAbandonedCheckoutStats,
} from "@/lib/abandonedCheckoutsDb";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;

    const [checkouts, stats] = await Promise.all([
      getAllAbandonedCheckouts({ status, search }),
      getAbandonedCheckoutStats(),
    ]);

    return NextResponse.json({
      status: "success",
      count: checkouts.length,
      checkouts,
      stats,
    });
  } catch (error: any) {
    console.error("Error fetching admin abandoned checkouts:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch abandoned checkouts" },
      { status: 500 }
    );
  }
}

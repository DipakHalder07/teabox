import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth";
import { getDatabaseStatus } from "@/lib/dbStatus";

// Database details for the admin dashboard (the public /api/health only says up or down).
export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ database: await getDatabaseStatus() });
}

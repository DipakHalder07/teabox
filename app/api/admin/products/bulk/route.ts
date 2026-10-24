import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConnected } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/auth";
import { refreshCatalog } from "@/lib/catalog";

const STATUS: Record<string, string> = { activate: "active", draft: "draft", archive: "archived" };

// Bulk actions on the selected products: set status or delete.
export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isDatabaseConnected())) {
    return NextResponse.json({ error: "Connect the database first (DATABASE_URL)." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String).slice(0, 1000) : [];
  if (ids.length === 0) return NextResponse.json({ error: "Select at least one product" }, { status: 400 });

  let count = 0;
  if (body.action === "delete") {
    count = (await prisma.product.deleteMany({ where: { id: { in: ids } } })).count;
  } else if (STATUS[body.action]) {
    count = (await prisma.product.updateMany({ where: { id: { in: ids } }, data: { status: STATUS[body.action] } })).count;
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  refreshCatalog();
  return NextResponse.json({ success: true, count });
}

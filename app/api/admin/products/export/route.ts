import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConnected } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/auth";
import { ensureCatalogSeeded, rowToProduct } from "@/lib/catalog";
import { productsToSheet, sheetToCsv, sheetToXlsx } from "@/lib/productSheet";
import { publicBaseUrl } from "@/lib/gateway/http";

// Download all products as a Shopify-format sheet: ?format=csv (Google Sheets / Shopify) or xlsx (Excel).
export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isDatabaseConnected())) {
    return NextResponse.json({ error: "Connect the database first (DATABASE_URL)." }, { status: 503 });
  }

  await ensureCatalogSeeded();
  const rows = await prisma.product.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  const sheet = productsToSheet(rows.map(rowToProduct), publicBaseUrl(req));
  const date = new Date().toISOString().slice(0, 10);

  if (req.nextUrl.searchParams.get("format") === "xlsx") {
    return new NextResponse(new Uint8Array(await sheetToXlsx(sheet)), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="products-${date}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // The byte-order mark makes Excel read ₹ and other non-English text correctly
  return new NextResponse(`﻿${sheetToCsv(sheet)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

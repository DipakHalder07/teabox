import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConnected } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/auth";
import { ensureCatalogSeeded, refreshCatalog, rowToProduct } from "@/lib/catalog";
import { firstIssue, inputToData, productInputSchema, uniqueHandle } from "@/lib/adminProducts";

const NO_DB = { error: "Products are saved in the database. Connect the database first (DATABASE_URL)." };

// Admin → Products: list every product (any status) and create new ones.
export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isDatabaseConnected())) return NextResponse.json(NO_DB, { status: 503 });

  await ensureCatalogSeeded();
  const rows = await prisma.product.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ products: rows.map(rowToProduct) });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isDatabaseConnected())) return NextResponse.json(NO_DB, { status: 503 });

  const parsed = productInputSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });

  const handle = await uniqueHandle(parsed.data.handle || parsed.data.title);
  const row = await prisma.product.create({ data: { id: handle, handle, ...inputToData(parsed.data) } });
  refreshCatalog();
  return NextResponse.json({ product: rowToProduct(row) }, { status: 201 });
}

/** Quick changes from the product list: status, availability or stock. */
export async function PATCH(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isDatabaseConnected())) return NextResponse.json(NO_DB, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const current = id ? await prisma.product.findUnique({ where: { id } }) : null;
  if (!current) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const data: { status?: string; inStock?: boolean; stockQuantity?: number } = {};
  if (["active", "draft", "archived"].includes(body.status)) data.status = body.status;
  if (typeof body.inStock === "boolean") data.inStock = body.inStock;
  if (Number.isInteger(body.stockQuantity) && body.stockQuantity >= 0) {
    data.stockQuantity = body.stockQuantity;
    if (current.trackInventory) data.inStock = body.stockQuantity > 0;
  }

  const row = await prisma.product.update({ where: { id }, data });
  refreshCatalog();
  return NextResponse.json({ product: rowToProduct(row) });
}

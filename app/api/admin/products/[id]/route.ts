import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConnected } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/auth";
import { refreshCatalog, rowToProduct } from "@/lib/catalog";
import { firstIssue, inputToData, productInputSchema, slugify, uniqueHandle } from "@/lib/adminProducts";

type Ctx = { params: Promise<{ id: string }> };

async function guard(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isDatabaseConnected())) {
    return NextResponse.json({ error: "Connect the database first (DATABASE_URL)." }, { status: 503 });
  }
  return null;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const row = await prisma.product.findUnique({ where: { id: (await params).id } });
  if (!row) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ product: rowToProduct(row) });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const { id } = await params;
  const current = await prisma.product.findUnique({ where: { id }, select: { handle: true } });
  if (!current) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const parsed = productInputSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });

  // The id stays the same (orders and carts point at it); only the URL handle may change
  const wanted = parsed.data.handle ? slugify(parsed.data.handle) : current.handle;
  const handle = wanted === current.handle ? current.handle : await uniqueHandle(wanted, id);

  const row = await prisma.product.update({ where: { id }, data: { handle, ...inputToData(parsed.data) } });
  refreshCatalog();
  return NextResponse.json({ product: rowToProduct(row) });
}

/** Deletes the product. Past orders keep their own copy of the title and price. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const { id } = await params;
  const { count } = await prisma.product.deleteMany({ where: { id } });
  if (count === 0) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  refreshCatalog();
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConnected } from "@/lib/prisma";
import { PRODUCTS, Product } from "@/data/products";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try PostgreSQL
    const isDbUp = await isDatabaseConnected();
    if (isDbUp) {
      try {
        const dbProducts = await prisma.product.findMany({
          orderBy: { createdAt: "desc" },
        });
        if (dbProducts.length > 0) {
          return NextResponse.json({ status: "success", products: dbProducts });
        }
      } catch (err) {
        console.warn("DB products fallback:", err);
      }
    }

    // Fallback to static products
    return NextResponse.json({
      status: "success",
      products: PRODUCTS,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, inStock, price } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const isDbUp = await isDatabaseConnected();
    if (isDbUp) {
      const updated = await prisma.product.update({
        where: { id },
        data: {
          inStock: inStock !== undefined ? inStock : undefined,
          price: price !== undefined ? price : undefined,
        },
      });
      return NextResponse.json({ status: "success", product: updated });
    }

    // In-memory update for mock session
    const prod = PRODUCTS.find((p) => p.id === id);
    if (prod) {
      if (inStock !== undefined) prod.inStock = inStock;
      if (price !== undefined) prod.price = price;
    }

    return NextResponse.json({ status: "success", product: prod });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

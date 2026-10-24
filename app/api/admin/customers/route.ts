import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth";
import { getAllCustomers } from "@/lib/customersDb";
import { prisma, isDatabaseConnected } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();
    const filter = searchParams.get("filter"); // "ALL" | "NEWSLETTER" | "ORDER"

    let customers = await getAllCustomers();

    if (filter && filter !== "ALL") {
      customers = customers.filter((c) => c.source === filter);
    }

    if (search) {
      customers = customers.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(search)) ||
          (c.email && c.email.toLowerCase().includes(search)) ||
          (c.phone && c.phone.includes(search))
      );
    }

    // Calculate summary statistics
    const all = await getAllCustomers();
    const stats = {
      totalCustomers: all.length,
      totalSubscribers: all.filter((c) => c.source === "NEWSLETTER" || c.ordersCount === 0).length,
      totalBuyers: all.filter((c) => c.ordersCount > 0).length,
      totalRevenue: all.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
    };

    return NextResponse.json({
      customers,
      stats,
    });
  } catch (error) {
    console.error("[Admin Customers API Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing customer id" }, { status: 400 });
    }

    const isDbUp = await isDatabaseConnected();
    if (isDbUp) {
      await prisma.user.deleteMany({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Customers Delete Error]:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}

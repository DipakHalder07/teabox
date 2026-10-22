import { NextResponse } from "next/server";
import { getDatabaseStatus } from "@/lib/dbStatus";
import { getAllOrders } from "@/lib/ordersDb";

export async function GET() {
  try {
    const dbStatus = await getDatabaseStatus();
    const orders = await getAllOrders();

    return NextResponse.json({
      status: dbStatus.connected ? "optimal" : "fallback_active",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        ...dbStatus,
        totalOrders: orders.length,
      },
      tools: {
        prismaStudio: "Run `npx prisma studio` in terminal to launch interactive UI at http://localhost:5555",
        adminDashboard: "/admin",
        schemaFile: "prisma/schema.prisma",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        error: (err as Error).message,
      },
      { status: 500 }
    );
  }
}

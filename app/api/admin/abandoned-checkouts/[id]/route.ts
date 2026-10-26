import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth";
import {
  getAbandonedCheckoutById,
  updateAbandonedCheckoutFollowUp,
  deleteAbandonedCheckout,
} from "@/lib/abandonedCheckoutsDb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const checkout = await getAbandonedCheckoutById(id);
    if (!checkout) {
      return NextResponse.json({ error: "Abandoned checkout not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", checkout });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch checkout" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await updateAbandonedCheckoutFollowUp(
      id,
      body.recoveryStatus || "UNSENT",
      body.status
    );

    if (!updated) {
      return NextResponse.json({ error: "Failed to update checkout" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", checkout: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update checkout" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const success = await deleteAbandonedCheckout(id);

    if (!success) {
      return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete checkout" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth";
import {
  getAbandonedCheckoutById,
  updateAbandonedCheckoutFollowUp,
} from "@/lib/abandonedCheckoutsDb";
import { publicBaseUrl } from "@/lib/gateway/http";
import { cleanIndianPhone } from "@/lib/validations/checkout";
import { sendWhatsAppText, getWhatsAppServiceStatus } from "@/lib/gateway/whatsapp";

export async function POST(
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

    const cleanPhone = cleanIndianPhone(checkout.customerPhone);
    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json({ error: "Invalid customer phone number" }, { status: 400 });
    }

    const baseUrl = publicBaseUrl(req);
    const recoveryUrl = `${baseUrl}/checkout?recover=${checkout.recoveryToken}`;
    const itemsList = checkout.items
      .map((i) => `• ${i.title}${i.weight ? ` (${i.weight})` : ""} ×${i.quantity}`)
      .join("\n");

    const message = [
      `Namaste *${checkout.customerName || "Customer"}* 🙏`,
      ``,
      `We noticed you left some fresh single-estate teas in your cart at *Demobox*:`,
      itemsList,
      ``,
      `💰 *Total Amount:* ₹${checkout.totalAmount.toLocaleString("en-IN")}`,
      ``,
      `Your cart & delivery address are safely saved! Tap the link below to complete your order in 1 click:`,
      `👉 ${recoveryUrl}`,
      ``,
      `🌿 *100% Freshness Guarantee:* Directly sourced from Darjeeling & Assam estates and vacuum-sealed at source within 48 hours.`,
      ``,
      `Need any help? Just reply to this message! 🍵`,
    ].join("\n");

    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const waMeUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;

    // Try automatic dispatch via background WhatsApp service if connected
    let directSent = false;
    let directError: string | null = null;
    try {
      const waStatus = await getWhatsAppServiceStatus();
      if (waStatus.connected) {
        await sendWhatsAppText(phoneWithCountry, message);
        directSent = true;
      }
    } catch (e: any) {
      directError = e?.message || "WhatsApp service unavailable";
    }

    // Update follow-up status
    const updated = await updateAbandonedCheckoutFollowUp(checkout.id, "WHATSAPP_SENT");

    return NextResponse.json({
      status: "success",
      directSent,
      directError,
      waMeUrl,
      message,
      phone: phoneWithCountry,
      checkout: updated,
    });
  } catch (error: any) {
    console.error("Error preparing WhatsApp recovery:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process WhatsApp recovery" },
      { status: 500 }
    );
  }
}

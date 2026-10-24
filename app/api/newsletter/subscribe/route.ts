import { NextRequest, NextResponse } from "next/server";
import { subscribeCustomer } from "@/lib/customersDb";
import { limitByIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const limited = limitByIp(req, "newsletter", 5, 10 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await req.json();
    const { email, name } = body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const result = await subscribeCustomer(email, name);

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed to harvest and store updates!",
      email: result.email,
    });
  } catch (error) {
    console.error("[Newsletter API Error]:", error);
    return NextResponse.json(
      { success: false, error: "Could not subscribe. Please try again." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { adminCookieOptions } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({
    status: "success",
    message: "Admin logged out successfully",
  });

  response.cookies.set({ ...adminCookieOptions(0), value: "" });

  return response;
}

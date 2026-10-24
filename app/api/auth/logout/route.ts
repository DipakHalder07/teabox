import { NextResponse } from "next/server";
import { CUSTOMER_COOKIE_NAME } from "@/lib/customerAuth";

// Customer sign-out: the session cookie is httpOnly, so only the server can remove it.
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(CUSTOMER_COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}

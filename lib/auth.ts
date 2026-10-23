import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// Resolved lazily so a missing secret fails at login time, not during `next build`.
export function getJwtSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("ADMIN_JWT_SECRET is not set; admin sessions are disabled");
      throw new Error("ADMIN_JWT_SECRET must be set in production");
    }
    return new TextEncoder().encode("dev-only-insecure-admin-jwt-secret");
  }
  return new TextEncoder().encode(secret);
}

export const ADMIN_COOKIE_NAME = "teabox_admin_session";
const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

export interface AdminPayload {
  adminId: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Hash a plain text password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain text password against hashed password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign an Admin JWT Session Token
 */
export async function signAdminToken(payload: AdminPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

/**
 * Verify an Admin JWT Session Token
 */
export async function verifyAdminToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const admin = payload as unknown as AdminPayload;
    // Customer login tokens are signed with the same key. Only a real admin payload may pass here.
    if (!admin.adminId || !ADMIN_ROLES.includes(admin.role)) return null;
    return admin;
  } catch (err) {
    return null;
  }
}

/**
 * Get the current admin session from server components or route handlers
 */
export async function getAdminSession(): Promise<AdminPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
}

/**
 * Verify admin session from an incoming Request
 */
export async function verifyAdminRequest(req: NextRequest): Promise<AdminPayload | null> {
  const token =
    req.cookies.get(ADMIN_COOKIE_NAME)?.value ||
    req.headers.get("Authorization")?.replace(/^Bearer\s+/, "");

  if (!token) return null;
  return await verifyAdminToken(token);
}

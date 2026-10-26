import { SignJWT, jwtVerify } from "jose";

// JWT-only helpers, kept free of database imports so proxy.ts can use them.

export const ADMIN_COOKIE_NAME = "teabox_admin_session";
export const ADMIN_SESSION_DAYS = 30;
export const ADMIN_SESSION_HOURS = ADMIN_SESSION_DAYS * 24; // 30 days persistent session (720 hours)
const ADMIN_AUDIENCE = "teabox-admin";
const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

export interface AdminPayload {
  adminId: string;
  email: string;
  name: string;
  role: string;
  /** Admin.sessionVersion when the token was issued; a bump signs the token out. */
  sv: number;
}

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

/**
 * Sign an Admin JWT Session Token (persists for 30 days)
 */
export async function signAdminToken(payload: AdminPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(ADMIN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_DAYS}d`)
    .sign(getJwtSecret());
}

/**
 * Check an admin token's signature, expiry and audience (no database lookup).
 */
export async function verifyAdminToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      audience: ADMIN_AUDIENCE,
      algorithms: ["HS256"],
    });
    const admin = payload as unknown as AdminPayload;
    if (!admin.adminId || !ADMIN_ROLES.includes(admin.role) || typeof admin.sv !== "number") return null;
    return admin;
  } catch {
    return null;
  }
}

export function adminCookieOptions(maxAgeSeconds: number) {
  return {
    name: ADMIN_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // "lax" so the Google sign-in redirect back to /api/admin/gateway/gmail/callback keeps the session.
    // Cross-site POSTs are refused by the Origin check in proxy.ts.
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma, isDatabaseConnected } from "./prisma";
import { ADMIN_COOKIE_NAME, AdminPayload, verifyAdminToken } from "./adminToken";

export {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_HOURS,
  adminCookieOptions,
  getJwtSecret,
  signAdminToken,
  verifyAdminToken,
} from "./adminToken";
export type { AdminPayload } from "./adminToken";

// Used only while the database is unreachable: the main admin can still sign in with the
// password from the environment.
const OFFLINE_ADMIN_ID = "adm_env_default";

// Lockout: after this many wrong passwords within the window, sign-in is refused until it passes.
export const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_PER_EMAIL_IP = 5;
const MAX_FAILS_PER_IP = 20;

/**
 * Hash a plain text password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain text password against hashed password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function safeEqualText(a: string, b: string) {
  const left = crypto.createHash("sha256").update(a).digest();
  const right = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(left, right);
}

/** The main admin set in the environment (ADMIN_DEFAULT_EMAIL / ADMIN_DEFAULT_PASSWORD). */
function envAdmin() {
  return {
    email: (process.env.ADMIN_DEFAULT_EMAIL || "admin@teabox.com").trim().toLowerCase(),
    password: process.env.ADMIN_DEFAULT_PASSWORD || "",
  };
}

function toPayload(admin: { id: string; email: string; name: string; role: string; sessionVersion: number }): AdminPayload {
  return { adminId: admin.id, email: admin.email, name: admin.name, role: admin.role, sv: admin.sessionVersion };
}

// A fixed hash so unknown emails cost the same bcrypt time as real ones.
const DUMMY_HASH = bcrypt.hashSync("teabox-timing-equaliser", 10);

/**
 * Checks an email and password. For the main admin the environment password is the only valid
 * one: changing ADMIN_DEFAULT_PASSWORD on Vercel changes the password and, at the next
 * sign-in, signs out every other device.
 */
export async function authenticateAdmin(email: string, password: string): Promise<AdminPayload | null> {
  const main = envAdmin();
  const dbUp = await isDatabaseConnected();

  if (main.password && email === main.email) {
    if (!safeEqualText(password, main.password)) return null;
    if (!dbUp) {
      return { adminId: OFFLINE_ADMIN_ID, email, name: "Teabox Admin", role: "SUPER_ADMIN", sv: 0 };
    }

    const existing = await prisma.admin.findUnique({ where: { email } });
    if (!existing) {
      const created = await prisma.admin.create({
        data: {
          email,
          name: "Teabox Admin",
          role: "SUPER_ADMIN",
          passwordHash: await hashPassword(password),
          lastLoginAt: new Date(),
        },
      });
      return toPayload(created);
    }
    if (!existing.isActive) return null;

    const passwordChanged = !(await verifyPassword(password, existing.passwordHash));
    const updated = await prisma.admin.update({
      where: { id: existing.id },
      data: passwordChanged
        ? { lastLoginAt: new Date(), passwordHash: await hashPassword(password), sessionVersion: { increment: 1 } }
        : { lastLoginAt: new Date() },
    });
    return toPayload(updated);
  }

  const admin = dbUp ? await prisma.admin.findUnique({ where: { email } }) : null;
  const valid = await verifyPassword(password, admin?.passwordHash || DUMMY_HASH);
  if (!admin || !valid || !admin.isActive) return null;

  const updated = await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  return toPayload(updated);
}

// ---------------------------------------------------------------------------------------------
// Sign-in attempts and lockout. Stored in the database; kept in memory only while it is down.
// ---------------------------------------------------------------------------------------------

const globalForAttempts = globalThis as unknown as {
  adminLoginFails?: Map<string, number[]>;
};
const memoryFails = (globalForAttempts.adminLoginFails ??= new Map<string, number[]>());

function recentMemoryFails(key: string) {
  const since = Date.now() - LOCKOUT_WINDOW_MS;
  const list = (memoryFails.get(key) || []).filter((t) => t > since);
  memoryFails.set(key, list);
  return list.length;
}

/** True while this email+IP (or this IP alone) has too many recent wrong passwords. */
export async function isLoginLocked(email: string, ip: string | null): Promise<boolean> {
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MS);
  if (await isDatabaseConnected()) {
    try {
      // A successful sign-in from this device clears its earlier mistakes.
      const lastSuccess = await prisma.adminLoginAttempt.findFirst({
        where: { email, ip, success: true, createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
      const pairSince = lastSuccess?.createdAt ?? since;
      const [pairFails, ipFails] = await Promise.all([
        prisma.adminLoginAttempt.count({ where: { email, ip, success: false, createdAt: { gt: pairSince } } }),
        ip
          ? prisma.adminLoginAttempt.count({ where: { ip, success: false, createdAt: { gte: since } } })
          : Promise.resolve(0),
      ]);
      return pairFails >= MAX_FAILS_PER_EMAIL_IP || ipFails >= MAX_FAILS_PER_IP;
    } catch (err) {
      console.warn("[Admin auth] lockout check failed:", err);
    }
  }
  return recentMemoryFails(`${email}|${ip}`) >= MAX_FAILS_PER_EMAIL_IP || recentMemoryFails(`ip|${ip}`) >= MAX_FAILS_PER_IP;
}

export async function recordLoginAttempt(entry: {
  email: string;
  ip: string | null;
  userAgent: string | null;
  success: boolean;
}) {
  if (!entry.success) {
    for (const key of [`${entry.email}|${entry.ip}`, `ip|${entry.ip}`]) {
      memoryFails.set(key, [...(memoryFails.get(key) || []), Date.now()]);
    }
  } else {
    memoryFails.delete(`${entry.email}|${entry.ip}`);
  }

  if (!(await isDatabaseConnected())) return;
  try {
    await prisma.adminLoginAttempt.create({
      data: {
        email: entry.email.slice(0, 254),
        ip: entry.ip?.slice(0, 64) || null,
        userAgent: entry.userAgent?.slice(0, 300) || null,
        success: entry.success,
      },
    });
  } catch (err) {
    console.warn("[Admin auth] could not record sign-in attempt:", err);
  }
}

// ---------------------------------------------------------------------------------------------
// Session checks
// ---------------------------------------------------------------------------------------------

/**
 * A valid token is not enough: the admin must still exist, be active, and not have used
 * "Sign out all devices" (or changed the password) since the token was issued.
 */
async function confirmAdmin(admin: AdminPayload | null): Promise<AdminPayload | null> {
  if (!admin) return null;
  if (!(await isDatabaseConnected())) return admin;
  if (admin.adminId === OFFLINE_ADMIN_ID) return null; // sign in again now the database is back

  try {
    const row = await prisma.admin.findUnique({ where: { id: admin.adminId } });
    if (!row || !row.isActive || row.sessionVersion !== admin.sv) return null;
    return toPayload(row);
  } catch (err) {
    console.warn("[Admin auth] session check failed:", err);
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
    return await confirmAdmin(await verifyAdminToken(token));
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
  return await confirmAdmin(await verifyAdminToken(token));
}

/** Signs out every device of this admin (their current tokens stop working). */
export async function revokeAdminSessions(adminId: string) {
  await prisma.admin.update({ where: { id: adminId }, data: { sessionVersion: { increment: 1 } } });
}

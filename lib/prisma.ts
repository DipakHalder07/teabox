import { PrismaClient } from "@prisma/client";

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

let lastCheckTime = 0;
let lastCheckResult = false;
const CHECK_COOLDOWN_MS = 30000; // Cache connection status for 30s when offline

/**
 * Checks if the PostgreSQL database connection is alive and reachable.
 * Caches failure for 30s so requests stay instant (<10ms) without 4-second timeouts.
 */
export async function isDatabaseConnected(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;

  const now = Date.now();
  if (now - lastCheckTime < CHECK_COOLDOWN_MS) {
    return lastCheckResult;
  }

  try {
    // 1.2s timeout race to never stall API responses
    const probe = prisma.$queryRaw`SELECT 1`;
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Database connection timeout")), 1200)
    );

    await Promise.race([probe, timeout]);
    lastCheckResult = true;
  } catch {
    lastCheckResult = false;
  }

  lastCheckTime = Date.now();
  return lastCheckResult;
}

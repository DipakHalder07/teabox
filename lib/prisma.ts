import { PrismaClient } from "@prisma/client";

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Neon's pooled address (host contains "-pooler", as set by Vercel's Neon integration) goes
 * through PgBouncer, which needs `pgbouncer=true` for Prisma. Added here so the URL can be
 * pasted unchanged.
 */
function runtimeDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.hostname.includes("-pooler") && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: runtimeDatabaseUrl(),
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
    // 5s timeout during build/CI to allow remote serverless DB handshake; 2.5s during runtime
    const timeoutMs =
      process.env.NEXT_PHASE === "phase-production-build" || process.env.CI || process.env.VERCEL ? 5000 : 2500;
    const probe = prisma.$queryRaw`SELECT 1`;
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Database connection timeout")), timeoutMs)
    );

    await Promise.race([probe, timeout]);
    lastCheckResult = true;
  } catch {
    lastCheckResult = false;
  }

  lastCheckTime = Date.now();
  return lastCheckResult;
}

export interface DatabaseStatusInfo {
  connected: boolean;
  latencyMs: number | null;
  driver: "PostgreSQL" | "In-Memory Fallback";
  host: string;
  lastChecked: string;
}

/**
 * Returns diagnostic metadata about the active database connection.
 */
export async function getDatabaseStatus(): Promise<DatabaseStatusInfo> {
  const dbUrl = process.env.DATABASE_URL || "";
  let host = "Not Configured";
  try {
    if (dbUrl) {
      const parsed = new URL(dbUrl);
      host = `${parsed.hostname}:${parsed.port || "5432"}${parsed.pathname}`;
    }
  } catch {
    host = "Custom/Cloud Pool";
  }

  const start = Date.now();
  const connected = await isDatabaseConnected();
  const latencyMs = connected ? Math.max(1, Date.now() - start) : null;

  return {
    connected,
    latencyMs,
    driver: connected ? "PostgreSQL" : "In-Memory Fallback",
    host,
    lastChecked: new Date().toISOString(),
  };
}

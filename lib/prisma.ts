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
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "20");
    }
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "20");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function getPrismaClient(): PrismaClient {
  let existing = globalForPrisma.prisma;
  if (!existing || !("abandonedCheckout" in existing)) {
    try {
      for (const k of Object.keys(require.cache)) {
        if (k.includes(".prisma") || k.includes("@prisma/client")) {
          delete require.cache[k];
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaClient: FreshClient } = require("@prisma/client");
      globalForPrisma.prisma = new FreshClient({
        datasourceUrl: runtimeDatabaseUrl(),
        log: ["warn"],
      });
    } catch {
      globalForPrisma.prisma = new PrismaClient({
        datasourceUrl: runtimeDatabaseUrl(),
        log: ["warn"],
      });
    }
  }
  return globalForPrisma.prisma!;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const val = (client as any)[prop];
    return typeof val === "function" ? val.bind(client) : val;
  },
});

let lastCheckTime = 0;
let lastCheckResult = false;
const CHECK_SUCCESS_COOLDOWN_MS = 60000;
const CHECK_FAILURE_COOLDOWN_MS = 4000;

/**
 * Checks if the PostgreSQL database connection is alive and reachable.
 */
export async function isDatabaseConnected(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;

  const now = Date.now();
  const cooldown = lastCheckResult ? CHECK_SUCCESS_COOLDOWN_MS : CHECK_FAILURE_COOLDOWN_MS;
  if (now - lastCheckTime < cooldown) {
    return lastCheckResult;
  }

  try {
    const timeoutMs = 20000; // 20s allows Neon serverless PostgreSQL to wake up from cold start
    let timer: NodeJS.Timeout;
    const timeout = new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(false), timeoutMs);
    });

    const probe = (async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
      } catch {
        return false;
      }
    })();

    const ok = await Promise.race([probe, timeout]).finally(() => {
      clearTimeout(timer);
    });

    lastCheckResult = Boolean(ok);
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

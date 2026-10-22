import { prisma, isDatabaseConnected } from "./prisma";

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

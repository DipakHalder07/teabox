import { isDatabaseConnected } from "./prisma";

export interface DatabaseStatusInfo {
  connected: boolean;
  latencyMs: number | null;
  driver: "PostgreSQL" | "In-Memory Fallback";
  host: string;
  lastChecked: string;
  /** Why it is offline: no URL, a computer-local URL on the live server, or unreachable. */
  problem: "not-configured" | "local-url-on-server" | "unreachable" | null;
}

/** True when DATABASE_URL points to this computer while running on Vercel (it can never work there). */
export function isLocalUrlOnServer() {
  try {
    const host = new URL(process.env.DATABASE_URL || "").hostname;
    return Boolean(process.env.VERCEL) && ["127.0.0.1", "localhost"].includes(host);
  } catch {
    return false;
  }
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
    problem: connected ? null : !dbUrl ? "not-configured" : isLocalUrlOnServer() ? "local-url-on-server" : "unreachable",
  };
}

// `npm run dev`: starts everything the shop needs on this computer, in one terminal.
//   1. the local database (npm run db:local), and brings its tables up to date
//   2. the WhatsApp service (npm run whatsapp), installed on first run
//   3. the shop (next dev; `npm run dev:web` runs only this)
// Anything already running is left alone. Ctrl+C stops what this started.

import fs from "node:fs";
import net from "node:net";
import { spawn, spawnSync } from "node:child_process";

if (fs.existsSync(".env")) process.loadEnvFile(".env");

function portInUse(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

const children = [];
function start(name, command, args) {
  console.log(`▶ starting ${name}`);
  const child = spawn(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  child.on("exit", (code) => console.log(`■ ${name} stopped${code ? ` (exit ${code})` : ""}`));
  children.push(child);
  return child;
}

function stopAll() {
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => process.exit(0), 1500);
}
process.on("SIGINT", stopAll);
process.on("SIGTERM", stopAll);

async function waitForPort(port, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await portInUse(port)) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

// Local database only (never touches a hosted database like Neon).
const dbUrl = process.env.DATABASE_URL || "";
const localDbMatch = dbUrl.match(/(?:127\.0\.0\.1|localhost):(\d+)/);
if (localDbMatch) {
  const localDbPort = Number(localDbMatch[1]);
  if (await portInUse(localDbPort)) console.log(`✓ database already running on ${localDbPort}`);
  else start("database", "npm", ["run", "db:local"]);
  if (await waitForPort(localDbPort, 20000)) {
    console.log("▶ updating database tables");
    spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], { stdio: "inherit", shell: process.platform === "win32" });
  } else {
    console.log("! database did not start; the shop will use manual UPI");
  }
}

const waPort = Number(new URL(process.env.WHATSAPP_SERVICE_URL || "http://127.0.0.1:7071").port || 7071);
if (!process.env.WHATSAPP_SERVICE_URL || !process.env.WHATSAPP_SERVICE_TOKEN) {
  console.log("• WhatsApp service not configured (WHATSAPP_SERVICE_URL / WHATSAPP_SERVICE_TOKEN), skipping");
} else if (await portInUse(waPort)) {
  console.log(`✓ WhatsApp service already running on ${waPort}`);
} else {
  if (!fs.existsSync("whatsapp-service/node_modules")) {
    console.log("▶ installing the WhatsApp service (first run only)");
    spawnSync("npm", ["--prefix", "whatsapp-service", "install"], { stdio: "inherit", shell: process.platform === "win32" });
  }
  start("WhatsApp service", "npm", ["run", "whatsapp"]);
}

start("shop", "npx", ["next", "dev"]);

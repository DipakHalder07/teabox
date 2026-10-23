// TeaPay WhatsApp service: stays logged in to the shop's WhatsApp as a linked device (scan a QR
// once) and sends checkout verification codes. It needs to run all the time, so it lives outside
// Vercel (your computer, Railway, a VPS…). The shop talks to it with a secret token.
//
// Env: WHATSAPP_SERVICE_TOKEN (required), WHATSAPP_SERVICE_PORT (default 7071),
//      WHATSAPP_AUTH_DIR (default ./auth: keep it on a persistent disk),
//      WHATSAPP_SESSION_DB_URL (optional Postgres URL: keeps the login in the shop's database
//      instead, for free hosts whose disk is wiped on restart, e.g. Render),
//      KEEP_AWAKE_URL (optional; Render's RENDER_EXTERNAL_URL is used automatically).

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import pino from "pino";
import QRCode from "qrcode";
import * as baileys from "@whiskeysockets/baileys";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
for (const file of [path.join(here, ".env"), path.join(here, "..", ".env")]) {
  if (fs.existsSync(file)) {
    process.loadEnvFile(file);
    break;
  }
}

const TOKEN = process.env.WHATSAPP_SERVICE_TOKEN || "";
const PORT = Number(process.env.WHATSAPP_SERVICE_PORT || process.env.PORT || 7071);
const AUTH_DIR = path.resolve(here, process.env.WHATSAPP_AUTH_DIR || "auth");
const SESSION_DB_URL = process.env.WHATSAPP_SESSION_DB_URL || "";
const KEEP_AWAKE_URL = process.env.KEEP_AWAKE_URL || process.env.RENDER_EXTERNAL_URL || "";
if (TOKEN.length < 16) {
  console.error("Set WHATSAPP_SERVICE_TOKEN (at least 16 characters) before starting.");
  process.exit(1);
}

const makeWASocket = baileys.default?.default ?? baileys.default ?? baileys.makeWASocket;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers, BufferJSON, initAuthCreds, proto } =
  baileys.default?.useMultiFileAuthState ? baileys.default : baileys;
const logger = pino({ level: process.env.WHATSAPP_LOG_LEVEL || "warn" });

// ---- Where the WhatsApp login is kept ------------------------------------------------

// Same layout as useMultiFileAuthState, one row per file, in the "whatsapp_auth" table
// (declared in the shop's prisma/schema.prisma so `prisma db push` keeps it).
const pool = SESSION_DB_URL ? new pg.Pool({ connectionString: SESSION_DB_URL, max: 3 }) : null;

async function usePostgresAuthState() {
  await pool.query("CREATE TABLE IF NOT EXISTS whatsapp_auth (id TEXT PRIMARY KEY, data TEXT NOT NULL)");
  const read = async (id) => {
    const { rows } = await pool.query("SELECT data FROM whatsapp_auth WHERE id = $1", [id]);
    return rows[0] ? JSON.parse(rows[0].data, BufferJSON.reviver) : null;
  };
  const write = (id, value) =>
    pool.query(
      "INSERT INTO whatsapp_auth (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data",
      [id, JSON.stringify(value, BufferJSON.replacer)]
    );
  const remove = (id) => pool.query("DELETE FROM whatsapp_auth WHERE id = $1", [id]);

  const creds = (await read("creds")) || initAuthCreds();
  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await read(`${type}-${id}`);
              if (type === "app-state-sync-key" && value) value = proto.Message.AppStateSyncKeyData.fromObject(value);
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              tasks.push(value ? write(`${category}-${id}`, value) : remove(`${category}-${id}`));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => write("creds", creds),
  };
}

function loadAuthState() {
  return pool ? usePostgresAuthState() : useMultiFileAuthState(AUTH_DIR);
}

async function clearSession() {
  if (pool) await pool.query("DELETE FROM whatsapp_auth");
  else fs.rmSync(AUTH_DIR, { recursive: true, force: true });
}

// ---- WhatsApp connection -------------------------------------------------------------

const state = { status: "starting", qr: null, phone: null, since: Date.now() };
let sock = null;
let restartTimer = null;

function setState(patch) {
  Object.assign(state, patch, { since: Date.now() });
}

async function connect() {
  clearTimeout(restartTimer);
  const { state: auth, saveCreds } = await loadAuthState();
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));

  sock = makeWASocket({
    version,
    auth,
    logger,
    printQRInTerminal: false,
    browser: Browsers.macOS("Teabox"),
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });
  const current = sock;
  current.ev.on("creds.update", saveCreds);
  current.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (current !== sock) return; // an older socket we already replaced
    if (qr) setState({ status: "qr", qr });
    if (connection === "open") {
      const phone = (current.user?.id || "").split(":")[0].split("@")[0] || null;
      setState({ status: "connected", qr: null, phone });
      console.log(`WhatsApp connected as +${phone}`);
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log("WhatsApp logged out; showing a new QR.");
      }
      setState({ status: "connecting", qr: null });
      const reconnect = async () => {
        if (code === DisconnectReason.loggedOut) await clearSession();
        await connect();
      };
      restartTimer = setTimeout(() => reconnect().catch(onFatal), code === DisconnectReason.loggedOut ? 500 : 3000);
    }
  });
}

function onFatal(err) {
  console.error("WhatsApp connection error:", err?.message || err);
  setState({ status: "connecting", qr: null });
  restartTimer = setTimeout(() => connect().catch(onFatal), 5000);
}

async function waitFor(check, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (check()) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return check();
}

function digits(phone) {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.length === 10) d = `91${d}`;
  return d;
}

// Protect the number: WhatsApp restricts accounts that send too much too fast.
const sendLog = [];
function underSendLimit() {
  const now = Date.now();
  while (sendLog.length && now - sendLog[0] > 24 * 60 * 60 * 1000) sendLog.shift();
  const lastMinute = sendLog.filter((t) => now - t < 60 * 1000).length;
  return lastMinute < 20 && sendLog.length < 500;
}

// ---- HTTP API ----------------------------------------------------------------------

function json(res, code, body) {
  res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

function authorized(req) {
  const given = Buffer.from((req.headers.authorization || "").replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(TOKEN);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 10_000) break;
  }
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

async function statusBody() {
  return {
    status: state.status,
    connected: state.status === "connected",
    phone: state.phone,
    qrDataUrl: state.status === "qr" && state.qr ? await QRCode.toDataURL(state.qr, { margin: 2, scale: 6 }) : null,
    since: new Date(state.since).toISOString(),
  };
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  try {
    if (pathname === "/health") return json(res, 200, { ok: true });
    if (!authorized(req)) return json(res, 401, { error: "Unauthorized" });

    if (req.method === "GET" && pathname === "/status") return json(res, 200, await statusBody());

    // Fresh login QR (e.g. the old one expired)
    if (req.method === "POST" && pathname === "/qr") {
      if (state.status === "connected") return json(res, 409, { error: "Already connected" });
      setState({ status: "connecting", qr: null });
      sock?.end(undefined);
      await connect();
      await waitFor(() => state.status === "qr" || state.status === "connected", 10000);
      return json(res, 200, await statusBody());
    }

    // Link with phone number instead of scanning
    if (req.method === "POST" && pathname === "/pairing-code") {
      if (state.status === "connected") return json(res, 409, { error: "Already connected" });
      const phone = digits((await readJson(req)).phone);
      if (!/^\d{11,15}$/.test(phone)) return json(res, 400, { error: "Enter the WhatsApp number with country code" });
      await waitFor(() => state.status === "qr", 10000);
      const code = await sock.requestPairingCode(phone);
      return json(res, 200, { code: code?.match(/.{1,4}/g)?.join("-") || code });
    }

    if (req.method === "POST" && pathname === "/send") {
      if (state.status !== "connected") return json(res, 503, { error: "WhatsApp is not connected" });
      const { to, text } = await readJson(req);
      const phone = digits(to);
      if (!/^\d{11,15}$/.test(phone) || !text || String(text).length > 1000) {
        return json(res, 400, { error: "Invalid number or message" });
      }
      if (!underSendLimit()) return json(res, 429, { error: "Sending limit reached, try again shortly" });
      const [exists] = await sock.onWhatsApp(`${phone}@s.whatsapp.net`);
      if (!exists?.exists) return json(res, 422, { error: "This number is not on WhatsApp" });
      await sock.sendMessage(exists.jid, { text: String(text) });
      sendLog.push(Date.now());
      return json(res, 200, { sent: true });
    }

    if (req.method === "POST" && pathname === "/logout") {
      await sock?.logout().catch(() => {});
      await clearSession();
      setState({ status: "connecting", qr: null, phone: null });
      await connect();
      return json(res, 200, { loggedOut: true });
    }

    json(res, 404, { error: "Not found" });
  } catch (err) {
    console.error(`${req.method} ${pathname} failed:`, err?.message || err);
    json(res, 500, { error: err?.message || "WhatsApp service error" });
  }
});

server.listen(PORT, () =>
  console.log(`TeaPay WhatsApp service on port ${PORT} (session in ${pool ? "the database" : AUTH_DIR})`)
);
connect().catch(onFatal);

// Free hosts (Render) put a service to sleep after 15 minutes without visitors, which logs
// WhatsApp out. Calling our own public /health every 10 minutes keeps it awake.
if (KEEP_AWAKE_URL) {
  const url = `${KEEP_AWAKE_URL.replace(/\/+$/, "")}/health`;
  setInterval(() => fetch(url).catch(() => {}), 10 * 60 * 1000).unref();
  console.log(`Keeping awake via ${url}`);
}

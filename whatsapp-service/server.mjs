// TeaPay WhatsApp service: stays logged in to the shop's WhatsApp as a linked device (scan a QR
// once) and sends checkout verification codes. It needs to run all the time, so it lives outside
// Vercel (your computer, Railway, a VPS…). The shop talks to it with a secret token.
//
// Env: WHATSAPP_SERVICE_TOKEN (required), WHATSAPP_SERVICE_PORT (default 7071),
//      WHATSAPP_AUTH_DIR (default ./auth: keep it on a persistent disk).

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import pino from "pino";
import QRCode from "qrcode";
import * as baileys from "@whiskeysockets/baileys";

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
if (TOKEN.length < 16) {
  console.error("Set WHATSAPP_SERVICE_TOKEN (at least 16 characters) before starting.");
  process.exit(1);
}

const makeWASocket = baileys.default?.default ?? baileys.default ?? baileys.makeWASocket;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = baileys.default?.useMultiFileAuthState
  ? baileys.default
  : baileys;
const logger = pino({ level: process.env.WHATSAPP_LOG_LEVEL || "warn" });

// ---- WhatsApp connection -------------------------------------------------------------

const state = { status: "starting", qr: null, phone: null, since: Date.now() };
let sock = null;
let restartTimer = null;

function setState(patch) {
  Object.assign(state, patch, { since: Date.now() });
}

async function connect() {
  clearTimeout(restartTimer);
  const { state: auth, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
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
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      }
      setState({ status: "connecting", qr: null });
      restartTimer = setTimeout(() => connect().catch(onFatal), code === DisconnectReason.loggedOut ? 500 : 3000);
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
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
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

server.listen(PORT, () => console.log(`TeaPay WhatsApp service on port ${PORT} (session in ${AUTH_DIR})`));
connect().catch(onFatal);

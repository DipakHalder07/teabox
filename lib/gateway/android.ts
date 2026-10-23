import QRCode from "qrcode";
import { ObserverDevice } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUpiConfig, PAYMENT_APP_PACKAGES } from "./config";
import { hmacHex, randomToken, safeEqualHex, sha256Hex } from "./crypto";
import { isBankSmsSender, parseCredit } from "./parse";
import { recordCredit } from "./payments";
import { getToggles } from "./toggles";

// Text sent by the app's "Dispatch Test Bank Credit SMS" button: proves the phone is connected,
// but it is not real money.
const APP_TEST_SMS = /999888777666/;

// Speaks the protocol of the existing Android observer app (youpi-sms-gateway.apk), so the
// same app reports bank SMS and UPI notifications straight to the shop.

const PAIRING_TTL_MS = 10 * 60 * 1000;
const MAX_CLOCK_DRIFT_MS = 24 * 60 * 60 * 1000; // SMS can be queued on the phone; replays are deduplicated

export async function createPairingQr(publicBaseUrl: string) {
  const token = randomToken();
  const expiresAt = Date.now() + PAIRING_TTL_MS;
  await prisma.pairingToken.create({ data: { tokenHash: sha256Hex(token), expiresAt: new Date(expiresAt) } });

  const payload = JSON.stringify({
    version: "v1",
    type: "YOUPI_SMS_GATEWAY_PAIR", // the app only accepts this type
    serverUrl: publicBaseUrl,
    gatewayUrl: publicBaseUrl,
    apiBaseUrl: publicBaseUrl,
    enrollmentToken: token,
    token,
    merchantId: "teabox",
    expiresAt,
  });
  const qrDataUrl = await QRCode.toDataURL(payload, { errorCorrectionLevel: "M", margin: 2, scale: 6 });
  // The token is also shown as text for the app's manual pairing (if the camera cannot scan).
  return { qrDataUrl, expiresAt: new Date(expiresAt).toISOString(), serverUrl: publicBaseUrl, enrollmentToken: token };
}

/** One-time token from the QR → a device with its own signing key. */
export async function pairDevice(input: { enrollmentToken?: string; deviceName?: string; deviceModel?: string }) {
  const token = String(input.enrollmentToken || "");
  if (!token) return null;

  const claimed = await prisma.pairingToken.updateMany({
    where: { tokenHash: sha256Hex(token), usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (claimed.count !== 1) return null;

  const signingKey = randomToken();
  const device = await prisma.observerDevice.create({
    data: {
      name: String(input.deviceName || "Android phone").slice(0, 80),
      model: input.deviceModel ? String(input.deviceModel).slice(0, 80) : null,
      signingKey,
      lastHeartbeatAt: new Date(),
    },
  });
  return { deviceId: device.id, signingKey };
}

/** Checks X-Device-Id / X-Timestamp / X-Signature = hex HMAC-SHA256(signingKey, body + ":" + timestamp). */
export async function authenticateDevice(headers: Headers, rawBody: string): Promise<ObserverDevice | null> {
  const deviceId = headers.get("x-device-id") || "";
  const timestamp = headers.get("x-timestamp") || "";
  const signature = headers.get("x-signature") || "";
  if (!deviceId || !timestamp || !signature) return null;
  if (!Number.isFinite(Number(timestamp)) || Math.abs(Date.now() - Number(timestamp)) > MAX_CLOCK_DRIFT_MS) return null;

  const device = await prisma.observerDevice.findUnique({ where: { id: deviceId } });
  if (!device || !device.isActive) return null;
  if (!safeEqualHex(signature, hmacHex(device.signingKey, `${rawBody}:${timestamp}`))) return null;
  return device;
}

export async function recordHeartbeat(deviceId: string, batteryPercent: unknown) {
  const res = await prisma.observerDevice.updateMany({
    where: { id: deviceId, isActive: true },
    data: {
      lastHeartbeatAt: new Date(),
      batteryPercent: typeof batteryPercent === "number" ? Math.round(batteryPercent) : undefined,
    },
  });
  return res.count === 1;
}

async function touchDevice(deviceId: string) {
  await prisma.observerDevice.update({
    where: { id: deviceId },
    data: { lastEventAt: new Date(), lastHeartbeatAt: new Date() },
  });
}

/** A bank SMS forwarded by the phone. Only registered bank sender IDs count. */
export async function handleSms(device: ObserverDevice, body: { sender?: string; body?: string; timestamp?: number }, rawBody: string) {
  await touchDevice(device.id);
  const sender = String(body.sender || "");
  const text = String(body.body || "");
  if (APP_TEST_SMS.test(text)) {
    await prisma.observerDevice.update({ where: { id: device.id }, data: { lastTestAt: new Date() } });
    return { accepted: true, test: true };
  }
  if (!(await getToggles()).sms) return { accepted: false, reason: "SMS verification is switched off" };
  if (!isBankSmsSender(sender)) return { accepted: false, reason: "not a bank sender" };

  const parsed = parseCredit(text, getUpiConfig().upiId);
  if (!parsed) return { accepted: false, reason: "not a credit" };

  const result = await recordCredit({
    source: "ANDROID_SMS",
    ...parsed,
    sender,
    rawText: text,
    observedAt: new Date(Number(body.timestamp) || Date.now()),
    deviceId: device.id,
    sourceKey: `sms:${sha256Hex(`${device.id}:${rawBody}`)}`,
  });
  return { accepted: true, ...result };
}

/** A payment-app notification (Google Pay, PhonePe, Paytm, bank apps…). */
export async function handleNotification(
  device: ObserverDevice,
  body: { observedAt?: number; rawNotification?: { title?: string; text?: string; package?: string } },
  rawBody: string
) {
  await touchDevice(device.id);
  if (!(await getToggles()).sms) return { accepted: false, reason: "SMS verification is switched off" };
  const raw = body.rawNotification || {};
  const pkg = String(raw.package || "");
  if (!PAYMENT_APP_PACKAGES.has(pkg)) return { accepted: false, reason: "not a payment app" };

  const text = `${raw.title || ""} ${raw.text || ""}`.trim();
  const parsed = parseCredit(text, getUpiConfig().upiId);
  if (!parsed) return { accepted: false, reason: "not a credit" };

  const result = await recordCredit({
    source: "ANDROID_NOTIFICATION",
    ...parsed,
    sender: pkg || null,
    rawText: text,
    observedAt: new Date(Number(body.observedAt) || Date.now()),
    deviceId: device.id,
    sourceKey: `notif:${sha256Hex(`${device.id}:${rawBody}`)}`,
  });
  return { accepted: true, ...result };
}

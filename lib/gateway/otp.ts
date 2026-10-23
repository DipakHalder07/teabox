import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { isWhatsAppConfigured } from "./config";
import { keyedHash, safeEqualHex } from "./crypto";
import { sendWhatsAppCode } from "./whatsapp";
import { GatewayError } from "./payments";

const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_PER_PHONE_PER_HOUR = 5;
const MAX_PER_IP_PER_HOUR = 20;
const MAX_ATTEMPTS = 5;

function codeHash(phone: string, code: string) {
  return keyedHash("otp", `${phone}:${code}`);
}

/** Sends a 6-digit WhatsApp code. Rate-limited per number and per IP. */
export async function sendCode(phone: string, ip: string | null): Promise<{ devCode?: string }> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.otpChallenge.findMany({
    where: { phone, createdAt: { gte: hourAgo } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (recent[0] && Date.now() - recent[0].createdAt.getTime() < RESEND_COOLDOWN_MS) {
    throw new GatewayError("Please wait 30 seconds before requesting another code.", 429);
  }
  if (recent.length >= MAX_PER_PHONE_PER_HOUR) {
    throw new GatewayError("Too many codes requested for this number. Try again later.", 429);
  }
  if (ip && (await prisma.otpChallenge.count({ where: { ip, createdAt: { gte: hourAgo } } })) >= MAX_PER_IP_PER_HOUR) {
    throw new GatewayError("Too many codes requested. Try again later.", 429);
  }

  const code = String(crypto.randomInt(100000, 1000000));
  await prisma.otpChallenge.create({
    data: { phone, codeHash: codeHash(phone, code), expiresAt: new Date(Date.now() + CODE_TTL_MS), ip },
  });

  if (isWhatsAppConfigured()) {
    const sent = await sendWhatsAppCode(phone, code);
    if (!sent.ok) throw new GatewayError(sent.error || "Could not send the WhatsApp code", 502);
    return {};
  }
  // Development without WhatsApp: show the code on screen instead.
  if (process.env.NODE_ENV !== "production") return { devCode: code };
  throw new GatewayError("WhatsApp verification is not available", 503);
}

/** Checks the latest code for this number. Each code allows 5 tries. */
export async function verifyCode(phone: string, code: string) {
  const challenge = await prisma.otpChallenge.findFirst({
    where: { phone, verifiedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) throw new GatewayError("The code has expired. Please request a new one.", 400);
  if (challenge.attempts >= MAX_ATTEMPTS) {
    throw new GatewayError("Too many wrong tries. Please request a new code.", 429);
  }

  if (!safeEqualHex(challenge.codeHash, codeHash(phone, code))) {
    await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
    throw new GatewayError("That code is not correct.", 400);
  }
  await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { verifiedAt: new Date() } });
}

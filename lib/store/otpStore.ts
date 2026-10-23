/**
 * Server-Side OTP Store & Validation Engine for Teabox customer email sign-in.
 * Generates 4-digit one-time passwords (10 min expiry, 30s resend cooldown, max 5 tries).
 *
 * Codes live in the database (otp_challenges, keyed "email:<address>") so they work on Vercel,
 * where the send and verify requests can reach different server instances. Memory is used only
 * while the database is unreachable.
 */
import crypto from "crypto";
import { prisma, isDatabaseConnected } from "@/lib/prisma";
import { keyedHash, safeEqualHex } from "@/lib/gateway/crypto";

export interface OtpRecord {
  codeHash: string;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
}

const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds cooldown between resends
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes expiry
const MAX_VERIFY_ATTEMPTS = 5; // Lockout after 5 incorrect attempts
const MAX_PER_EMAIL_PER_HOUR = 5;
const MAX_PER_IP_PER_HOUR = 20;

// Retain in memory across Next.js dev server reloads
const globalForOtp = globalThis as unknown as {
  otpStore?: Map<string, OtpRecord>;
};

export const otpStore = (globalForOtp.otpStore ??= new Map<string, OtpRecord>());

const keyFor = (email: string) => `email:${email.trim().toLowerCase()}`;
const hashCode = (key: string, code: string) => keyedHash("email-otp", `${key}:${code}`);

type GenerateResult = { success: boolean; code?: string; error?: string; remainingCooldown?: number };

function cooldownError(lastSentAt: number): GenerateResult {
  const remainingCooldown = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - lastSentAt)) / 1000);
  return {
    success: false,
    error: `Please wait ${remainingCooldown}s before requesting a new code.`,
    remainingCooldown,
  };
}

/**
 * Generate a new 4-digit OTP for an email address.
 * Enforces a 30s resend cooldown and hourly limits per email and per IP.
 */
export async function generateOtp(email: string, ip: string | null = null): Promise<GenerateResult> {
  const key = keyFor(email);
  const now = Date.now();
  const code = String(crypto.randomInt(1000, 10000));

  if (await isDatabaseConnected()) {
    const hourAgo = new Date(now - 60 * 60 * 1000);
    const recent = await prisma.otpChallenge.findMany({
      where: { phone: key, createdAt: { gte: hourAgo } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (recent[0] && now - recent[0].createdAt.getTime() < RESEND_COOLDOWN_MS) {
      return cooldownError(recent[0].createdAt.getTime());
    }
    if (recent.length >= MAX_PER_EMAIL_PER_HOUR) {
      return { success: false, error: "Too many codes requested for this email. Try again later.", remainingCooldown: 60 };
    }
    if (ip) {
      const fromIp = await prisma.otpChallenge.count({
        where: { ip, phone: { startsWith: "email:" }, createdAt: { gte: hourAgo } },
      });
      if (fromIp >= MAX_PER_IP_PER_HOUR) {
        return { success: false, error: "Too many codes requested. Try again later.", remainingCooldown: 60 };
      }
    }

    await prisma.otpChallenge.create({
      data: { phone: key, codeHash: hashCode(key, code), expiresAt: new Date(now + OTP_EXPIRY_MS), ip },
    });
    return { success: true, code };
  }

  const existing = otpStore.get(key);
  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) return cooldownError(existing.lastSentAt);
  otpStore.set(key, { codeHash: hashCode(key, code), expiresAt: now + OTP_EXPIRY_MS, lastSentAt: now, attempts: 0 });
  return { success: true, code };
}

function wrongCodeError(attempts: number) {
  const attemptsLeft = MAX_VERIFY_ATTEMPTS - attempts;
  return {
    success: false,
    error:
      attemptsLeft > 0
        ? `Incorrect verification code. ${attemptsLeft} attempt${attemptsLeft > 1 ? "s" : ""} remaining.`
        : "Too many failed attempts. Please request a new verification code.",
  };
}

/**
 * Verify a 4-digit OTP for an email address.
 * A used code cannot be used again.
 */
export async function verifyOtp(email: string, inputCode: string): Promise<{ success: boolean; error?: string }> {
  const key = keyFor(email);
  const hash = hashCode(key, inputCode.trim());
  const expired = {
    success: false,
    error: "Verification code has expired or was not requested. Please request a new code.",
  };

  if (await isDatabaseConnected()) {
    const challenge = await prisma.otpChallenge.findFirst({
      where: { phone: key, verifiedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!challenge) return expired;
    if (challenge.attempts >= MAX_VERIFY_ATTEMPTS) {
      return {
        success: false,
        error: "Too many failed attempts. For your security, please request a new verification code.",
      };
    }
    if (!safeEqualHex(challenge.codeHash, hash)) {
      await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
      return wrongCodeError(challenge.attempts + 1);
    }
    await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { verifiedAt: new Date() } });
    return { success: true };
  }

  const record = otpStore.get(key);
  if (!record || Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return expired;
  }
  record.attempts += 1;
  if (record.attempts > MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(key);
    return {
      success: false,
      error: "Too many failed attempts. For your security, please request a new verification code.",
    };
  }
  if (!safeEqualHex(record.codeHash, hash)) return wrongCodeError(record.attempts);

  // Valid: Clear record to prevent replay
  otpStore.delete(key);
  return { success: true };
}

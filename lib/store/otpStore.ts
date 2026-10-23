/**
 * Server-Side OTP Store & Validation Engine for Teabox
 * Generates secure 4-digit one-time passwords, handles TTL expiry (10 mins),
 * enforces resend cooldowns (30s), and limits failed verification attempts (max 5).
 */

export interface OtpRecord {
  code: string;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
}

const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds cooldown between resends
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes expiry
const MAX_VERIFY_ATTEMPTS = 5; // Lockout after 5 incorrect attempts

// Retain in memory across Next.js dev server reloads
const globalForOtp = globalThis as unknown as {
  otpStore?: Map<string, OtpRecord>;
};

export const otpStore = globalForOtp.otpStore || new Map<string, OtpRecord>();

if (process.env.NODE_ENV !== "production") {
  globalForOtp.otpStore = otpStore;
}

/**
 * Generate a new 4-digit OTP for an email address.
 * Enforces a 30s resend cooldown.
 */
export function generateOtp(email: string): {
  success: boolean;
  code?: string;
  error?: string;
  remainingCooldown?: number;
} {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = otpStore.get(normalizedEmail);
  const now = Date.now();

  // Check resend cooldown
  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const remainingCooldown = Math.ceil(
      (RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000
    );
    return {
      success: false,
      error: `Please wait ${remainingCooldown}s before requesting a new code.`,
      remainingCooldown,
    };
  }

  // Generate a random 4-digit code (1000 - 9999)
  const code = Math.floor(1000 + Math.random() * 9000).toString();

  otpStore.set(normalizedEmail, {
    code,
    expiresAt: now + OTP_EXPIRY_MS,
    lastSentAt: now,
    attempts: 0,
  });

  return { success: true, code };
}

/**
 * Verify a 4-digit OTP for an email address.
 * Clears OTP on success to prevent replay attacks.
 */
export function verifyOtp(
  email: string,
  inputCode: string
): { success: boolean; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedCode = inputCode.trim();
  const record = otpStore.get(normalizedEmail);
  const now = Date.now();

  // Fallback demo code allowed in development if no record exists yet
  if (!record) {
    if (process.env.NODE_ENV !== "production" && trimmedCode === "1234") {
      return { success: true };
    }
    return {
      success: false,
      error: "Verification code has expired or was not requested. Please request a new code.",
    };
  }

  // Check if expired
  if (now > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return {
      success: false,
      error: "Verification code has expired. Please request a new code.",
    };
  }

  // Increment attempts counter
  record.attempts += 1;

  if (record.attempts > MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(normalizedEmail);
    return {
      success: false,
      error: "Too many failed attempts. For your security, please request a new verification code.",
    };
  }

  // Match check (or dev 1234 fallback)
  const isMatch =
    record.code === trimmedCode ||
    (process.env.NODE_ENV !== "production" && trimmedCode === "1234");

  if (!isMatch) {
    const attemptsLeft = MAX_VERIFY_ATTEMPTS - record.attempts;
    return {
      success: false,
      error:
        attemptsLeft > 0
          ? `Incorrect verification code. ${attemptsLeft} attempt${attemptsLeft > 1 ? "s" : ""} remaining.`
          : "Too many failed attempts. Please request a new verification code.",
    };
  }

  // Valid: Clear record to prevent replay
  otpStore.delete(normalizedEmail);
  return { success: true };
}

/**
 * Get remaining cooldown seconds for an email (if any)
 */
export function getRemainingCooldown(email: string): number {
  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);
  if (!record) return 0;

  const diff = Date.now() - record.lastSentAt;
  if (diff < RESEND_COOLDOWN_MS) {
    return Math.ceil((RESEND_COOLDOWN_MS - diff) / 1000);
  }
  return 0;
}

import crypto from "crypto";

// All gateway secrets derive from ADMIN_JWT_SECRET, so there is one key to manage.
// Rotating it signs everyone out and requires reconnecting Gmail.
function masterSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_JWT_SECRET must be set in production");
  }
  return "dev-only-insecure-admin-jwt-secret";
}

function deriveKey(purpose: string): Buffer {
  return Buffer.from(crypto.hkdfSync("sha256", masterSecret(), "teapay", purpose, 32));
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function hmacHex(key: string | Buffer, value: string) {
  return crypto.createHmac("sha256", key).update(value).digest("hex");
}

export function keyedHash(purpose: string, value: string) {
  return hmacHex(deriveKey(purpose), value);
}

export function safeEqualHex(a: string, b: string) {
  const left = Buffer.from(String(a || "").toLowerCase());
  const right = Buffer.from(String(b || "").toLowerCase());
  return left.length === right.length && left.length > 0 && crypto.timingSafeEqual(left, right);
}

/** AES-256-GCM for secrets stored in the database (e.g. the Gmail refresh token). */
export function encryptSecret(plain: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveKey("db-secret"), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function decryptSecret(sealed: string) {
  const [iv, tag, data] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", deriveKey("db-secret"), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/** "<value>.<expiryMs>.<sig>": a tamper-proof value for cookies. */
export function signValue(purpose: string, value: string, ttlMs: number) {
  const expires = Date.now() + ttlMs;
  const payload = `${value}.${expires}`;
  return `${payload}.${keyedHash(purpose, payload)}`;
}

export function readSignedValue(purpose: string, signed: string | undefined): string | null {
  if (!signed) return null;
  const parts = signed.split(".");
  if (parts.length !== 3) return null;
  const [value, expires, sig] = parts;
  if (!safeEqualHex(sig, keyedHash(purpose, `${value}.${expires}`))) return null;
  if (Number(expires) < Date.now()) return null;
  return value;
}

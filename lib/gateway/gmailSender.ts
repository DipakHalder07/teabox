import nodemailer from "nodemailer";
import { getGoogleConfig, isGmailConfigured } from "./config";
import { decryptSecret, encryptSecret } from "./crypto";
import { tokenRequest } from "./gmail";
import { deleteSettings, getSetting, setSetting } from "./settings";

// Sends shop emails (login codes, order emails) from the admin's Gmail through the Gmail API.
// The admin signs in with Google once; no Gmail password or App Password is stored anywhere.
// Uses the send-only scope: this connection cannot read the inbox.

const SCOPE = "openid email https://www.googleapis.com/auth/gmail.send";
const KEYS = {
  refreshToken: "gmailSend.refreshToken",
  email: "gmailSend.email",
  lastError: "gmailSend.lastError",
};

// Access tokens last ~1 hour; reuse one per server instance instead of refreshing on every email.
let cachedToken: { value: string; expiresAt: number; sealed: string } | null = null;

export function gmailSenderAuthUrl(redirectUri: string, state: string) {
  const c = getGoogleConfig();
  const params = new URLSearchParams({
    client_id: c.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${c.authBase}/o/oauth2/v2/auth?${params}`;
}

/** The id_token comes straight from Google's token endpoint over TLS, so its payload is trusted as-is. */
function emailFromIdToken(idToken: string | undefined) {
  const payload = idToken?.split(".")[1];
  if (!payload) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof claims.email === "string" ? claims.email : null;
  } catch {
    return null;
  }
}

/** OAuth callback: stores the encrypted refresh token for sending. */
export async function connectGmailSender(code: string, redirectUri: string) {
  const tokens = await tokenRequest({ code, redirect_uri: redirectUri, grant_type: "authorization_code" });
  if (!tokens.refresh_token) throw new Error("Google did not return a refresh token. Remove the app's access in your Google account and try again.");
  const email = emailFromIdToken(tokens.id_token);
  if (!email) throw new Error("Google did not share the account's email address. Please try again.");

  await setSetting(KEYS.refreshToken, encryptSecret(tokens.refresh_token));
  await setSetting(KEYS.email, email);
  await deleteSettings([KEYS.lastError]);
  cachedToken = null;
  return email;
}

export async function disconnectGmailSender() {
  await deleteSettings(Object.values(KEYS));
  cachedToken = null;
}

export async function getGmailSenderStatus() {
  const [email, lastError, token] = await Promise.all([
    getSetting(KEYS.email),
    getSetting(KEYS.lastError),
    getSetting(KEYS.refreshToken),
  ]);
  return { configured: isGmailConfigured(), connected: Boolean(token), email, lastError };
}

async function accessToken(sealed: string) {
  if (cachedToken && cachedToken.sealed === sealed && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }
  const t = await tokenRequest({ refresh_token: decryptSecret(sealed), grant_type: "refresh_token" });
  cachedToken = { value: t.access_token, expiresAt: Date.now() + (t.expires_in || 3600) * 1000, sealed };
  return t.access_token;
}

/**
 * Sends one email via the Gmail API. Returns null when no Gmail is connected, so the caller can
 * fall back to another provider.
 */
export async function sendViaGmailApi(mail: { to: string; subject: string; html: string; text?: string; fromName: string }) {
  if (!isGmailConfigured()) return null;
  const [sealed, email, lastError] = await Promise.all([
    getSetting(KEYS.refreshToken),
    getSetting(KEYS.email),
    getSetting(KEYS.lastError),
  ]);
  if (!sealed || !email) return null;

  try {
    // Nodemailer only builds the MIME message here; the Gmail API does the sending.
    const composed = await nodemailer
      .createTransport({ streamTransport: true, buffer: true })
      .sendMail({ from: { name: mail.fromName, address: email }, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text });

    const res = await fetch(`${getGoogleConfig().gmailBase}/gmail/v1/users/me/messages/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await accessToken(sealed)}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: Buffer.from(composed.message as Buffer).toString("base64url") }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || `Gmail API error ${res.status}`);
    if (lastError) await deleteSettings([KEYS.lastError]);
    return { id: String(data.id), from: email };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    cachedToken = null;
    await setSetting(KEYS.lastError, message).catch(() => {});
    throw new Error(message);
  }
}

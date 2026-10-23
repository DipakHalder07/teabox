import { getBankEmailDomains, getGoogleConfig, getUpiConfig, isGmailConfigured } from "./config";
import { decryptSecret, encryptSecret } from "./crypto";
import { parseCredit } from "./parse";
import { recordCredit } from "./payments";
import { claimInterval, deleteSettings, getSetting, setSetting } from "./settings";
import { getToggles } from "./toggles";

// Reads bank credit-alert emails with the Gmail API (read-only). Vercel-friendly: there is no
// always-on poller. A check runs when a customer is waiting (throttled), from the cron job,
// or when the admin presses "Check now".

const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const KEYS = {
  refreshToken: "gmail.refreshToken",
  email: "gmail.email",
  lastPollAt: "gmail.lastPollAt",
  lastError: "gmail.lastError",
  watermark: "gmail.watermarkMs",
  throttle: "gmail.pollThrottle",
};

export function gmailAuthUrl(redirectUri: string, state: string) {
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

async function tokenRequest(params: Record<string, string>) {
  const c = getGoogleConfig();
  const res = await fetch(c.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: c.clientId, client_secret: c.clientSecret, ...params }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error_description || data?.error || `Google token error ${res.status}`);
  return data as { access_token: string; refresh_token?: string };
}

async function gmailGet<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${getGoogleConfig().gmailBase}/gmail/v1/users/me${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Gmail API error ${res.status}`);
  return data as T;
}

/** OAuth callback: stores the encrypted refresh token and starts reading from now on. */
export async function connectGmail(code: string, redirectUri: string) {
  const tokens = await tokenRequest({ code, redirect_uri: redirectUri, grant_type: "authorization_code" });
  if (!tokens.refresh_token) throw new Error("Google did not return a refresh token. Remove the app's access in your Google account and try again.");
  const profile = await gmailGet<{ emailAddress: string }>("/profile", tokens.access_token);

  await setSetting(KEYS.refreshToken, encryptSecret(tokens.refresh_token));
  await setSetting(KEYS.email, profile.emailAddress);
  await setSetting(KEYS.watermark, String(Date.now() - 10 * 60 * 1000));
  await deleteSettings([KEYS.lastError]);
  return profile.emailAddress;
}

export async function disconnectGmail() {
  await deleteSettings(Object.values(KEYS));
}

export async function getGmailStatus() {
  const [email, lastPollAt, lastError, token] = await Promise.all([
    getSetting(KEYS.email),
    getSetting(KEYS.lastPollAt),
    getSetting(KEYS.lastError),
    getSetting(KEYS.refreshToken),
  ]);
  return {
    configured: isGmailConfigured(),
    connected: Boolean(token),
    email,
    lastPollAt: lastPollAt ? new Date(Number(lastPollAt)).toISOString() : null,
    lastError,
  };
}

interface GmailPart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
}

interface GmailMessage {
  id: string;
  internalDate: string;
  snippet?: string;
  payload?: GmailPart & { headers?: Array<{ name: string; value: string }> };
}

function messageText(part: GmailPart | undefined): string {
  if (!part) return "";
  if (part.mimeType === "text/plain" && part.body?.data) {
    return Buffer.from(part.body.data, "base64url").toString("utf8");
  }
  if (part.parts?.length) {
    const plain = part.parts.map(messageText).find((t) => t.trim());
    if (plain) return plain;
  }
  if (part.mimeType === "text/html" && part.body?.data) {
    return Buffer.from(part.body.data, "base64url")
      .toString("utf8")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&#8377;|&#x20b9;/gi, "₹");
  }
  return "";
}

function domainMatches(domain: string, allowed: string[]) {
  const d = domain.toLowerCase();
  return allowed.some((a) => d === a || d.endsWith(`.${a}`));
}

/**
 * Only emails from a bank domain that pass DKIM count, so a forged "credited" email from
 * anyone else is ignored.
 */
export function isTrustedBankEmail(headers: Array<{ name: string; value: string }>) {
  const get = (name: string) => headers.filter((h) => h.name.toLowerCase() === name).map((h) => h.value);
  const from = get("from")[0] || "";
  const fromDomain = (from.match(/@([a-z0-9.-]+)/i)?.[1] || "").toLowerCase();
  const allowed = getBankEmailDomains();
  if (!fromDomain || !domainMatches(fromDomain, allowed)) return false;

  return get("authentication-results").some((value) =>
    [...value.matchAll(/dkim=pass[^;]*?header\.(?:d|i)=@?([a-z0-9.-]+)/gi)].some((m) => domainMatches(m[1], allowed))
  );
}

/**
 * Reads new bank alert emails and records credits. Throttled to one run per `minIntervalMs`
 * across all server instances unless `force` is set.
 */
export async function pollGmail({ force = false, minIntervalMs = 15000 } = {}) {
  const sealed = await getSetting(KEYS.refreshToken);
  if (!sealed || !isGmailConfigured()) return { ran: false, reason: "not connected" };
  if (!(await getToggles()).gmail) return { ran: false, reason: "switched off" };
  if (!force && !(await claimInterval(KEYS.throttle, minIntervalMs))) return { ran: false, reason: "throttled" };

  let found = 0;
  let matched = 0;
  try {
    const { access_token } = await tokenRequest({ refresh_token: decryptSecret(sealed), grant_type: "refresh_token" });
    const watermark = Number((await getSetting(KEYS.watermark)) || Date.now() - 60 * 60 * 1000);

    // Only mail since the last check (5 min overlap); duplicates are ignored by recordCredit.
    const since = Math.floor((watermark - 5 * 60 * 1000) / 1000);
    const q = encodeURIComponent(`after:${since} {credited received deposited}`);
    const list = await gmailGet<{ messages?: Array<{ id: string }> }>(`/messages?q=${q}&maxResults=25`, access_token);
    let newest = watermark;

    for (const { id } of list.messages || []) {
      const msg = await gmailGet<GmailMessage>(`/messages/${id}?format=full`, access_token);
      const received = Number(msg.internalDate);
      if (received <= watermark - 5 * 60 * 1000) continue; // already handled (5 min overlap; duplicates are ignored)
      newest = Math.max(newest, received);
      if (!isTrustedBankEmail(msg.payload?.headers || [])) continue;

      const text = messageText(msg.payload) || msg.snippet || "";
      const parsed = parseCredit(text, getUpiConfig().upiId);
      if (!parsed) continue;
      found++;
      const result = await recordCredit({
        source: "GMAIL",
        ...parsed,
        sender: (msg.payload?.headers || []).find((h) => h.name.toLowerCase() === "from")?.value || null,
        rawText: text,
        observedAt: new Date(received),
        sourceKey: `gmail:${id}`,
      });
      if (result.matched) matched++;
    }

    await setSetting(KEYS.watermark, String(newest));
    await setSetting(KEYS.lastPollAt, String(Date.now()));
    await deleteSettings([KEYS.lastError]);
    return { ran: true, found, matched };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await setSetting(KEYS.lastError, message.slice(0, 300));
    await setSetting(KEYS.lastPollAt, String(Date.now()));
    return { ran: true, found, matched, error: message };
  }
}

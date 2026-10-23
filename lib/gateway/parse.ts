// Reads Indian bank / UPI alerts ("Rs.1,169.63 credited to A/c XX1234 ... UPI Ref 428712345678")
// and returns the incoming amount. Anything that is not clearly money RECEIVED returns null.

export interface ParsedCredit {
  amountPaise: number;
  utr: string | null;
  payerVpa: string | null;
}

const INCOMING = [
  /\b(a\/c|ac|acct|account)\b[^.]{0,60}?\b(is\s+|has\s+been\s+|was\s+)?credited\b/i, // "A/c XX12 credited"
  /\bcredited\s+(to|in|into)\s+(your\s+)?[^.]{0,30}?\b(a\/c|ac|acct|account|bank)\b/i, // "credited to your A/c"
  /\b(has\s+been|is|was|been)\s+credited\b/i,
  /\bcredited\s+(by|with)\s+(rs\.?|inr|₹)/i, // "credited by Rs500"
  /\breceived\s+(a\s+payment\s+of\s+)?(rs\.?|inr|₹)/i, // "Received Rs.500"
  /(rs\.?|inr|₹)\s*[\d,]+(\.\d{1,2})?\s+(has\s+been\s+)?received\b/i, // "₹500 received from"
  /\byou(\s+have|'ve)?\s+received\b/i,
  /\b(money|payment)\s+received\b/i,
  /\bpaid\s+you\b/i, // Google Pay: "Rahul paid you ₹500"
  /\bdeposited\s+(in|to|into)\b/i,
];

// Outgoing money, requests, failures and OTPs are never credits.
const REJECT = [
  /\bdebited\s+(from|by|with|for)\b|\bhas\s+been\s+debited\b|\b(a\/c|acct|account)\b[^.]{0,40}?\bdebited\b/i,
  /\b(sent|paid|transferred)\s+(rs\.?|inr|₹|to)\b/i,
  /\byou(\s+have|'ve)?\s+(sent|paid)\b/i,
  /\b(will\s+be|to\s+be)\s+credited\b/i,
  /\b(requested|request(ed)?\s+(money|rs|inr|₹)|collect\s+request|payment\s+request)\b/i,
  /\b(failed|declined|unsuccessful|reversed|reversal)\b/i,
  /\b(otp|one[\s-]?time\s+password|verification\s+code)\b/i,
];

const AMOUNT = /(?:rs\.?|inr|₹)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi;
const BALANCE_CONTEXT = /(bal(ance)?|avl|available|limit|outstanding|total\s+due)[\s:.-]*$/i;

const UTR_PATTERNS = [
  /\bUPI\/(?:P2A|P2M|P2P|CR|DR)?\/?(\d{12})\b/i, // Axis "UPI/P2A/428712345678/NAME"
  /\b(?:utr|rrn|upi\s*ref(?:erence)?|ref(?:erence)?|txn|transaction)\s*(?:no|num|number|id)?\s*[.:#-]?\s*(?:no\.?)?\s*[:#-]?\s*(\d{12})\b/i,
  /\(UPI[\s:-]*(\d{12})\)/i, // HDFC "(UPI 428712345678)"
  /\b(\d{12})\b/,
];

const VPA = /\b([a-z0-9][a-z0-9._-]{1,63}@[a-z][a-z0-9]{1,63})\b/gi;

export function parseCredit(text: string, ownUpiId?: string): ParsedCredit | null {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return null;
  if (REJECT.some((re) => re.test(clean))) return null;
  if (!INCOMING.some((re) => re.test(clean))) return null;

  // First amount that is not a balance or limit figure.
  let amountPaise: number | null = null;
  for (const match of clean.matchAll(AMOUNT)) {
    const before = clean.slice(Math.max(0, (match.index ?? 0) - 25), match.index);
    if (BALANCE_CONTEXT.test(before)) continue;
    const value = Math.round(parseFloat(match[1].replace(/,/g, "")) * 100);
    if (Number.isFinite(value) && value > 0) {
      amountPaise = value;
      break;
    }
  }
  if (!amountPaise) return null;

  let utr: string | null = null;
  for (const re of UTR_PATTERNS) {
    const m = clean.match(re);
    if (m) {
      utr = m[1];
      break;
    }
  }

  const own = (ownUpiId || "").toLowerCase();
  let payerVpa: string | null = null;
  for (const m of clean.matchAll(VPA)) {
    const vpa = m[1].toLowerCase();
    if (vpa !== own && !/\.(com|in|net|org)$/.test(vpa)) {
      payerVpa = vpa;
      break;
    }
  }

  return { amountPaise, utr, payerVpa };
}

/**
 * Real bank alerts come from registered DLT headers like "AX-HDFCBK" or "JD-SBIUPI-S".
 * Messages from ordinary phone numbers are rejected, so a customer cannot fake an alert by SMS.
 */
export function isBankSmsSender(sender: string) {
  return /^[A-Z]{2}-[A-Z0-9]{5,8}(-[A-Z])?$/i.test(String(sender || "").trim());
}

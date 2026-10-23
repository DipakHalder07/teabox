/**
 * A hard-to-guess order number for COD and manual-UPI orders, e.g. "TB-4821937065".
 * (Gateway UPI orders get theirs on the server in lib/gateway/payments.)
 */
export function newOrderNumber() {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const digits = Array.from(bytes, (b, i) => (i === 0 ? 1 + (b % 9) : b % 10)).join("");
  return `TB-${digits}`;
}

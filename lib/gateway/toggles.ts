import { prisma } from "@/lib/prisma";
import { setSetting } from "./settings";

// ON/OFF switches the admin controls from Admin → Payment Gateway.
//  whatsapp: customers verify their number with a WhatsApp code before paying
//  sms:      the paired Android phone confirms payments from bank SMS / payment-app notifications
//  gmail:    bank alert emails confirm payments
//  cod:      customers can choose Cash on Delivery at checkout
//  emailCheckout:      email the shop owner when a customer reaches the payment QR
//  emailOrderAdmin:    email the shop owner each new order
//  emailOrderCustomer: email the customer their order confirmation (when they gave an email)

export type ToggleKey = "whatsapp" | "sms" | "gmail" | "cod" | "emailCheckout" | "emailOrderAdmin" | "emailOrderCustomer";
export type Toggles = Record<ToggleKey, boolean>;

const DEFAULTS: Toggles = {
  whatsapp: false,
  sms: true,
  gmail: true,
  cod: true,
  emailCheckout: true,
  emailOrderAdmin: true,
  emailOrderCustomer: true,
};
const KEYS = Object.keys(DEFAULTS) as ToggleKey[];

let cache: { at: number; value: Toggles } | null = null;

export async function getToggles({ fresh = false } = {}): Promise<Toggles> {
  if (!fresh && cache && Date.now() - cache.at < 5000) return cache.value;
  const value = { ...DEFAULTS };
  try {
    const rows = await prisma.gatewaySetting.findMany({ where: { key: { in: KEYS.map((k) => `toggle.${k}`) } } });
    for (const row of rows) value[row.key.slice("toggle.".length) as ToggleKey] = row.value === "on";
  } catch {
    // database unavailable: defaults
  }
  cache = { at: Date.now(), value };
  return value;
}

export async function setToggle(key: ToggleKey, on: boolean) {
  await setSetting(`toggle.${key}`, on ? "on" : "off");
  cache = null;
}

export function isToggleKey(key: string): key is ToggleKey {
  return (KEYS as string[]).includes(key);
}

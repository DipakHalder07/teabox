import { prisma } from "@/lib/prisma";

export async function getSetting(key: string) {
  const row = await prisma.gatewaySetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  await prisma.gatewaySetting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

export async function deleteSettings(keys: string[]) {
  await prisma.gatewaySetting.deleteMany({ where: { key: { in: keys } } });
}

/**
 * Lets one caller run a periodic job (e.g. a Gmail check) at most every `intervalMs`, even
 * with many serverless instances. Returns true for the caller that won the slot.
 */
export async function claimInterval(key: string, intervalMs: number) {
  const now = Date.now();
  const res = await prisma.gatewaySetting.updateMany({
    where: { key, value: { lt: String(now - intervalMs) } },
    data: { value: String(now) },
  });
  if (res.count === 1) return true;
  try {
    await prisma.gatewaySetting.create({ data: { key, value: String(now) } });
    return true;
  } catch {
    return false; // exists and still fresh, or another instance created it first
  }
}

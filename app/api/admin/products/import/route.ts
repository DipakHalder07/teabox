import dns from "node:dns/promises";
import net from "node:net";
import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConnected } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/auth";
import { refreshCatalog } from "@/lib/catalog";
import { firstIssue, inputToData, productInputSchema, slugify, uniqueHandle } from "@/lib/adminProducts";
import { ImportedProduct, readSheet, sheetToProducts } from "@/lib/productSheet";
import { isAllowedImage } from "@/lib/productImages";
import { saveImage } from "@/lib/media";
import { publicBaseUrl } from "@/lib/gateway/http";

// Import products from a Shopify product export (or a sheet exported here), as .csv or .xlsx.
// mode=preview shows what would change; mode=apply creates new products and updates existing
// ones (matched by Handle). Copying many photos can take a while, hence the longer time limit.
export const maxDuration = 300;

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const PLACEHOLDER = "/assets/product-placeholder.webp";

/** True for addresses on the public internet (not loopback, private, link-local or reserved). */
function isPublicIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return !(
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPublicIp(v6.slice(7));
  return !(v6 === "::" || v6 === "::1" || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6));
}

/** Only https links whose host resolves to public addresses, so a sheet can't reach internal services. */
async function isSafeUrl(url: URL) {
  if (url.protocol !== "https:") return false;
  try {
    const addresses = await dns.lookup(url.hostname, { all: true });
    return addresses.length > 0 && addresses.every((a) => isPublicIp(a.address));
  } catch {
    return false;
  }
}

async function copyRemoteImage(src: string): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return null;
  }
  try {
    // Follow up to 3 redirects by hand, checking every hop
    let res: Response | null = null;
    for (let hop = 0; hop < 4; hop++) {
      if (!(await isSafeUrl(url))) return null;
      res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15000) });
      const next = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
      if (!next) break;
      url = new URL(next, url);
      res = null;
    }
    if (!res || !res.ok || !(res.headers.get("content-type") || "").startsWith("image/")) return null;
    if (Number(res.headers.get("content-length") || 0) > MAX_IMAGE_BYTES) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_IMAGE_BYTES) return null;
    return (await saveImage(buf)).url;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isDatabaseConnected())) {
    return NextResponse.json({ error: "Connect the database first (DATABASE_URL)." }, { status: 503 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a .csv or .xlsx file" }, { status: 400 });
  if (!/\.(csv|xlsx)$/i.test(file.name)) {
    return NextResponse.json({ error: "Use a .csv or .xlsx file (Google Sheets: File → Download → CSV)" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "File is too large (max 10 MB)" }, { status: 413 });

  let parsed: ReturnType<typeof sheetToProducts>;
  try {
    parsed = sheetToProducts(await readSheet(Buffer.from(await file.arrayBuffer()), file.name));
  } catch {
    return NextResponse.json({ error: "Couldn't read this file. Is it a valid CSV or Excel sheet?" }, { status: 400 });
  }
  const { products, errors } = parsed;

  const handles = products.map((p) => slugify(p.handle || p.title));
  const existing = new Map(
    (await prisma.product.findMany({ where: { handle: { in: handles } }, select: { id: true, handle: true } })).map((p) => [
      p.handle,
      p.id,
    ])
  );

  if (form?.get("mode") !== "apply") {
    return NextResponse.json({
      products: products.map((p, i) => ({
        handle: handles[i],
        title: p.title,
        action: existing.has(handles[i]) ? "update" : "create",
        status: p.status,
        category: p.category,
        sizes: p.variants.map((v) => v.name),
        price: Math.min(...p.variants.map((v) => v.price)),
        images: p.images.length,
        stock: p.trackInventory ? p.stockQuantity : null,
        warnings: p.warnings,
      })),
      errors,
    });
  }

  // ---- apply ----
  const copyAll = form?.get("copyImages") === "true";
  const ownHost = new URL(publicBaseUrl(req)).host;
  const resolved = new Map<string, string | null>();

  async function resolveImage(src: string) {
    if (resolved.has(src)) return resolved.get(src)!;
    let out: string | null = null;
    try {
      const url = new URL(src, "https://placeholder.invalid");
      if (src.startsWith("/")) out = src;
      else if (url.host === ownHost) out = url.pathname; // a link back to this shop
      else if (isAllowedImage(src) && !copyAll) out = src;
      else out = await copyRemoteImage(src);
    } catch {
      out = null;
    }
    resolved.set(src, out);
    return out;
  }

  const result = { created: 0, updated: 0, failed: [...errors] as string[], warnings: [] as string[] };

  for (let i = 0; i < products.length; i++) {
    const p: ImportedProduct = products[i];
    const images: string[] = [];
    for (let j = 0; j < p.images.length; j += 4) {
      const batch = await Promise.all(p.images.slice(j, j + 4).map(resolveImage));
      images.push(...batch.filter((x): x is string => Boolean(x)));
    }
    if (p.images.length > images.length) {
      result.warnings.push(`"${p.title}": ${p.images.length - images.length} photo(s) couldn't be downloaded.`);
    }

    const input = productInputSchema.safeParse({
      ...p,
      handle: handles[i],
      images: images.length > 0 ? images : [PLACEHOLDER],
      status: images.length > 0 ? p.status : "draft",
      inStock: true,
    });
    if (!input.success) {
      result.failed.push(`"${p.title}": ${firstIssue(input.error)}`);
      continue;
    }

    try {
      const id = existing.get(handles[i]);
      if (id) {
        await prisma.product.update({ where: { id }, data: inputToData(input.data) });
        result.updated++;
      } else {
        const handle = await uniqueHandle(handles[i]);
        await prisma.product.create({ data: { id: handle, handle, ...inputToData(input.data) } });
        result.created++;
      }
    } catch (err) {
      result.failed.push(`"${p.title}": ${err instanceof Error ? err.message : "could not be saved"}`);
    }
  }

  refreshCatalog();
  return NextResponse.json(result);
}

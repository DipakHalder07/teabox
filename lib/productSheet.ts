import ExcelJS from "exceljs";
import Papa from "papaparse";
import type { Product } from "@/data/products";
import { COLLECTIONS } from "@/data/products";
import { productVariants } from "@/lib/productVariants";

// Products ⇄ spreadsheets in Shopify's product CSV format, so a Shopify export imports here, and
// an export from here opens in Excel / Google Sheets and can be imported back (or into Shopify).
// One row per size (variant); extra photos get rows with only Handle + Image Src.

const META = {
  subtitle: "Subtitle (product.metafields.custom.subtitle)",
  collection: "Collection (product.metafields.custom.collection)",
  region: "Region (product.metafields.custom.region)",
  caffeine: "Caffeine (product.metafields.custom.caffeine)",
  badge: "Badge (product.metafields.custom.badge)",
};

export const SHEET_COLUMNS = [
  "Handle",
  "Title",
  "Body (HTML)",
  "Vendor",
  "Type",
  "Tags",
  "Published",
  "Option1 Name",
  "Option1 Value",
  "Variant SKU",
  "Variant Inventory Tracker",
  "Variant Inventory Qty",
  "Variant Inventory Policy",
  "Variant Fulfillment Service",
  "Variant Price",
  "Variant Compare At Price",
  "Variant Requires Shipping",
  "Variant Taxable",
  "Image Src",
  "Image Position",
  "Image Alt Text",
  "Status",
  META.subtitle,
  META.collection,
  META.region,
  META.caffeine,
  META.badge,
];

// ---------- export ----------

/** Text starting with = + @ would run as a formula in Excel / Sheets; a leading ' keeps it text. */
function safeCell(value: string) {
  return /^[=+@]/.test(value) ? `'${value}` : value;
}

function htmlEscape(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toHtml(text: string) {
  return text
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${htmlEscape(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Spreadsheet rows (first row = headers). Relative image paths become full links. */
export function productsToSheet(products: Product[], baseUrl: string): string[][] {
  const absolute = (src: string) => (src.startsWith("/") ? `${baseUrl}${src}` : src);
  const rows: string[][] = [SHEET_COLUMNS];

  for (const p of products) {
    const variants = productVariants(p);
    const images = Array.from(new Set([p.image, ...(p.galleryImages || [])].filter(Boolean)));
    const lines = Math.max(variants.length, images.length);

    for (let i = 0; i < lines; i++) {
      const v = variants[i];
      const img = images[i];
      const row: Record<string, string> = { Handle: p.handle || p.id };
      if (i === 0) {
        Object.assign(row, {
          Title: p.title,
          "Body (HTML)": toHtml(p.description || p.subtitle || ""),
          Vendor: p.vendor || "",
          Type: p.format || "",
          Tags: (p.tags || []).join(", "),
          Published: p.status === "active" || !p.status ? "TRUE" : "FALSE",
          "Option1 Name": "Size",
          Status: p.status || "active",
          [META.subtitle]: p.subtitle || "",
          [META.collection]: p.category || "",
          [META.region]: p.region || "",
          [META.caffeine]: p.caffeine || "",
          [META.badge]: p.badge || "",
        });
      }
      if (v) {
        Object.assign(row, {
          "Option1 Value": v.name,
          "Variant SKU": v.sku || "",
          "Variant Inventory Tracker": p.trackInventory ? "shopify" : "",
          // Stock is kept per product here, so it goes on the first size
          "Variant Inventory Qty": p.trackInventory ? String(i === 0 ? p.stockQuantity ?? 0 : 0) : "",
          "Variant Inventory Policy": "deny",
          "Variant Fulfillment Service": "manual",
          "Variant Price": String(v.price),
          "Variant Compare At Price": v.compareAtPrice && v.compareAtPrice > v.price ? String(v.compareAtPrice) : "",
          "Variant Requires Shipping": "TRUE",
          "Variant Taxable": "TRUE",
        });
      }
      if (img) {
        Object.assign(row, { "Image Src": absolute(img), "Image Position": String(i + 1), "Image Alt Text": p.title });
      }
      rows.push(SHEET_COLUMNS.map((c) => safeCell(row[c] ?? "")));
    }
  }
  return rows;
}

export function sheetToCsv(rows: string[][]) {
  return Papa.unparse(rows);
}

export async function sheetToXlsx(rows: string[][]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Products", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.addRows(rows);
  ws.getRow(1).font = { bold: true };
  ws.columns.forEach((col, i) => {
    const header = rows[0][i] || "";
    col.width = header === "Body (HTML)" ? 60 : header === "Image Src" ? 50 : Math.min(40, Math.max(12, header.length + 2));
  });
  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ---------- import ----------

export type SheetRecord = Record<string, string>;

const unsafeCell = (value: string) => (/^'[=+@]/.test(value) ? value.slice(1) : value);

/** Reads a .csv or .xlsx file into rows keyed by column name. */
export async function readSheet(file: Buffer, filename: string): Promise<SheetRecord[]> {
  if (/\.xlsx$/i.test(filename)) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(file as unknown as ArrayBuffer);
    const ws = wb.worksheets[0];
    if (!ws) return [];
    const header = (ws.getRow(1).values as unknown[]).slice(1).map((v) => String(v ?? "").trim());
    const out: SheetRecord[] = [];
    ws.eachRow((row, n) => {
      if (n === 1) return;
      const values = (row.values as unknown[]).slice(1);
      const rec: SheetRecord = {};
      header.forEach((h, i) => {
        const v = values[i];
        const cell =
          v && typeof v === "object" && "text" in (v as object)
            ? String((v as { text: unknown }).text)
            : v && typeof v === "object" && "result" in (v as object)
              ? String((v as { result: unknown }).result ?? "")
              : v instanceof Date
                ? v.toISOString()
                : String(v ?? "");
        if (h) rec[h] = unsafeCell(cell.trim());
      });
      out.push(rec);
    });
    return out;
  }
  const text = file.toString("utf8").replace(/^﻿/, "");
  const parsed = Papa.parse<SheetRecord>(text, { header: true, skipEmptyLines: "greedy", transformHeader: (h) => h.trim() });
  return parsed.data.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, unsafeCell(String(v ?? "").trim())])));
}

export interface ImportedProduct {
  handle: string;
  title: string;
  subtitle: string;
  description: string;
  status: "active" | "draft" | "archived";
  category: string;
  format: string;
  region: string;
  caffeine: string;
  badge: string;
  vendor: string;
  tags: string[];
  images: string[];
  variants: Array<{ name: string; price: number; compareAtPrice: number | null; sku: string | null }>;
  trackInventory: boolean;
  stockQuantity: number;
  warnings: string[];
}

function htmlToText(html: string) {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*li\s*>/gi, "\n")
    .replace(/<\/\s*(p|div|ul|ol|h[1-6])\s*>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const rupees = (value: string) => {
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};

/** Best guess of the shop collection for a product imported from Shopify. */
function guessCollection(text: string) {
  const t = text.toLowerCase();
  const rules: Array<[RegExp, string]> = [
    [/premix|instant/, "premix"],
    [/mug|teapot|strainer|infuser|accessor|teaware|kettle|\bcups?\b|glass/, "teaware"],
    [/gift|hamper/, "gifts"],
    [/sampler|trial|taster/, "trial-packs"],
    [/chai|masala/, "chai"],
    [/herbal|tisane|chamomile|tulsi|hibiscus|blue pea|caffeine.free/, "herbal-tea"],
    [/white tea|silver needle/, "white-tea"],
    [/green|matcha|kahwa/, "green-tea"],
    [/black|assam|darjeeling|nilgiri|oolong/, "black-tea"],
  ];
  return rules.find(([re]) => re.test(t))?.[1] || "";
}

const COLLECTION_IDS = new Set(COLLECTIONS.map((c) => c.id));

/** Groups Shopify-style rows by Handle into products. Rows that can't be used are reported. */
export function sheetToProducts(records: SheetRecord[]): { products: ImportedProduct[]; errors: string[] } {
  const errors: string[] = [];
  if (records.length === 0) return { products: [], errors: ["The file is empty."] };
  if (!("Handle" in records[0]) && !("Title" in records[0])) {
    return { products: [], errors: ['This doesn\'t look like a product sheet: it needs a "Handle" or "Title" column.'] };
  }

  // Shopify repeats the Handle on every row of a product (sizes and extra photos)
  const groups = new Map<string, SheetRecord[]>();
  for (const r of records) {
    const key = r["Handle"] || r["Title"] || "";
    if (!key) continue;
    groups.set(key, [...(groups.get(key) || []), r]);
  }

  const products: ImportedProduct[] = [];
  for (const [key, rows] of groups) {
    const first = rows.find((r) => r["Title"]) || rows[0];
    const title = first["Title"] || "";
    if (!title) {
      errors.push(`"${key}": no Title, skipped.`);
      continue;
    }
    const warnings: string[] = [];

    const variants: ImportedProduct["variants"] = [];
    for (const r of rows) {
      const price = rupees(r["Variant Price"] || "");
      if (!price) continue;
      const name = [r["Option1 Value"], r["Option2 Value"], r["Option3 Value"]]
        .filter((v) => v && v !== "Default Title")
        .join(" / ") || "Default";
      if (variants.some((v) => v.name.toLowerCase() === name.toLowerCase())) continue;
      const compare = rupees(r["Variant Compare At Price"] || "");
      variants.push({ name, price, compareAtPrice: compare > price ? compare : null, sku: r["Variant SKU"] || null });
    }
    if (variants.length === 0) {
      errors.push(`"${title}": no Variant Price, skipped.`);
      continue;
    }

    const images = rows
      .filter((r) => r["Image Src"] || r["Variant Image"])
      .sort((a, b) => Number(a["Image Position"] || 999) - Number(b["Image Position"] || 999))
      .flatMap((r) => [r["Image Src"], r["Variant Image"]])
      .filter((src): src is string => Boolean(src));
    const uniqueImages = Array.from(new Set(images));
    if (uniqueImages.length === 0) warnings.push("No photo: imported as Draft, add a photo before publishing.");

    const statusRaw = (first["Status"] || "").toLowerCase();
    let status: ImportedProduct["status"] =
      statusRaw === "draft" || statusRaw === "archived" || statusRaw === "active"
        ? statusRaw
        : (first["Published"] || "").toUpperCase() === "FALSE"
          ? "draft"
          : "active";
    if (uniqueImages.length === 0) status = "draft";

    const tags = (first["Tags"] || "").split(",").map((t) => t.trim()).filter(Boolean);
    const explicitCollection = first[META.collection] || "";
    const category = COLLECTION_IDS.has(explicitCollection)
      ? explicitCollection
      : guessCollection([first["Type"], first["Product Category"], tags.join(" "), title].join(" "));

    const tracked = rows.some((r) => (r["Variant Inventory Tracker"] || "").toLowerCase() === "shopify");
    const stock = rows.reduce((sum, r) => sum + Math.max(0, Math.floor(Number(r["Variant Inventory Qty"] || 0)) || 0), 0);

    const description = htmlToText(first["Body (HTML)"] || "");
    products.push({
      handle: first["Handle"] || "",
      title,
      subtitle: first[META.subtitle] || first["SEO Description"] || "",
      description,
      status,
      category,
      format: first["Type"] || "",
      region: first[META.region] || "",
      caffeine: first[META.caffeine] || "",
      badge: first[META.badge] || "",
      vendor: first["Vendor"] || "",
      tags,
      images: uniqueImages,
      variants,
      trackInventory: tracked,
      stockQuantity: stock,
      warnings,
    });
  }
  return { products, errors };
}

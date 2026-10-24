"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { COLLECTIONS, Product } from "@/data/products";
import { productInputSchema, slugify } from "@/lib/validations/product";
import ProductImages from "./ProductImages";

// Add / edit a product, laid out like Shopify: content on the left, status and organisation on the right.

const FORMATS = ["Loose Leaf", "Tea Bags", "Sampler", "Premix", "Gift Box", "Accessories"];
const CAFFEINE = ["High", "Medium", "Low", "Caffeine-free"];
const REGIONS = ["Assam", "Darjeeling", "Nilgiri", "Kashmir", "Kerala", "Gujarat", "India"];

interface VariantRow {
  name: string;
  price: string;
  compareAtPrice: string;
  sku: string;
}

interface FormState {
  title: string;
  handle: string;
  subtitle: string;
  description: string;
  status: "active" | "draft" | "archived";
  category: string;
  format: string;
  region: string;
  caffeine: string;
  badge: string;
  vendor: string;
  tags: string;
  images: string[];
  variants: VariantRow[];
  trackInventory: boolean;
  stockQuantity: string;
  inStock: boolean;
}

const EMPTY: FormState = {
  title: "",
  handle: "",
  subtitle: "",
  description: "",
  status: "active",
  category: "",
  format: "Loose Leaf",
  region: "",
  caffeine: "",
  badge: "",
  vendor: "",
  tags: "",
  images: [],
  variants: [{ name: "100G", price: "", compareAtPrice: "", sku: "" }],
  trackInventory: false,
  stockQuantity: "0",
  inStock: true,
};

function fromProduct(p: Product): FormState {
  return {
    title: p.title,
    handle: p.handle,
    subtitle: p.subtitle || "",
    description: p.description || "",
    status: p.status || "active",
    category: p.category || "",
    format: p.format || "",
    region: p.region || "",
    caffeine: p.caffeine || "",
    badge: p.badge || "",
    vendor: p.vendor || "",
    tags: (p.tags || []).join(", "),
    images: Array.from(new Set([p.image, ...(p.galleryImages || [])].filter(Boolean))),
    variants: (p.variants || []).map((v) => ({
      name: v.name,
      price: String(v.price),
      compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : "",
      sku: v.sku || "",
    })),
    trackInventory: Boolean(p.trackInventory),
    stockQuantity: String(p.stockQuantity ?? 0),
    // A tracked product that sold out keeps "available" on, so restocking brings it back
    inStock: p.trackInventory ? true : p.inStock,
  };
}

function toInput(f: FormState) {
  return {
    ...f,
    tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
    variants: f.variants.map((v) => ({
      name: v.name,
      price: v.price,
      compareAtPrice: v.compareAtPrice ? v.compareAtPrice : null,
      sku: v.sku || null,
    })),
  };
}

const card = "bg-white border border-[#e7e2d8] rounded-2xl p-5 shadow-2xs";
const label = "block text-[13px] font-semibold text-[#202020] mb-1";
const input =
  "w-full border border-[#d6d3cb] focus:border-[#1f3a2c] rounded-lg px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#02cb5a]/20 bg-white";

export default function ProductEditor({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saved, setSaved] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [handleTouched, setHandleTouched] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/admin/products/${encodeURIComponent(id)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          toast.error(data.error || "Product not found");
          router.replace("/admin/products");
          return;
        }
        const state = fromProduct(data.product);
        setForm(state);
        setSaved(state);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const setTitle = (title: string) =>
    setForm((f) => ({ ...f, title, handle: handleTouched ? f.handle : slugify(title) }));

  const setVariant = (i: number, key: keyof VariantRow, value: string) =>
    setForm((f) => ({ ...f, variants: f.variants.map((v, j) => (j === i ? { ...v, [key]: value } : v)) }));

  const save = async () => {
    setError(null);
    const body = toInput(form);
    const check = productInputSchema.safeParse(body);
    if (!check.success) {
      setError(check.error.issues[0]?.message || "Please check the product details.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(id ? `/api/admin/products/${encodeURIComponent(id)}` : "/api/admin/products", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save the product.");
        return;
      }
      const state = fromProduct(data.product);
      setForm(state);
      setSaved(state);
      toast.success(id ? "Product saved" : "Product added");
      if (!id) router.replace(`/admin/products/${encodeURIComponent(data.product.id)}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!id || !window.confirm(`Delete "${form.title}"? This can't be undone. Past orders keep their details.`)) return;
    const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Product deleted");
      router.push("/admin/products");
    } else {
      toast.error("Could not delete the product");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin text-[#747576]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto pb-28">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/admin/products" className="p-2 rounded-lg hover:bg-[#f0ede6]" aria-label="Back to products">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-[20px] sm:text-[24px] font-bold text-[#1f3a2c] truncate">{id ? form.title || "Edit product" : "Add product"}</h1>
        </div>
        {id && form.status === "active" && (
          <a
            href={`/products/${form.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-[13px] font-semibold text-[#016c2f] flex items-center gap-1 hover:underline"
          >
            View in shop <ExternalLink size={13} />
          </a>
        )}
      </div>

      {error && (
        <div className="mb-4 text-[13.5px] font-semibold text-[#c53030] bg-[#fff5f5] border border-[#feb2b2] rounded-xl p-3">{error}</div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5 min-w-0">
          <section className={card}>
            <label className="block mb-4">
              <span className={label}>Title</span>
              <input className={input} value={form.title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Assam Gold Black Tea" />
            </label>
            <label className="block mb-4">
              <span className={label}>Short line under the title</span>
              <input className={input} value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="e.g. Malty & bold · Single estate" />
            </label>
            <label className="block">
              <span className={label}>Description</span>
              <textarea className={`${input} min-h-[140px] resize-y`} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </label>
          </section>

          <section className={card}>
            <h2 className="font-bold text-[#1f3a2c] mb-3">Photos</h2>
            <ProductImages images={form.images} onChange={(images) => set("images", images)} />
          </section>

          <section className={card}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[#1f3a2c]">Sizes and prices</h2>
              <button
                type="button"
                onClick={() => set("variants", [...form.variants, { name: "", price: "", compareAtPrice: "", sku: "" }])}
                className="text-[13px] font-semibold text-[#016c2f] flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add size
              </button>
            </div>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-[13.5px] min-w-[520px]">
                <thead>
                  <tr className="text-left text-[12px] text-[#5c5a52]">
                    <th className="pb-2 px-1 font-semibold">Size</th>
                    <th className="pb-2 px-1 font-semibold">Price ₹</th>
                    <th className="pb-2 px-1 font-semibold">Compare-at ₹</th>
                    <th className="pb-2 px-1 font-semibold">SKU</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {form.variants.map((v, i) => (
                    <tr key={i}>
                      <td className="p-1"><input className={input} value={v.name} onChange={(e) => setVariant(i, "name", e.target.value)} placeholder="100G" aria-label="Size name" /></td>
                      <td className="p-1"><input className={input} value={v.price} onChange={(e) => setVariant(i, "price", e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="349" aria-label="Price" /></td>
                      <td className="p-1"><input className={input} value={v.compareAtPrice} onChange={(e) => setVariant(i, "compareAtPrice", e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="420" aria-label="Compare-at price" /></td>
                      <td className="p-1"><input className={input} value={v.sku} onChange={(e) => setVariant(i, "sku", e.target.value)} aria-label="SKU" /></td>
                      <td className="p-1 w-9">
                        <button
                          type="button"
                          onClick={() => set("variants", form.variants.filter((_, j) => j !== i))}
                          disabled={form.variants.length === 1}
                          aria-label="Remove size"
                          className="p-2 text-[#c62828] disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11.5px] text-[#747576] mt-2">
              The first size is selected by default and its price shows on product cards. Compare-at price shows as the
              crossed-out price.
            </p>
          </section>

          <section className={card}>
            <h2 className="font-bold text-[#1f3a2c] mb-3">Inventory</h2>
            <label className="flex items-center gap-2.5 text-[14px] mb-3 cursor-pointer">
              <input type="checkbox" checked={form.trackInventory} onChange={(e) => set("trackInventory", e.target.checked)} className="w-4 h-4 accent-[#1f3a2c]" />
              Track stock (goes down with each order, sold out at 0)
            </label>
            {form.trackInventory ? (
              <label className="block max-w-[200px]">
                <span className={label}>Packs in stock</span>
                <input className={input} value={form.stockQuantity} onChange={(e) => set("stockQuantity", e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" />
              </label>
            ) : (
              <label className="flex items-center gap-2.5 text-[14px] cursor-pointer">
                <input type="checkbox" checked={form.inStock} onChange={(e) => set("inStock", e.target.checked)} className="w-4 h-4 accent-[#1f3a2c]" />
                In stock (customers can buy it)
              </label>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className={card}>
            <label className="block">
              <span className={label}>Status</span>
              <select className={input} value={form.status} onChange={(e) => set("status", e.target.value as FormState["status"])}>
                <option value="active">Active: shown in the shop</option>
                <option value="draft">Draft: hidden</option>
                <option value="archived">Archived: hidden</option>
              </select>
            </label>
          </section>

          <section className={`${card} space-y-3.5`}>
            <h2 className="font-bold text-[#1f3a2c]">Organisation</h2>
            <label className="block">
              <span className={label}>Collection</span>
              <select className={input} value={form.category} onChange={(e) => set("category", e.target.value)}>
                <option value="">None (only in “All”)</option>
                {COLLECTIONS.filter((c) => c.id !== "all").map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={label}>Format</span>
              <select className={input} value={form.format} onChange={(e) => set("format", e.target.value)}>
                <option value="">—</option>
                {FORMATS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </label>
            <label className="block">
              <span className={label}>Region</span>
              <input className={input} list="regions" value={form.region} onChange={(e) => set("region", e.target.value)} />
              <datalist id="regions">{REGIONS.map((r) => <option key={r} value={r} />)}</datalist>
            </label>
            <label className="block">
              <span className={label}>Caffeine</span>
              <select className={input} value={form.caffeine} onChange={(e) => set("caffeine", e.target.value)}>
                <option value="">—</option>
                {CAFFEINE.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className={label}>Badge (optional)</span>
              <input className={input} value={form.badge} onChange={(e) => set("badge", e.target.value)} placeholder="e.g. BESTSELLER" />
            </label>
            <label className="block">
              <span className={label}>Vendor</span>
              <input className={input} value={form.vendor} onChange={(e) => set("vendor", e.target.value)} />
            </label>
            <label className="block">
              <span className={label}>Tags</span>
              <input className={input} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="assam, strong, breakfast" />
              <span className="block text-[11.5px] text-[#747576] mt-1">Separate with commas</span>
            </label>
          </section>

          <section className={card}>
            <label className="block">
              <span className={label}>URL handle</span>
              <input
                className={input}
                value={form.handle}
                onChange={(e) => {
                  setHandleTouched(true);
                  set("handle", e.target.value);
                }}
              />
              <span className="block text-[11.5px] text-[#747576] mt-1 break-all">/products/{slugify(form.handle || form.title)}</span>
            </label>
          </section>

          {id && (
            <button type="button" onClick={remove} className="w-full flex items-center justify-center gap-1.5 border border-[#f3c4c4] text-[#c62828] hover:bg-[#fdecec] font-semibold text-[13.5px] py-2.5 rounded-xl cursor-pointer">
              <Trash2 size={15} /> Delete product
            </button>
          )}
        </div>
      </div>

      {/* Save bar */}
      <div className="fixed bottom-0 right-0 left-0 md:left-64 z-30 bg-white/95 backdrop-blur border-t border-[#e7e2d8] px-4 py-3">
        <div className="max-w-[1200px] mx-auto flex items-center justify-end gap-3">
          {dirty && <span className="text-[13px] text-[#8a5a18] mr-auto">Unsaved changes</span>}
          {dirty && id && (
            <button type="button" onClick={() => setForm(saved)} className="px-4 py-2 rounded-xl border border-[#d6d3cb] text-[13.5px] font-semibold cursor-pointer">
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving || (!dirty && Boolean(id))}
            className="flex items-center gap-2 bg-[#1f3a2c] hover:bg-[#16291f] disabled:opacity-50 text-white font-bold text-[14px] px-6 py-2.5 rounded-xl cursor-pointer"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {id ? "Save" : "Add product"}
          </button>
        </div>
      </div>
    </div>
  );
}

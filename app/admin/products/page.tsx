"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Download, Loader2, Package, Plus, RefreshCw, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { COLLECTIONS, Product } from "@/data/products";
import ImportProductsDialog from "@/components/admin/ImportProductsDialog";

// Admin → Products: Shopify-style list with status tabs, search, bulk actions, export and import.

type Tab = "all" | "active" | "draft" | "archived";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-[#eaf8ef] text-[#016c2f]",
  draft: "bg-[#eef2f6] text-[#3f5468]",
  archived: "bg-[#f3f1ec] text-[#747576]",
};

function priceRange(p: Product) {
  const prices = (p.variants || []).map((v) => v.price);
  if (prices.length === 0) return `₹${p.price.toLocaleString("en-IN")}`;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `₹${min.toLocaleString("en-IN")}` : `₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString("en-IN")}`;
}

const collectionName = (id: string) => COLLECTIONS.find((c) => c.id === id)?.name || "—";

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(data.error || "Could not load products");
        return;
      }
      setLoadError(null);
      setProducts(data.products || []);
    } catch {
      setLoadError("Network error. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    return () => clearTimeout(first);
  }, [load]);

  const counts = useMemo(() => {
    const c = { all: products.length, active: 0, draft: 0, archived: 0 };
    products.forEach((p) => c[(p.status || "active") as Exclude<Tab, "all">]++);
    return c;
  }, [products]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (tab === "all" || (p.status || "active") === tab) &&
        (!collection || p.category === collection) &&
        (!q ||
          p.title.toLowerCase().includes(q) ||
          p.handle.toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q)))
    );
  }, [products, tab, collection, search]);

  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));
  const toggleAll = () =>
    setSelected((s) => {
      const next = new Set(s);
      visible.forEach((p) => (allVisibleSelected ? next.delete(p.id) : next.add(p.id)));
      return next;
    });
  const toggleOne = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const bulk = async (action: "activate" | "draft" | "archive" | "delete") => {
    const ids = Array.from(selected);
    if (action === "delete" && !window.confirm(`Delete ${ids.length} product(s)? This can't be undone. Past orders keep their details.`)) return;
    setBusy(action);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Action failed");
        return;
      }
      toast.success(`${data.count} product(s) ${action === "delete" ? "deleted" : "updated"}`);
      setSelected(new Set());
      load();
    } finally {
      setBusy(null);
    }
  };

  const toggleStock = async (p: Product) => {
    setBusy(p.id);
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, inStock: !p.inStock }),
    });
    setBusy(null);
    if (res.ok) setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, inStock: !p.inStock } : x)));
    else toast.error("Could not update stock");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-[#1f3a2c]">Products</h1>
          <p className="text-[13.5px] text-[#5c5a52]">Add, edit and organise everything in your shop.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={load} aria-label="Refresh" className="p-2.5 bg-white border border-[#e7e2d8] hover:border-[#1f3a2c] rounded-xl cursor-pointer">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              className="px-3.5 py-2.5 bg-white border border-[#e7e2d8] hover:border-[#1f3a2c] rounded-xl text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} /> Export <ChevronDown size={13} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-1.5 w-[260px] bg-white border border-[#e7e2d8] rounded-xl shadow-lg z-20 p-1.5 text-[13px]" onMouseLeave={() => setExportOpen(false)}>
                <a href="/api/admin/products/export?format=csv" download className="block px-3 py-2 rounded-lg hover:bg-[#fafafa]" onClick={() => setExportOpen(false)}>
                  <div className="font-semibold">CSV</div>
                  <div className="text-[11.5px] text-[#747576]">Google Sheets (File → Import) or Shopify</div>
                </a>
                <a href="/api/admin/products/export?format=xlsx" download className="block px-3 py-2 rounded-lg hover:bg-[#fafafa]" onClick={() => setExportOpen(false)}>
                  <div className="font-semibold">Excel (.xlsx)</div>
                  <div className="text-[11.5px] text-[#747576]">Microsoft Excel, Numbers, Google Sheets</div>
                </a>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="px-3.5 py-2.5 bg-white border border-[#e7e2d8] hover:border-[#1f3a2c] rounded-xl text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Upload size={14} /> Import
          </button>
          <Link href="/admin/products/new" className="px-4 py-2.5 bg-[#1f3a2c] hover:bg-[#16291f] text-white rounded-xl text-[13px] font-bold flex items-center gap-1.5">
            <Plus size={15} /> Add product
          </Link>
        </div>
      </div>

      {loadError && <div className="text-[13.5px] font-semibold text-[#c53030] bg-[#fff5f5] border border-[#feb2b2] rounded-xl p-3">{loadError}</div>}

      <div className="bg-white border border-[#e7e2d8] rounded-2xl shadow-2xs overflow-hidden">
        {/* Tabs */}
        <div className="flex gap-1 px-3 pt-3 border-b border-[#e7e2d8] overflow-x-auto">
          {(["all", "active", "draft", "archived"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3.5 py-2 text-[13px] font-semibold rounded-t-lg whitespace-nowrap cursor-pointer ${
                tab === t ? "bg-[#f3f1ec] text-[#1f3a2c]" : "text-[#747576] hover:text-[#202020]"
              }`}
            >
              {t === "all" ? "All" : t[0].toUpperCase() + t.slice(1)} <span className="text-[#9c9a94]">{counts[t]}</span>
            </button>
          ))}
        </div>

        {/* Search and filter, or bulk actions when products are selected */}
        <div className="p-3 border-b border-[#e7e2d8]">
          {selected.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className="font-semibold mr-1">{selected.size} selected</span>
              {[
                ["activate", "Set active"],
                ["draft", "Set draft"],
                ["archive", "Archive"],
              ].map(([action, text]) => (
                <button
                  key={action}
                  type="button"
                  disabled={busy !== null}
                  onClick={() => bulk(action as "activate" | "draft" | "archive")}
                  className="px-3 py-1.5 border border-[#d6d3cb] hover:border-[#1f3a2c] rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                >
                  {text}
                </button>
              ))}
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => bulk("delete")}
                className="px-3 py-1.5 border border-[#f3c4c4] text-[#c62828] hover:bg-[#fdecec] rounded-lg font-semibold cursor-pointer disabled:opacity-50"
              >
                Delete
              </button>
              <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-[#747576] underline cursor-pointer">
                Clear
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center bg-[#fafafa] border border-[#e7e2d8] focus-within:border-[#1f3a2c] rounded-xl px-3 py-2 flex-1">
                <Search size={16} className="text-[#747576] shrink-0 mr-2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, handle, SKU or tag"
                  className="w-full bg-transparent text-[13.5px] outline-none"
                />
              </div>
              <select
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                className="bg-[#fafafa] border border-[#e7e2d8] rounded-xl px-3 py-2 text-[13.5px] outline-none"
                aria-label="Filter by collection"
              >
                <option value="">All collections</option>
                {COLLECTIONS.filter((c) => c.id !== "all").map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px] min-w-[820px]">
            <thead className="bg-[#fafafa] text-[#5c5a52] text-[12px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 pl-4 w-10">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Select all" className="w-4 h-4 accent-[#1f3a2c]" />
                </th>
                <th className="py-2.5 px-3 font-semibold">Product</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Inventory</th>
                <th className="py-2.5 px-3 font-semibold">Collection</th>
                <th className="py-2.5 px-3 font-semibold text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ede6]">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="animate-spin inline text-[#747576]" />
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-[#747576]">
                    <Package size={30} className="mx-auto mb-2 text-[#c9c3b6]" />
                    No products here.{" "}
                    <Link href="/admin/products/new" className="text-[#016c2f] font-semibold underline">
                      Add a product
                    </Link>
                  </td>
                </tr>
              ) : (
                visible.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/admin/products/${encodeURIComponent(p.id)}`)}
                    className="hover:bg-[#fcfbf8] cursor-pointer"
                  >
                    <td className="py-2.5 pl-4" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} aria-label={`Select ${p.title}`} className="w-4 h-4 accent-[#1f3a2c]" />
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image} alt="" className="w-11 h-11 object-contain bg-[#fafafa] rounded-lg border border-[#e7e2d8] shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold text-[#202020] truncate max-w-[320px]">{p.title}</div>
                          <div className="text-[11.5px] text-[#747576] truncate max-w-[320px]">
                            {(p.variants || []).length} size{(p.variants || []).length === 1 ? "" : "s"}
                            {p.sku ? ` · ${p.sku}` : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[12px] font-bold px-2 py-0.5 rounded-md capitalize ${STATUS_STYLE[p.status || "active"]}`}>{p.status || "active"}</span>
                    </td>
                    <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                      {p.trackInventory ? (
                        <span className={(p.stockQuantity ?? 0) > 0 ? "text-[#202020]" : "text-[#c62828] font-semibold"}>
                          {(p.stockQuantity ?? 0) > 0 ? `${p.stockQuantity} in stock` : "Sold out"}
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={busy === p.id}
                          onClick={() => toggleStock(p)}
                          className={`text-[12px] font-bold px-2.5 py-1 rounded-full cursor-pointer ${
                            p.inStock ? "bg-[#02cb5a]/15 text-[#016c2f]" : "bg-[#d93838]/12 text-[#c62828]"
                          }`}
                          title="Click to switch"
                        >
                          {p.inStock ? "In stock" : "Out of stock"}
                        </button>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#5c5a52]">{collectionName(p.category)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-[#1f3a2c] whitespace-nowrap">{priceRange(p)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {importOpen && <ImportProductsDialog onClose={() => setImportOpen(false)} onDone={load} />}
    </div>
  );
}

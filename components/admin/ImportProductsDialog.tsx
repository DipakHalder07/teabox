"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";

// Import products from a Shopify export or a sheet from Google Sheets / Excel: preview, then apply.

interface PreviewRow {
  handle: string;
  title: string;
  action: "create" | "update";
  status: string;
  category: string;
  sizes: string[];
  price: number;
  images: number;
  stock: number | null;
  warnings: string[];
}

interface ApplyResult {
  created: number;
  updated: number;
  failed: string[];
  warnings: string[];
}

export default function ImportProductsDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [copyImages, setCopyImages] = useState(false);
  const [preview, setPreview] = useState<{ products: PreviewRow[]; errors: string[] } | null>(null);
  const [result, setResult] = useState<ApplyResult | null>(null);
  const [busy, setBusy] = useState<"preview" | "apply" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async (mode: "preview" | "apply", chosen: File) => {
    setBusy(mode);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", chosen);
      form.append("mode", mode);
      form.append("copyImages", String(copyImages));
      const res = await fetch("/api/admin/products/import", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Import failed");
        return;
      }
      if (mode === "preview") setPreview(data);
      else {
        setResult(data);
        onDone();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const choose = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    e.target.value = "";
    if (!chosen) return;
    setFile(chosen);
    setPreview(null);
    send("preview", chosen);
  };

  const creates = preview?.products.filter((p) => p.action === "create").length || 0;
  const updates = preview?.products.filter((p) => p.action === "update").length || 0;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Import products">
      <div className="bg-white rounded-2xl w-full max-w-[760px] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e7e2d8]">
          <h2 className="font-bold text-[18px] text-[#1f3a2c]">Import products</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-[13.5px]">
          {result ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#016c2f] font-bold text-[15px]">
                <CheckCircle2 size={20} /> Import finished: {result.created} added, {result.updated} updated
              </div>
              {result.failed.length > 0 && <Issues title={`${result.failed.length} not imported`} items={result.failed} tone="error" />}
              {result.warnings.length > 0 && <Issues title="Notes" items={result.warnings} tone="warn" />}
            </div>
          ) : (
            <>
              <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-xl p-4 space-y-1.5 text-[#5c5a52]">
                <div><strong className="text-[#202020]">From Shopify:</strong> Products → Export → All products → CSV.</div>
                <div><strong className="text-[#202020]">From Google Sheets:</strong> File → Download → Comma-separated values (.csv).</div>
                <div><strong className="text-[#202020]">From Excel:</strong> save as .xlsx or .csv.</div>
                <div>
                  Easiest: <em>Export</em> from this page first and edit that file. Products are matched by <strong>Handle</strong>:
                  existing ones are updated, new ones are added. Nothing is deleted.
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={copyImages} onChange={(e) => setCopyImages(e.target.checked)} className="w-4 h-4 mt-0.5 accent-[#1f3a2c]" />
                <span>
                  Copy Shopify photos into this shop
                  <span className="block text-[12px] text-[#747576]">Recommended if you&apos;re closing your Shopify store. Photos from other websites are always copied.</span>
                </span>
              </label>

              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={busy !== null}
                className="w-full border-2 border-dashed border-[#c9c3b6] hover:border-[#1f3a2c] rounded-xl py-6 flex flex-col items-center gap-2 text-[#1f3a2c] font-semibold cursor-pointer disabled:opacity-60"
              >
                {busy === "preview" ? <Loader2 className="animate-spin" /> : <FileSpreadsheet size={26} />}
                {file ? file.name : "Choose a .csv or .xlsx file"}
              </button>
              <input ref={fileInput} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={choose} />

              {preview && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-[12.5px] font-bold">
                    <span className="bg-[#eaf8ef] text-[#016c2f] px-2.5 py-1 rounded-md">{creates} new</span>
                    <span className="bg-[#e8f0fb] text-[#1d4f91] px-2.5 py-1 rounded-md">{updates} updated</span>
                    {preview.errors.length > 0 && (
                      <span className="bg-[#fdecec] text-[#b42318] px-2.5 py-1 rounded-md">{preview.errors.length} can&apos;t be imported</span>
                    )}
                  </div>
                  {preview.errors.length > 0 && <Issues title="These rows will be skipped" items={preview.errors} tone="error" />}
                  <div className="border border-[#e7e2d8] rounded-xl overflow-x-auto">
                    <table className="w-full text-[12.5px] min-w-[560px]">
                      <thead className="bg-[#fafafa] text-left text-[#5c5a52]">
                        <tr>
                          <th className="py-2 px-3">Product</th>
                          <th className="py-2 px-3">Change</th>
                          <th className="py-2 px-3">Sizes</th>
                          <th className="py-2 px-3">From</th>
                          <th className="py-2 px-3">Photos</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0ede6]">
                        {preview.products.slice(0, 200).map((p) => (
                          <tr key={p.handle} className="align-top">
                            <td className="py-2 px-3">
                              <div className="font-semibold text-[#202020]">{p.title}</div>
                              {p.warnings.map((w) => (
                                <div key={w} className="text-[11.5px] text-[#8a5a18]">{w}</div>
                              ))}
                            </td>
                            <td className="py-2 px-3">{p.action === "create" ? "Add" : "Update"}</td>
                            <td className="py-2 px-3">{p.sizes.join(", ")}</td>
                            <td className="py-2 px-3">₹{p.price}</td>
                            <td className="py-2 px-3">{p.images}</td>
                            <td className="py-2 px-3 capitalize">{p.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {preview.products.length > 200 && (
                    <p className="text-[12px] text-[#747576]">Showing 200 of {preview.products.length} products.</p>
                  )}
                </div>
              )}

              {error && <p className="text-[#c53030] font-semibold bg-[#fff5f5] border border-[#feb2b2] rounded-lg p-2.5">{error}</p>}
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#e7e2d8] flex justify-end gap-3">
          {result ? (
            <button type="button" onClick={onClose} className="bg-[#1f3a2c] text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer">
              Done
            </button>
          ) : (
            <>
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[#d6d3cb] font-semibold cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => file && send("apply", file)}
                disabled={!preview || preview.products.length === 0 || busy !== null}
                className="flex items-center gap-2 bg-[#1f3a2c] disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer"
              >
                {busy === "apply" ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {busy === "apply" ? "Importing… (copying photos can take a minute)" : `Import ${preview?.products.length || ""} products`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Issues({ title, items, tone }: { title: string; items: string[]; tone: "error" | "warn" }) {
  return (
    <div className={`rounded-xl p-3 border ${tone === "error" ? "bg-[#fff5f5] border-[#feb2b2]" : "bg-[#fffaf0] border-[#f6dfb3]"}`}>
      <div className="flex items-center gap-1.5 font-bold mb-1">
        <AlertTriangle size={14} /> {title}
      </div>
      <ul className="list-disc pl-5 space-y-0.5 max-h-[140px] overflow-y-auto">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

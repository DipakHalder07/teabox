"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Star,
} from "lucide-react";
import { Product } from "@/data/products";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (data?.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleStock = async (product: Product) => {
    const nextStock = !product.inStock;
    setUpdatingId(product.id);

    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, inStock: nextStock }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, inStock: nextStock } : p))
        );
      }
    } catch (err) {
      console.error("Error toggling stock:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.subtitle?.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-[#1f3a2c]">
            Products &amp; Inventory Catalog
          </h1>
          <p className="text-[13.5px] text-[#5c5a52]">
            Manage single-estate tea availability, live prices, and stock inventory.
          </p>
        </div>

        <button
          onClick={fetchProducts}
          className="px-4 py-2 bg-white border border-[#e7e2d8] hover:border-[#1f3a2c] rounded-xl text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-[#e7e2d8] rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center bg-[#fafafa] border border-[#e7e2d8] focus-within:border-[#02cb5a] rounded-xl px-3.5 py-2.5 flex-1 max-w-md transition-colors">
          <Search size={17} className="text-[#747576] shrink-0 mr-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teas by name, estate, blend..."
            className="w-full bg-transparent text-[13.5px] outline-none text-[#202020]"
          />
        </div>
        <span className="text-[13px] text-[#747576] font-medium hidden sm:inline">
          Showing {filteredProducts.length} teas
        </span>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#e7e2d8] rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead className="bg-[#fafafa] border-b border-[#e7e2d8] text-[#5c5a52] text-[12px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Tea Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Base Price</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4 text-right">Storefront</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e2d8]">
              {filteredProducts.map((p) => {
                const isItemUpdating = updatingId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-[#fafafa]/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-12 h-12 object-contain bg-[#fafafa] rounded-lg border border-[#e7e2d8] p-1 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-[#202020] block truncate max-w-[280px]">
                            {p.title}
                          </span>
                          <span className="text-[11.5px] text-[#747576] block truncate max-w-[280px]">
                            {p.subtitle || p.region || "Direct Single Estate"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#5c5a52] capitalize">
                      {p.category || "Chai & Green"}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#1f3a2c]">
                      ₹{p.price.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 font-bold text-[12.5px] text-[#202020]">
                        <Star size={13} className="fill-[#1f3a2c] text-[#1f3a2c]" />
                        <span>{p.rating || 4.9}</span>
                        <span className="text-[11px] text-[#747576] font-normal">
                          ({p.reviewsCount || 100}+)
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        disabled={isItemUpdating}
                        onClick={() => handleToggleStock(p)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold transition-all cursor-pointer ${
                          p.inStock
                            ? "bg-[#02cb5a]/20 text-[#016c2f] hover:bg-[#02cb5a]/30"
                            : "bg-[#d93838]/15 text-[#d93838] hover:bg-[#d93838]/25"
                        }`}
                      >
                        {p.inStock ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>In Stock</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={13} />
                            <span>Out of Stock</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`/products/${p.handle || p.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#016c2f] hover:underline text-[12.5px] font-bold inline-flex items-center gap-1"
                      >
                        <span>View</span>
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

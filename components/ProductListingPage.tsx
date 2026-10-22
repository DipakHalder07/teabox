"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { SlidersHorizontal, ChevronDown, X, Check } from "lucide-react";
import { PRODUCTS, COLLECTIONS, Product } from "@/data/products";
import ProductCard from "./ProductCard";

interface PLPProps {
  initialCollectionId?: string;
}

export default function ProductListingPage({ initialCollectionId = "all" }: PLPProps) {
  const [selectedCollection, setSelectedCollection] = useState<string>(initialCollectionId);
  const [sortBy, setSortBy] = useState<string>("best-selling");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Active filter state
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedCaffeine, setSelectedCaffeine] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState<string>("all");

  const currentCollection = useMemo(() => {
    return (
      COLLECTIONS.find((c) => c.id === selectedCollection) || {
        id: "all",
        name: "All Collection",
        description:
          "Discover India's freshest loose-leaf teas, authentic artisanal chais, wellness blends, and luxury gift boxes.",
      }
    );
  }, [selectedCollection]);

  // Available options with dynamic counts
  const formatsList = ["Loose Leaf", "Tea Bags", "Sampler", "Premix", "Accessories"];
  const caffeineList = ["High", "Medium", "Low", "Caffeine-free"];
  const regionsList = ["Assam", "Darjeeling", "Kashmir", "Kerala", "Gujarat"];

  // Filter logic
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      // 1. Collection filter
      if (selectedCollection !== "all") {
        if (selectedCollection === "chai" && p.category !== "chai") return false;
        if (selectedCollection === "green-tea" && p.category !== "green-tea") return false;
        if (selectedCollection === "black-tea" && p.category !== "black-tea") return false;
        if (selectedCollection === "white-tea" && p.category !== "white-tea") return false;
        if (selectedCollection === "herbal-tea" && p.category !== "herbal-tea") return false;
        if (selectedCollection === "trial-packs" && p.category !== "trial-packs") return false;
        if (selectedCollection === "gifts" && p.category !== "gifts") return false;
        if (selectedCollection === "premix" && p.category !== "premix") return false;
        if (selectedCollection === "teaware" && p.category !== "teaware") return false;
      }

      // 2. Format filter
      if (selectedFormats.length > 0 && !selectedFormats.includes(p.format)) {
        return false;
      }

      // 3. Caffeine filter
      if (selectedCaffeine.length > 0 && !selectedCaffeine.includes(p.caffeine)) {
        return false;
      }

      // 4. Region filter
      if (selectedRegions.length > 0 && !selectedRegions.includes(p.region)) {
        return false;
      }

      // 5. Discount filter
      if (selectedDiscounts.length > 0) {
        const matchesDiscount = selectedDiscounts.some((d) => p.discount >= d);
        if (!matchesDiscount) return false;
      }

      // 6. Price range filter
      if (priceRange === "under-300" && p.price >= 300) return false;
      if (priceRange === "300-600" && (p.price < 300 || p.price > 600)) return false;
      if (priceRange === "600-1000" && (p.price < 600 || p.price > 1000)) return false;
      if (priceRange === "over-1000" && p.price <= 1000) return false;

      return true;
    });
  }, [
    selectedCollection,
    selectedFormats,
    selectedCaffeine,
    selectedRegions,
    selectedDiscounts,
    priceRange,
  ]);

  // Sort logic
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortBy) {
      case "price-asc":
        return list.sort((a, b) => a.price - b.price);
      case "price-desc":
        return list.sort((a, b) => b.price - a.price);
      case "rating-desc":
        return list.sort((a, b) => b.rating - a.rating);
      case "alpha-asc":
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case "alpha-desc":
        return list.sort((a, b) => b.title.localeCompare(a.title));
      case "best-selling":
      default:
        return list; // original order has top sellers first
    }
  }, [filteredProducts, sortBy]);

  // Count active filters
  const activeFiltersCount =
    selectedFormats.length +
    selectedCaffeine.length +
    selectedRegions.length +
    selectedDiscounts.length +
    (priceRange !== "all" ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedFormats([]);
    setSelectedCaffeine([]);
    setSelectedRegions([]);
    setSelectedDiscounts([]);
    setPriceRange("all");
  };

  const toggleFilter = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const sortLabels: Record<string, string> = {
    "best-selling": "Best selling",
    featured: "Featured",
    "alpha-asc": "Alphabetically, A-Z",
    "alpha-desc": "Alphabetically, Z-A",
    "price-asc": "Price, low to high",
    "price-desc": "Price, high to low",
    "rating-desc": "Highest rated",
  };

  return (
    <div className="w-full bg-white min-h-screen">
      {/* Container */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-5 sm:py-8">
        {/* 1. Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-[13px] sm:text-[14px] text-[#747576] mb-3">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="text-[#1f3a2c] hover:underline">
                Home
              </Link>
            </li>
            <li>›</li>
            <li>
              <Link href="/collections/all" className="text-[#1f3a2c] hover:underline">
                Teas
              </Link>
            </li>
            <li>›</li>
            <li className="text-[#202020] font-medium truncate max-w-[200px]">
              {currentCollection.name}
            </li>
          </ol>
        </nav>

        {/* 2. Collection Title & Description */}
        <div className="mb-6">
          <h1 className="font-stencil text-[32px] sm:text-[40px] lg:text-[48px] font-bold text-[#202020] leading-tight mb-2 tracking-[-0.5px]">
            {currentCollection.name}
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#5c5a52] max-w-[720px] leading-relaxed">
            {currentCollection.description}
          </p>
        </div>

        {/* 3. Category quick pills carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {COLLECTIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCollection(c.id)}
              className={`text-[13px] sm:text-[14px] px-4 py-2 rounded-full whitespace-nowrap transition-all cursor-pointer font-medium border ${
                selectedCollection === c.id
                  ? "bg-[#1f3a2c] text-white border-[#1f3a2c] shadow-sm"
                  : "bg-[#fafafa] text-[#202020] border-[#e7e2d8] hover:border-[#1f3a2c]"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="border-t border-[#e7e2d8] pt-4 mb-6">
          {/* 4. Controls Bar: Filters Button + Active Count + Sort Dropdown */}
          <div className="flex items-center justify-between gap-4">
            {/* Filter Toggle Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className="border border-[#202020] rounded-lg px-4 py-2.5 text-[14px] font-semibold text-[#202020] hover:bg-[#fafafa] transition-colors flex items-center gap-2.5 cursor-pointer shadow-xs"
              >
                <SlidersHorizontal size={17} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-[#02cb5a] text-[#1f3a2c] text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
                <ChevronDown size={14} className="text-[#5c5a52]" />
              </button>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="hidden sm:inline-block text-[13px] text-[#5c5a52] hover:text-[#e53935] underline cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Results count (desktop) */}
            <span className="hidden md:inline-block text-[14px] text-[#747576]">
              Showing {sortedProducts.length} {sortedProducts.length === 1 ? "tea" : "teas"}
            </span>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="border border-[#202020] rounded-lg px-4 py-2.5 text-[14px] font-semibold text-[#202020] hover:bg-[#fafafa] transition-colors flex items-center gap-2 cursor-pointer shadow-xs min-w-[190px] justify-between"
              >
                <span>
                  Sort by: <span className="font-normal text-[#5c5a52]">{sortLabels[sortBy] || "Best selling"}</span>
                </span>
                <ChevronDown size={14} className="text-[#5c5a52]" />
              </button>

              {/* Sort Dropdown Menu */}
              {isSortOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsSortOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-[230px] bg-white border border-[#e7e2d8] rounded-lg shadow-xl z-40 py-2 animate-in fade-in zoom-in-95 duration-100">
                    {Object.entries(sortLabels).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSortBy(key);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-[13.5px] flex items-center justify-between hover:bg-[#fafafa] transition-colors cursor-pointer ${
                          sortBy === key ? "font-bold text-[#016c2f] bg-[#f0f9f3]" : "text-[#202020]"
                        }`}
                      >
                        <span>{label}</span>
                        {sortBy === key && <Check size={15} className="text-[#016c2f]" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-4">
              {selectedFormats.map((f) => (
                <span
                  key={f}
                  className="bg-[#fafafa] border border-[#e7e2d8] text-[12px] font-medium text-[#202020] px-2.5 py-1 rounded-full flex items-center gap-1.5"
                >
                  {f}
                  <button
                    type="button"
                    onClick={() => toggleFilter(selectedFormats, setSelectedFormats, f)}
                    className="hover:text-[#e53935]"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}

              {selectedCaffeine.map((c) => (
                <span
                  key={c}
                  className="bg-[#fafafa] border border-[#e7e2d8] text-[12px] font-medium text-[#202020] px-2.5 py-1 rounded-full flex items-center gap-1.5"
                >
                  {c} Caffeine
                  <button
                    type="button"
                    onClick={() => toggleFilter(selectedCaffeine, setSelectedCaffeine, c)}
                    className="hover:text-[#e53935]"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}

              {selectedRegions.map((r) => (
                <span
                  key={r}
                  className="bg-[#fafafa] border border-[#e7e2d8] text-[12px] font-medium text-[#202020] px-2.5 py-1 rounded-full flex items-center gap-1.5"
                >
                  {r}
                  <button
                    type="button"
                    onClick={() => toggleFilter(selectedRegions, setSelectedRegions, r)}
                    className="hover:text-[#e53935]"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}

              {selectedDiscounts.map((d) => (
                <span
                  key={d}
                  className="bg-[#fafafa] border border-[#e7e2d8] text-[12px] font-medium text-[#202020] px-2.5 py-1 rounded-full flex items-center gap-1.5"
                >
                  {d}%+ Off
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDiscounts(selectedDiscounts.filter((x) => x !== d))
                    }
                    className="hover:text-[#e53935]"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}

              {priceRange !== "all" && (
                <span className="bg-[#fafafa] border border-[#e7e2d8] text-[12px] font-medium text-[#202020] px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  Price: {priceRange}
                  <button
                    type="button"
                    onClick={() => setPriceRange("all")}
                    className="hover:text-[#e53935]"
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[12px] text-[#5c5a52] hover:text-[#e53935] underline ml-2 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* 5. Main Product Grid */}
        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-xl p-10 sm:p-16 text-center flex flex-col items-center justify-center my-8">
            <h3 className="font-stencil text-[22px] sm:text-[26px] font-bold text-[#202020] mb-2">
              No teas found
            </h3>
            <p className="text-[14px] sm:text-[15px] text-[#5c5a52] max-w-[420px] mb-6">
              We couldn&apos;t find any teas matching your selected filters. Try removing some filters to discover more blends.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="bg-[#02cb5a] text-[#1f3a2c] font-bold text-[14px] px-6 py-3 rounded-lg hover:brightness-105 transition-all shadow-sm cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 6. Filter Drawer (Slide-in from Left, exact match to live site)      */}
      {/* ==================================================================== */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsFilterOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-[360px] sm:max-w-[400px] bg-white h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-250">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-[#e7e2d8] flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-bold text-[#202020]">Filters</h2>
                {activeFiltersCount > 0 && (
                  <span className="text-[13px] text-[#5c5a52]">({activeFiltersCount})</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="p-1 text-[#202020] hover:text-[#016c2f] transition-colors cursor-pointer"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-[#202020]">
              {/* Sort by Section */}
              <div className="border-b border-[#e7e2d8] pb-5">
                <h3 className="text-[15px] font-bold text-[#202020] mb-3">Sort by</h3>
                <div className="space-y-2">
                  {Object.entries(sortLabels).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 cursor-pointer text-[14px] text-[#3d3b36] hover:text-[#016c2f]"
                    >
                      <input
                        type="radio"
                        name="sort-drawer"
                        checked={sortBy === key}
                        onChange={() => setSortBy(key)}
                        className="accent-[#02cb5a] w-4 h-4 cursor-pointer"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Shop By Discount */}
              <div className="border-b border-[#e7e2d8] pb-5">
                <h3 className="text-[15px] font-bold text-[#202020] mb-3">Shop By Discount</h3>
                <div className="space-y-2.5">
                  {[30, 20, 10].map((disc) => (
                    <label
                      key={disc}
                      className="flex items-center gap-3 cursor-pointer text-[14px] text-[#3d3b36] hover:text-[#016c2f]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDiscounts.includes(disc)}
                        onChange={() => {
                          if (selectedDiscounts.includes(disc)) {
                            setSelectedDiscounts(selectedDiscounts.filter((x) => x !== disc));
                          } else {
                            setSelectedDiscounts([...selectedDiscounts, disc]);
                          }
                        }}
                        className="accent-[#02cb5a] w-4 h-4 rounded cursor-pointer"
                      />
                      <span>{disc}% or more</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Product Type / Format */}
              <div className="border-b border-[#e7e2d8] pb-5">
                <h3 className="text-[15px] font-bold text-[#202020] mb-3">Product Type</h3>
                <div className="space-y-2.5">
                  {formatsList.map((f) => (
                    <label
                      key={f}
                      className="flex items-center gap-3 cursor-pointer text-[14px] text-[#3d3b36] hover:text-[#016c2f]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFormats.includes(f)}
                        onChange={() => toggleFilter(selectedFormats, setSelectedFormats, f)}
                        className="accent-[#02cb5a] w-4 h-4 rounded cursor-pointer"
                      />
                      <span>{f}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Region */}
              <div className="border-b border-[#e7e2d8] pb-5">
                <h3 className="text-[15px] font-bold text-[#202020] mb-3">Origin / Region</h3>
                <div className="space-y-2.5">
                  {regionsList.map((r) => (
                    <label
                      key={r}
                      className="flex items-center gap-3 cursor-pointer text-[14px] text-[#3d3b36] hover:text-[#016c2f]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRegions.includes(r)}
                        onChange={() => toggleFilter(selectedRegions, setSelectedRegions, r)}
                        className="accent-[#02cb5a] w-4 h-4 rounded cursor-pointer"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Caffeine Level */}
              <div className="border-b border-[#e7e2d8] pb-5">
                <h3 className="text-[15px] font-bold text-[#202020] mb-3">Caffeine Level</h3>
                <div className="space-y-2.5">
                  {caffeineList.map((c) => (
                    <label
                      key={c}
                      className="flex items-center gap-3 cursor-pointer text-[14px] text-[#3d3b36] hover:text-[#016c2f]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCaffeine.includes(c)}
                        onChange={() => toggleFilter(selectedCaffeine, setSelectedCaffeine, c)}
                        className="accent-[#02cb5a] w-4 h-4 rounded cursor-pointer"
                      />
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-[15px] font-bold text-[#202020] mb-3">Price</h3>
                <div className="space-y-2.5">
                  {[
                    { id: "all", label: "All Prices" },
                    { id: "under-300", label: "Under ₹300" },
                    { id: "300-600", label: "₹300 - ₹600" },
                    { id: "600-1000", label: "₹600 - ₹1,000" },
                    { id: "over-1000", label: "Over ₹1,000" },
                  ].map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 cursor-pointer text-[14px] text-[#3d3b36] hover:text-[#016c2f]"
                    >
                      <input
                        type="radio"
                        name="price-drawer"
                        checked={priceRange === p.id}
                        onChange={() => setPriceRange(p.id)}
                        className="accent-[#02cb5a] w-4 h-4 cursor-pointer"
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#e7e2d8] bg-white sticky bottom-0 flex gap-3">
              <button
                type="button"
                onClick={clearAllFilters}
                className="w-1/3 border border-[#e7e2d8] hover:border-[#1f3a2c] text-[#202020] font-semibold text-[14px] py-3 rounded-lg transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="w-2/3 bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[14px] py-3 rounded-lg transition-colors cursor-pointer shadow-sm text-center"
              >
                Apply ({sortedProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./context/CartContext";
import { Search, X, ArrowRight } from "lucide-react";

const searchableItems = [
  {
    id: "abhay-ras-chai",
    title: "Abhay Ras Chai",
    category: "Chai",
    price: 449,
    weight: "150G",
    image: "/assets/product-abhay-ras.webp",
    description: "Bright & Tangy · Caffeine-free",
  },
  {
    id: "ashoka-ras-chai",
    title: "Ashoka Ras Chai",
    category: "Chai",
    price: 429,
    weight: "150G",
    image: "/assets/product-ashoka-ras.webp",
    description: "Naturally Sweet · Herbal Lift",
  },
  {
    id: "ojas-ras-chai",
    title: "Ojas Ras Chai",
    category: "Chai",
    price: 499,
    weight: "150G",
    image: "/assets/product-ojas-ras.webp",
    description: "Mint & Spiced · Lemongrass lift",
  },
  {
    id: "teabox-kadak-chai",
    title: "Teabox Kadak Chai",
    category: "Chai",
    price: 200,
    weight: "250G",
    image: "/assets/product-kadak-chai.webp",
    description: "Bold & Earthy · Everyday Cup",
  },
  {
    id: "the-ramayana-chai-collection",
    title: "RAMAYANA COLLECTION",
    category: "Trial Packs",
    price: 1170,
    weight: "450G",
    image: "/assets/pack-ramayana.webp",
    description: "Ayurvedic chai · herbs & spices",
  },
  {
    id: "ayurvedic-chai-trial-pack",
    title: "Ayurvedic Chai Trial Pack",
    category: "Trial Packs",
    price: 1598,
    weight: "240G",
    image: "/assets/pack-ayurvedic.webp",
    description: "10 ayurvedic chai blends + Free cup",
  },
  {
    id: "promo-prebiotic",
    title: "Prebiotic Instant Tea Mix",
    category: "Premix",
    price: 599,
    weight: "100G",
    image: "/assets/promo-prebiotic.webp",
    description: "Real Assam tea + gut-friendly prebiotics",
  },
];

export default function SearchDrawer() {
  const { isSearchOpen, closeSearch, addToCart } = useCart();
  const [query, setQuery] = useState("");

  if (!isSearchOpen) return null;

  const popularKeywords = [
    "Kadak Chai",
    "Darjeeling",
    "Trial Pack",
    "Ayurvedic",
    "Prebiotic",
    "Green Tea",
  ];

  const filteredItems = query.trim()
    ? searchableItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={closeSearch}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-[460px] bg-white shadow-2xl flex flex-col justify-between overflow-hidden border-l border-[#e7e2d8]">
          {/* Search Header */}
          <div className="p-5 border-b border-[#e7e2d8] flex items-center gap-3 bg-white">
            <Search size={22} className="text-[#5c5a52] flex-shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for teas, chai, harvest..."
              className="flex-1 text-[16px] text-[#202020] placeholder-[#747576] outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-[13px] text-[#747576] hover:text-[#202020] font-medium"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={closeSearch}
              className="p-1.5 text-[#5c5a52] hover:text-[#202020] rounded-full hover:bg-[#f0f0f0] transition-colors ml-1"
              aria-label="Close search"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {query.trim() === "" ? (
              <div className="flex flex-col gap-6">
                <div>
                  <h4 className="text-[13px] font-bold tracking-wider uppercase text-[#747576] mb-3">
                    Popular Searches
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {popularKeywords.map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => setQuery(kw)}
                        className="px-3.5 py-1.5 rounded-full bg-[#fafafa] hover:bg-[#02cb5a]/15 text-[#1f3a2c] text-[13px] font-medium border border-[#e7e2d8] transition-colors"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[13px] font-bold tracking-wider uppercase text-[#747576] mb-3">
                    Trending This Season
                  </h4>
                  <div className="flex flex-col gap-3">
                    {searchableItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          closeSearch();
                          addToCart({
                            id: item.id,
                            title: item.title,
                            price: item.price,
                            image: item.image,
                            weight: item.weight,
                          });
                        }}
                        className="p-2.5 rounded-lg border border-[#e7e2d8] hover:border-[#02cb5a] flex items-center justify-between cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded bg-[#fafafa] overflow-hidden flex-shrink-0">
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-[14px] font-bold text-[#202020] group-hover:text-[#016c2f]">
                              {item.title}
                            </div>
                            <div className="text-[12px] text-[#5c5a52]">
                              ₹{item.price} · {item.weight}
                            </div>
                          </div>
                        </div>
                        <span className="text-[12px] font-bold text-[#016c2f] group-hover:translate-x-0.5 transition-transform">
                          Add +
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 text-center text-[#5c5a52]">
                <p className="text-[16px] font-bold text-[#202020] mb-1">
                  No matching teas found
                </p>
                <p className="text-[14px]">
                  Try searching for &quot;Chai&quot;, &quot;Trial Pack&quot;, or &quot;Darjeeling&quot;
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="text-[13px] text-[#747576] font-medium mb-1">
                  {filteredItems.length} results found
                </div>
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-[#e7e2d8] hover:border-[#02cb5a] flex items-center justify-between transition-colors bg-white shadow-2xs group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-14 h-14 rounded-lg bg-[#fafafa] overflow-hidden flex-shrink-0 border border-[#e7e2d8]">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[14px] font-bold text-[#202020] group-hover:text-[#016c2f] truncate">
                          {item.title}
                        </div>
                        <div className="text-[12px] text-[#5c5a52] truncate">
                          {item.description}
                        </div>
                        <div className="text-[13px] font-bold text-[#1f3a2c] mt-0.5">
                          ₹{item.price} ({item.weight})
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        closeSearch();
                        addToCart({
                          id: item.id,
                          title: item.title,
                          price: item.price,
                          image: item.image,
                          weight: item.weight,
                        });
                      }}
                      className="px-3 py-1.5 bg-[#02cb5a] hover:bg-[#01b850] text-[#1f3a2c] text-[12px] font-bold rounded uppercase whitespace-nowrap transition-colors"
                    >
                      Add +
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-4 border-t border-[#e7e2d8] bg-[#fafafa] text-center text-[12px] text-[#5c5a52]">
            Free express delivery on all orders above ₹399
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useCart } from "./context/CartContext";
import Link from "next/link";
import { Check, Star } from "lucide-react";

interface TrialPack {
  id: string;
  title: string;
  accent: string;
  accentColor: string;
  image: string;
  rating: number;
  reviewCount: number;
  features: string[];
  price: number;
  buttonLabel: string;
  weight: string;
}

const trialPacksData: TrialPack[] = [
  {
    id: "the-ramayana-chai-collection",
    title: "RAMAYANA COLLECTION",
    accent: "Ayurvedic chai · herbs & spices",
    accentColor: "#8a5a18",
    image: "/assets/pack-ramayana.webp",
    rating: 4.9,
    reviewCount: 120,
    features: [
      "3 ayurvedic chai blends",
      "450 g in all ≈ 225 cups",
      "Free Valencia teacup",
    ],
    price: 1170,
    buttonLabel: "ADD COLLECTION — ₹1,170",
    weight: "450G",
  },
  {
    id: "ayurvedic-chai-trial-pack",
    title: "Ayurvedic Chai Trial Pack",
    accent: "Ayurvedic chai · herbs & spices",
    accentColor: "#202020",
    image: "/assets/pack-ayurvedic.webp",
    rating: 4.98,
    reviewCount: 123,
    features: [
      "10 ayurvedic chai blends",
      "240 g in all ≈ 130 cups",
      "Free Valencia teacup + spoon",
    ],
    price: 1598,
    buttonLabel: "ADD AYURVEDIC PACK — ₹1,598",
    weight: "240G",
  },
  {
    id: "authentic-indian-chai-tea-trial-pack",
    title: "Authentic Indian Chai Trial Pack (Special Diwali Edition)",
    accent: "Whole spices · bold & strong",
    accentColor: "#5c4a1b",
    image: "/assets/pack-indian-chai.webp",
    rating: 5.0,
    reviewCount: 9,
    features: [
      "10 chai blends - masala, ginger…",
      "30 g each · 300 g total ≈ 150 cups",
      "Free Valencia teacup + spoon",
    ],
    price: 1299,
    buttonLabel: "ADD DIWALI BOX — ₹1,299",
    weight: "300G",
  },
];

export default function TrialPacks() {
  const { addToCart } = useCart();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAddToCart = (e: React.MouseEvent, pack: TrialPack) => {
    e.preventDefault();
    e.stopPropagation();
    setLoadingId(pack.id);
    setTimeout(() => {
      addToCart({
        id: pack.id,
        title: pack.title,
        price: pack.price,
        image: pack.image,
        weight: pack.weight,
      });
      setLoadingId(null);
    }, 250);
  };

  return (
    <section id="trial-packs" className="w-full bg-[#fafafa] border-t border-[#e7e2d8] py-10 sm:py-14 px-4 sm:px-8 lg:px-16">
      <div className="max-w-[1440px] mx-auto">
        {/* Heading Row */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h2 className="font-stencil text-[22px] sm:text-[28px] lg:text-[32px] font-bold text-[#202020] tracking-[-0.2px]">
              START WITH A TRIAL PACK
            </h2>
          </div>
          <div className="self-start sm:self-auto flex items-center gap-3">
            <span className="inline-block text-[#5c5a52] text-[13px] sm:text-[14px] font-medium border-[1.5px] border-[#02cb5a] rounded px-3 py-1 bg-white">
              One-time purchase. No subscription.
            </span>
            <Link
              href="/collections/trial-packs"
              className="hidden sm:inline-block text-[14px] font-bold text-[#1f3a2c] hover:text-[#016c2f] transition-colors"
            >
              View all trial packs →
            </Link>
          </div>
        </div>

        {/* 3-Column Pack Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {trialPacksData.map((pack) => {
            const productHref = `/products/${pack.id}`;
            return (
              <div
                key={pack.id}
                className="group relative bg-white border-2 border-[#e7e2d8] hover:border-[#02cb5a] rounded-[10px] overflow-hidden flex flex-col justify-between shadow-sm transition-all duration-200"
              >
                {/* Media Image with Link */}
                <Link
                  href={productHref}
                  className="block relative aspect-square w-full bg-[#bfdcc9]/30 overflow-hidden cursor-pointer"
                >
                  <Image
                    src={pack.image}
                    alt={pack.title}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </Link>

                {/* Body Content */}
                <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 gap-4">
                  <div className="flex flex-col gap-2">
                    {/* Accent tag */}
                    <div
                      className="text-[13px] font-bold tracking-[0.8px] uppercase"
                      style={{ color: pack.accentColor }}
                    >
                      {pack.accent}
                    </div>

                    {/* Title with Link */}
                    <Link
                      href={productHref}
                      className="hover:text-[#016c2f] transition-colors cursor-pointer"
                    >
                      <h3 className="text-[17px] sm:text-[19px] font-bold text-[#202020] leading-snug">
                        {pack.title}
                      </h3>
                    </Link>

                    {/* Rating Stars */}
                    <div className="flex items-center gap-1.5 text-[13px] text-[#202020]">
                      <div className="flex text-[#e8770f]">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className="fill-[#e8770f] text-[#e8770f]"
                          />
                        ))}
                      </div>
                      <span className="font-semibold">{pack.rating}</span>
                      <span className="text-[#5c5a52]">({pack.reviewCount})</span>
                    </div>

                    {/* Bullet features */}
                    <ul className="flex flex-col gap-1 text-[14px] text-[#3d3b36] pt-1">
                      {pack.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <Check size={14} className="text-[#02cb5a] stroke-[2.5]" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-[#f0ece4]">
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(e, pack)}
                      disabled={loadingId === pack.id}
                      className="w-full bg-[#02cb5a] hover:bg-[#01b850] text-[#1f3a2c] font-bold text-[14px] sm:text-[15px] py-3.5 px-4 rounded-[6px] tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-none active:brightness-95"
                    >
                      {loadingId === pack.id ? (
                        <span className="inline-block w-4 h-4 border-2 border-[#1f3a2c] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>{pack.buttonLabel}</span>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-[12px] sm:text-[13px] text-[#5c5a52] px-1">
                      <span>Ships in 24h · 2–4 days</span>
                      <Link
                        href={productHref}
                        className="text-[#1f3a2c] hover:text-[#016c2f] font-semibold transition-colors underline decoration-[#02cb5a] underline-offset-2"
                      >
                        Details ➝
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

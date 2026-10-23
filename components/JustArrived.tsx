"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./context/CartContext";
import { Star } from "lucide-react";

interface Product {
  id: string;
  title: string;
  primaryImage: string;
  secondaryImage: string;
  pointers: string;
  rating?: number;
  reviewCount?: number;
  weight: string;
  price: number;
}

const productsData: Product[] = [
  {
    id: "abhay-ras-chai",
    title: "Abhay Ras Chai",
    primaryImage: "/assets/product-abhay-ras.webp",
    secondaryImage: "/assets/product-abhay-ras-hover.webp",
    pointers: "Bright & Tangy · Caffeine-free",
    weight: "150G",
    price: 449,
  },
  {
    id: "ashoka-ras-chai",
    title: "Ashoka Ras Chai",
    primaryImage: "/assets/product-ashoka-ras.webp",
    secondaryImage: "/assets/product-ashoka-ras-hover.webp",
    pointers: "Naturally Sweet · Herbal Lift",
    weight: "150G",
    price: 429,
  },
  {
    id: "ojas-ras-chai",
    title: "Ojas Ras Chai",
    primaryImage: "/assets/product-ojas-ras.webp",
    secondaryImage: "/assets/product-ojas-ras-hover.webp",
    pointers: "Mint & Spiced · Lemongrass lift",
    weight: "150G",
    price: 499,
  },
  {
    id: "teabox-kadak-chai",
    title: "Teabox Kadak Chai",
    primaryImage: "/assets/product-kadak-chai.webp",
    secondaryImage: "/assets/product-kadak-chai-hover.webp",
    pointers: "Bold & Earthy · Everyday Cup",
    rating: 4.82,
    reviewCount: 119,
    weight: "250G",
    price: 200,
  },
];

export default function JustArrived() {
  const { addToCart } = useCart();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAddProduct = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setLoadingId(product.id);
    setTimeout(() => {
      addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.primaryImage,
        weight: product.weight,
      });
      setLoadingId(null);
    }, 250);
  };

  return (
    <section
      id="full-size-chais"
      className="w-full bg-[#fafafa] py-[26px] lg:py-0 lg:pb-[56px] lg:px-16"
    >
      <div className="max-w-[1440px] mx-auto">
        {/* Header: px-4 on mobile, px-0 on desktop */}
        <div className="px-4 lg:px-0 mb-3 lg:mb-[18px] flex items-baseline justify-between">
          <div>
            <h2 className="font-stencil text-[22px] sm:text-[26px] lg:text-[30px] font-bold text-[#202020] tracking-[-0.2px] m-0">
              FULL SIZE CHAIS
            </h2>
            <p className="text-[14px] sm:text-[15px] lg:text-[16px] text-[#5c5a52] m-0">
              Our most-loved chais, in full packs
            </p>
          </div>
          {/* Top link visible only on desktop (lg: >= 1000px) */}
          <Link
            href="/collections/chai"
            className="hidden lg:block text-[15px] font-bold text-[#1f3a2c] av-hover-underline ml-auto hover:text-[#016c2f] transition-colors"
          >
            View all chais →
          </Link>
        </div>

        {/* Product Cards Container */}
        <div className="flex lg:grid lg:grid-cols-4 gap-3 lg:gap-5 overflow-x-auto lg:overflow-visible px-4 lg:px-0 pb-1.5 lg:pb-0 no-scrollbar scroll-smooth">
          {productsData.map((product) => {
            const productHref = `/products/${product.id}`;
            return (
              <div
                key={product.id}
                className="min-w-[190px] max-w-[75vw] sm:min-w-[240px] lg:min-w-0 flex-none lg:flex-initial group bg-white border border-[#e7e2d8] rounded-[12px] overflow-hidden flex flex-col justify-between"
              >
                {/* Product Media with Secondary Image Hover Transition + Link */}
                <Link
                  href={productHref}
                  className="block relative aspect-square w-full bg-[#fafafa] overflow-hidden cursor-pointer rounded-t-[12px]"
                >
                  <Image
                    src={product.primaryImage}
                    alt={product.title}
                    fill
                    unoptimized
                    className="object-cover transition-opacity duration-300 group-hover:opacity-0"
                    sizes="(max-width: 640px) 200px, (max-width: 1024px) 260px, 25vw"
                  />
                  <Image
                    src={product.secondaryImage}
                    alt={`${product.title} lifestyle view`}
                    fill
                    unoptimized
                    className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    sizes="(max-width: 640px) 200px, (max-width: 1024px) 260px, 25vw"
                  />
                </Link>

                {/* Product Info: Exact Live Teabox tb-product-card__info */}
                <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 gap-3 tb-product-card__info">
                  <div className="flex flex-col">
                    <div className="flex flex-col gap-[2px] w-full">
                      <span className="product-card__title block">
                        <Link
                          href={productHref}
                          className="font-bold text-[16px] sm:text-[17px] text-[#202020] hover:text-[#016c2f] transition-colors leading-[1.35] line-clamp-2 block"
                        >
                          {product.title}
                        </Link>
                      </span>
                      <p className="product-card__pointers text-[13.5px] sm:text-[14px] text-[#5c5a52] hover:text-[#202020] line-clamp-1 leading-normal m-0 block font-normal">
                        {product.pointers}
                      </p>
                    </div>

                    {/* Star Reviews matching live site */}
                    {product.reviewCount ? (
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="flex items-center text-[#e5a524]">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={13.5}
                              className="fill-[#e5a524] text-[#e5a524]"
                            />
                          ))}
                        </div>
                        <span className="text-[12.5px] sm:text-[13px] text-[#5c5a52] font-medium">
                          ({product.reviewCount})
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Add to Cart Button & More Sizes */}
                  <div className="pt-2 flex flex-col">
                    <button
                      type="button"
                      onClick={(e) => handleAddProduct(e, product)}
                      disabled={loadingId === product.id}
                      className="w-full bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[13px] sm:text-[14px] h-[42px] py-2 px-3 rounded-[6px] tracking-[0.3px] uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-none active:brightness-95"
                    >
                      {loadingId === product.id ? (
                        <span className="inline-block w-4 h-4 border-2 border-[#1f3a2c] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>
                          ADD {product.weight} — ₹{product.price}
                        </span>
                      )}
                    </button>

                    <Link
                      href={productHref}
                      className="more-sizes-btn text-[13px] sm:text-[13.5px] font-medium text-[#1f3a2c] hover:text-[#016c2f] text-center transition-colors underline decoration-[#02cb5a] underline-offset-4 mt-[7px] block"
                    >
                      More Sizes ➝
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Footer: View all chais link below carousel */}
        <div className="block lg:hidden px-4 pt-2.5">
          <Link
            href="/collections/chai"
            className="text-[15px] font-bold text-[#1f3a2c] av-hover-underline hover:text-[#016c2f] transition-colors"
          >
            View all chais →
          </Link>
        </div>
      </div>
    </section>
  );
}

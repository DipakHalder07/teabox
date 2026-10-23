"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { Product } from "@/data/products";
import { useCart } from "./context/CartContext";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const productUrl = product.url || `/products/${product.handle || product.id}`;
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: `${product.id}-${product.weight || "default"}`,
      title: product.title,
      weight: product.weight || "",
      price: product.price,
      image: product.image,
    });
  };

  const hasMultipleSizes = product.weights && product.weights.length > 1;

  // Format button label matching live site: e.g. "ADD 250G — ₹200" or "ADD — ₹1,199"
  const buttonLabel = product.weight
    ? `ADD ${product.weight.toUpperCase()} — ₹${product.price.toLocaleString("en-IN")}`
    : `ADD — ₹${product.price.toLocaleString("en-IN")}`;

  return (
    <div
      className="group relative bg-white border border-[#E7E2D8] rounded-[12px] overflow-hidden flex flex-col justify-between"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Figure with 1:1 Aspect Ratio and Smooth Cross-Fade Hover */}
      <div className="relative w-full aspect-square bg-[#fafafa] overflow-hidden rounded-t-[12px]">
        {/* Badge: Bottom-right, flush with edge, matching live site */}
        {product.badge && (
          <span className="absolute bottom-0 right-0 z-10 bg-[#1c3327] text-white text-[10.5px] sm:text-[11px] font-bold tracking-[1px] uppercase px-2 sm:px-2.5 py-1 rounded-tl-[4px] pointer-events-none">
            {product.badge}
          </span>
        )}

        <Link href={productUrl} className="block w-full h-full relative">
          {/* Primary Image */}
          <Image
            src={product.image}
            alt={product.title}
            fill
            className={`object-contain transition-opacity duration-200 ${
              product.secondaryImage && product.secondaryImage !== product.image
                ? "group-hover:opacity-0"
                : ""
            }`}
            sizes="(max-width: 699px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* Secondary Image on Hover (No zoom, pure cross-fade) */}
          {product.secondaryImage && product.secondaryImage !== product.image && (
            <Image
              src={product.secondaryImage}
              alt={`${product.title} secondary`}
              fill
              className="object-contain transition-opacity duration-200 opacity-0 group-hover:opacity-100"
              sizes="(max-width: 699px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          )}
        </Link>
      </div>

      {/* 2. Card Info Body: Exact Live Teabox tb-product-card__info */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3 tb-product-card__info">
        {/* Title & Description with exact live 2px gap (gap-0.5) */}
        <div className="flex flex-col">
          <div className="flex flex-col gap-[2px] w-full">
            <span className="product-card__title block">
              <Link
                href={productUrl}
                className="font-bold text-[16px] sm:text-[17px] text-[#202020] hover:text-[#016c2f] transition-colors leading-[1.35] line-clamp-2 block"
              >
                {product.title}
              </Link>
            </span>
            <p className="product-card__pointers text-[13.5px] sm:text-[14px] text-[#5c5a52] hover:text-[#202020] line-clamp-1 leading-normal m-0 block font-normal">
              {product.subtitle}
            </p>
          </div>

          {/* Star Reviews matching live site */}
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
              ({product.reviewsCount})
            </span>
          </div>
        </div>

        {/* 3. Bottom CTA & More Sizes Link */}
        <div className="pt-2 flex flex-col">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[13px] sm:text-[14px] h-[42px] py-2 px-3 rounded-[6px] tracking-[0.3px] uppercase transition-colors shadow-none cursor-pointer flex items-center justify-center text-center active:brightness-95"
          >
            {buttonLabel}
          </button>

          {hasMultipleSizes ? (
            <Link
              href={productUrl}
              className="more-sizes-btn text-[13px] sm:text-[13.5px] font-medium text-[#1f3a2c] hover:text-[#016c2f] text-center transition-colors underline decoration-[#02cb5a] underline-offset-4 mt-[7px] block"
            >
              More Sizes ➝
            </Link>
          ) : (
            <div className="h-[27px] mt-[7px]" />
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { motion } from "motion/react";
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
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-white border border-[#E7E2D8] hover:border-[#1f3a2c]/30 hover:shadow-md rounded-[12px] overflow-hidden flex flex-col justify-between transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Figure with 1:1 Aspect Ratio and Smooth Cross-Fade Hover */}
      <div className="relative w-full aspect-square bg-[#fafafa] overflow-hidden rounded-t-[12px]">
        {/* Badge: Bottom-right, flush with edge, matching live site */}
        {product.badge && (
          <span className="absolute bottom-0 right-0 z-10 bg-[#1c3327] text-white text-[10px] sm:text-[11px] font-bold tracking-[1px] uppercase px-2 sm:px-2.5 py-1 rounded-tl-[4px] pointer-events-none">
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

      {/* 2. Card Info Body */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3">
        {/* Title & Subtitle */}
        <div className="flex flex-col gap-0.5">
          <Link
            href={productUrl}
            className="font-bold text-[14.5px] sm:text-[15px] text-[#202020] hover:text-[#016c2f] transition-colors leading-[1.35] line-clamp-2"
          >
            {product.title}
          </Link>
          <Link
            href={productUrl}
            className="text-[13px] text-[#5c5a52] hover:text-[#202020] line-clamp-1 leading-normal mt-0.5 block"
          >
            {product.subtitle}
          </Link>

          {/* Star Reviews */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center text-[#e5a524]">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className="fill-[#e5a524] text-[#e5a524]"
                />
              ))}
            </div>
            <span className="text-[12px] sm:text-[13px] text-[#202020] font-medium">
              ({product.reviewsCount})
            </span>
          </div>
        </div>

        {/* 3. Bottom CTA & More Sizes Link */}
        <div className="pt-2 flex flex-col">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[13px] sm:text-[14px] py-2.5 sm:py-3 px-3 rounded-[6px] tracking-[0.5px] uppercase transition-colors shadow-none cursor-pointer text-center active:brightness-95"
          >
            {buttonLabel}
          </button>

          {hasMultipleSizes ? (
            <Link
              href={productUrl}
              className="text-[13px] font-medium text-[#1f3a2c] hover:text-[#016c2f] text-center transition-colors underline decoration-[#02cb5a] underline-offset-4 mt-2 block"
            >
              More Sizes ➝
            </Link>
          ) : (
            <div className="h-[27px]" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

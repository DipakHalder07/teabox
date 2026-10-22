"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="w-full bg-white border-b border-[#e7e2d8]/60 overflow-hidden">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 items-center">
        {/* Media on Mobile appears on top, on Desktop appears on right */}
        <div className="order-1 lg:order-2 relative w-full h-[240px] sm:h-[360px] lg:h-full min-h-[380px] lg:min-h-[520px] bg-[#f2ece2]">
          <Image
            src="/assets/hero-banner.webp"
            alt="Fresh Indian Tea Harvest Selection"
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        {/* Content */}
        <div className="order-2 lg:order-1 px-5 py-8 sm:px-10 sm:py-12 lg:px-16 lg:py-16 flex flex-col justify-center gap-4 sm:gap-5">
          {/* Badge */}
          <div className="self-start inline-flex items-center gap-2 bg-[#fafafa] border border-[#e7e2d8] text-[#202020] rounded px-3 py-1.5 text-[12px] sm:text-[13px] font-bold tracking-[1px] uppercase">
            <span className="text-[#1f3a2c] tracking-tight text-[14px]">★★★★★</span>
            <span>TRUSTED BY 300,000+ HAPPY CUSTOMERS</span>
          </div>

          {/* Heading with Teabox Stencil */}
          <h1 className="font-stencil text-[32px] sm:text-[42px] lg:text-[46px] xl:text-[50px] font-bold text-[#202020] leading-[1.1] tracking-[-0.5px]">
            THE WORLD&apos;S BEST WAY TO BUY FRESH INDIAN TEA
          </h1>

          {/* Subheading */}
          <p className="text-[15px] sm:text-[17px] text-[#3d3b36] leading-[1.55] max-w-[500px]">
            Single-estate teas &amp; chai. Hand-sorted, vacuum-sealed within 48 hours of harvest, delivered direct. No middlemen. No warehouse years.
          </p>

          {/* CTA Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
            <Link
              href="#trial-packs"
              className="av-btn av-btn-fill px-7 py-3.5 sm:py-4 text-[15px] sm:text-[16px] text-center"
            >
              SHOP TRIAL PACKS
            </Link>
            <Link
              href="#full-size-chais"
              className="av-btn av-btn-outline px-7 py-3.5 sm:py-4 text-[15px] sm:text-[16px] text-center"
            >
              SHOP BEST SELLERS
            </Link>
          </div>

          {/* Guarantee */}
          <div className="text-[14px] text-[#5c5a52] text-center sm:text-left pt-1">
            Free shipping ₹399+ · Cash on delivery available
          </div>
        </div>
      </div>
    </section>
  );
}

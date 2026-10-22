"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function PromoSplit({ onOpenTeaFinder }: { onOpenTeaFinder?: () => void }) {
  return (
    <section id="promo-split" className="w-full bg-[#fafafa] px-4 pt-4 pb-0 lg:px-16 lg:pt-0 lg:pb-12">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-4 lg:grid lg:grid-cols-[1.4fr_1fr] lg:gap-6 items-stretch">
        {/* Card 1: Prebiotic Instant Tea Promo */}
        <div className="group relative bg-white border border-[#e7e2d8] hover:border-[#02cb5a] rounded-[10px] overflow-hidden flex flex-col lg:grid lg:grid-cols-2 transition-colors duration-150">
          {/* Media with Link */}
          <Link
            href="/collections/premix"
            className="block relative w-full aspect-[752/480] lg:aspect-auto lg:h-full bg-[#fafafa] overflow-hidden cursor-pointer"
          >
            <span className="absolute top-[10px] left-[10px] z-20 bg-[#02cb5a] text-[#1f3a2c] text-[11px] font-bold tracking-[1px] uppercase px-[10px] py-[5px] rounded-[4px] pointer-events-none">
              WORLD&apos;S FIRST
            </span>
            <Image
              src="/assets/promo-prebiotic.webp"
              alt="Assorted Chai Premix"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 999px) 100vw, 40vw"
            />
          </Link>

          {/* Body */}
          <div className="p-[16px_18px_20px] lg:p-[26px_28px] flex flex-col gap-2 justify-center text-center lg:text-left">
            <Link href="/collections/premix" className="hover:text-[#016c2f] transition-colors cursor-pointer">
              <h3 className="text-[17px] lg:text-[18px] font-bold text-[#202020] leading-[1.2] m-0">
                THE WORLD&apos;S FIRST PREBIOTIC INSTANT TEA MIX
              </h3>
            </Link>
            <p className="text-[14px] text-[#5c5a52] leading-[1.5] m-0">
              Real Assam tea + gut-friendly prebiotics. Hot or iced, in seconds.
            </p>
            <Link
              href="/collections/premix"
              className="w-full lg:w-auto lg:self-start mt-1 py-[13px] px-5 text-[14px] font-bold bg-[#02cb5a] text-[#1f3a2c] rounded-[6px] tracking-[0.5px] text-center inline-block hover:brightness-105 transition-all cursor-pointer shadow-none"
            >
              SEE HOW IT WORKS →
            </Link>
          </div>
        </div>

        {/* Card 2: Tea Finder Quiz */}
        <div className="bg-[#e8e8e8] text-[#202020] rounded-[10px] p-[20px_18px] lg:p-7 flex flex-col justify-center items-center text-center gap-1 lg:gap-[10px] border border-transparent hover:border-[#202020] transition-colors duration-150">
          <h3 className="text-[17px] lg:text-[18px] font-bold text-[#202020] leading-snug m-0">
            NOT SURE WHERE TO START?
          </h3>
          <p className="text-[14px] text-[#3d3b36] mt-1 leading-[1.4] max-w-[360px] m-0">
            Tell us what you drink and we&apos;ll suggest a tea you&apos;ll love. Real people, 24/7.
          </p>
          <button
            type="button"
            onClick={onOpenTeaFinder}
            className="w-full lg:w-fit lg:mx-auto mt-3 lg:mt-2 py-[13px] lg:py-3.5 px-5 lg:px-6 text-[14px] font-bold bg-[#02cb5a] text-[#1f3a2c] rounded-[6px] tracking-[0.5px] text-center cursor-pointer hover:brightness-105 transition-all shadow-sm"
          >
            HELP ME FIND MY TEA →
          </button>
        </div>
      </div>
    </section>
  );
}

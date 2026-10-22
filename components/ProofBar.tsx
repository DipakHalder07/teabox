"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function ProofBar() {
  return (
    <aside className="w-full bg-[#e8e8e8] text-[#202020] border-b border-[#dedede] py-4 px-4 sm:px-8">
      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[14px] sm:text-[15px] font-medium">
        {/* Backed by Ratan Tata */}
        <div className="flex items-center gap-2.5">
          <Image
            src="/assets/ratan-tata.webp"
            alt="Ratan Tata"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover border border-[#c8c8c8] flex-shrink-0"
          />
          <span>
            Backed by the late{" "}
            <Link
              href="#why-teabox"
              className="text-[#1f3a2c] font-bold av-hover-underline"
            >
              Ratan Tata
            </Link>{" "}
            →
          </span>
        </div>

        {/* Separator */}
        <span className="hidden md:inline text-[#747576] select-none">|</span>

        {/* Press Coverage */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[#5c5a52]">
          <span className="font-semibold text-[#3d3b36]">As featured on</span>

          <div className="flex items-center gap-4 sm:gap-6 opacity-80 hover:opacity-100 transition-opacity">
            <Image
              src="/assets/press-forbes.svg"
              alt="Forbes"
              width={75}
              height={22}
              className="h-4 sm:h-5 w-auto object-contain grayscale hover:grayscale-0 transition-all"
            />
            <Image
              src="/assets/press-ndtv.svg"
              alt="NDTV"
              width={65}
              height={20}
              className="h-3.5 sm:h-4 w-auto object-contain grayscale hover:grayscale-0 transition-all"
            />
            <Image
              src="/assets/press-et.svg"
              alt="The Economic Times"
              width={90}
              height={20}
              className="h-3.5 sm:h-4.5 w-auto object-contain grayscale hover:grayscale-0 transition-all"
            />
            <Image
              src="/assets/press-mint.svg"
              alt="Mint"
              width={60}
              height={20}
              className="h-3.5 sm:h-4.5 w-auto object-contain grayscale hover:grayscale-0 transition-all"
            />
          </div>

          <Link
            href="#why-teabox"
            className="text-[#1f3a2c] font-bold av-hover-underline text-[13px] sm:text-[14px]"
          >
            Read the coverage →
          </Link>
        </div>
      </div>
    </aside>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, MapPin } from "lucide-react";

export default function WhyTeabox() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section id="why-teabox" className="w-full bg-white">
      {/* ============================================================== */}
      {/* MOBILE VIEW (< 1000px): Exact live site cards layout          */}
      {/* ============================================================== */}
      <div className="lg:hidden px-4 pt-4 pb-6">
        <h2 className="font-stencil text-[22px] sm:text-[24px] font-bold text-center tracking-[1.5px] uppercase mb-4 text-[#1f3a2c]">
          WHY TEABOX
        </h2>

        <div className="flex flex-col gap-2">
          {/* Card 1: Photo / Video Card */}
          <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-[10px] overflow-hidden transition-colors hover:border-[#1f3a2c]">
            <div className="relative w-full aspect-[16/9] bg-[#0e1713] overflow-hidden">
              <Image
                src="/assets/why-teabox-map.webp"
                alt="Sourced hours from the estates"
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 999px) 100vw, 400px"
              />
              <span className="absolute top-2 left-2 z-20 bg-[rgba(20,32,26,0.85)] rounded-[4px] px-[9px] py-[5px] text-[11px] font-bold text-white flex items-center gap-1.5 pointer-events-none">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#02cb5a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 21.5 5 15a7.5 7.5 0 1 1 14 0Z"></path>
                  <path d="M12 13.5V7.5"></path>
                </svg>
                We are here
              </span>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[rgba(20,32,26,0.85)] flex items-center justify-center text-white cursor-pointer transition-transform active:scale-95 shadow-md"
                aria-label="Play video"
              >
                <Play size={20} className="fill-white translate-x-0.5" />
              </button>
            </div>

            <div className="p-3 sm:p-4">
              <p className="text-[16px] font-bold text-[#202020] mb-0.5 leading-snug">
                Sourced hours from the estates
              </p>
              <p className="text-[13.5px] text-[#5c5a52] leading-relaxed">
                Sorted &amp; vacuum-sealed within 48 hours of harvest - freshness locked in at the garden, not lost in a warehouse.
              </p>
            </div>
          </div>

          {/* Card 2: Star - Curated by master tasters */}
          <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-[10px] p-[14px_16px] flex items-center gap-3 transition-colors hover:border-[#026d30]">
            <span className="w-10 h-10 rounded-lg bg-[#fafafa] flex items-center justify-center shrink-0">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#026d30"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2.5 14.6 8l5.9.7-4.3 4.1 1.1 5.9L12 15.9 6.7 18.7l1.1-5.9L3.5 8.7 9.4 8Z"></path>
              </svg>
            </span>
            <div>
              <p className="text-[15px] font-bold text-[#202020] leading-tight">
                Curated by master tasters
              </p>
              <p className="text-[13.5px] text-[#5c5a52] leading-tight mt-0.5">
                Every lot tasted, 90% rejected.
              </p>
            </div>
          </div>

          {/* Card 3: Box - Tracked to your door */}
          <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-[10px] p-[14px_16px] flex items-center gap-3 transition-colors hover:border-[#026d30]">
            <span className="w-10 h-10 rounded-lg bg-[#fafafa] flex items-center justify-center shrink-0">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#026d30"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5Z"></path>
                <path d="M3.5 7.5 12 12l8.5-4.5"></path>
              </svg>
            </span>
            <div>
              <p className="text-[15px] font-bold text-[#202020] leading-tight">
                Tracked to your door
              </p>
              <p className="text-[13.5px] text-[#5c5a52] leading-tight mt-0.5">
                Ships in 24h · 2–4 days · COD
              </p>
            </div>
          </div>

          {/* Card 4: Loop - 68% of customers reorder */}
          <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-[10px] p-[14px_16px] flex items-center gap-3 transition-colors hover:border-[#026d30]">
            <span className="w-10 h-10 rounded-lg bg-[#fafafa] flex items-center justify-center shrink-0">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#026d30"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.5 12a8.5 8.5 0 1 1-2.9-6.4"></path>
                <path d="M20.5 3.5V9H15"></path>
              </svg>
            </span>
            <div>
              <p className="text-[15px] font-bold text-[#202020] leading-tight">
                68% of customers reorder
              </p>
              <p className="text-[13.5px] text-[#5c5a52] leading-tight mt-0.5">
                ★ 4.6 rating on Trustpilot.
              </p>
            </div>
          </div>

          {/* Card 5: Press - In CNN & NY Times */}
          <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-[10px] p-[14px_16px] flex items-center gap-3 transition-colors hover:border-[#026d30]">
            <span className="w-10 h-10 rounded-lg bg-[#fafafa] flex items-center justify-center shrink-0">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#026d30"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4.5h13v15H5.5A1.5 1.5 0 0 1 4 18Z"></path>
                <path d="M17 9h3v9a1.5 1.5 0 0 1-3 0Z"></path>
                <path d="M7.5 9h6"></path>
              </svg>
            </span>
            <div>
              <p className="text-[15px] font-bold leading-tight">
                <Link
                  href="https://in.teabox.com/pages/in-the-press"
                  className="text-[#1f3a2c] underline"
                >
                  In CNN &amp; NY Times →
                </Link>
              </p>
              <p className="text-[13.5px] text-[#5c5a52] leading-tight mt-0.5">
                Watch &amp; read the coverage.
              </p>
            </div>
          </div>

          {/* Card 6: User - Backed by late Ratan Tata */}
          <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-[10px] p-[14px_16px] flex items-center gap-3 transition-colors hover:border-[#026d30]">
            <span className="w-10 h-10 rounded-lg bg-[#fafafa] flex items-center justify-center shrink-0">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#026d30"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="4"></circle>
                <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"></path>
              </svg>
            </span>
            <div>
              <p className="text-[15px] font-bold leading-tight">
                <Link
                  href="https://in.teabox.com/pages/ratan-tata-backs-teabox-story"
                  className="text-[#1f3a2c] underline"
                >
                  Backed by the late Ratan Tata →
                </Link>
              </p>
              <p className="text-[13.5px] text-[#5c5a52] leading-tight mt-0.5">
                Why Kaushal started Teabox
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* DESKTOP VIEW (>= 1000px): Exact desktop layout                */}
      {/* ============================================================== */}
      <div className="hidden lg:block px-16 py-7 lg:py-10 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-2 gap-11 items-center">
          {/* Left Column: Story */}
          <div className="flex flex-col gap-3">
            <span className="text-[13px] font-bold tracking-[2.5px] uppercase text-[#202020]">
              WHY TEABOX
            </span>

            <blockquote className="font-stencil text-[36px] font-bold text-[#202020] leading-[1.18] tracking-[-0.3px]">
              “We live at the source. We pick the best. We ship it fresh.”
            </blockquote>

            <p className="text-[15px] text-[#5c5a52] leading-[1.5] max-w-[560px]">
              From Siliguri, hours from the estates, our tasters score every lot — only the best pass, vacuum-packed within 48 hours of harvest. That&apos;s what keeps your tea fresh: sealed at the garden, never warehoused.
            </p>

            {/* Founder Avatar & Story Link */}
            <div className="flex items-center gap-3 pt-1">
              <Image
                src="/assets/founder-kausshal.webp"
                alt="Kausshal Dugarr"
                width={44}
                height={44}
                unoptimized
                className="w-11 h-11 rounded-full object-cover border-2 border-[#e7e2d8] flex-shrink-0"
              />
              <div className="text-[15px] text-[#202020]">
                <span className="font-bold">Kausshal Dugarr</span>, founder ·{" "}
                <Link
                  href="#why-teabox"
                  className="font-bold text-[#1f3a2c] av-hover-underline"
                >
                  Why he started Teabox →
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Tea Garden Map & Media */}
          <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-[#e7e2d8] bg-[#0e1713]">
            <Image
              src="/assets/why-teabox-map.webp"
              alt="Darjeeling Tea Gardens"
              fill
              unoptimized
              className="object-cover"
              sizes="45vw"
            />

            {/* Play Button Overlay */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[rgba(20,32,26,0.85)] text-white flex items-center justify-center transition-transform hover:scale-110 shadow-lg cursor-pointer"
              aria-label="Play tea gardens footage"
            >
              <Play size={24} className="fill-white translate-x-0.5" />
            </button>

            {/* Location Pin */}
            <div className="absolute left-3 bottom-3 bg-[rgba(20,32,26,0.85)] rounded-md px-3 py-2 text-[12px] font-bold text-white flex items-center gap-2">
              <MapPin size={16} className="text-[#02cb5a]" />
              <span>We are here — among the Darjeeling gardens</span>
            </div>
          </div>
        </div>

        {/* Bottom 4-Stat Metric Row */}
        <div className="grid grid-cols-4 border-t border-[#e7e2d8] mt-6 pt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-[36px] font-bold text-[#202020] font-stencil leading-none">
              250+
            </span>
            <span className="text-[14px] text-[#5c5a52]">
              estates sourced directly
            </span>
          </div>

          <div className="flex items-baseline gap-2 border-l border-[#e7e2d8] pl-6">
            <span className="text-[36px] font-bold text-[#202020] font-stencil leading-none">
              48h
            </span>
            <span className="text-[14px] text-[#5c5a52]">
              harvest to vacuum-pack
            </span>
          </div>

          <div className="flex items-baseline gap-2 border-l border-[#e7e2d8] pl-6">
            <span className="text-[36px] font-bold text-[#202020] font-stencil leading-none">
              90%
            </span>
            <span className="text-[14px] text-[#5c5a52]">
              of lots rejected at source
            </span>
          </div>

          <div className="flex items-baseline gap-2 border-l border-[#e7e2d8] pl-6">
            <span className="text-[36px] font-bold text-[#202020] font-stencil leading-none">
              68%
            </span>
            <span className="text-[14px] text-[#5c5a52]">
              of customers reorder
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

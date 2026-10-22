"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Clock, Sprout, Heart, Award, ArrowRight, Check } from "lucide-react";
import SiteLayoutWrapper from "@/components/SiteLayoutWrapper";

export default function WhyTeaboxPage() {
  return (
    <SiteLayoutWrapper>
      <div className="w-full bg-white text-[#202020]">
        {/* Hero */}
        <section className="relative w-full bg-[#1f3a2c] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-12 text-center">
          <div className="max-w-[840px] mx-auto space-y-5">
            <span className="text-[#02cb5a] font-bold text-[13px] tracking-[2.5px] uppercase">
              THE TEABOX REVOLUTION
            </span>
            <h1 className="font-stencil text-[36px] sm:text-[50px] font-bold leading-tight">
              FROM BUSH TO CUP IN 48 HOURS
            </h1>
            <p className="text-[16px] sm:text-[18px] text-[#c9d6cd] leading-relaxed">
              We eliminated the antiquated 6-month middleman auction chain. For the first time in tea history, you experience single-estate tea as fresh as the garden pluckers taste it.
            </p>
          </div>
        </section>

        {/* 2-Column Story: Old Way vs Teabox Way */}
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-16 sm:py-24">
          <div className="text-center mb-14">
            <h2 className="font-stencil text-[30px] sm:text-[40px] font-bold text-[#202020] mb-3">
              THE FRESHNESS TIMELINE
            </h2>
            <p className="text-[15px] sm:text-[16px] text-[#5c5a52] max-w-[600px] mx-auto">
              Compare how traditional supermarket tea ages vs how Teabox delivers garden freshness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Old Way */}
            <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-2xl p-7 sm:p-9 space-y-5">
              <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-4">
                <h3 className="font-bold text-[18px] text-[#8e8d8a] uppercase tracking-wide">
                  Traditional Industry Way
                </h3>
                <span className="bg-[#e7e2d8] text-[#5c5a52] text-[12px] font-bold px-2.5 py-1 rounded">
                  3–9 Months Old
                </span>
              </div>
              <ul className="space-y-4 text-[14px] text-[#5c5a52]">
                <li className="flex items-start gap-3">
                  <span className="text-[#d93838] font-bold text-[16px]">✕</span>
                  <span>Teas sit in humid estate warehouses waiting for bulk brokers.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#d93838] font-bold text-[16px]">✕</span>
                  <span>Traded in public auction houses over 8 to 12 weeks.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#d93838] font-bold text-[16px]">✕</span>
                  <span>Blended with cheap fillers to mask stale taste and aroma loss.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#d93838] font-bold text-[16px]">✕</span>
                  <span>Finally reaches supermarket shelves months after harvesting.</span>
                </li>
              </ul>
            </div>

            {/* The Teabox Way */}
            <div className="bg-[#f0f9f3] border-2 border-[#02cb5a] rounded-2xl p-7 sm:p-9 space-y-5 relative shadow-md">
              <span className="absolute -top-3 right-6 bg-[#02cb5a] text-[#1f3a2c] font-bold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider">
                Teabox Innovation
              </span>
              <div className="flex items-center justify-between border-b border-[#02cb5a]/30 pb-4">
                <h3 className="font-bold text-[18px] text-[#1f3a2c] uppercase tracking-wide">
                  The Teabox Direct Way
                </h3>
                <span className="bg-[#02cb5a]/20 text-[#016c2f] text-[12px] font-bold px-2.5 py-1 rounded">
                  24–48 Hours
                </span>
              </div>
              <ul className="space-y-4 text-[14px] text-[#1f3a2c]">
                <li className="flex items-start gap-3">
                  <Check size={18} className="text-[#02cb5a] shrink-0 mt-0.5" />
                  <span>Harvested by master pluckers in iconic Darjeeling, Assam &amp; Nilgiri gardens.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={18} className="text-[#02cb5a] shrink-0 mt-0.5" />
                  <span>Rushed to our Siliguri cold-chain facility right at the foothills within hours.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={18} className="text-[#02cb5a] shrink-0 mt-0.5" />
                  <span>Nitrogen flushed &amp; vacuum-sealed to freeze aromatic essential oils in time.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={18} className="text-[#02cb5a] shrink-0 mt-0.5" />
                  <span>Express dispatched straight to your doorstep across India and 125+ nations.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Sourcing Hubs Grid */}
        <section className="w-full bg-[#fafafa] border-y border-[#e7e2d8] py-16 px-4 sm:px-6 lg:px-12">
          <div className="max-w-[1200px] mx-auto text-center">
            <h2 className="font-stencil text-[28px] sm:text-[36px] font-bold text-[#202020] mb-3">
              SOURCED DIRECT FROM 273 ESTATES
            </h2>
            <p className="text-[15px] text-[#5c5a52] max-w-[620px] mx-auto mb-12">
              Every package carries the exact estate name, harvest flush date, altitude, and batch lot number.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  region: "Darjeeling",
                  alt: "6,000+ ft altitude",
                  desc: "The Champagne of Teas. Muscatel notes, floral bouquet, light golden liquor.",
                },
                {
                  region: "Assam",
                  alt: "Brahmaputra Valley",
                  desc: "Rich, malty, bold, robust amber liquor perfect with steamed milk and spices.",
                },
                {
                  region: "Nilgiri",
                  alt: "Blue Mountains, South India",
                  desc: "Vibrant, brisk, fragrant high-grown leaves that make refreshing morning and iced teas.",
                },
              ].map((item, idx) => (
                <div key={idx} className="bg-white border border-[#e7e2d8] rounded-xl p-6 text-left shadow-xs">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#016c2f] block mb-1">
                    {item.alt}
                  </span>
                  <h4 className="font-stencil text-[22px] font-bold text-[#202020] mb-2">
                    {item.region}
                  </h4>
                  <p className="text-[13.5px] text-[#5c5a52] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-16 text-center px-4">
          <div className="max-w-[600px] mx-auto space-y-4">
            <h3 className="font-stencil text-[28px] font-bold text-[#202020]">
              Taste The Difference Today
            </h3>
            <p className="text-[14px] text-[#5c5a52]">
              Order our Authentic Chai Trial Pack or discover 50+ single-estate fresh harvests.
            </p>
            <div className="pt-2">
              <Link
                href="/collections/all"
                className="inline-flex items-center gap-2 bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[15px] px-8 py-3.5 rounded-lg uppercase tracking-wider transition-colors shadow-sm"
              >
                <span>Shop All Teas</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteLayoutWrapper>
  );
}

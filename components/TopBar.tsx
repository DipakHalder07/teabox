"use client";

import React from "react";
import Link from "next/link";

export default function TopBar() {
  return (
    <aside className="w-full bg-white border-b border-[#e7e2d8] py-[9px] px-3 sm:px-6">
      <div className="max-w-[1440px] mx-auto flex items-center justify-center gap-2 sm:gap-2.5 text-[15px] sm:text-[16px] leading-normal font-normal text-[#202020]">
        <Link
          href="/pages/corporate-gifting-2026"
          className="text-[#1f3a2c] font-bold underline decoration-[#02cb5a] underline-offset-[3px] hover:opacity-80 transition-opacity"
        >
          Corporate Gifting
        </Link>
        <span className="text-[#5C5A52] select-none">|</span>
        <Link
          href="/track"
          className="text-[#1f3a2c] font-bold underline decoration-[#02cb5a] underline-offset-[3px] hover:opacity-80 transition-opacity"
        >
          Track
        </Link>
      </div>
    </aside>
  );
}

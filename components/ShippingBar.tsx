"use client";

import React from "react";

export default function ShippingBar() {
  return (
    <aside className="w-full bg-[#202020] text-white py-[9px] sm:py-[10px] px-3 sm:px-6 text-center text-[13px] sm:text-[15px] lg:text-[16px] font-semibold leading-normal">
      <div className="max-w-[1440px] mx-auto">
        <span className="hidden sm:inline">
          Free shipping on orders ₹399+ · Cash on delivery available · 2–4 days across India
        </span>
        <span className="sm:hidden inline">
          Free shipping ₹399+ · COD · 2–4 days
        </span>
      </div>
    </aside>
  );
}

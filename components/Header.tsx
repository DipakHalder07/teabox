"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./context/CartContext";
import { Search, User, ShoppingBag, Menu, X, ChevronDown, ArrowRight } from "lucide-react";

export default function Header({ onOpenTeaFinder }: { onOpenTeaFinder?: () => void }) {
  const { openCart, openSearch, totalCount } = useCart();
  const [activeMega, setActiveMega] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const [headerBottom, setHeaderBottom] = useState(68);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveMega(null);
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dynamically calculate header bottom so drawer is ALWAYS perfectly flush with header
  useEffect(() => {
    const updatePosition = () => {
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect();
        setHeaderBottom(Math.round(rect.bottom));
      }
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        ref={navRef}
        className="sticky top-0 z-40 w-full bg-white border-b border-[#e7e2d8] transition-shadow duration-200"
      >
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 xl:px-12 h-[68px] lg:h-[72px] flex items-center justify-between gap-4 relative">
          {/* Mobile Hamburger Toggle (hidden on desktop) */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#202020] hover:text-[#016c2f] transition-colors focus:outline-none cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Centered Brand Logo */}
          <div className="lg:hidden absolute left-1/2 -translate-x-1/2 flex items-center">
            <Link href="/" className="inline-block relative py-1">
              <Image
                src="/assets/teabox-logo.svg"
                alt="Teabox India"
                width={120}
                height={28}
                priority
                className="h-[25px] sm:h-[28px] w-auto object-contain"
              />
            </Link>
          </div>

          {/* Desktop Left Group: Brand Logo on Far Left + Navigation Items */}
          <div className="hidden lg:flex items-center gap-7 xl:gap-9">
            {/* Desktop Brand Logo */}
            <Link href="/" className="inline-block relative py-1 shrink-0">
              <Image
                src="/assets/teabox-logo.svg"
                alt="Teabox India"
                width={128}
                height={28}
                priority
                className="h-[25px] xl:h-[27px] w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="flex items-center gap-5 xl:gap-6">
              {/* Shop Teas with Mega Menu */}
              <div
                className="relative"
                onMouseEnter={() => {
                  setActiveMega("shop");
                  setActiveDropdown(null);
                }}
              >
                <Link
                  href="/collections/all"
                  className={`flex items-center gap-1.5 py-4 text-[15px] font-medium text-[#202020] hover:text-[#016c2f] transition-colors ${
                    activeMega === "shop" ? "text-[#016c2f]" : ""
                  }`}
                >
                  <span>Shop Teas</span>
                  <ChevronDown
                    size={13}
                    strokeWidth={2}
                    className={`transition-transform duration-200 ${
                      activeMega === "shop" ? "rotate-180 text-[#016c2f]" : "text-[#747576]"
                    }`}
                  />
                </Link>
              </div>

              {/* Direct links */}
              <Link
                href="/collections/trial-packs"
                className="text-[15px] font-medium text-[#202020] hover:text-[#016c2f] transition-colors whitespace-nowrap"
              >
                Trial Packs
              </Link>
              <Link
                href="/collections/chai"
                className="text-[15px] font-medium text-[#202020] hover:text-[#016c2f] transition-colors whitespace-nowrap"
              >
                Chai
              </Link>
              <Link
                href="/collections/green-tea"
                className="text-[15px] font-medium text-[#202020] hover:text-[#016c2f] transition-colors whitespace-nowrap"
              >
                Green
              </Link>
              <Link
                href="/collections/all"
                className="text-[15px] font-medium text-[#c87a1d] hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                Limited Edition
              </Link>

              {/* Gifts Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => {
                  setActiveDropdown("gifts");
                  setActiveMega(null);
                }}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  className={`flex items-center gap-1.5 py-4 text-[15px] font-medium text-[#202020] hover:text-[#016c2f] transition-colors cursor-pointer ${
                    activeDropdown === "gifts" ? "text-[#016c2f]" : ""
                  }`}
                >
                  <span>Gifts</span>
                  <ChevronDown
                    size={13}
                    strokeWidth={2}
                    className={`transition-transform duration-200 ${
                      activeDropdown === "gifts" ? "rotate-180 text-[#016c2f]" : "text-[#747576]"
                    }`}
                  />
                </button>

                {/* Gifts Dropdown Content */}
                {activeDropdown === "gifts" && (
                  <div className="absolute top-[calc(100%-8px)] left-0 min-w-[240px] bg-white border border-[#e7e2d8] rounded-lg shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <ul className="flex flex-col text-[14px] text-[#1f3a2c]">
                      <li>
                        <Link
                          href="/collections/gifts"
                          className="block px-5 py-2.5 hover:bg-[#fafafa] hover:text-[#016c2f] transition-colors"
                        >
                          All Gift Sets
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/collections/trial-packs"
                          className="block px-5 py-2.5 hover:bg-[#fafafa] hover:text-[#016c2f] transition-colors"
                        >
                          Festive Specials
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/collections/tea-accessories"
                          className="block px-5 py-2.5 hover:bg-[#fafafa] hover:text-[#016c2f] transition-colors"
                        >
                          Luxury Wooden Boxes &amp; Teaware
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/pages/corporate-gifting-2026"
                          className="block px-5 py-2.5 hover:bg-[#fafafa] hover:text-[#016c2f] transition-colors font-medium border-t border-[#e7e2d8]/60 mt-1"
                        >
                          Corporate Gifting
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Why Teabox */}
              <Link
                href="/pages/why-teabox"
                className="text-[15px] font-medium text-[#202020] hover:text-[#016c2f] transition-colors whitespace-nowrap"
              >
                Why Teabox
              </Link>
            </nav>
          </div>

          {/* Right Group: Action Icons & Search */}
          <div className="flex items-center gap-2.5 sm:gap-4 ml-auto">
            {/* Desktop Search Bar (Exact Live Teabox Style) */}
            <button
              type="button"
              onClick={openSearch}
              className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 w-[190px] xl:w-[220px] h-[38px] text-[13px] xl:text-[14px] text-[#747576] bg-[#f7f6f3] hover:bg-[#eae8e1] border border-[#dcd6cb] rounded-md transition-colors text-left group cursor-pointer"
            >
              <Search size={16} className="text-[#666] group-hover:text-[#202020] transition-colors shrink-0" />
              <span className="truncate">Search teas...</span>
            </button>

            {/* Mobile Search Icon */}
            <button
              type="button"
              onClick={openSearch}
              className="md:hidden p-2 text-[#202020] hover:text-[#016c2f] transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search size={22} strokeWidth={1.8} />
            </button>

            {/* Account Icon */}
            <Link
              href="/account/login"
              className="hidden sm:inline-flex p-2 text-[#202020] hover:text-[#016c2f] transition-colors cursor-pointer"
              aria-label="Account"
            >
              <User size={22} strokeWidth={1.8} />
            </Link>

            {/* Cart Icon & Count */}
            <button
              type="button"
              onClick={openCart}
              className="relative p-2 text-[#202020] hover:text-[#016c2f] transition-colors flex items-center justify-center cursor-pointer"
              aria-label={`Cart with ${totalCount} items`}
            >
              <ShoppingBag size={22} strokeWidth={1.8} />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#02cb5a] text-[#1f3a2c] text-[11px] font-bold w-[19px] h-[19px] rounded-full flex items-center justify-center shadow-sm">
                  {totalCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mega Menu Overlay */}
        {activeMega === "shop" && (
          <div
            className="absolute top-full left-0 right-0 bg-white border-b border-[#e7e2d8] shadow-2xl z-50 animate-in fade-in duration-200"
            onMouseLeave={() => setActiveMega(null)}
          >
            <div className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-8 pb-6">
              <div className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-6 gap-8 pb-8">
                {/* Column 1: By Type */}
                <div>
                  <h4 className="text-[14px] font-bold tracking-[1.5px] uppercase text-[#5c5a52] mb-4">
                    By Type
                  </h4>
                  <ul className="flex flex-col gap-2.5 text-[16px] text-[#1f3a2c]">
                    {[
                      "Premix",
                      "Herbal Chai",
                      "Black",
                      "Green",
                      "White",
                      "Oolong",
                      "Herbals",
                      "Breakfast",
                      "Matcha",
                    ].map((item) => (
                      <li key={item}>
                        <Link
                          href="#full-size-chais"
                          onClick={() => setActiveMega(null)}
                          className="hover:text-[#016c2f] transition-colors"
                        >
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 2: By Region */}
                <div>
                  <h4 className="text-[14px] font-bold tracking-[1.5px] uppercase text-[#5c5a52] mb-4">
                    By Region
                  </h4>
                  <ul className="flex flex-col gap-2.5 text-[16px] text-[#1f3a2c]">
                    {["Darjeeling", "Assam", "Nilgiri", "Kangra"].map((item) => (
                      <li key={item}>
                        <Link
                          href="#full-size-chais"
                          onClick={() => setActiveMega(null)}
                          className="hover:text-[#016c2f] transition-colors"
                        >
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 3: By Harvest */}
                <div>
                  <h4 className="text-[14px] font-bold tracking-[1.5px] uppercase text-[#5c5a52] mb-4">
                    By Flush/Season
                  </h4>
                  <ul className="flex flex-col gap-2.5 text-[16px] text-[#1f3a2c]">
                    {[
                      "First Flush (Spring)",
                      "Second Flush (Summer)",
                      "Autumn Flush",
                      "Winter Flush",
                    ].map((item) => (
                      <li key={item}>
                        <Link
                          href="#full-size-chais"
                          onClick={() => setActiveMega(null)}
                          className="hover:text-[#016c2f] transition-colors"
                        >
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 4: By Strength */}
                <div>
                  <h4 className="text-[14px] font-bold tracking-[1.5px] uppercase text-[#5c5a52] mb-4">
                    By Strength
                  </h4>
                  <ul className="flex flex-col gap-2.5 text-[16px] text-[#1f3a2c]">
                    {[
                      "Light & Floral",
                      "Medium & Balanced",
                      "Robust & Bold",
                      "Extra Kadak",
                    ].map((item) => (
                      <li key={item}>
                        <Link
                          href="#full-size-chais"
                          onClick={() => setActiveMega(null)}
                          className="hover:text-[#016c2f] transition-colors"
                        >
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 5: By Format */}
                <div>
                  <h4 className="text-[14px] font-bold tracking-[1.5px] uppercase text-[#5c5a52] mb-4">
                    By Format
                  </h4>
                  <ul className="flex flex-col gap-2.5 text-[16px] text-[#1f3a2c]">
                    {[
                      "Loose Leaf",
                      "Pyramid Teabags",
                      "Trial Samplers",
                      "Gift Tin Caddies",
                    ].map((item) => (
                      <li key={item}>
                        <Link
                          href="#full-size-chais"
                          onClick={() => setActiveMega(null)}
                          className="hover:text-[#016c2f] transition-colors"
                        >
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 6: Featured Teaser Card */}
                <div className="col-span-2 md:col-span-1">
                  <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-xl overflow-hidden hover:border-[#02cb5a] transition-all group">
                    <div className="relative aspect-[4/3] w-full bg-[#f0ede6]">
                      <span className="absolute top-2.5 left-2.5 z-10 bg-[#02cb5a] text-[#1f3a2c] text-[11px] font-bold tracking-wider px-2 py-0.5 rounded">
                        NEW LAUNCH
                      </span>
                      <Image
                        src="/assets/promo-prebiotic.webp"
                        alt="Prebiotic Instant Tea"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3.5 flex flex-col gap-1.5">
                      <p className="text-[15px] font-bold text-[#202020] leading-snug">
                        Prebiotic Instant Tea
                      </p>
                      <p className="text-[13px] text-[#5c5a52]">
                        Real Assam tea with gut-friendly prebiotic fibers.
                      </p>
                      <Link
                        href="#promo-split"
                        onClick={() => setActiveMega(null)}
                        className="text-[14px] font-bold text-[#1f3a2c] underline decoration-[#02cb5a] underline-offset-4 mt-1 flex items-center gap-1"
                      >
                        Explore Blend <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Mega Bar */}
              <div className="pt-4 border-t border-[#e7e2d8] flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6 text-[15px] font-semibold text-[#1f3a2c]">
                  <Link href="#full-size-chais" onClick={() => setActiveMega(null)} className="hover:text-[#016c2f]">
                    All Teas
                  </Link>
                  <Link href="#trial-packs" onClick={() => setActiveMega(null)} className="hover:text-[#016c2f]">
                    Trial Packs
                  </Link>
                  <Link href="#full-size-chais" onClick={() => setActiveMega(null)} className="hover:text-[#016c2f]">
                    Best Sellers
                  </Link>
                  <Link href="#why-teabox" onClick={() => setActiveMega(null)} className="hover:text-[#016c2f]">
                    Garden Fresh Promise
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMega(null);
                    onOpenTeaFinder?.();
                  }}
                  className="bg-[#02cb5a] hover:bg-[#01b850] text-[#1f3a2c] px-5 py-2.5 rounded-md font-bold text-[14px] tracking-wider uppercase transition-colors"
                >
                  Tea Finder Quiz →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed left-0 right-0 bottom-0 bg-black/50 z-50 animate-in fade-in duration-200"
            style={{ top: `${headerBottom}px` }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-[85%] max-w-[340px] h-full bg-white flex flex-col justify-between overflow-y-auto p-5 border-r border-[#e7e2d8] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-4">
                <div className="border-b border-[#e7e2d8] pb-3">
                  <button
                    type="button"
                    onClick={() =>
                      setMobileExpandedSection(
                        mobileExpandedSection === "shop" ? null : "shop"
                      )
                    }
                    className="w-full flex items-center justify-between text-[18px] font-bold text-[#202020] py-2"
                  >
                    <span>Shop Teas</span>
                    <ChevronDown
                      size={18}
                      className={`transition-transform ${
                        mobileExpandedSection === "shop" ? "rotate-180 text-[#02cb5a]" : ""
                      }`}
                    />
                  </button>

                  {mobileExpandedSection === "shop" && (
                    <div className="pl-3 py-2 flex flex-col gap-2 text-[15px] text-[#5c5a52]">
                      <Link
                        href="/collections/trial-packs"
                        onClick={() => setMobileMenuOpen(false)}
                        className="py-1 hover:text-[#016c2f]"
                      >
                        All Trial Packs
                      </Link>
                      <Link
                        href="/collections/chai"
                        onClick={() => setMobileMenuOpen(false)}
                        className="py-1 hover:text-[#016c2f]"
                      >
                        Full Size Chais
                      </Link>
                      <Link
                        href="/collections/premix"
                        onClick={() => setMobileMenuOpen(false)}
                        className="py-1 hover:text-[#016c2f]"
                      >
                        Prebiotic Instant Tea
                      </Link>
                      <Link
                        href="/collections/black-tea"
                        onClick={() => setMobileMenuOpen(false)}
                        className="py-1 hover:text-[#016c2f]"
                      >
                        Darjeeling & Assam
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  href="/collections/trial-packs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[18px] font-bold text-[#202020] py-2 border-b border-[#e7e2d8]"
                >
                  Trial Packs
                </Link>

                <Link
                  href="/collections/chai"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[18px] font-bold text-[#202020] py-2 border-b border-[#e7e2d8]"
                >
                  Chai Blends
                </Link>

                <Link
                  href="/collections/all"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[18px] font-bold text-[#f89028] py-2 border-b border-[#e7e2d8]"
                >
                  Limited Edition
                </Link>

                <Link
                  href="#why-teabox"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[18px] font-bold text-[#202020] py-2 border-b border-[#e7e2d8]"
                >
                  Why Teabox
                </Link>

                <Link
                  href="/pages/corporate-gifting-2026"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[16px] font-semibold text-[#1f3a2c] py-2"
                >
                  Corporate Gifting
                </Link>
              </div>

              {/* Mobile Drawer Bottom */}
              <div className="pt-6 border-t border-[#e7e2d8] flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTeaFinder?.();
                  }}
                  className="w-full bg-[#02cb5a] text-[#1f3a2c] py-3 rounded-lg font-bold text-center tracking-wider uppercase text-[14px]"
                >
                  Help Me Find My Tea
                </button>
                <div className="text-center text-[13px] text-[#5c5a52]">
                  Direct from Indian Estates · Vacuum Sealed in 48h
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

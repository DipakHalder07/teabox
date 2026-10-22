"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ArrowRight, Check } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes("@")) {
      setSubscribed(true);
      setEmail("");
    }
  };

  const footerMenus = [
    {
      title: "SHOP",
      links: [
        { label: "Trial Packs", href: "#trial-packs" },
        { label: "Darjeeling", href: "#full-size-chais" },
        { label: "Assam", href: "#full-size-chais" },
        { label: "Nilgiri", href: "#full-size-chais" },
        { label: "Chai", href: "#full-size-chais" },
        { label: "Herbal Blends", href: "#full-size-chais" },
        { label: "Green Tea", href: "#full-size-chais" },
      ],
    },
    {
      title: "ABOUT",
      links: [
        { label: "Why Teabox", href: "#why-teabox" },
        { label: "Press", href: "#why-teabox" },
        { label: "Career", href: "#" },
      ],
    },
    {
      title: "LEARN",
      links: [
        { label: "Tea 101", href: "#" },
        { label: "Blog", href: "#" },
      ],
    },
    {
      title: "HELP",
      links: [
        { label: "Track Your Order", href: "/track" },
        { label: "Shipping & Returns", href: "#" },
        { label: "Contact Us", href: "#" },
      ],
    },
    {
      title: "LEGAL",
      links: [
        { label: "Terms + Conditions", href: "#" },
        { label: "Privacy Policy", href: "#" },
      ],
    },
  ];

  return (
    <footer className="w-full bg-[#202020] text-[#c9d6cd] pt-12 pb-8 sm:pt-16 sm:pb-10 px-5 sm:px-10 lg:px-16 font-sans">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_repeat(5,minmax(0,1fr))] gap-8 lg:gap-8 pb-12">
          {/* Brand & Newsletter Column */}
          <div className="flex flex-col gap-4 max-w-[440px]">
            {/* Logo */}
            <div className="brightness-0 invert opacity-95">
              <Image
                src="/assets/teabox-logo.svg"
                alt="Teabox India"
                width={120}
                height={30}
                style={{ width: "auto" }}
                className="h-7 w-auto object-contain"
              />
            </div>

            <p className="text-[13px] tracking-[1.5px] uppercase text-[#8fa396] font-semibold">
              FRESH FROM THE GARDENS OF INDIA.
            </p>

            <h3 className="text-[16px] font-bold text-white leading-snug mt-2">
              Be first to know when a harvest lands
            </h3>

            {/* Newsletter Form */}
            {subscribed ? (
              <div className="flex items-center gap-2 p-3 bg-[#02cb5a]/10 border border-[#02cb5a] rounded-lg text-white font-bold text-[14px]">
                <Check size={18} className="text-[#02cb5a]" />
                <span>Thank you! We&apos;ll notify you for upcoming harvests.</span>
              </div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                className="flex items-center h-[48px] border-[1.5px] border-[#02cb5a] rounded-lg overflow-hidden bg-transparent focus-within:ring-2 focus-within:ring-[#02cb5a]/40 transition-all"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="YOUR EMAIL ADDRESS"
                  required
                  className="flex-1 h-full px-4 bg-transparent text-white placeholder-white/80 font-bold tracking-[2px] text-[13px] uppercase outline-none"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="px-4 h-full text-[#02cb5a] hover:text-white font-bold text-[18px] transition-colors"
                >
                  <ArrowRight size={20} />
                </button>
              </form>
            )}

            <p className="text-[12px] text-[#8fa396]">
              By signing up you consent to receiving Teabox emails.
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="https://facebook.com/teabox.tea"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow on Facebook"
                className="w-9 h-9 border-[1.5px] border-[#5f7568] hover:border-[#02cb5a] hover:text-white rounded-lg flex items-center justify-center transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>

              <a
                href="https://instagram.com/teabox.tea"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow on Instagram"
                className="w-9 h-9 border-[1.5px] border-[#5f7568] hover:border-[#02cb5a] hover:text-white rounded-lg flex items-center justify-center transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Desktop Link Columns */}
          {footerMenus.map((col) => (
            <div key={col.title} className="hidden lg:flex flex-col gap-3">
              <h4 className="text-[14px] font-bold tracking-[1.5px] uppercase text-white mb-1">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-2.5 text-[14px] text-[#c9d6cd]">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Mobile Accordion Menus */}
          <div className="lg:hidden flex flex-col divide-y divide-[#33463a] border-t border-b border-[#33463a] my-2">
            {footerMenus.map((col) => {
              const isOpen = openAccordion === col.title;
              return (
                <div key={col.title} className="py-3">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenAccordion(isOpen ? null : col.title)
                    }
                    className="w-full flex items-center justify-between font-bold text-[15px] text-white"
                  >
                    <span>{col.title}</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        isOpen ? "rotate-180 text-[#02cb5a]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <ul className="flex flex-col gap-2 pt-3 pl-2 text-[14px] text-[#c9d6cd]">
                      {col.links.map((link) => (
                        <li key={link.label}>
                          <Link href={link.href} className="hover:text-white">
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Copyright & Legal */}
        <div className="pt-6 border-t border-[#33463a] flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#8fa396]">
          <p>© 2026 Teabox India. Buy Delicious Indian Teas Online - Delivered Fresh.</p>
          <div className="flex items-center gap-4 text-[12px]">
            <span>100% Direct Estate Teas</span>
            <span>·</span>
            <span>Vacuum-Sealed Freshness</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

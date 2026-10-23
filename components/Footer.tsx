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
    <footer className="w-full bg-[#202020] text-[#c9d6cd] pt-8 pb-5 sm:pt-10 sm:pb-6 px-4 sm:px-8 lg:px-12 font-sans">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_repeat(5,minmax(0,1fr))] gap-6 lg:gap-6 xl:gap-8 pb-6 sm:pb-8">
          {/* Brand & Newsletter Column */}
          <div className="flex flex-col gap-2.5 max-w-[380px]">
            {/* Logo: Clean text format */}
            <Link href="/" className="inline-block py-0.5">
              <span className="font-stencil text-[24px] font-bold tracking-wider text-white hover:text-[#02cb5a] transition-colors">
                DEMOBOX
              </span>
            </Link>

            <p className="text-[11.5px] sm:text-[12px] tracking-[1.2px] uppercase text-[#8fa396] font-semibold mt-1">
              FRESH FROM THE GARDENS OF INDIA.
            </p>

            <h3 className="text-[14px] sm:text-[15px] font-bold text-white leading-snug mt-1">
              Be first to know when a harvest lands
            </h3>

            {/* Newsletter Form: Slim 40px/42px Box */}
            {subscribed ? (
              <div className="flex items-center gap-2 p-2.5 bg-[#02cb5a]/10 border border-[#02cb5a] rounded-[6px] text-white font-semibold text-[13px]">
                <Check size={16} className="text-[#02cb5a] shrink-0" />
                <span>Thank you! We&apos;ll notify you for upcoming harvests.</span>
              </div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                className="flex items-center h-[40px] sm:h-[42px] border-[1.5px] border-[#02cb5a] rounded-[6px] overflow-hidden bg-transparent focus-within:ring-2 focus-within:ring-[#02cb5a]/30 transition-all mt-0.5"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="YOUR EMAIL ADDRESS"
                  required
                  className="flex-1 h-full px-3.5 bg-transparent text-white placeholder-white/70 font-bold tracking-[1.5px] text-[12px] uppercase outline-none"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="px-3.5 h-full text-[#02cb5a] hover:text-white font-bold text-[16px] transition-colors cursor-pointer flex items-center justify-center"
                >
                  <ArrowRight size={18} />
                </button>
              </form>
            )}

            <p className="text-[11px] text-[#8fa396]">
              By signing up you consent to receiving Teabox emails.
            </p>

            {/* Social Media Links: Slim 32px Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://facebook.com/teabox.tea"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow on Facebook"
                className="w-8 h-8 border border-[#5f7568] hover:border-[#02cb5a] hover:text-[#02cb5a] text-[#c9d6cd] rounded-[6px] flex items-center justify-center transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>

              <a
                href="https://instagram.com/teabox.tea"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow on Instagram"
                className="w-8 h-8 border border-[#5f7568] hover:border-[#02cb5a] hover:text-[#02cb5a] text-[#c9d6cd] rounded-[6px] flex items-center justify-center transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Desktop Link Columns: Tight, refined spacing */}
          {footerMenus.map((col) => (
            <div key={col.title} className="hidden lg:flex flex-col gap-2">
              <h4 className="text-[12.5px] xl:text-[13px] font-bold tracking-[1.5px] uppercase text-white mb-1.5">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-2 text-[13px] xl:text-[13.5px] text-[#c9d6cd]">
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

          {/* Mobile Accordion Menus: Slim rows */}
          <div className="lg:hidden flex flex-col divide-y divide-[#33463a] border-t border-b border-[#33463a] my-1">
            {footerMenus.map((col) => {
              const isOpen = openAccordion === col.title;
              return (
                <div key={col.title} className="py-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenAccordion(isOpen ? null : col.title)
                    }
                    className="w-full flex items-center justify-between font-bold text-[14px] text-white cursor-pointer"
                  >
                    <span>{col.title}</span>
                    <ChevronDown
                      size={15}
                      className={`transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#02cb5a]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <ul className="flex flex-col gap-1.5 pt-2 pl-1 text-[13px] text-[#c9d6cd]">
                      {col.links.map((link) => (
                        <li key={link.label}>
                          <Link href={link.href} className="hover:text-white block py-0.5">
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

        {/* Slim Copyright & Legal Row matching live site */}
        <div className="pt-4 border-t border-[#33463a]/60 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[12px] text-[#8fa396]">
          <p>© 2026 Teabox · Siliguri, India - the doorstep of Darjeeling · Prices in INR</p>
          <div className="flex items-center gap-3 text-[11.5px] text-[#8fa396]">
            <span>100% Direct Estate Teas</span>
            <span>·</span>
            <span>Vacuum Sealed in 48h</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight, Check, Loader2 } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubscribed(true);
        setEmail("");
      } else {
        setErrorMessage(data.error || "Subscription failed. Please try again.");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
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
    <footer className="w-full bg-[#181a18] text-[#c2d0c6] border-t border-white/[0.08] pt-6 pb-4 sm:pt-7 sm:pb-5 px-4 sm:px-8 lg:px-12 font-sans">
      <div className="max-w-[1380px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_repeat(5,minmax(0,1fr))] gap-6 lg:gap-7 xl:gap-8 pb-5 sm:pb-6">
          {/* Brand & Slim Newsletter Column */}
          <div className="flex flex-col gap-2 max-w-[340px]">
            {/* Logo + Tag */}
            <div className="flex items-center gap-2">
              <Link href="/" className="inline-block">
                <span className="font-stencil text-[22px] font-bold tracking-wider text-white hover:text-[#02cb5a] transition-colors">
                  DEMOBOX
                </span>
              </Link>
              <span className="h-3 w-px bg-white/20" />
              <span className="text-[10.5px] font-medium tracking-[1px] uppercase text-[#8fa396]">
                Garden Fresh
              </span>
            </div>

            <p className="text-[12px] text-white/80 leading-snug">
              Be first to know when a fresh harvest lands.
            </p>

            {/* Newsletter: Slim 36px Pill */}
            {subscribed ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#02cb5a]/10 border border-[#02cb5a]/40 rounded-full text-white font-medium text-[11.5px] max-w-[320px]">
                <Check size={14} className="text-[#02cb5a] shrink-0" />
                <span>You&apos;re subscribed for harvest alerts!</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1 max-w-[320px]">
                <form
                  onSubmit={handleSubscribe}
                  className="flex items-center h-[36px] bg-white/[0.04] border border-white/15 hover:border-white/25 focus-within:border-[#02cb5a] focus-within:bg-white/[0.07] rounded-full pl-3.5 pr-1 transition-all"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                    className="flex-1 bg-transparent text-white placeholder-white/40 font-normal text-[11.5px] outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe"
                    disabled={loading}
                    className="w-7 h-7 rounded-full bg-[#02cb5a] text-black hover:bg-[#00e363] disabled:opacity-75 flex items-center justify-center transition-all cursor-pointer shrink-0"
                  >
                    {loading ? (
                      <Loader2 size={13} className="animate-spin text-black" />
                    ) : (
                      <ArrowRight size={13} strokeWidth={2.5} />
                    )}
                  </button>
                </form>
                {errorMessage && (
                  <p className="text-[11px] text-red-400 pl-2">{errorMessage}</p>
                )}
              </div>
            )}

            {/* Micro info & Social icons in one tidy row */}
            <div className="flex items-center justify-between max-w-[320px] pt-0.5 text-[10.5px] text-[#8fa396]">
              <span>No spam. Opt out anytime.</span>
              <div className="flex items-center gap-1.5">
                <a
                  href="https://facebook.com/teabox.tea"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow on Facebook"
                  className="w-6 h-6 rounded-full border border-white/10 hover:border-[#02cb5a] hover:text-[#02cb5a] text-[#8fa396] flex items-center justify-center transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                <a
                  href="https://instagram.com/teabox.tea"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow on Instagram"
                  className="w-6 h-6 rounded-full border border-white/10 hover:border-[#02cb5a] hover:text-[#02cb5a] text-[#8fa396] flex items-center justify-center transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Desktop Link Columns: Slim, clean typography */}
          {footerMenus.map((col) => (
            <div key={col.title} className="hidden lg:flex flex-col gap-1.5">
              <h4 className="text-[11px] font-bold tracking-[1.4px] uppercase text-white/95 mb-1">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-1 text-[12.5px] text-[#b4c4b9]">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-white hover:translate-x-0.5 inline-block transition-all duration-150 py-0.5"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Mobile Accordion Menus: Slim rows */}
          <div className="lg:hidden flex flex-col divide-y divide-white/[0.07] border-t border-b border-white/[0.07] my-2">
            {footerMenus.map((col) => {
              const isOpen = openAccordion === col.title;
              return (
                <div key={col.title} className="py-2">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenAccordion(isOpen ? null : col.title)
                    }
                    className="w-full flex items-center justify-between font-semibold text-[13px] text-white cursor-pointer"
                  >
                    <span>{col.title}</span>
                    <ChevronDown
                      size={14}
                      className={`text-neutral-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#02cb5a]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <ul className="flex flex-col gap-1 pt-1.5 pb-0.5 pl-1 text-[12px] text-[#b4c4b9]">
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

        {/* Slim Copyright & Trust Row */}
        <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#8fa396]">
          <p>© 2026 DEMOBOX · Siliguri, India · Doorstep of Darjeeling</p>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-[11px] text-[#8fa396]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#02cb5a]" />
              100% Direct Estate Teas
            </span>
            <span className="hidden sm:inline">·</span>
            <span>Vacuum Sealed in 48h</span>
            <span className="hidden sm:inline">·</span>
            <span>Prices in INR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

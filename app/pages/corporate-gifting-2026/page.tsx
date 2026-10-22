"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Gift,
  Building2,
  Phone,
  Mail,
  Check,
  Download,
  Sparkles,
  Award,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  Star,
} from "lucide-react";
import SiteLayoutWrapper from "@/components/SiteLayoutWrapper";
import { useCart } from "@/components/context/CartContext";

export default function CorporateGiftingPage() {
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState<"gifts" | "trial" | "teaware">("gifts");

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      alert("Please complete the required contact fields");
      return;
    }
    setFormSubmitted(true);
  };

  const budgetTiers = [
    {
      budget: "UNDER INR 1,000",
      title: "Chai & Green Tea Duos",
      image: "https://in.teabox.com/cdn/shop/files/Under1000.png?v=1697525381&width=400",
      description: "Artisanal twin canisters with brass finished lids and fresh whole leaves.",
    },
    {
      budget: "UNDER INR 3,000",
      title: "Authentic Chai Trail & Cups",
      image: "https://in.teabox.com/cdn/shop/files/Under3000.png?v=1697525381&width=400",
      description: "10 chai blends + Valencia double-walled insulated glassware and brass scoop.",
    },
    {
      budget: "UNDER INR 5,000",
      title: "Assam Soiree Luxury Hamper",
      image: "https://in.teabox.com/cdn/shop/files/Under5000.png?v=1697525381&width=400",
      description: "Premium handcrafted gift box with gold foil detailing and estate harvests.",
    },
    {
      budget: "ABOVE INR 10,000",
      title: "The Odyssey Royal Wooden Chest",
      image: "https://in.teabox.com/cdn/shop/files/Above10000.png?v=1697525381&width=400",
      description: "High-gloss lacquer wood trunk housing 9 single-estate Grand Cru harvests.",
    },
  ];

  const clientLogos = [
    { name: "Silicon Valley Bank", label: "SVB" },
    { name: "Marriott Hotels", label: "Marriott" },
    { name: "KPMG Global", label: "KPMG" },
    { name: "Intuit", label: "Intuit" },
    { name: "Google", label: "Google" },
    { name: "DBS Bank", label: "DBS" },
    { name: "Black & Veatch", label: "Black & Veatch" },
  ];

  const giftProducts = [
    {
      id: "gift-montage",
      title: "Chai Montage Festive Hamper",
      subtitle: "6 Iconic Indian Chais with Brass Strainer",
      price: 1899,
      image: "https://in.teabox.com/cdn/shop/files/Artboard_1_copy_5_2.png?v=1738734509&width=600",
      badge: "BESTSELLER",
    },
    {
      id: "gift-darjeeling-flushes",
      title: "The Darjeeling Grand Flushes Chest",
      subtitle: "First & Second Flush Single-Estate Teas",
      price: 2499,
      image: "https://in.teabox.com/cdn/shop/files/Artboard_1_18_fdb04dd4-c085-4ae2-aeb6-a3674681615f.png?v=1738735235&width=600",
      badge: "LUXURY",
    },
    {
      id: "gift-wellness-trio",
      title: "Ayurvedic Wellness & Immunity Box",
      subtitle: "Ashwagandha, Turmeric & Tulsi Green",
      price: 1499,
      image: "https://in.teabox.com/cdn/shop/files/Artboard_1_copy_10.png?v=1738734638&width=600",
      badge: "WELLNESS",
    },
    {
      id: "gift-odyssey-lacquer",
      title: "The Heritage Odyssey Chest",
      subtitle: "Limited Edition Hand-Painted Floral Box",
      price: 4999,
      image: "https://in.teabox.com/cdn/shop/files/Artboard_1_copy_12.png?v=1738734676&width=600",
      badge: "ROYAL",
    },
  ];

  return (
    <SiteLayoutWrapper>
      <div className="w-full bg-[#fdfbf7] text-[#202020]">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION WITH FESTIVE HAMPERS & GOLD ACCENTS                      */}
        {/* ========================================================================= */}
        <section className="relative w-full overflow-hidden border-b border-[#e7e2d8] bg-gradient-to-b from-[#213728] via-[#1f3a2c] to-[#15271d] text-white py-12 sm:py-20 px-4 sm:px-6 lg:px-12">
          {/* Background overlay pattern */}
          <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left Content */}
            <div className="flex flex-col gap-4 sm:gap-6 z-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 self-center lg:self-start bg-[#02cb5a]/20 border border-[#02cb5a]/60 text-[#02cb5a] px-3.5 py-1.5 rounded-full text-[12px] font-bold tracking-[1.5px] uppercase">
                <Sparkles size={14} />
                <span>CORPORATE &amp; BESPOKE GIFTING 2026</span>
              </div>

              <h1 className="font-stencil text-[36px] sm:text-[48px] lg:text-[56px] font-bold leading-[1.08] tracking-[-0.5px]">
                GIFTS WORTH <br />
                <span className="text-[#02cb5a]">TALKING ABOUT</span>
              </h1>

              <p className="text-[15px] sm:text-[17px] text-[#c9d6cd] max-w-[540px] leading-relaxed">
                A decade of delivering teas directly from Himalayan gardens has taught us that the most memorable corporate gifts are the ones that carry a true origin story.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 justify-center lg:justify-start">
                <a
                  href="#inquiry-form"
                  className="w-full sm:w-auto bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[15px] px-8 py-4 rounded-xl tracking-wider uppercase transition-all shadow-lg text-center cursor-pointer active:scale-98"
                >
                  Request 2026 Catalogue
                </a>
                <a
                  href="#budget-tiers"
                  className="w-full sm:w-auto border border-white/60 hover:border-white text-white font-semibold text-[15px] px-7 py-4 rounded-xl transition-colors text-center"
                >
                  Explore By Budget ↓
                </a>
              </div>
            </div>

            {/* Right Media: Hamper Showcase */}
            <div className="relative aspect-[4/3] w-full max-w-[620px] mx-auto rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl">
              <Image
                src="https://in.teabox.com/cdn/shop/files/Corporate_Gifting_Banner_2_d0a1b637-bf7d-4ba6-8cb9-f53835f8cb4f.png?v=1697524956&width=1200"
                alt="Teabox Corporate Gifting Hampers"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. STATS & SOURCING TICKER                                                */}
        {/* ========================================================================= */}
        <div className="w-full bg-[#f4eee4] border-b border-[#e7e2d8] py-4 px-4 overflow-hidden">
          <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-around gap-6 text-[13.5px] sm:text-[15px] font-bold text-[#1f3a2c]">
            <div className="flex items-center gap-2">
              <span className="text-[18px]">☕</span>
              <span>5 Billion+ Cups Served Globally</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[18px]">🌐</span>
              <span>125+ Countries Shipped Direct</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[18px]">🌿</span>
              <span>273 Tea Gardens at Direct Source</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[18px]">🏆</span>
              <span>Over 50 Lakh Corporate Hampers Delivered</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. GIFTS FOR EVERY BUDGET (4 CIRCULAR IMAGE TIERS)                        */}
        {/* ========================================================================= */}
        <section id="budget-tiers" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-16 sm:py-24 text-center">
          <h2 className="font-stencil text-[30px] sm:text-[42px] font-bold text-[#202020] mb-2 tracking-tight">
            GIFTS FOR EVERY BUDGET
          </h2>
          <p className="text-[15px] sm:text-[16px] text-[#5c5a52] max-w-[620px] mx-auto mb-12 sm:mb-16">
            From thoughtful employee wellness tokens to opulent handcrafted mahogany trunks for VIP clients and board members.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {budgetTiers.map((tier, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center group cursor-pointer"
                onClick={() => {
                  const el = document.getElementById("inquiry-form");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {/* Circular image with gold dotted border accent */}
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden p-1.5 border-2 border-dashed border-[#d4af37] group-hover:scale-105 transition-transform duration-300 bg-white shadow-md">
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-[#fafafa]">
                    <Image
                      src={tier.image}
                      alt={tier.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-col items-center">
                  <span className="text-[14px] font-extrabold tracking-[2px] uppercase text-[#1f3a2c] underline decoration-[#02cb5a] underline-offset-4">
                    {tier.budget}
                  </span>
                  <h4 className="font-bold text-[16px] sm:text-[17px] text-[#202020] mt-2 group-hover:text-[#016c2f] transition-colors">
                    {tier.title}
                  </h4>
                  <p className="text-[13px] text-[#5c5a52] max-w-[240px] mt-1 text-center">
                    {tier.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. TRUSTED BY 1000+ CLIENTS (BRAND LOGOS)                                 */}
        {/* ========================================================================= */}
        <section className="w-full bg-[#f5f1ea] border-y border-[#e7e2d8] py-12 px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto text-center">
            <h3 className="text-[13px] font-bold tracking-[2.5px] uppercase text-[#5c5a52] mb-8">
              TRUSTED BY OVER 1,000+ ENTERPRISES ACROSS INDIA &amp; THE GLOBE
            </h3>

            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-85">
              {clientLogos.map((client, idx) => (
                <div
                  key={idx}
                  className="font-stencil text-[22px] sm:text-[26px] font-bold text-[#1f3a2c] tracking-wider hover:opacity-100 transition-opacity"
                >
                  {client.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. WHY TEABOX CORPORATE GIFTING (5-PILLAR VALUE GRID)                     */}
        {/* ========================================================================= */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-16 sm:py-24 text-center">
          <h2 className="font-stencil text-[30px] sm:text-[42px] font-bold text-[#202020] mb-2 tracking-tight">
            WHY TEABOX FOR YOUR ORGANIZATION?
          </h2>
          <p className="text-[15px] sm:text-[16px] text-[#5c5a52] max-w-[620px] mx-auto mb-12 sm:mb-16">
            We manage your entire gifting process from custom packaging and personalized messaging to multi-location doorstep delivery.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                icon: Gift,
                title: "FOR ALL OCCASIONS",
                desc: "Festive hampers, Diwali, New Year, Work Anniversaries, and client appreciation.",
              },
              {
                icon: Award,
                title: "FOR EVERY BUDGET",
                desc: "Transparent tiered price points starting from ₹499 up to bespoke royal flushes.",
              },
              {
                icon: Sparkles,
                title: "CUSTOMIZE & BRAND",
                desc: "Custom logo embossing, personalized ribbons, custom sleeves, and CEO message cards.",
              },
              {
                icon: Compass,
                title: "50+ FRESH HARVESTS",
                desc: "Single-estate loose leaves and pyramid bags sourced directly from 273 Himalayan gardens.",
              },
              {
                icon: Users,
                title: "DEDICATED MANAGER",
                desc: "End-to-end B2B account support with single-click multi-address delivery worldwide.",
              },
            ].map((col, idx) => {
              const Icon = col.icon;
              return (
                <div
                  key={idx}
                  className="bg-white border border-[#e7e2d8] rounded-2xl p-6 sm:p-7 text-center flex flex-col items-center hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-full bg-[#f4eee4] border border-[#e7e2d8] flex items-center justify-center text-[#1f3a2c] mb-4">
                    <Icon size={24} />
                  </div>
                  <h4 className="font-bold text-[14.5px] text-[#202020] tracking-wide mb-2 uppercase">
                    {col.title}
                  </h4>
                  <p className="text-[13px] text-[#5c5a52] leading-relaxed">
                    {col.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. CURATED GIFT SETS SHOWCASE                                             */}
        {/* ========================================================================= */}
        <section className="w-full bg-[#faf7f2] border-t border-[#e7e2d8] py-16 sm:py-24 px-4 sm:px-6 lg:px-12">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
              <div>
                <h3 className="font-stencil text-[28px] sm:text-[36px] font-bold text-[#202020]">
                  OUR SIGNATURE HAMPERS
                </h3>
                <p className="text-[14px] sm:text-[15px] text-[#5c5a52]">
                  Ready-to-ship luxury assortments with customizable exterior bands.
                </p>
              </div>

              <Link
                href="/collections/gifts"
                className="text-[14px] font-bold text-[#1f3a2c] underline decoration-[#02cb5a] underline-offset-4 hover:text-[#016c2f]"
              >
                View Complete Retail Gift Line →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {giftProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-[#e7e2d8] rounded-xl overflow-hidden flex flex-col justify-between shadow-xs transition-all"
                >
                  <div className="relative aspect-square w-full bg-[#fafafa]">
                    <span className="absolute bottom-0 right-0 z-10 bg-[#1c3327] text-white text-[10px] font-bold px-2 py-0.5 rounded-tl-[4px] tracking-wider uppercase">
                      {p.badge}
                    </span>
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                  </div>

                  <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-[15px] text-[#202020] leading-snug">
                        {p.title}
                      </h4>
                      <p className="text-[13px] text-[#5c5a52] mt-0.5">{p.subtitle}</p>
                      <div className="text-[16px] font-bold text-[#1f3a2c] mt-2">
                        ₹{p.price.toLocaleString("en-IN")}{" "}
                        <span className="text-[12px] font-normal text-[#8e8d8a]">
                          / hamper
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          addToCart({
                            id: p.id,
                            title: p.title,
                            weight: "Gift Set",
                            price: p.price,
                            image: p.image,
                          })
                        }
                        className="w-full bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[13px] py-2.5 rounded-lg tracking-wider uppercase transition-colors cursor-pointer"
                      >
                        ADD SAMPLE — ₹{p.price.toLocaleString("en-IN")}
                      </button>
                      <a
                        href="#inquiry-form"
                        className="text-[12.5px] font-medium text-[#1f3a2c] text-center hover:underline"
                      >
                        Enquire for Bulk Quote (10+ Units)
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. CUSTOMER TESTIMONIALS                                                  */}
        {/* ========================================================================= */}
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-[#e7e2d8] rounded-2xl p-8 text-left shadow-sm flex flex-col justify-between">
              <div className="flex items-center text-[#e5a524] mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-[#e5a524]" />
                ))}
              </div>
              <p className="text-[15px] text-[#3d3b36] italic leading-relaxed mb-4">
                &ldquo;Every single person messaged back that the packaging alone made it feel like we&apos;d actually thought about the gift, not just ticked a box. The fresh aroma of Darjeeling first flush when unboxed is extraordinary.&rdquo;
              </p>
              <div>
                <span className="font-bold text-[15px] text-[#202020] block">Rohan Kumar</span>
                <span className="text-[13px] text-[#016c2f] font-semibold flex items-center gap-1 mt-0.5">
                  <Check size={14} /> Head of Partnerships &amp; Events
                </span>
              </div>
            </div>

            <div className="bg-white border border-[#e7e2d8] rounded-2xl p-8 text-left shadow-sm flex flex-col justify-between">
              <div className="flex items-center text-[#e5a524] mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-[#e5a524]" />
                ))}
              </div>
              <p className="text-[15px] text-[#3d3b36] italic leading-relaxed mb-4">
                &ldquo;Ordered 800 hampers for our nationwide employee wellness celebration. From custom branding with our company logo to delivery at employees&apos; homes in 42 cities, Teabox executed without a single glitch.&rdquo;
              </p>
              <div>
                <span className="font-bold text-[15px] text-[#202020] block">Ananya Biswas</span>
                <span className="text-[13px] text-[#016c2f] font-semibold flex items-center gap-1 mt-0.5">
                  <Check size={14} /> People Operations Lead, Tech Corp
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. BEGIN YOUR GIFTING JOURNEY (INQUIRY & CATALOG FORM)                    */}
        {/* ========================================================================= */}
        <section id="inquiry-form" className="w-full bg-[#1f3a2c] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-12">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Contact Details Column */}
            <div className="space-y-6 text-center lg:text-left">
              <span className="text-[#02cb5a] font-bold text-[13px] tracking-[2px] uppercase">
                DIRECT CORPORATE DESK
              </span>

              <h2 className="font-stencil text-[34px] sm:text-[46px] font-bold leading-tight">
                BEGIN YOUR GIFTING JOURNEY
              </h2>

              <p className="text-[15px] sm:text-[16px] text-[#c9d6cd] leading-relaxed">
                Connect directly with our dedicated gifting curators to discuss customization, bulk tier pricing, and tailored box assortments.
              </p>

              <div className="space-y-3 pt-2 text-[15px] font-medium">
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <Phone size={18} className="text-[#02cb5a]" />
                  <span>Give us a call / WhatsApp: <strong className="text-white">+91 97330 61444</strong></span>
                </div>
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <Mail size={18} className="text-[#02cb5a]" />
                  <span>Email: <strong className="text-white">help.in@teabox.com</strong></span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/20 flex items-center gap-3 justify-center lg:justify-start text-[13px] text-[#c9d6cd]">
                <ShieldCheck size={18} className="text-[#02cb5a]" />
                <span>GST Invoicing &amp; Multi-Address Logistics Included</span>
              </div>
            </div>

            {/* Form Column */}
            <div className="bg-white text-[#202020] rounded-2xl p-7 sm:p-9 shadow-2xl border border-[#e7e2d8]">
              {formSubmitted ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#02cb5a]/20 border-2 border-[#02cb5a] flex items-center justify-center mx-auto text-[#016c2f]">
                    <Check size={36} className="stroke-[3]" />
                  </div>
                  <h3 className="font-stencil text-[26px] font-bold text-[#202020]">
                    Inquiry Received!
                  </h3>
                  <p className="text-[14px] text-[#5c5a52]">
                    Thank you, <strong className="text-[#1f3a2c]">{name}</strong>. Our corporate concierge has sent our 2026 Lookbook to <strong className="text-[#1f3a2c]">{email}</strong> and will call you shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      alert("Downloading Teabox Corporate Gifting Catalogue 2026 (PDF)...");
                    }}
                    className="inline-flex items-center gap-2 bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[14px] px-6 py-3 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download size={16} />
                    <span>Download PDF Catalogue</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-[18px] font-bold text-[#202020] mb-2">
                    Request 2026 Lookbook &amp; Custom Quote
                  </h3>

                  <div>
                    <label className="block text-[12.5px] font-bold uppercase tracking-wider text-[#202020] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Write your full name"
                      className="w-full px-3.5 py-2.5 border border-[#e7e2d8] rounded-lg text-[14px] outline-none focus:border-[#02cb5a]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12.5px] font-bold uppercase tracking-wider text-[#202020] mb-1">
                      Corporate / Official Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="youremail@example.com"
                      className="w-full px-3.5 py-2.5 border border-[#e7e2d8] rounded-lg text-[14px] outline-none focus:border-[#02cb5a]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12.5px] font-bold uppercase tracking-wider text-[#202020] mb-1">
                      Contact Number *
                    </label>
                    <div className="flex items-center border border-[#e7e2d8] focus-within:border-[#02cb5a] rounded-lg overflow-hidden">
                      <span className="px-3 py-2.5 bg-[#fafafa] border-r border-[#e7e2d8] text-[13.5px] font-bold">
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10 digit mobile number"
                        className="flex-1 px-3 py-2.5 text-[14px] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12.5px] font-bold uppercase tracking-wider text-[#202020] mb-1">
                      Estimated Quantity &amp; Message
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="e.g. Need 150 Diwali hampers with our company logo by next month..."
                      className="w-full px-3.5 py-2.5 border border-[#e7e2d8] rounded-lg text-[14px] outline-none focus:border-[#02cb5a]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] font-bold text-[15px] py-3.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer shadow-sm mt-2 active:scale-99"
                  >
                    Get Our Catalogue &amp; Pricing
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </SiteLayoutWrapper>
  );
}

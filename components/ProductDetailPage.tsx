"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  ShieldCheck,
  Sprout,
  Leaf,
  Sparkles,
  Check,
  Globe,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  X,
} from "lucide-react";
import { Product, PRODUCTS } from "@/data/products";
import { useCart } from "./context/CartContext";
import ProductCard from "./ProductCard";
import ProductReviews from "./ProductReviews";

export default function ProductDetailPage({ product }: { product: Product }) {
  const { addToCart } = useCart();

  // Variant selector
  const [selectedWeight, setSelectedWeight] = useState(product.weight || "100G");
  const [quantity, setQuantity] = useState(1);

  // Gallery images with full array support (all 9 authentic live images)
  const galleryImages =
    product.galleryImages && product.galleryImages.length > 0
      ? product.galleryImages
      : [product.image, product.secondaryImage, product.image].filter(Boolean);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Smooth Custom Cursor & Hover Navigation (120fps requestAnimationFrame, 0 React re-renders on mousemove)
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const cursorFollowerRef = useRef<HTMLDivElement>(null);
  const cursorArrowRef = useRef<SVGSVGElement>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  // Mutable animation state (no React re-renders on mousemove)
  const mouseTargetRef = useRef({ x: 0, y: 0, visible: false, isLeft: false });
  const mouseCurrentRef = useRef({ x: 0, y: 0, scale: 0, opacity: 0 });
  const animFrameId = useRef<number | null>(null);

  // Setup silky smooth requestAnimationFrame loop for cursor
  useEffect(() => {
    const loop = () => {
      const target = mouseTargetRef.current;
      const current = mouseCurrentRef.current;
      const el = cursorFollowerRef.current;
      const arrow = cursorArrowRef.current;

      if (el) {
        // High-precision smooth lerp
        current.x += (target.x - current.x) * 0.24;
        current.y += (target.y - current.y) * 0.24;
        current.opacity += ((target.visible ? 1 : 0) - current.opacity) * 0.22;
        current.scale += ((target.visible ? 1 : 0.4) - current.scale) * 0.22;

        el.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%) scale(${current.scale})`;
        el.style.opacity = `${current.opacity}`;

        if (arrow) {
          arrow.style.transform = target.isLeft ? "rotate(180deg)" : "rotate(0deg)";
        }
      }

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const isLeft = x < rect.width / 2;
    mouseTargetRef.current = { x, y, visible: true, isLeft };
    mouseCurrentRef.current.x = x;
    mouseCurrentRef.current.y = y;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const isLeft = x < rect.width / 2;
    mouseTargetRef.current = { x, y, visible: true, isLeft };
  };

  const handleMouseLeave = () => {
    mouseTargetRef.current.visible = false;
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if (mouseTargetRef.current.isLeft) {
      setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
    } else {
      setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
    }
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
  };

  // Auto-scroll thumbnails when active image changes
  useEffect(() => {
    if (!thumbnailContainerRef.current) return;
    const container = thumbnailContainerRef.current;
    const activeThumb = container.children[activeImageIndex] as HTMLElement;
    if (activeThumb) {
      const containerWidth = container.offsetWidth;
      const thumbOffsetLeft = activeThumb.offsetLeft;
      const thumbWidth = activeThumb.offsetWidth;
      const scrollPos = thumbOffsetLeft - containerWidth / 2 + thumbWidth / 2;
      container.scrollTo({ left: Math.max(0, scrollPos), behavior: "smooth" });
    }
  }, [activeImageIndex]);

  // Keyboard navigation for image gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setActiveImageIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setActiveImageIndex((prev) => Math.min(galleryImages.length - 1, prev + 1));
      } else if (e.key === "Escape") {
        setIsZoomOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [galleryImages.length]);

  // Price calculation based on selected weight matching live site
  const getCalculatedPrice = (weight: string) => {
    if (product.id === "organic-green" || product.handle === "organic-green") {
      if (weight === "100G") return 232;
      if (weight === "200G") return 454;
      if (weight === "300G") return 667;
    }
    if (weight === "100G") return Math.round(product.price * 0.55);
    if (weight === "200G") return Math.round(product.price * 1.0);
    if (weight === "300G") return Math.round(product.price * 1.45);
    if (weight === "250G") return product.price;
    if (weight === "500G") return Math.round(product.price * 1.85);
    if (weight === "1KG") return Math.round(product.price * 3.4);
    if (weight === "50 Teabags") return Math.round(product.price * 1.8);
    if (weight === "2 Boxes") return Math.round(product.price * 1.9);
    return product.price;
  };

  const currentPrice = getCalculatedPrice(selectedWeight);

  // Variant selector with live price & packaging slide sync
  const handleSelectWeight = (w: string) => {
    setSelectedWeight(w);
    if (product.id === "organic-green" || product.handle === "organic-green") {
      if (w === "100G" && galleryImages.length >= 7) {
        setActiveImageIndex(6); // 7th image
      } else if (w === "200G" && galleryImages.length >= 8) {
        setActiveImageIndex(7); // 8th image
      } else if (w === "300G" && galleryImages.length >= 9) {
        setActiveImageIndex(8); // 9th image
      }
    }
  };

  // Variant options matching live site
  const variants =
    product.weights && product.weights.length > 1
      ? product.weights.map((w, idx) => ({
          weight: w,
          cups:
            w === "100G"
              ? "50 cups"
              : w === "200G"
              ? "100 cups"
              : w === "300G"
              ? "150 cups"
              : w === "250G"
              ? "125 cups"
              : w === "500G"
              ? "250 cups"
              : "500 cups",
          price: getCalculatedPrice(w),
          originalPrice:
            w === "200G"
              ? 464
              : w === "300G"
              ? 696
              : Math.round(getCalculatedPrice(w) * 1.15),
          badge: idx === 1 ? "MOST POPULAR" : idx === 2 ? "BEST VALUE" : undefined,
        }))
      : [
          {
            weight: product.weight || "Standard Pack",
            cups: "100+ cups",
            price: product.price,
            originalPrice: Math.round(product.price * 1.2),
            badge: undefined,
          },
        ];

  const handleAddToCart = () => {
    addToCart(
      {
        id: `${product.id}-${selectedWeight}`,
        title: product.title,
        weight: selectedWeight,
        price: currentPrice,
        image: product.image,
      },
      quantity
    );
  };

  // Related products (guaranteed unique by id)
  const relatedProducts = Array.from(
    new Map(
      PRODUCTS.filter(
        (p) => p.category === product.category && p.id !== product.id
      ).map((p) => [p.id, p])
    ).values()
  ).slice(0, 4);

  // Live PDP FAQs
  const faqs = [
    {
      q: "What does Darjeeling green tea taste like?",
      a: "Unlike typical bitter green teas, Darjeeling whole-leaf green tea is smooth, delicate, and vegetal with natural floral notes and a sweet lingering finish. It offers 0% bitterness when brewed between 80-85°C.",
    },
    {
      q: "Does this green tea help with weight management?",
      a: "Yes! High levels of EGCG (epigallocatechin gallate) and polyphenols naturally accelerate metabolism, improve fat oxidation, and assist in weight management as part of an active lifestyle.",
    },
    {
      q: "When is the best time to drink green tea?",
      a: "The ideal times are morning after waking up and 30-45 minutes after meals to support healthy digestion and sustain energy without caffeine jitters.",
    },
    {
      q: "How is Teabox green tea different from tea bags?",
      a: "Most commercial tea bags contain stale 'dust and fannings' with high bitterness. Teabox uses 100% whole leaves vacuum-sealed at the garden within 48 hours of harvest for unrivaled freshness and essential oils.",
    },
  ];

  return (
    <div className="w-full bg-white">
      {/* 1. Main Product Section */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-5 sm:py-8">
        {/* Breadcrumb matching live site: Home › All Collection › Title */}
        <nav aria-label="Breadcrumb" className="text-[13px] sm:text-[14px] text-[#747576] mb-5">
          <ol className="flex items-center gap-1.5 flex-wrap">
            <li>
              <Link href="/" className="text-[#1f3a2c] hover:underline">
                Home
              </Link>
            </li>
            <li>›</li>
            <li>
              <Link href="/collections/all" className="text-[#1f3a2c] hover:underline">
                All Collection
              </Link>
            </li>
            <li>›</li>
            <li className="text-[#202020] font-medium truncate max-w-[240px]">
              {product.title}
            </li>
          </ol>
        </nav>

        {/* 2-Column Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
          {/* Left Column: Image Gallery (Pixel-perfect to Live Site) */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Main Stage Image with dynamic cursor-following hover navigation */}
            <div
              ref={imageContainerRef}
              onMouseEnter={handleMouseEnter}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleContainerClick}
              className="group relative aspect-square w-full bg-[#fcfbf9] border border-[#E7E2D8] rounded-[16px] sm:rounded-[20px] overflow-hidden select-none lg:cursor-none"
            >
              {product.badge && (
                <span className="absolute bottom-0 right-0 z-10 bg-[#1c3327] text-white text-[11px] font-bold tracking-[1px] uppercase px-3 py-1.5 rounded-tl-[4px]">
                  {product.badge}
                </span>
              )}

              {/* Dynamic custom cursor circle following the mouse pointer (120fps lerp, silky smooth) */}
              <div
                ref={cursorFollowerRef}
                className="hidden lg:flex pointer-events-none absolute z-30 w-12 h-12 rounded-full bg-white text-[#202020] shadow-[0_4px_16px_rgba(0,0,0,0.18)] border border-[#e7e2d8] items-center justify-center select-none will-change-transform"
                style={{
                  top: 0,
                  left: 0,
                  opacity: 0,
                  transform: "translate3d(-100px, -100px, 0)",
                }}
              >
                <svg
                  ref={cursorArrowRef}
                  role="presentation"
                  focusable="false"
                  width="11"
                  height="15"
                  viewBox="0 0 7 10"
                  className="transition-transform duration-250 ease-[cubic-bezier(0.34,1.56,0.64,1)] text-[#1f3a2c]"
                >
                  <path
                    d="m1 9 4-4-4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Silky-Smooth Sliding Image Track */}
              <div className="w-full h-full overflow-hidden relative">
                <div
                  className="flex h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
                  style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
                >
                  {galleryImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-full h-full shrink-0 flex items-center justify-center p-2 sm:p-4"
                    >
                      <Image
                        src={img}
                        alt={`${product.title} - view ${idx + 1}`}
                        fill
                        priority={idx === 0 || idx === 1}
                        className="object-contain p-2 sm:p-4 select-none pointer-events-none transition-transform duration-500 ease-out"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Slide Counter Pill (Bottom Left) */}
              {galleryImages.length > 1 && (
                <div className="absolute bottom-3.5 left-3.5 sm:bottom-4 sm:left-4 z-20 bg-white/90 backdrop-blur-xs border border-[#e7e2d8] text-[#5c5a52] text-[11.5px] font-bold px-2.5 py-1 rounded-full shadow-2xs pointer-events-none flex items-center gap-1.5">
                  <span className="text-[#1f3a2c]">{activeImageIndex + 1}</span>
                  <span className="text-[#a09e99]">/</span>
                  <span>{galleryImages.length}</span>
                </div>
              )}

              {/* Zoom Trigger Button at Top Right (Matches Live Site Organic Green) */}
              <button
                type="button"
                onMouseEnter={() => {
                  mouseTargetRef.current.visible = false;
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomOpen(true);
                }}
                aria-label="Zoom image"
                className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-[#202020] shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-[#e7e2d8] flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer pointer-events-auto"
              >
                <Search size={17} className="stroke-[2.2]" />
              </button>

              {/* Mobile/Touch Fallback Navigation Arrows */}
              <div className="lg:hidden pointer-events-none">
                <button
                  type="button"
                  onClick={handlePrevImage}
                  aria-label="Previous image"
                  className="pointer-events-auto absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 text-[#202020] shadow flex items-center justify-center cursor-pointer active:scale-95"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="Next image"
                  className="pointer-events-auto absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 text-[#202020] shadow flex items-center justify-center cursor-pointer active:scale-95"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Thumbnail Row with smooth hover & auto-scroll (All 9 live carousel items) */}
            {galleryImages.length > 1 && (
              <div
                ref={thumbnailContainerRef}
                className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
              >
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onMouseEnter={() => setActiveImageIndex(idx)}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-[68px] md:h-[68px] rounded-[10px] overflow-hidden bg-[#fafafa] shrink-0 transition-all duration-200 cursor-pointer ${
                      activeImageIndex === idx
                        ? "border-2 border-[#1c3327] shadow-xs scale-[1.03]"
                        : "border border-[#E7E2D8] hover:border-[#1c3327]/60 opacity-75 hover:opacity-100 hover:scale-[1.02]"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-contain p-0.5"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details & Purchasing */}
          <div className="flex flex-col gap-5 text-[#202020]">
            <div>
              <h1 className="text-[26px] sm:text-[34px] font-bold text-[#202020] leading-tight">
                {product.title}
              </h1>

              {/* Rating with Dark Green Stars (#1f3a2c) linking to #judgeme_product_reviews */}
              <a
                href="#judgeme_product_reviews"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("judgeme_product_reviews")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 mt-2.5 group cursor-pointer"
              >
                <div className="flex items-center text-[#1f3a2c]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className="fill-[#1f3a2c] text-[#1f3a2c]"
                    />
                  ))}
                </div>
                <span className="text-[14px] font-bold text-[#202020]">
                  {product.rating}
                </span>
                <span className="text-[14px] text-[#747576]">·</span>
                <span className="text-[14px] text-[#1f3a2c] group-hover:underline font-medium">
                  {product.reviewsCount} reviews
                </span>
              </a>
            </div>

            {/* Description matching live site */}
            <p className="text-[15px] sm:text-[16px] text-[#5c5a52] leading-relaxed">
              {product.id === "organic-green" || product.handle === "organic-green"
                ? "A delicate, antioxidant-rich green tea from the misty hills of Darjeeling—smooth, floral, and beautifully balanced."
                : `A bold, full-bodied blend crafted from pristine estates in ${product.region}. Vacuum-packed at the source within 48 hours of harvest for unbeatable garden-fresh flavor and aroma.`}
            </p>

            {/* 4 Key Feature Badges 2x2 Grid (Exact Live Site Icons) */}
            <div className="grid grid-cols-2 gap-3.5 py-3.5 border-y border-[#E7E2D8]">
              <div className="flex items-center gap-2.5 text-[14px] text-[#202020]">
                <div className="w-6 h-6 shrink-0 flex items-center justify-center text-[#016c2f]">
                  <Leaf size={18} />
                </div>
                <span className="text-[13.5px] leading-tight">
                  <b>Very Low</b><br />caffeine
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-[14px] text-[#202020]">
                <div className="w-6 h-6 shrink-0 flex items-center justify-center text-[#016c2f]">
                  <Sparkles size={18} />
                </div>
                <span className="text-[13.5px] leading-tight">
                  <b>Whole leaf</b><br />no dust
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-[14px] text-[#202020]">
                <div className="w-6 h-6 shrink-0 flex items-center justify-center text-[#016c2f]">
                  <Sprout size={18} />
                </div>
                <span className="text-[13.5px] leading-tight">
                  <b>Himalayan</b><br />green tea base
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-[14px] text-[#202020]">
                <div className="w-6 h-6 shrink-0 flex items-center justify-center text-[#016c2f]">
                  <ShieldCheck size={18} />
                </div>
                <span className="text-[13.5px] leading-tight">
                  <b>Certified</b><br />organic
                </span>
              </div>
            </div>

            {/* Size / Weight Selection Cards */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[13px] font-bold uppercase tracking-wider text-[#5c5a52]">
                Pack Size:
              </span>
              <div className="flex flex-col gap-2">
                {variants.map((v) => {
                  const isSelected = selectedWeight === v.weight;
                  return (
                    <div
                      key={v.weight}
                      onClick={() => handleSelectWeight(v.weight)}
                      className={`relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#1f3a2c] bg-[#fafafa]"
                          : "border-[#E7E2D8] hover:border-[#1f3a2c]/60 bg-white"
                      }`}
                    >
                      {v.badge && (
                        <span
                          className={`absolute -top-2.5 right-4 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            v.badge === "BEST VALUE" ? "bg-[#1c3327]" : "bg-[#5c5a52]"
                          }`}
                        >
                          {v.badge}
                        </span>
                      )}

                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-[#1f3a2c]" : "border-[#b5b4af]"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#1f3a2c]" />
                          )}
                        </div>
                        <div>
                          <span className="text-[15px] font-bold text-[#202020]">
                            {v.weight}
                          </span>
                          <span className="text-[13px] text-[#747576] ml-2">
                            ≈ {v.cups}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-2">
                        {v.originalPrice > v.price && (
                          <span className="text-[13px] text-[#8e8d8a] line-through">
                            ₹{v.originalPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                        <span className="text-[17px] font-bold text-[#202020]">
                          ₹{v.price.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quantity Stepper & Add to Cart Button */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center border border-[#E7E2D8] rounded-lg p-1 bg-[#fafafa] shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 flex items-center justify-center text-[#202020] hover:text-[#016c2f] transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-bold text-[15px] text-[#202020]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 flex items-center justify-center text-[#202020] hover:text-[#016c2f] transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 bg-[#02cb5a] hover:bg-[#02cb5a]/90 text-[#1f3a2c] font-bold text-[17px] sm:text-[18px] h-14 rounded-[6px] tracking-[0.3px] uppercase transition-all shadow-sm active:scale-98 text-center cursor-pointer flex items-center justify-center"
              >
                Add to cart — ₹{(currentPrice * quantity).toLocaleString("en-IN")}
              </button>
            </div>

            {/* Delivery Promise Banner */}
            <p className="text-[13px] text-center text-[#5c5a52] flex items-center justify-center gap-1.5 font-medium pt-1">
              <span>🟢</span>
              <span>SHIPS BY <b>TOMORROW</b></span>
              <span className="text-[#a09e99]">|</span>
              <span>🌍 2–4 DAYS <b>PAN INDIA</b></span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Official Tea Board Certification Banner */}
      <div className="w-full bg-[#fafafa] border-y border-[#E7E2D8] py-8 sm:py-12 px-4 sm:px-8 mt-12">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-center md:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 border-b md:border-b-0 md:border-r border-[#E7E2D8] pb-6 md:pb-0 md:pr-8">
            <div className="w-16 h-16 rounded-full bg-white border border-[#E7E2D8] flex items-center justify-center shrink-0 text-[#016c2f]">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h4 className="font-bold text-[17px] text-[#202020]">
                100% Pure &amp; Fresh Single-Estate Tea
              </h4>
              <p className="text-[13.5px] text-[#5c5a52] mt-1 leading-normal">
                Certified by the Tea Board of India under the Ministry of Commerce. Sealed at origin, never warehoused.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 rounded-full bg-white border border-[#E7E2D8] flex items-center justify-center shrink-0 text-[#016c2f]">
              <Sprout size={32} />
            </div>
            <div>
              <h4 className="font-bold text-[17px] text-[#202020]">
                Garden-Direct Harvest
              </h4>
              <p className="text-[13.5px] text-[#5c5a52] mt-1 leading-normal">
                Vacuum-sealed within 48 hours of harvest. Pure whole-leaf teas with no artificial colors or additives.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Ingredients & Health Benefits (Live Site Sections) */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-[#fcfbf9] border border-[#E7E2D8] rounded-2xl p-6 sm:p-8">
          <h3 className="font-stencil text-[22px] sm:text-[26px] font-bold text-[#202020] mb-4">
            Ingredients
          </h3>
          <p className="text-[15px] text-[#5c5a52] leading-relaxed mb-4">
            100% Darjeeling Whole Leaf Green Tea. Sourced directly from certified organic tea gardens in Darjeeling, India.
          </p>
          <div className="flex items-center gap-2 text-[14px] font-semibold text-[#016c2f]">
            <Check size={18} />
            <span>Zero preservatives · 100% Natural · Non-GMO</span>
          </div>
        </div>

        <div className="bg-[#fcfbf9] border border-[#E7E2D8] rounded-2xl p-6 sm:p-8">
          <h3 className="font-stencil text-[22px] sm:text-[26px] font-bold text-[#202020] mb-4">
            These Teas Are
          </h3>
          <ul className="space-y-2.5 text-[14.5px] text-[#5c5a52]">
            <li className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#02cb5a]" />
              <span><b>0% Bitterness:</b> Tender spring & summer leaves smooth to the palate.</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#02cb5a]" />
              <span><b>Rich in EGCG:</b> Powerful polyphenols support active metabolism.</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#02cb5a]" />
              <span><b>Garden Vacuum-Sealed:</b> Locked at the peak of freshness.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 4. Brewing Guide */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 pb-12 sm:pb-16">
        <h2 className="font-stencil text-[26px] sm:text-[34px] font-bold text-center text-[#202020] mb-8">
          How To Steep?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#fafafa] border border-[#E7E2D8] rounded-xl p-6 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-white border border-[#E7E2D8] flex items-center justify-center font-bold text-[18px] text-[#016c2f] mb-3">
              1
            </div>
            <h4 className="font-bold text-[16px] text-[#202020] mb-1">Heat Water (80–85°C)</h4>
            <p className="text-[13.5px] text-[#5c5a52]">
              Bring 150–200ml of fresh water just below boiling point (80–85°C) to preserve delicate antioxidants.
            </p>
          </div>

          <div className="bg-[#fafafa] border border-[#E7E2D8] rounded-xl p-6 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-white border border-[#E7E2D8] flex items-center justify-center font-bold text-[18px] text-[#016c2f] mb-3">
              2
            </div>
            <h4 className="font-bold text-[16px] text-[#202020] mb-1">Add Leaves &amp; Steep</h4>
            <p className="text-[13.5px] text-[#5c5a52]">
              Add 1 tsp (2.5g) of whole leaves. Steep for 3–4 minutes for a balanced, golden brew.
            </p>
          </div>

          <div className="bg-[#fafafa] border border-[#E7E2D8] rounded-xl p-6 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-white border border-[#E7E2D8] flex items-center justify-center font-bold text-[18px] text-[#016c2f] mb-3">
              3
            </div>
            <h4 className="font-bold text-[16px] text-[#202020] mb-1">Strain &amp; Savor</h4>
            <p className="text-[13.5px] text-[#5c5a52]">
              Strain and enjoy pure. Leaves can be re-steeped up to 2 additional times.
            </p>
          </div>
        </div>
      </div>

      {/* 5. YOU ASKED, WE ANSWERED (Accordion FAQs) */}
      <div className="w-full bg-[#fcfbf9] border-t border-[#E7E2D8] py-12 sm:py-16 px-4 sm:px-6 lg:px-12">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-stencil text-[24px] sm:text-[30px] font-bold text-center text-[#202020] mb-8">
            YOU ASKED, WE ANSWERED
          </h2>

          <div className="divide-y divide-[#E7E2D8] border-y border-[#E7E2D8]">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left font-bold text-[16px] text-[#202020] hover:text-[#016c2f] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-[#747576] transition-transform duration-200 shrink-0 ml-4 ${
                        isOpen ? "rotate-180 text-[#016c2f]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-[14.5px] text-[#5c5a52] leading-relaxed animate-in fade-in duration-150">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Customer Reviews Section (Universal Review Part Shared Across All Products) */}
      <ProductReviews
        productTitle={product.title}
        rating={product.rating}
        reviewsCount={product.reviewsCount}
      />

      {/* 7. Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="w-full bg-[#fafafa] border-t border-[#E7E2D8] py-12 sm:py-16 px-4 sm:px-6 lg:px-12">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-stencil text-[22px] sm:text-[28px] font-bold text-[#202020]">
                You May Also Like
              </h3>
              <Link
                href="/collections/all"
                className="text-[14px] font-bold text-[#1f3a2c] hover:underline"
              >
                View All Teas →
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. Fullscreen High-Resolution Lightbox Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            aria-label="Close fullscreen view"
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2.5 rounded-full hover:bg-white/10 transition-colors z-50 cursor-pointer"
          >
            <X size={28} />
          </button>

          {/* Previous in lightbox */}
          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={handlePrevImage}
              aria-label="Previous image"
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Next in lightbox */}
          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={handleNextImage}
              aria-label="Next image"
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Centered High-Res Image */}
          <div
            className="relative max-w-[85vw] max-h-[75vh] w-[750px] h-[750px] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={galleryImages[activeImageIndex] || product.image}
              alt={product.title}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {/* Bottom Thumbnails Strip in Lightbox */}
          {galleryImages.length > 1 && (
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 overflow-x-auto max-w-[90vw] px-4 py-2 bg-black/60 rounded-full border border-white/20 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? "border-[#02cb5a] scale-105"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt={`Thumb ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

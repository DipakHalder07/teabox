"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useCart } from "./context/CartContext";
import { X, CheckCircle, Sparkles, ArrowRight } from "lucide-react";

interface TeaFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TeaFinderModal({ isOpen, onClose }: TeaFinderModalProps) {
  const { addToCart } = useCart();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    style: "",
    time: "",
    flavor: "",
  });

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setAnswers({ style: "", time: "", flavor: "" });
  };

  const getRecommendation = () => {
    if (answers.style === "milk" || answers.flavor === "spiced") {
      return {
        id: "teabox-kadak-chai",
        title: "Teabox Kadak Chai",
        reason: "Rich Assam CTC blended for bold morning chai with milk.",
        price: 200,
        weight: "250G",
        image: "/assets/product-kadak-chai.webp",
      };
    }
    if (answers.style === "herbal" || answers.time === "night") {
      return {
        id: "abhay-ras-chai",
        title: "Abhay Ras Chai",
        reason: "Caffeine-free ayurvedic blend with citrus lift, perfect for evening calm.",
        price: 449,
        weight: "150G",
        image: "/assets/product-abhay-ras.webp",
      };
    }
    return {
      id: "ayurvedic-chai-trial-pack",
      title: "Ayurvedic Chai Trial Pack",
      reason: "Our most popular sampler with 10 master-curated estate blends.",
      price: 1598,
      weight: "240G",
      image: "/assets/pack-ayurvedic.webp",
    };
  };

  const rec = getRecommendation();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-[540px] bg-white rounded-2xl shadow-2xl border border-[#e7e2d8] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-[#e7e2d8] flex items-center justify-between bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[#02cb5a]" />
            <h3 className="text-[18px] font-bold text-[#202020]">
              Find Your Perfect Tea Match
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5c5a52] hover:text-[#202020] rounded-full hover:bg-[#e7e2d8]/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {step === 1 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              <span className="text-[12px] font-bold tracking-wider uppercase text-[#016c2f]">
                Question 1 of 3
              </span>
              <h4 className="text-[18px] font-bold text-[#202020]">
                How do you usually like to drink your tea?
              </h4>
              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {[
                  { id: "milk", label: "With milk & sugar (classic chai style)" },
                  { id: "black", label: "Pure black without milk (Darjeeling / Assam)" },
                  { id: "green", label: "Green & light (fresh vegetal / grassy notes)" },
                  { id: "herbal", label: "Herbal & caffeine-free (wellness & calming)" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setAnswers({ ...answers, style: opt.id });
                      setStep(2);
                    }}
                    className="p-3.5 text-left rounded-lg border border-[#e7e2d8] hover:border-[#02cb5a] hover:bg-[#fafafa] font-medium text-[15px] text-[#202020] transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              <span className="text-[12px] font-bold tracking-wider uppercase text-[#016c2f]">
                Question 2 of 3
              </span>
              <h4 className="text-[18px] font-bold text-[#202020]">
                What time of the day do you look forward to your cup?
              </h4>
              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {[
                  { id: "morning", label: "First thing in the morning for high energy" },
                  { id: "afternoon", label: "Mid-day or post-lunch reset" },
                  { id: "night", label: "Evening unwind / bedtime relaxation" },
                  { id: "all-day", label: "All throughout the day" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setAnswers({ ...answers, time: opt.id });
                      setStep(3);
                    }}
                    className="p-3.5 text-left rounded-lg border border-[#e7e2d8] hover:border-[#02cb5a] hover:bg-[#fafafa] font-medium text-[15px] text-[#202020] transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              <span className="text-[12px] font-bold tracking-wider uppercase text-[#016c2f]">
                Question 3 of 3
              </span>
              <h4 className="text-[18px] font-bold text-[#202020]">
                Which tasting note appeals most to your palate?
              </h4>
              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {[
                  { id: "spiced", label: "Cardamom, ginger & warm winter spices" },
                  { id: "malty", label: "Deep malty, robust & brisk" },
                  { id: "floral", label: "Delicate muscatel grapes & floral bouquets" },
                  { id: "minty", label: "Refreshing mint & soothing lemongrass" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setAnswers({ ...answers, flavor: opt.id });
                      setStep(4);
                    }}
                    className="p-3.5 text-left rounded-lg border border-[#e7e2d8] hover:border-[#02cb5a] hover:bg-[#fafafa] font-medium text-[15px] text-[#202020] transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-[#016c2f]">
                <CheckCircle size={20} />
                <span className="text-[13px] font-bold tracking-wider uppercase">
                  Your Custom Recommendation
                </span>
              </div>

              <div className="p-4 bg-[#fafafa] border border-[#e7e2d8] rounded-xl flex gap-4 items-center">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white border border-[#e7e2d8] flex-shrink-0">
                  <Image
                    src={rec.image}
                    alt={rec.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-[17px] font-bold text-[#202020]">
                    {rec.title}
                  </h4>
                  <p className="text-[13px] text-[#5c5a52] mt-1 leading-snug">
                    {rec.reason}
                  </p>
                  <div className="text-[15px] font-bold text-[#1f3a2c] mt-1.5">
                    ₹{rec.price} ({rec.weight})
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    addToCart({
                      id: rec.id,
                      title: rec.title,
                      price: rec.price,
                      image: rec.image,
                      weight: rec.weight,
                    });
                    onClose();
                  }}
                  className="w-full bg-[#02cb5a] hover:bg-[#01b850] text-[#1f3a2c] font-bold py-3.5 px-4 rounded-lg tracking-wider uppercase text-[15px] flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <span>Add To Cart — ₹{rec.price}</span>
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[13px] text-[#5c5a52] hover:text-[#202020] text-center underline font-medium"
                >
                  Retake quiz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

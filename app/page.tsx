"use client";

import React, { useState } from "react";
import TopBar from "@/components/TopBar";
import ShippingBar from "@/components/ShippingBar";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProofBar from "@/components/ProofBar";
import TrialPacks from "@/components/TrialPacks";
import WhyTeabox from "@/components/WhyTeabox";
import PromoSplit from "@/components/PromoSplit";
import JustArrived from "@/components/JustArrived";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SearchDrawer from "@/components/SearchDrawer";
import TeaFinderModal from "@/components/TeaFinderModal";

export default function Home() {
  const [teaFinderOpen, setTeaFinderOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 1. Header announcement bars */}
      <TopBar />
      <ShippingBar />

      {/* 2. Main sticky navigation header */}
      <Header onOpenTeaFinder={() => setTeaFinderOpen(true)} />

      {/* 3. Main content sections */}
      <main className="flex-1">
        <Hero />
        <ProofBar />
        <TrialPacks />
        <WhyTeabox />
        <PromoSplit onOpenTeaFinder={() => setTeaFinderOpen(true)} />
        <JustArrived />
      </main>

      {/* 4. Luxury Dark Footer */}
      <Footer />

      {/* 5. Modals and Slide-Out Drawers */}
      <CartDrawer />
      <SearchDrawer />
      <TeaFinderModal
        isOpen={teaFinderOpen}
        onClose={() => setTeaFinderOpen(false)}
      />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import TopBar from "@/components/TopBar";
import ShippingBar from "@/components/ShippingBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SearchDrawer from "@/components/SearchDrawer";
import TeaFinderModal from "@/components/TeaFinderModal";

export default function SiteLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [teaFinderOpen, setTeaFinderOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 1. Header & Announcement Bars */}
      <TopBar />
      <ShippingBar />
      <Header onOpenTeaFinder={() => setTeaFinderOpen(true)} />

      {/* 2. Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* 3. Luxury Dark Footer */}
      <Footer />

      {/* 4. Global Drawers & Modals */}
      <CartDrawer />
      <SearchDrawer />
      <TeaFinderModal
        isOpen={teaFinderOpen}
        onClose={() => setTeaFinderOpen(false)}
      />
    </div>
  );
}

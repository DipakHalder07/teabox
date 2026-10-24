"use client";

import React, { useState } from "react";
import TopBar from "@/components/TopBar";
import ShippingBar from "@/components/ShippingBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SearchDrawer from "@/components/SearchDrawer";
import TeaFinderModal from "@/components/TeaFinderModal";
import ProductListingPage from "@/components/ProductListingPage";
import type { Product } from "@/data/products";

export default function CollectionLayoutWrapper({ collection, products }: { collection: string; products: Product[] }) {
  const [teaFinderOpen, setTeaFinderOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 1. Header & Announcement Bars */}
      <TopBar />
      <ShippingBar />
      <Header onOpenTeaFinder={() => setTeaFinderOpen(true)} />

      {/* 2. Main Product Listing Content */}
      <main className="flex-1">
        <ProductListingPage initialCollectionId={collection} products={products} />
      </main>

      {/* 3. Luxury Dark Footer */}
      <Footer />

      {/* 4. Drawers & Modals */}
      <CartDrawer />
      <SearchDrawer />
      <TeaFinderModal
        isOpen={teaFinderOpen}
        onClose={() => setTeaFinderOpen(false)}
      />
    </div>
  );
}

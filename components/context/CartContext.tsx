"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useCartStore, CartItem } from "@/lib/store/useCartStore";
import { initCartSync } from "@/lib/store/cartSync";

export type { CartItem };

export interface CartContextType {
  cartItems: CartItem[];
  hasHydrated: boolean;
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isCheckoutOpen: boolean;
  isTeaFinderOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  openTeaFinder: () => void;
  closeTeaFinder: () => void;
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, deltaOrExact: number, isExact?: boolean) => void;
  clearCart: () => void;
  mergeCartItems: (items: CartItem[]) => void;
  totalCount: number;
  subtotal: number;
  freeShippingThreshold: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Bind cross-tab synchronization bus on mount
  useEffect(() => {
    const unbind = initCartSync();
    return unbind;
  }, []);

  // Client hydration detection
  const [clientMounted, setClientMounted] = useState(false);
  const storeHydrated = useCartStore((s) => s.hasHydrated);

  useEffect(() => {
    setClientMounted(true);
    // In case persist already finished before mount
    if (!storeHydrated && typeof window !== "undefined") {
      useCartStore.getState().setHasHydrated(true);
    }
  }, [storeHydrated]);

  const hasHydrated = clientMounted && storeHydrated;

  // Granular Zustand subscriptions to avoid full-page re-renders
  const cartItems = useCartStore((s) => s.cartItems);
  const isCartOpen = useCartStore((s) => s.isCartOpen);
  const isSearchOpen = useCartStore((s) => s.isSearchOpen);
  const isCheckoutOpen = useCartStore((s) => s.isCheckoutOpen);
  const isTeaFinderOpen = useCartStore((s) => s.isTeaFinderOpen);
  const openCart = useCartStore((s) => s.openCart);
  const closeCart = useCartStore((s) => s.closeCart);
  const toggleCart = useCartStore((s) => s.toggleCart);
  const openSearch = useCartStore((s) => s.openSearch);
  const closeSearch = useCartStore((s) => s.closeSearch);
  const openCheckout = useCartStore((s) => s.openCheckout);
  const closeCheckout = useCartStore((s) => s.closeCheckout);
  const openTeaFinder = useCartStore((s) => s.openTeaFinder);
  const closeTeaFinder = useCartStore((s) => s.closeTeaFinder);
  const addToCart = useCartStore((s) => s.addToCart);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const mergeCartItems = useCartStore((s) => s.mergeCartItems);
  const freeShippingThreshold = useCartStore((s) => s.freeShippingThreshold);

  // Prices saved in the cart can be stale (admin price change, a button showing the wrong size's
  // price). Re-price every line from the live catalog so the cart shows what checkout charges.
  const lineKey = cartItems.map((it) => `${it.id}|${it.weight || ""}|${it.price}`).join(",");
  useEffect(() => {
    if (!hasHydrated || cartItems.length === 0) return;
    const lines = cartItems.map((it) => ({ id: it.id, weight: it.weight || null }));
    const controller = new AbortController();
    fetch("/api/cart/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: lines }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const prices: Array<number | null> | undefined = data?.prices;
        if (!Array.isArray(prices)) return;
        const live = new Map(lines.map((l, i) => [l.id, prices[i]]));
        const current = useCartStore.getState().cartItems;
        let changed = false;
        const next = current.map((it) => {
          const price = live.get(it.id);
          if (typeof price !== "number" || price === it.price) return it;
          changed = true;
          return { ...it, price };
        });
        if (changed) useCartStore.getState().setCartItems(next);
      })
      .catch(() => {});
    return () => controller.abort();
    // lineKey covers every field that affects the price
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, lineKey]);

  // Computed total count and subtotal
  const totalCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  );

  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems]
  );

  const contextValue = useMemo<CartContextType>(
    () => ({
      cartItems: hasHydrated ? cartItems : [],
      hasHydrated,
      isCartOpen,
      isSearchOpen,
      isCheckoutOpen,
      isTeaFinderOpen,
      openCart,
      closeCart,
      toggleCart,
      openSearch,
      closeSearch,
      openCheckout,
      closeCheckout,
      openTeaFinder,
      closeTeaFinder,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      mergeCartItems,
      totalCount: hasHydrated ? totalCount : 0,
      subtotal: hasHydrated ? subtotal : 0,
      freeShippingThreshold,
    }),
    [
      cartItems,
      hasHydrated,
      isCartOpen,
      isSearchOpen,
      isCheckoutOpen,
      isTeaFinderOpen,
      openCart,
      closeCart,
      toggleCart,
      openSearch,
      closeSearch,
      openCheckout,
      closeCheckout,
      openTeaFinder,
      closeTeaFinder,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      mergeCartItems,
      totalCount,
      subtotal,
      freeShippingThreshold,
    ]
  );

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

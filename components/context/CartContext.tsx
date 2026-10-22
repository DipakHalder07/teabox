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

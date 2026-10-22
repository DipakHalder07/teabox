"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useCartStore, CartItem } from "@/lib/store/useCartStore";

export type { CartItem };

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isCheckoutOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
  freeShippingThreshold: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Use Zustand store under the hood
  const store = useCartStore();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const totalCount = store.getTotalCount();
  const subtotal = store.getSubtotal();

  const contextValue: CartContextType = {
    cartItems: hasHydrated ? store.cartItems : store.cartItems,
    isCartOpen: store.isCartOpen,
    isSearchOpen: store.isSearchOpen,
    isCheckoutOpen: store.isCheckoutOpen,
    openCart: store.openCart,
    closeCart: store.closeCart,
    openSearch: store.openSearch,
    closeSearch: store.closeSearch,
    openCheckout: store.openCheckout,
    closeCheckout: store.closeCheckout,
    addToCart: store.addToCart,
    removeFromCart: store.removeFromCart,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    totalCount,
    subtotal,
    freeShippingThreshold: store.freeShippingThreshold,
  };

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

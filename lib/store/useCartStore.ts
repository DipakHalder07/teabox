import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  title: string;
  weight: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartStoreState {
  // Items
  cartItems: CartItem[];
  
  // UI Drawers & Modals
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isCheckoutOpen: boolean;
  isTeaFinderOpen: boolean;

  // Actions
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
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  
  // Computed helpers
  getTotalCount: () => number;
  getSubtotal: () => number;
  freeShippingThreshold: number;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      cartItems: [
        {
          id: "abhay-ras-chai",
          title: "Abhay Ras Chai",
          weight: "150G",
          price: 449,
          image: "/assets/product-abhay-ras.webp",
          quantity: 1,
        },
      ],
      isCartOpen: false,
      isSearchOpen: false,
      isCheckoutOpen: false,
      isTeaFinderOpen: false,
      freeShippingThreshold: 399,

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      
      openSearch: () => set({ isSearchOpen: true }),
      closeSearch: () => set({ isSearchOpen: false }),

      openCheckout: () => set({ isCartOpen: false, isCheckoutOpen: true }),
      closeCheckout: () => set({ isCheckoutOpen: false }),

      openTeaFinder: () => set({ isTeaFinderOpen: true }),
      closeTeaFinder: () => set({ isTeaFinderOpen: false }),

      addToCart: (item, quantity = 1) => {
        let addedTitle = item.title;
        set((state) => {
          const existing = state.cartItems.find((i) => i.id === item.id);
          let newItems: CartItem[];
          if (existing) {
            newItems = state.cartItems.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
            );
          } else {
            newItems = [...state.cartItems, { ...item, quantity }];
          }
          return {
            cartItems: newItems,
            isCartOpen: true,
          };
        });

        toast.success("Added to Bag", {
          description: `${addedTitle} (${item.weight || "100g"})`,
          action: {
            label: "View Cart",
            onClick: () => get().openCart(),
          },
        });
      },

      removeFromCart: (id: string) => {
        const itemToRemove = get().cartItems.find((i) => i.id === id);
        set((state) => ({
          cartItems: state.cartItems.filter((i) => i.id !== id),
        }));

        if (itemToRemove) {
          toast.info("Removed from Bag", {
            description: itemToRemove.title,
          });
        }
      },

      updateQuantity: (id: string, delta: number) => {
        set((state) => {
          const updated = state.cartItems
            .map((item) => {
              if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
              }
              return item;
            })
            .filter(Boolean) as CartItem[];
          return { cartItems: updated };
        });
      },

      clearCart: () => {
        set({ cartItems: [] });
      },

      getTotalCount: () => {
        return get().cartItems.reduce((acc, item) => acc + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().cartItems.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: "teabox-cart-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist cartItems to avoid modals opening on page reload
      partialize: (state) => ({
        cartItems: state.cartItems,
      }),
    }
  )
);

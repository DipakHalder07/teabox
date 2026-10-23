import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { broadcastCartChange } from "./cartSync";

export interface CartItem {
  id: string; // Composite unique key e.g. "abhay-ras-chai-150G"
  productId?: string; // Base product identifier / handle
  title: string;
  weight?: string;
  price: number;
  image: string;
  quantity: number;
}

/**
 * Validates that an untrusted object meets the required CartItem structure
 */
export function isValidCartItem(item: any): item is CartItem {
  return (
    item &&
    typeof item === "object" &&
    typeof item.id === "string" &&
    item.id.trim().length > 0 &&
    typeof item.title === "string" &&
    item.title.trim().length > 0 &&
    typeof item.price === "number" &&
    !isNaN(item.price) &&
    item.price >= 0 &&
    typeof item.quantity === "number" &&
    !isNaN(item.quantity) &&
    item.quantity > 0 &&
    Number.isInteger(item.quantity)
  );
}

export interface CartStoreState {
  // Items & Hydration
  cartItems: CartItem[];
  hasHydrated: boolean;
  
  // UI Drawers & Modals
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isCheckoutOpen: boolean;
  isTeaFinderOpen: boolean;
  freeShippingThreshold: number;

  // Actions
  setHasHydrated: (hydrated: boolean) => void;
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
  setCartItems: (items: CartItem[], broadcast?: boolean) => void;
  mergeCartItems: (incomingItems: CartItem[]) => void;
  
  // Computed helpers
  getTotalCount: () => number;
  getSubtotal: () => number;
}

// In-memory fallback storage when window/localStorage is unavailable
const memoryStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      // Clean initial state: Starts empty and restores safely from localStorage
      cartItems: [],
      hasHydrated: false,

      // UI Drawers
      isCartOpen: false,
      isSearchOpen: false,
      isCheckoutOpen: false,
      isTeaFinderOpen: false,
      freeShippingThreshold: 399,

      setHasHydrated: (hydrated: boolean) => set({ hasHydrated: hydrated }),

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      
      openSearch: () => set({ isSearchOpen: true }),
      closeSearch: () => set({ isSearchOpen: false }),

      openCheckout: () => set({ isCartOpen: false, isCheckoutOpen: true }),
      closeCheckout: () => set({ isCheckoutOpen: false }),

      openTeaFinder: () => set({ isTeaFinderOpen: true }),
      closeTeaFinder: () => set({ isTeaFinderOpen: false }),

      /**
       * Add product to cart with variant-aware deduplication
       */
      addToCart: (item, quantity = 1) => {
        const validQuantity = Math.max(1, Math.floor(quantity || 1));
        const normalizedWeight = item.weight?.trim() || "";
        
        // Build a canonical variant key: e.g. "abhay-ras-chai-150G"
        const canonicalId =
          item.id.includes("-") && normalizedWeight && item.id.endsWith(normalizedWeight)
            ? item.id
            : normalizedWeight
            ? `${item.id}-${normalizedWeight}`
            : item.id;

        const cartItemToAdd: CartItem = {
          ...item,
          id: canonicalId,
          productId: item.productId || item.id,
          weight: normalizedWeight || undefined,
          quantity: validQuantity,
        };

        let newItems: CartItem[] = [];

        set((state) => {
          // Check for existing variant match
          const existingIndex = state.cartItems.findIndex(
            (i) =>
              i.id === canonicalId ||
              (i.productId && item.productId && i.productId === item.productId && i.weight === normalizedWeight)
          );

          if (existingIndex > -1) {
            newItems = state.cartItems.map((i, idx) =>
              idx === existingIndex
                ? { ...i, quantity: i.quantity + validQuantity }
                : i
            );
          } else {
            newItems = [...state.cartItems, cartItemToAdd];
          }

          return {
            cartItems: newItems,
            isCartOpen: true,
          };
        });

        // Broadcast to other tabs
        broadcastCartChange(newItems);
      },

      /**
       * Remove item from cart by ID
       */
      removeFromCart: (id: string) => {
        const itemToRemove = get().cartItems.find((i) => i.id === id);
        let newItems: CartItem[] = [];

        set((state) => {
          newItems = state.cartItems.filter((i) => i.id !== id);
          return { cartItems: newItems };
        });

        // Broadcast to other tabs
        broadcastCartChange(newItems);
      },

      /**
       * Update item quantity (either +/- delta or exact value)
       */
      updateQuantity: (id: string, deltaOrExact: number, isExact: boolean = false) => {
        let newItems: CartItem[] = [];

        set((state) => {
          newItems = state.cartItems
            .map((item) => {
              if (item.id === id) {
                const nextQty = isExact
                  ? Math.floor(deltaOrExact)
                  : item.quantity + Math.floor(deltaOrExact);
                return nextQty > 0 ? { ...item, quantity: nextQty } : null;
              }
              return item;
            })
            .filter(Boolean) as CartItem[];

          return { cartItems: newItems };
        });

        // Broadcast to other tabs
        broadcastCartChange(newItems);
      },

      /**
       * Clear all cart items
       */
      clearCart: () => {
        set({ cartItems: [] });
        broadcastCartChange([], "CART_CLEAR");
      },

      /**
       * Set cart items directly (used by cross-tab synchronizer)
       */
      setCartItems: (items: CartItem[], broadcast: boolean = true) => {
        const validated = items.filter(isValidCartItem);
        set({ cartItems: validated });
        if (broadcast) {
          broadcastCartChange(validated);
        }
      },

      /**
       * Merge guest cart with customer cart upon login
       * Conflict resolution: Sums quantities for identical items, keeps unique items
       */
      mergeCartItems: (incomingItems: CartItem[]) => {
        if (!Array.isArray(incomingItems) || incomingItems.length === 0) return;

        let merged: CartItem[] = [];

        set((state) => {
          const map = new Map<string, CartItem>();

          // Add current cart items
          for (const item of state.cartItems) {
            map.set(item.id, { ...item });
          }

          // Merge incoming items
          for (const inc of incomingItems) {
            if (!isValidCartItem(inc)) continue;
            const existing = map.get(inc.id);
            if (existing) {
              map.set(inc.id, {
                ...existing,
                quantity: Math.min(99, existing.quantity + inc.quantity),
              });
            } else {
              map.set(inc.id, { ...inc });
            }
          }

          merged = Array.from(map.values());
          return { cartItems: merged };
        });

        broadcastCartChange(merged);
      },

      /**
       * Total count of items
       */
      getTotalCount: () => {
        return get().cartItems.reduce((acc, item) => acc + item.quantity, 0);
      },

      /**
       * Subtotal in INR
       */
      getSubtotal: () => {
        return get().cartItems.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: "teabox-cart-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : memoryStorage
      ),
      // Only persist cartItems to avoid modals reopening on page refresh
      partialize: (state) => ({
        cartItems: state.cartItems,
      }),
      // Safely deserialize and validate stored items, handling corrupted or outdated JSON
      merge: (persistedState: any, currentState) => {
        try {
          const storedItems = Array.isArray(persistedState?.cartItems)
            ? persistedState.cartItems.filter(isValidCartItem)
            : [];
          return {
            ...currentState,
            cartItems: storedItems,
            hasHydrated: true,
          };
        } catch (err) {
          console.warn("Cart state merge fallback:", err);
          return {
            ...currentState,
            cartItems: [],
            hasHydrated: true,
          };
        }
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn("Cart rehydration warning:", error);
        }
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);

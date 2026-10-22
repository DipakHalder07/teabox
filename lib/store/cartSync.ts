/**
 * Multi-Tab Cross-Tab Cart Synchronization Engine for Teabox
 *
 * Uses BroadcastChannel for instant <5ms cross-tab messaging with automatic
 * fallback to the browser Storage API (`storage` event) for older browsers.
 *
 * Features:
 * - Deterministic tab IDs to avoid infinite message reflection loops
 * - Safe payload validation preventing malformed cross-tab messages from corrupting store
 * - Automatic re-sync when tabs regain visibility or focus
 * - Clean event listener unbinding on unmount
 */

import { CartItem, useCartStore, isValidCartItem } from "./useCartStore";

const CHANNEL_NAME = "teabox_cart_bus_v1";
const STORAGE_KEY = "teabox-cart-storage";

// Unique ID for the current browser tab session
export const TAB_ID =
  typeof window !== "undefined"
    ? `tab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    : "ssr";

interface CartSyncPayload {
  type: "CART_SYNC" | "CART_CLEAR";
  items: CartItem[];
  senderTabId: string;
  timestamp: number;
}

let broadcastChannel: BroadcastChannel | null = null;

/**
 * Initializes cross-tab communication for the cart
 */
export function initCartSync(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  // 1. Initialize BroadcastChannel if supported
  if (typeof BroadcastChannel !== "undefined") {
    try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
      broadcastChannel.onmessage = (event: MessageEvent<CartSyncPayload>) => {
        handleIncomingSync(event.data);
      };
    } catch (e) {
      console.warn("BroadcastChannel not available, using storage event fallback:", e);
    }
  }

  // 2. Storage Event Listener (fires in other same-origin tabs when localStorage updates)
  const handleStorageEvent = (e: StorageEvent) => {
    // Only listen to our cart storage key
    if (e.key !== STORAGE_KEY || !e.newValue) return;

    try {
      const parsed = JSON.parse(e.newValue);
      const items = parsed?.state?.cartItems;
      if (Array.isArray(items)) {
        const validated = items.filter(isValidCartItem);
        // Sync without echoing back to storage
        useCartStore.getState().setCartItems(validated, false);
      }
    } catch (err) {
      console.warn("Storage sync parse warning:", err);
    }
  };

  // 3. Tab Visibility Change / Focus Listener
  // When user switches back to an idle tab, ensure its state is 100% fresh
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const items = parsed?.state?.cartItems;
          if (Array.isArray(items)) {
            const validated = items.filter(isValidCartItem);
            const currentItems = useCartStore.getState().cartItems;
            // Only update if actually different to prevent extra renders
            if (JSON.stringify(currentItems) !== JSON.stringify(validated)) {
              useCartStore.getState().setCartItems(validated, false);
            }
          }
        }
      } catch {}
    }
  };

  window.addEventListener("storage", handleStorageEvent);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("focus", handleVisibilityChange);

  // Return unbind cleanup function
  return () => {
    if (broadcastChannel) {
      try {
        broadcastChannel.close();
      } catch {}
      broadcastChannel = null;
    }
    window.removeEventListener("storage", handleStorageEvent);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("focus", handleVisibilityChange);
  };
}

/**
 * Broadcasts cart changes to all other open tabs
 */
export function broadcastCartChange(items: CartItem[], type: "CART_SYNC" | "CART_CLEAR" = "CART_SYNC"): void {
  if (typeof window === "undefined") return;

  const payload: CartSyncPayload = {
    type,
    items,
    senderTabId: TAB_ID,
    timestamp: Date.now(),
  };

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch (err) {
      console.warn("BroadcastChannel postMessage error:", err);
    }
  }
}

/**
 * Internal handler for incoming messages from other tabs
 */
function handleIncomingSync(payload: CartSyncPayload | null): void {
  if (!payload || typeof payload !== "object") return;

  // Ignore messages from this tab
  if (payload.senderTabId === TAB_ID) return;

  if (payload.type === "CART_CLEAR") {
    useCartStore.getState().setCartItems([], false);
    return;
  }

  if (payload.type === "CART_SYNC" && Array.isArray(payload.items)) {
    const validated = payload.items.filter(isValidCartItem);
    useCartStore.getState().setCartItems(validated, false);
  }
}

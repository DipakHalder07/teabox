"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./context/CartContext";
import { X, Trash2, Plus, Minus, Check, ShoppingBag, ArrowRight } from "lucide-react";
import FastrrCheckoutModal from "./FastrrCheckoutModal";

export default function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    removeFromCart,
    updateQuantity,
    totalCount,
    subtotal,
    freeShippingThreshold,
    isCheckoutOpen,
    openCheckout,
    closeCheckout,
  } = useCart();

  const [orderNote, setOrderNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  const diffToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );

  return (
    <>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={closeCart}
          />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-[420px] bg-white shadow-2xl flex flex-col justify-between overflow-hidden border-l border-[#e7e2d8]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#e7e2d8] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-[#1f3a2c]" />
              <h2 className="text-[18px] font-bold text-[#202020]">
                Cart ({totalCount})
              </h2>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="p-1.5 text-[#5c5a52] hover:text-[#202020] rounded-full hover:bg-[#f0f0f0] transition-colors"
              aria-label="Close cart"
            >
              <X size={20} />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          <div className="bg-[#fafafa] border-b border-[#e7e2d8] px-5 py-3">
            <div className="text-[13px] text-[#202020] font-medium mb-1.5 flex items-center gap-1.5">
              {diffToFreeShipping === 0 ? (
                <>
                  <Check size={16} className="text-[#02cb5a] stroke-[3]" />
                  <span className="font-semibold text-[#016c2f]">
                    You have unlocked FREE Express Shipping!
                  </span>
                </>
              ) : (
                <span>
                  Add <strong className="text-[#016c2f]">₹{diffToFreeShipping}</strong> more for Free Express Shipping
                </span>
              )}
            </div>
            <div className="w-full h-1.5 bg-[#e7e2d8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#02cb5a] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto px-5 py-4 divide-y divide-[#e7e2d8]">
            {cartItems.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
                <ShoppingBag size={48} className="text-[#c0c0c0]" />
                <p className="text-[16px] font-semibold text-[#202020]">
                  Your cart is currently empty
                </p>
                <p className="text-[14px] text-[#5c5a52] max-w-[240px]">
                  Explore our freshly packed teas and trial samplers.
                </p>
                <button
                  type="button"
                  onClick={closeCart}
                  className="mt-2 bg-[#02cb5a] text-[#1f3a2c] font-bold text-[14px] px-6 py-2.5 rounded-md hover:bg-[#01b850]"
                >
                  START SHOPPING
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="py-4 flex gap-4 items-start">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-[#fafafa] border border-[#e7e2d8] flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[15px] font-bold text-[#202020] truncate">
                        {item.title}
                      </h4>
                      <p className="text-[13px] text-[#5c5a52]">{item.weight}</p>
                      <div className="text-[14px] font-bold text-[#1f3a2c] mt-0.5">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>

                    {/* Stepper & Remove */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-[#e7e2d8] rounded-md overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="px-2 py-1 text-[#5c5a52] hover:bg-[#fafafa]"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="px-3 text-[13px] font-bold text-[#202020]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-2 py-1 text-[#5c5a52] hover:bg-[#fafafa]"
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-[12px] text-[#5c5a52] hover:text-[#d93838] underline transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Area */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-[#e7e2d8] bg-white flex flex-col gap-3">
              {/* Order note accordion */}
              <div className="text-[13px]">
                <button
                  type="button"
                  onClick={() => setShowNoteInput(!showNoteInput)}
                  className="text-[#5c5a52] hover:text-[#202020] underline font-medium"
                >
                  {showNoteInput ? "Hide order note" : "+ Add order note"}
                </button>
                {showNoteInput && (
                  <textarea
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Special instructions for delivery or tea packaging..."
                    rows={2}
                    className="w-full mt-2 p-2.5 text-[13px] border border-[#e7e2d8] rounded-md outline-none focus:border-[#02cb5a]"
                  />
                )}
              </div>

              {/* Subtotal */}
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-[16px] font-bold text-[#202020]">Total</span>
                <span className="text-[20px] font-bold text-[#1f3a2c]">
                  ₹{subtotal}
                </span>
              </div>
              <p className="text-[12px] text-[#5c5a52]">
                Tax included. Free express shipping on all prepaid orders.
              </p>

              {/* Fastrr Green Checkout Button linking to dedicated /checkout page */}
              <Link
                href="/checkout"
                onClick={() => closeCart()}
                className="w-full bg-[#02cb5a] hover:bg-[#01b850] text-[#1f3a2c] py-3.5 px-4 rounded-lg font-bold text-[16px] tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-99 text-center"
              >
                <span>PROCEED TO CHECKOUT — ₹{subtotal}</span>
                <ArrowRight size={18} />
              </Link>

              {/* Payment Trust Badges */}
              <div className="flex flex-col items-center gap-1 text-[11px] text-[#747576] font-medium pt-1">
                <span className="text-[#016c2f] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#02cb5a]" />
                  Instant UPI &amp; Cash on Delivery Available
                </span>
                <span>Google Pay · PhonePe · Paytm · CRED · Cash on Delivery (COD)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )}

  {/* Headless Fastrr Checkout Modal with YouPI-PG (accessible anywhere) */}
  <FastrrCheckoutModal
    isOpen={isCheckoutOpen}
    onClose={closeCheckout}
  />
</>
  );
}

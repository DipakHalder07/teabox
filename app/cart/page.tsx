"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { useCart } from "@/components/context/CartContext";
import SiteLayoutWrapper from "@/components/SiteLayoutWrapper";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Check,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";

export default function CartPage() {
  const {
    cartItems,
    hasHydrated,
    totalCount,
    subtotal,
    freeShippingThreshold,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const diffToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );
  const shippingFee = subtotal >= freeShippingThreshold ? 0 : 50;
  const estimatedTotal = subtotal + shippingFee;

  return (
    <SiteLayoutWrapper>
      <div className="bg-[#fafafa] min-h-[80vh] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="text-[13px] text-[#747576] mb-6">
            <Link href="/" className="hover:text-[#016c2f] transition-colors">
              Home
            </Link>{" "}
            › <span className="text-[#202020] font-semibold">Shopping Bag</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#e7e2d8] gap-4">
            <div>
              <h1 className="text-[28px] sm:text-[34px] font-bold text-[#1f3a2c]">
                Your Shopping Bag
              </h1>
              <p className="text-[14px] text-[#5c5a52] mt-1">
                {hasHydrated && totalCount > 0
                  ? `You have ${totalCount} fresh item${totalCount === 1 ? "" : "s"} in your bag.`
                  : "Your shopping bag is currently empty."}
              </p>
            </div>

            {hasHydrated && cartItems.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[13px] text-[#dc3545] hover:underline flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Clear Entire Bag</span>
              </button>
            )}
          </div>

          {!hasHydrated ? (
            /* Loading Shimmer while hydration completes */
            <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-10 h-10 border-3 border-[#02cb5a] border-t-transparent rounded-full animate-spin" />
              <p className="text-[14px] text-[#747576]">Restoring your fresh tea selection...</p>
            </div>
          ) : cartItems.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-[#e7e2d8] rounded-2xl p-10 sm:p-16 my-8 text-center max-w-lg mx-auto shadow-2xs">
              <div className="w-20 h-20 rounded-full bg-[#f0f0f0] flex items-center justify-center mx-auto text-[#747576] mb-4">
                <ShoppingBag size={40} />
              </div>
              <h2 className="text-[22px] font-bold text-[#202020]">
                Your shopping bag is empty
              </h2>
              <p className="text-[14px] text-[#5c5a52] mt-2 mb-6">
                Discover 100% fresh, authentic single-estate teas and hand-crafted wellness blends.
              </p>
              <Link
                href="/collections/all"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#02cb5a] hover:bg-[#01b850] text-[#1f3a2c] font-bold text-[15px] rounded-xl transition-all shadow-sm uppercase tracking-wider"
              >
                <span>Explore Teas</span>
                <ArrowRight size={17} />
              </Link>
            </div>
          ) : (
            /* Active Cart Layout */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 items-start">
              {/* Left Column: Items List */}
              <div className="lg:col-span-8 space-y-4">
                {/* Free Shipping Progress Indicator */}
                <div className="bg-white border border-[#e7e2d8] rounded-xl p-4 shadow-2xs">
                  <div className="text-[13.5px] text-[#202020] font-medium mb-2 flex items-center gap-2">
                    {diffToFreeShipping === 0 ? (
                      <>
                        <Check size={17} className="text-[#02cb5a] stroke-[3]" />
                        <span className="font-bold text-[#016c2f]">
                          You have unlocked FREE Express Shipping!
                        </span>
                      </>
                    ) : (
                      <span>
                        Add <strong className="text-[#016c2f]">₹{diffToFreeShipping}</strong> more for Free Express Shipping
                      </span>
                    )}
                  </div>
                  <div className="w-full h-2 bg-[#e7e2d8] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#02cb5a] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>

                {/* Items */}
                <div className="bg-white border border-[#e7e2d8] rounded-2xl divide-y divide-[#e7e2d8] overflow-hidden shadow-2xs">
                  {cartItems.map((item) => (
                    <motion.div
                      layout
                      key={item.id}
                      className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#fafafa] border border-[#e7e2d8] shrink-0">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>

                        <div>
                          <h3 className="font-bold text-[16px] text-[#202020]">
                            {item.title}
                          </h3>
                          {item.weight && (
                            <span className="inline-block text-[12px] bg-[#fafafa] border border-[#e7e2d8] text-[#5c5a52] px-2 py-0.5 rounded mt-1">
                              {item.weight}
                            </span>
                          )}
                          <div className="text-[14px] text-[#747576] mt-1">
                            ₹{item.price.toLocaleString("en-IN")} each
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-[#e7e2d8] rounded-lg overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="px-2.5 py-1.5 text-[#5c5a52] hover:bg-[#fafafa] cursor-pointer transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-3.5 text-[14px] font-bold text-[#202020]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="px-2.5 py-1.5 text-[#5c5a52] hover:bg-[#fafafa] cursor-pointer transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right min-w-[80px]">
                          <span className="font-bold text-[17px] text-[#1f3a2c]">
                            ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-[#999] hover:text-[#dc3545] p-1.5 transition-colors cursor-pointer"
                          aria-label={`Remove ${item.title} from cart`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right Column: Order Summary */}
              <div className="lg:col-span-4 bg-white border border-[#e7e2d8] rounded-2xl p-6 shadow-2xs space-y-5 sticky top-28">
                <h2 className="text-[18px] font-bold text-[#202020] border-b border-[#e7e2d8] pb-3">
                  Order Summary
                </h2>

                <div className="space-y-3 text-[14px]">
                  <div className="flex justify-between text-[#5c5a52]">
                    <span>Bag Subtotal ({totalCount} items)</span>
                    <span className="font-semibold text-[#202020]">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex justify-between text-[#5c5a52]">
                    <span>Shipping</span>
                    <span className="font-semibold text-[#016c2f]">
                      {shippingFee === 0 ? "FREE" : `₹${shippingFee}`}
                    </span>
                  </div>

                  <div className="border-t border-[#e7e2d8] pt-3 flex justify-between items-baseline">
                    <span className="text-[16px] font-bold text-[#202020]">Estimated Total</span>
                    <span className="text-[24px] font-bold text-[#1f3a2c]">
                      ₹{estimatedTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#747576]">
                    Taxes calculated at checkout. Free shipping on orders above ₹399.
                  </p>
                </div>

                <Link
                  href="/checkout"
                  className="w-full bg-[#02cb5a] hover:bg-[#01b850] text-[#1f3a2c] py-4 px-6 rounded-xl font-bold text-[15px] tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer text-center"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={17} />
                </Link>

                <div className="border-t border-[#e7e2d8] pt-4 space-y-2 text-[12px] text-[#747576]">
                  <div className="flex items-center gap-2">
                    <Truck size={15} className="text-[#016c2f]" />
                    <span>Express 2–4 Day Delivery across India</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={15} className="text-[#016c2f]" />
                    <span>Secure UPI &amp; Cash on Delivery Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw size={15} className="text-[#016c2f]" />
                    <span>100% Freshness Guarantee direct from Darjeeling</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SiteLayoutWrapper>
  );
}

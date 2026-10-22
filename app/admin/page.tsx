"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Banknote,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  ArrowUpRight,
  Database,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { StoredOrderData } from "@/lib/ordersDb";

export default function AdminOverviewPage() {
  const [orders, setOrders] = useState<StoredOrderData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (data?.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to load dashboard orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate metrics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const upiOrders = orders.filter((o) => o.paymentMethod === "upi");
  const codOrders = orders.filter((o) => o.paymentMethod === "cod");
  const paidOrders = orders.filter((o) => o.paymentStatus === "PAID");
  const processingOrders = orders.filter((o) => o.orderStatus === "PROCESSING");

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-7 max-w-[1400px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-[#1f3a2c]">
            Store Overview &amp; Analytics
          </h1>
          <p className="text-[13.5px] text-[#5c5a52]">
            Real-time PostgreSQL orders, UPI payment confirmations, and catalog fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            className="px-3.5 py-2 bg-white border border-[#e7e2d8] hover:border-[#1f3a2c] rounded-xl text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/orders"
            className="px-4 py-2 bg-[#1f3a2c] hover:bg-[#14281e] text-white rounded-xl text-[13px] font-bold flex items-center gap-1.5 transition-colors"
          >
            <span>Manage Orders</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>

      {/* Database Connection Status Banner */}
      <div className="bg-white border border-[#e7e2d8] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#02cb5a]/20 border border-[#02cb5a]/40 flex items-center justify-center text-[#016c2f]">
            <Database size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[14px] text-[#202020]">
                PostgreSQL &amp; Prisma ORM Active
              </span>
              <span className="bg-[#02cb5a]/20 text-[#016c2f] text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#02cb5a] animate-pulse" />
                Live Engine
              </span>
            </div>
            <p className="text-[12px] text-[#747576] mt-0.5">
              Orders and payments are synchronized directly to PostgreSQL tables via Prisma ORM with instant fallback caching.
            </p>
          </div>
        </div>

        <div className="text-[12px] font-mono bg-[#fafafa] border border-[#e7e2d8] px-3 py-1.5 rounded-lg text-[#5c5a52] shrink-0">
          prisma/schema.prisma · PostgreSQL
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Revenue */}
        <div className="bg-white border border-[#e7e2d8] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[#747576] mb-3">
            <span className="text-[13px] font-semibold">Total Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-[#02cb5a]/15 text-[#016c2f] flex items-center justify-center">
              <TrendingUp size={19} />
            </div>
          </div>
          <div className="text-[26px] font-bold text-[#1f3a2c]">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </div>
          <span className="text-[12px] text-[#016c2f] font-semibold mt-1 block">
            {paidOrders.length} confirmed paid orders
          </span>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-[#e7e2d8] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[#747576] mb-3">
            <span className="text-[13px] font-semibold">Total Orders</span>
            <div className="w-9 h-9 rounded-xl bg-[#1f3a2c]/10 text-[#1f3a2c] flex items-center justify-center">
              <ShoppingBag size={19} />
            </div>
          </div>
          <div className="text-[26px] font-bold text-[#202020]">{totalOrders}</div>
          <span className="text-[12px] text-[#e27a00] font-semibold mt-1 block">
            {processingOrders.length} pending dispatch
          </span>
        </div>

        {/* UPI Payments */}
        <div className="bg-white border border-[#e7e2d8] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[#747576] mb-3">
            <span className="text-[13px] font-semibold">UPI (YouPI-PG)</span>
            <div className="w-9 h-9 rounded-xl bg-[#02cb5a]/15 text-[#016c2f] flex items-center justify-center">
              <CreditCard size={19} />
            </div>
          </div>
          <div className="text-[26px] font-bold text-[#1f3a2c]">{upiOrders.length}</div>
          <span className="text-[12px] text-[#747576] mt-1 block">
            VPA: 8617513004@ptaxis
          </span>
        </div>

        {/* Cash on Delivery */}
        <div className="bg-white border border-[#e7e2d8] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[#747576] mb-3">
            <span className="text-[13px] font-semibold">Cash on Delivery</span>
            <div className="w-9 h-9 rounded-xl bg-[#f0ad4e]/15 text-[#e27a00] flex items-center justify-center">
              <Banknote size={19} />
            </div>
          </div>
          <div className="text-[26px] font-bold text-[#202020]">{codOrders.length}</div>
          <span className="text-[12px] text-[#747576] mt-1 block">
            +₹40 handling fee applied
          </span>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white border border-[#e7e2d8] rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-[#e7e2d8] flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-[#202020]">Recent Customer Orders</h2>
            <p className="text-[12.5px] text-[#747576]">
              Latest orders placed through the online storefront &amp; UPI gateway.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-[13px] font-bold text-[#016c2f] hover:underline"
          >
            View All ({orders.length}) →
          </Link>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead className="bg-[#fafafa] border-b border-[#e7e2d8] text-[#5c5a52] text-[12px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">City / State</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e2d8]">
              {orders.slice(0, 6).map((order) => (
                <tr key={order.id} className="hover:bg-[#fafafa]/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#1f3a2c]">
                    {order.orderNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-[#202020] block">
                      {order.customerName}
                    </span>
                    <span className="text-[12px] text-[#747576] block">
                      {order.customerPhone}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#5c5a52]">
                    {order.city}, {order.state}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[11.5px] font-bold px-2 py-0.5 rounded ${
                        order.paymentMethod === "upi"
                          ? "bg-[#02cb5a]/20 text-[#016c2f]"
                          : "bg-[#fafafa] border border-[#e7e2d8] text-[#5c5a52]"
                      }`}
                    >
                      {order.paymentMethod === "upi" ? "UPI (Instant)" : "COD"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#1f3a2c]">
                    ₹{order.totalAmount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                        order.paymentStatus === "PAID"
                          ? "bg-[#02cb5a]/20 text-[#016c2f]"
                          : "bg-[#fff3cd] text-[#856404]"
                      }`}
                    >
                      {order.paymentStatus === "PAID" ? (
                        <>
                          <CheckCircle2 size={12} />
                          <span>PAID</span>
                        </>
                      ) : (
                        <>
                          <Clock size={12} />
                          <span>PENDING</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded ${
                        order.orderStatus === "DELIVERED"
                          ? "bg-[#02cb5a]/20 text-[#016c2f]"
                          : order.orderStatus === "SHIPPED"
                          ? "bg-[#d1ecf1] text-[#0c5460]"
                          : "bg-[#f8f9fa] text-[#495057] border border-[#e7e2d8]"
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/admin/orders?id=${order.id}`}
                      className="text-[12.5px] font-bold text-[#016c2f] hover:underline"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

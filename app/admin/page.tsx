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
  Users,
  ShoppingCart,
} from "lucide-react";
import { StoredOrderData } from "@/lib/ordersDb";

export default function AdminOverviewPage() {
  const [orders, setOrders] = useState<StoredOrderData[]>([]);
  const [customerStats, setCustomerStats] = useState<{ totalCustomers: number; totalSubscribers: number } | null>(null);
  const [abandonedStats, setAbandonedStats] = useState<{ abandonedCount: number; potentialLostRevenue: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    driver: string;
    host: string;
    latencyMs: number | null;
    problem: "not-configured" | "local-url-on-server" | "unreachable" | null;
  } | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ordersRes, healthRes, customersRes, abandonedRes] = await Promise.allSettled([
        fetch("/api/admin/orders"),
        fetch("/api/admin/status"),
        fetch("/api/admin/customers"),
        fetch("/api/admin/abandoned-checkouts"),
      ]);

      if (abandonedRes.status === "fulfilled") {
        const data = await abandonedRes.value.json();
        if (data?.stats) {
          setAbandonedStats(data.stats);
        }
      }

      if (ordersRes.status === "fulfilled") {
        const data = await ordersRes.value.json();
        if (data?.orders) {
          setOrders(data.orders);
        }
      }

      if (customersRes.status === "fulfilled") {
        const data = await customersRes.value.json();
        if (data?.stats) {
          setCustomerStats(data.stats);
        }
      }

      if (healthRes.status === "fulfilled") {
        const healthData = await healthRes.value.json();
        if (healthData?.database) {
          setDbStatus(healthData.database);
        }
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

      {/* Database Live Monitoring Banner */}
      <div className="bg-white border border-[#e7e2d8] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
              dbStatus?.connected
                ? "bg-[#02cb5a]/15 border-[#02cb5a]/40 text-[#016c2f]"
                : "bg-[#fff3cd] border-[#ffeeba] text-[#856404]"
            }`}
          >
            <Database size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[15px] text-[#202020]">
                {dbStatus?.connected
                  ? "PostgreSQL Connected (Prisma ORM)"
                  : "Database not connected: orders are not being saved"}
              </span>
              <span
                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                  dbStatus?.connected
                    ? "bg-[#02cb5a]/20 text-[#016c2f]"
                    : "bg-[#fff3cd] text-[#856404]"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    dbStatus?.connected
                      ? "bg-[#02cb5a] animate-pulse"
                      : "bg-[#e27a00]"
                  }`}
                />
                {dbStatus?.connected
                  ? `Live (${dbStatus.latencyMs ? `${dbStatus.latencyMs}ms` : "Active"})`
                  : "Fallback Mode"}
              </span>
            </div>
            <p className="text-[12.5px] text-[#747576] mt-0.5">
              {dbStatus?.connected
                ? `Orders, inventory, and payment logs are synced in real-time to PostgreSQL at ${dbStatus.host}.`
                : dbStatus?.problem === "local-url-on-server"
                  ? "DATABASE_URL on Vercel points to 127.0.0.1, the database on your own computer, which Vercel cannot reach. In Vercel → Storage, create a Neon database for this project, delete the old DATABASE_URL, and redeploy."
                  : dbStatus?.problem === "not-configured"
                    ? "DATABASE_URL is not set. In Vercel → Storage, create a Neon database for this project and redeploy."
                    : `Cannot reach the database at ${dbStatus?.host || "the configured address"}. Check DATABASE_URL (and that the database is running).`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end shrink-0">
          <a
            href="/api/admin/status"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-[#fafafa] hover:bg-[#f0ece1] border border-[#e7e2d8] rounded-lg text-[12px] font-semibold text-[#1f3a2c] flex items-center gap-1.5 transition-colors"
            title="View raw database health JSON"
          >
            <span>Health API</span>
            <ExternalLink size={13} />
          </a>
          <div
            className="text-[11.5px] font-mono bg-[#fafafa] border border-[#e7e2d8] px-3 py-1.5 rounded-lg text-[#5c5a52] hidden sm:block"
            title="Run this command in terminal to open visual table editor"
          >
            npx prisma studio
          </div>
        </div>
      </div>

      {/* 5 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
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

        {/* Customers & Subscribers */}
        <Link
          href="/admin/customers"
          className="bg-white border border-[#e7e2d8] hover:border-[#1f3a2c] rounded-2xl p-5 shadow-2xs transition-all group block"
        >
          <div className="flex items-center justify-between text-[#747576] mb-3">
            <span className="text-[13px] font-semibold group-hover:text-[#1f3a2c]">Customers</span>
            <div className="w-9 h-9 rounded-xl bg-[#1f3a2c]/10 text-[#1f3a2c] group-hover:bg-[#1f3a2c] group-hover:text-white transition-colors flex items-center justify-center">
              <Users size={19} />
            </div>
          </div>
          <div className="text-[26px] font-bold text-[#1f3a2c]">
            {customerStats ? customerStats.totalCustomers : "—"}
          </div>
          <span className="text-[12px] text-[#016c2f] font-semibold mt-1 block">
            {customerStats ? `${customerStats.totalSubscribers} subscribers` : "Manage Customers →"}
          </span>
        </Link>

        {/* UPI Payments */}
        <div className="bg-white border border-[#e7e2d8] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[#747576] mb-3">
            <span className="text-[13px] font-semibold">UPI (TeaPay)</span>
            <div className="w-9 h-9 rounded-xl bg-[#02cb5a]/15 text-[#016c2f] flex items-center justify-center">
              <CreditCard size={19} />
            </div>
          </div>
          <div className="text-[26px] font-bold text-[#1f3a2c]">{upiOrders.length}</div>
          <span className="text-[12px] text-[#747576] mt-1 block">
            Direct-to-bank UPI
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

      {/* Abandoned Cart Recovery Banner */}
      {abandonedStats && abandonedStats.abandonedCount > 0 && (
        <div className="bg-[#fffdf5] border border-[#fde68a] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#fef3c7] text-[#b45309] flex items-center justify-center shrink-0">
              <ShoppingCart size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[14.5px] text-[#92400e]">
                  {abandonedStats.abandonedCount} Abandoned Checkout{abandonedStats.abandonedCount > 1 ? "s" : ""}
                </span>
                <span className="bg-[#fef3c7] text-[#92400e] text-[10.5px] font-bold px-2 py-0.5 rounded-full border border-[#fde68a]">
                  ₹{abandonedStats.potentialLostRevenue.toLocaleString("en-IN")} recoverable
                </span>
              </div>
              <p className="text-[12.5px] text-[#78350f] mt-0.5">
                Customers proceeded to payment but left without paying. Send 1-click WhatsApp or email recovery links.
              </p>
            </div>
          </div>
          <Link
            href="/admin/abandoned-checkouts"
            className="px-4 py-2 bg-[#b45309] hover:bg-[#92400e] text-white text-[13px] font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
          >
            <span>Recover Checkouts</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      )}

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

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users,
  Mail,
  ShoppingBag,
  Search,
  RefreshCw,
  Copy,
  Download,
  IndianRupee,
  ExternalLink,
  Trash2,
  Check,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { istDateTime } from "@/lib/istTime";

interface CustomerData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  source: "NEWSLETTER" | "ORDER" | "ACCOUNT";
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CustomerStats {
  totalCustomers: number;
  totalSubscribers: number;
  totalBuyers: number;
  totalRevenue: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    totalSubscribers: 0,
    totalBuyers: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "NEWSLETTER" | "ORDER">("ALL");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (data?.customers) {
        setCustomers(data.customers);
      }
      if (data?.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      toast.error("Failed to load customer list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filtered customer list
  const filteredCustomers = customers.filter((c) => {
    const matchesFilter = filter === "ALL" || c.source === filter;
    const matchesSearch =
      !search ||
      (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search));
    return matchesFilter && matchesSearch;
  });

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    toast.success(`Copied: ${email}`);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleCopyAllEmails = () => {
    const emails = filteredCustomers
      .map((c) => c.email)
      .filter((e): e is string => Boolean(e));

    if (emails.length === 0) {
      toast.error("No customer emails to copy");
      return;
    }

    navigator.clipboard.writeText(emails.join(", "));
    toast.success(`Copied ${emails.length} customer emails to clipboard!`);
  };

  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) {
      toast.error("No customers to export");
      return;
    }

    const headers = ["Name", "Email", "Phone", "Type", "Orders Count", "Total Spent (INR)", "Joined Date"];
    const rows = filteredCustomers.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${(c.email || "").replace(/"/g, '""')}"`,
      `"${(c.phone || "").replace(/"/g, '""')}"`,
      `"${c.source}"`,
      c.ordersCount,
      c.totalSpent,
      `"${istDateTime(c.createdAt)}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `teabox_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Customer CSV exported successfully!");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const res = await fetch(`/api/admin/customers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Customer removed successfully");
        setCustomers((prev) => prev.filter((c) => c.id !== id));
      } else {
        toast.error("Failed to delete customer");
      }
    } catch {
      toast.error("Error connecting to server");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] sm:text-[28px] font-bold text-[#1f3a2c]">
              Store Customers &amp; Subscribers
            </h1>
            <span className="bg-[#02cb5a]/20 text-[#1f3a2c] text-[11px] font-bold px-2 py-0.5 rounded-full">
              PostgreSQL Users
            </span>
          </div>
          <p className="text-[13.5px] text-[#5c5a52] mt-0.5">
            Real-time newsletter submissions, registered accounts, and checkout customers.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={fetchCustomers}
            className="px-3.5 py-2 bg-white border border-[#e7e2d8] hover:border-[#1f3a2c] rounded-xl text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleCopyAllEmails}
            className="px-3.5 py-2 bg-white border border-[#e7e2d8] hover:border-[#02cb5a] hover:text-[#1f3a2c] rounded-xl text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Copy size={14} />
            <span>Copy All Emails</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-[#1f3a2c] hover:bg-[#14281e] text-white rounded-xl text-[13px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#e7e2d8] p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold tracking-wider text-[#5c5a52] uppercase">
              Total Customers
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#1f3a2c]/10 text-[#1f3a2c] flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[26px] font-bold text-[#1f3a2c]">
              {stats.totalCustomers}
            </p>
            <p className="text-[11.5px] text-[#5c5a52]">Registered &amp; Newsletter</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e7e2d8] p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold tracking-wider text-[#5c5a52] uppercase">
              Subscribers
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#02cb5a]/15 text-[#1f3a2c] flex items-center justify-center">
              <Mail size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[26px] font-bold text-[#1f3a2c]">
              {stats.totalSubscribers}
            </p>
            <p className="text-[11.5px] text-[#5c5a52]">Harvest alert opt-ins</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e7e2d8] p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold tracking-wider text-[#5c5a52] uppercase">
              Paying Buyers
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[26px] font-bold text-[#1f3a2c]">
              {stats.totalBuyers}
            </p>
            <p className="text-[11.5px] text-[#5c5a52]">Placed 1+ orders</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e7e2d8] p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold tracking-wider text-[#5c5a52] uppercase">
              Customer Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[26px] font-bold text-[#1f3a2c]">
              ₹{stats.totalRevenue.toLocaleString("en-IN")}
            </p>
            <p className="text-[11.5px] text-[#5c5a52]">Total lifetime revenue</p>
          </div>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="bg-white rounded-2xl border border-[#e7e2d8] p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5c5a52]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 bg-[#f7f6f2] border border-transparent focus:border-[#1f3a2c] focus:bg-white rounded-xl text-[13px] outline-none transition-all"
          />
        </div>

        {/* Filter Segment Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#f7f6f2] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
              filter === "ALL"
                ? "bg-white text-[#1f3a2c] shadow-2xs font-bold"
                : "text-[#5c5a52] hover:text-[#1f3a2c]"
            }`}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setFilter("NEWSLETTER")}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
              filter === "NEWSLETTER"
                ? "bg-white text-[#1f3a2c] shadow-2xs font-bold"
                : "text-[#5c5a52] hover:text-[#1f3a2c]"
            }`}
          >
            Subscribers ({stats.totalSubscribers})
          </button>
          <button
            onClick={() => setFilter("ORDER")}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
              filter === "ORDER"
                ? "bg-white text-[#1f3a2c] shadow-2xs font-bold"
                : "text-[#5c5a52] hover:text-[#1f3a2c]"
            }`}
          >
            Buyers ({stats.totalBuyers})
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-[#e7e2d8] shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#5c5a52] flex flex-col items-center justify-center gap-2">
            <RefreshCw size={24} className="animate-spin text-[#1f3a2c]" />
            <p className="text-[14px]">Loading customer records...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-[#5c5a52] flex flex-col items-center justify-center gap-2">
            <Users size={32} className="text-[#a7b8ad]" />
            <p className="text-[15px] font-semibold text-[#1f3a2c]">No customers found</p>
            <p className="text-[13px] text-[#5c5a52]">
              {search
                ? `No results match "${search}"`
                : "When customers submit emails in the footer or place orders, they will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e7e2d8] bg-[#fbfaf8] text-[11.5px] font-bold text-[#5c5a52] uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Customer</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Source / Type</th>
                  <th className="py-3.5 px-4">Orders</th>
                  <th className="py-3.5 px-4">Total Spent</th>
                  <th className="py-3.5 px-4 sm:px-6">Joined Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e2d8] text-[13px]">
                {filteredCustomers.map((c) => {
                  const initial = (c.name || "C").charAt(0).toUpperCase();
                  const isSubscriber = c.source === "NEWSLETTER" || c.ordersCount === 0;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[#f7f6f2]/50 transition-colors"
                    >
                      {/* Customer Name & Avatar */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1f3a2c]/10 text-[#1f3a2c] font-bold text-[12px] flex items-center justify-center shrink-0">
                            {initial}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1f3a2c] leading-tight">
                              {c.name}
                            </p>
                            <p className="text-[11px] text-[#8fa396]">
                              ID: {c.id.slice(0, 12)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info (Email & Phone) */}
                      <td className="py-3.5 px-4">
                        {c.email ? (
                          <div className="flex items-center gap-1.5 group">
                            <span className="font-mono text-[12.5px] text-[#1f3a2c]">
                              {c.email}
                            </span>
                            <button
                              onClick={() => handleCopyEmail(c.email!)}
                              title="Copy email"
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-black transition-all cursor-pointer"
                            >
                              {copiedEmail === c.email ? (
                                <Check size={12} className="text-[#02cb5a]" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic text-[12px]">No email</span>
                        )}
                        {c.phone && (
                          <p className="text-[11.5px] text-[#5c5a52]">
                            Phone: +91 {c.phone}
                          </p>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4">
                        {isSubscriber ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Sparkles size={11} className="text-emerald-500" />
                            Subscriber
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <ShoppingBag size={11} className="text-amber-600" />
                            Buyer
                          </span>
                        )}
                      </td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-4 font-semibold text-[#1f3a2c]">
                        {c.ordersCount > 0 ? (
                          <Link
                            href={`/admin/orders?search=${encodeURIComponent(c.email || c.phone || "")}`}
                            className="inline-flex items-center gap-1 hover:text-[#02cb5a] hover:underline"
                          >
                            <span>{c.ordersCount} {c.ordersCount === 1 ? "order" : "orders"}</span>
                            <ExternalLink size={12} />
                          </Link>
                        ) : (
                          <span className="text-[#8fa396] font-normal">0 orders</span>
                        )}
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-4 font-bold text-[#1f3a2c]">
                        ₹{(c.totalSpent || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 sm:px-6 text-[12px] text-[#5c5a52]">
                        {istDateTime(c.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          title="Remove customer"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

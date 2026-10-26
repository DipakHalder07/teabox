"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search,
  Filter,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Mail,
  Trash2,
  Sparkles,
  MapPin,
  Phone,
  User,
  TrendingUp,
  X,
  MessageCircle,
  ArrowRight,
  Check,
  Send,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import { StoredAbandonedCheckout } from "@/lib/abandonedCheckoutsDb";
import { istDateTime } from "@/lib/istTime";

interface AbandonedStats {
  totalCheckouts: number;
  abandonedCount: number;
  recoveredCount: number;
  potentialLostRevenue: number;
  recoveredRevenue: number;
  recoveryRate: number;
}

export default function AdminAbandonedCheckoutsPage() {
  const [checkouts, setCheckouts] = useState<StoredAbandonedCheckout[]>([]);
  const [stats, setStats] = useState<AbandonedStats>({
    totalCheckouts: 0,
    abandonedCount: 0,
    recoveredCount: 0,
    potentialLostRevenue: 0,
    recoveredRevenue: 0,
    recoveryRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "ABANDONED" | "RECOVERED">("ALL");

  // Drawer / Modals
  const [activeCheckout, setActiveCheckout] = useState<StoredAbandonedCheckout | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [emailModalCheckout, setEmailModalCheckout] = useState<StoredAbandonedCheckout | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCheckouts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/abandoned-checkouts");
      const data = await res.json();
      if (data?.checkouts) {
        setCheckouts(data.checkouts);
      }
      if (data?.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load abandoned checkouts:", err);
      toast.error("Failed to load abandoned checkouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckouts();
  }, []);

  // Filter checkouts
  const filteredCheckouts = checkouts.filter((c) => {
    const matchesStatus =
      selectedStatus === "ALL" || c.status === selectedStatus;

    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.checkoutNumber.toLowerCase().includes(q) ||
      c.customerName.toLowerCase().includes(q) ||
      c.customerPhone.includes(q) ||
      (c.customerEmail && c.customerEmail.toLowerCase().includes(q)) ||
      c.city.toLowerCase().includes(q) ||
      c.items.some((i) => i.title.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  const handleCopyRecoveryLink = (token: string, checkoutId: string) => {
    const url = `${window.location.origin}/checkout?recover=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(checkoutId);
    toast.success("Recovery Link Copied!", {
      description: "Send this URL to the customer to restore their cart in 1 click.",
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendWhatsApp = async (checkout: StoredAbandonedCheckout) => {
    try {
      const res = await fetch(`/api/admin/abandoned-checkouts/${checkout.id}/whatsapp`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to prepare WhatsApp message");
        return;
      }

      // Update state locally
      if (data.checkout) {
        setCheckouts((prev) =>
          prev.map((c) => (c.id === checkout.id ? { ...c, ...data.checkout } : c))
        );
        if (activeCheckout?.id === checkout.id) {
          setActiveCheckout((prev) => (prev ? { ...prev, ...data.checkout } : null));
        }
      }

      // If background service sent directly
      if (data.directSent) {
        toast.success("WhatsApp recovery message sent via connected service!");
      } else {
        // Open WhatsApp Web/App
        window.open(data.waMeUrl, "_blank");
        toast.success("Opened in WhatsApp", {
          description: "Follow-up status recorded as WhatsApp Sent.",
        });
      }
    } catch {
      toast.error("Network error preparing WhatsApp recovery");
    }
  };

  const handleSendEmail = async (checkout: StoredAbandonedCheckout) => {
    if (!checkout.customerEmail) {
      toast.error("No email address provided for this customer");
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await fetch(`/api/admin/abandoned-checkouts/${checkout.id}/send-email`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data?.message || "Recovery email sent successfully!");
        setEmailModalCheckout(null);
        if (data.checkout) {
          setCheckouts((prev) =>
            prev.map((c) => (c.id === checkout.id ? { ...c, ...data.checkout } : c))
          );
          if (activeCheckout?.id === checkout.id) {
            setActiveCheckout((prev) => (prev ? { ...prev, ...data.checkout } : null));
          }
        }
      } else {
        toast.error(data?.error || "Failed to send recovery email");
      }
    } catch {
      toast.error("Network error while sending email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleToggleRecovered = async (checkout: StoredAbandonedCheckout) => {
    const newStatus = checkout.status === "ABANDONED" ? "RECOVERED" : "ABANDONED";
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/abandoned-checkouts/${checkout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setCheckouts((prev) =>
          prev.map((c) => (c.id === checkout.id ? { ...c, ...data.checkout } : c))
        );
        if (activeCheckout?.id === checkout.id) {
          setActiveCheckout((prev) => (prev ? { ...prev, ...data.checkout } : null));
        }
        toast.success(`Checkout marked as ${newStatus}`);
        fetchCheckouts(); // Refresh stats
      } else {
        toast.error(data?.error || "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCheckout = async (checkoutId: string) => {
    if (!confirm("Are you sure you want to delete this abandoned checkout record?")) {
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/abandoned-checkouts/${checkoutId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCheckouts((prev) => prev.filter((c) => c.id !== checkoutId));
        if (activeCheckout?.id === checkoutId) {
          setActiveCheckout(null);
        }
        toast.success("Abandoned checkout deleted");
        fetchCheckouts();
      } else {
        toast.error("Failed to delete checkout");
      }
    } catch {
      toast.error("Network error while deleting checkout");
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper for human-readable relative time
  const formatTimeAgo = (dateStr: Date | string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto text-[#202020]">
      {/* Sub-nav / Breadcrumb matching Shopify */}
      <div className="flex items-center gap-2 text-[13px] text-[#5c5a52]">
        <Link href="/admin/orders" className="hover:text-[#1f3a2c] font-medium transition-colors">
          Orders
        </Link>
        <span>/</span>
        <span className="text-[#1f3a2c] font-bold">Abandoned checkouts</span>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] sm:text-[28px] font-bold text-[#1f3a2c]">
              Abandoned Checkouts
            </h1>
            <span className="bg-[#fff3cd] text-[#856404] text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#ffeeba]">
              Shopify Recovery
            </span>
          </div>
          <p className="text-[13.5px] text-[#5c5a52] mt-0.5">
            Customers who entered contact &amp; delivery details and clicked Proceed to Payment, but left without paying.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/admin/orders"
            className="px-3.5 py-2 bg-white border border-[#e7e2d8] hover:border-[#1f3a2c] rounded-xl text-[13px] font-semibold text-[#1f3a2c] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <ShoppingBag size={14} />
            <span>View All Orders</span>
          </Link>
          <button
            onClick={fetchCheckouts}
            className="px-4 py-2 bg-[#1f3a2c] hover:bg-[#284c39] text-white rounded-xl text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs: Orders vs Abandoned Checkouts (Shopify style) */}
      <div className="flex items-center gap-3 border-b border-[#e7e2d8] pb-1">
        <Link
          href="/admin/orders"
          className="px-4 py-2 text-[13.5px] font-medium text-[#5c5a52] hover:text-[#1f3a2c] transition-colors flex items-center gap-2"
        >
          <ShoppingBag size={15} />
          <span>Orders</span>
        </Link>
        <Link
          href="/admin/abandoned-checkouts"
          className="px-4 py-2 text-[13.5px] font-bold text-[#1f3a2c] border-b-2 border-[#02cb5a] -mb-[5px] flex items-center gap-2"
        >
          <Clock size={15} />
          <span>Abandoned Checkouts ({checkouts.length})</span>
        </Link>
      </div>

      {/* KPI Stat Cards (Shopify Analytics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Abandoned */}
        <div className="bg-white border border-[#e7e2d8] rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-[#5c5a52] text-[12.5px] font-medium mb-1">
            <span>Needs Recovery</span>
            <div className="w-8 h-8 rounded-lg bg-[#fff8e1] text-[#b78103] flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-[24px] sm:text-[28px] font-bold text-[#1f3a2c]">
            {stats.abandonedCount}
          </div>
          <p className="text-[11.5px] text-[#747576] mt-1">
            Unrecovered shopping carts
          </p>
        </div>

        {/* Recoverable Revenue */}
        <div className="bg-white border border-[#e7e2d8] rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-[#5c5a52] text-[12.5px] font-medium mb-1">
            <span>Potential Lost Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-[#fef2f2] text-[#dc2626] flex items-center justify-center">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="text-[24px] sm:text-[28px] font-bold text-[#dc2626]">
            ₹{stats.potentialLostRevenue.toLocaleString("en-IN")}
          </div>
          <p className="text-[11.5px] text-[#747576] mt-1">
            Ready to be recovered via follow-up
          </p>
        </div>

        {/* Recovered Checkouts */}
        <div className="bg-white border border-[#e7e2d8] rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-[#5c5a52] text-[12.5px] font-medium mb-1">
            <span>Recovered Checkouts</span>
            <div className="w-8 h-8 rounded-lg bg-[#eaf8ef] text-[#016c2f] flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-[24px] sm:text-[28px] font-bold text-[#016c2f]">
            {stats.recoveredCount}
          </div>
          <p className="text-[11.5px] text-[#016c2f] mt-1 font-semibold">
            ₹{stats.recoveredRevenue.toLocaleString("en-IN")} recovered
          </p>
        </div>

        {/* Recovery Rate */}
        <div className="bg-white border border-[#e7e2d8] rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-[#5c5a52] text-[12.5px] font-medium mb-1">
            <span>Recovery Rate</span>
            <div className="w-8 h-8 rounded-lg bg-[#f0f7f3] text-[#1f3a2c] flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-[24px] sm:text-[28px] font-bold text-[#1f3a2c]">
            {stats.recoveryRate}%
          </div>
          <p className="text-[11.5px] text-[#747576] mt-1">
            {stats.totalCheckouts} total initiated checkouts
          </p>
        </div>
      </div>

      {/* Controls Bar: Search & Status Filter Tabs */}
      <div className="bg-white border border-[#e7e2d8] rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#f7f6f2] rounded-xl self-start overflow-x-auto max-w-full">
          <button
            onClick={() => setSelectedStatus("ALL")}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedStatus === "ALL"
                ? "bg-white text-[#1f3a2c] shadow-2xs"
                : "text-[#5c5a52] hover:text-[#202020]"
            }`}
          >
            All ({checkouts.length})
          </button>
          <button
            onClick={() => setSelectedStatus("ABANDONED")}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedStatus === "ABANDONED"
                ? "bg-white text-[#b78103] shadow-2xs"
                : "text-[#5c5a52] hover:text-[#202020]"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <span>Abandoned ({stats.abandonedCount})</span>
          </button>
          <button
            onClick={() => setSelectedStatus("RECOVERED")}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedStatus === "RECOVERED"
                ? "bg-white text-[#016c2f] shadow-2xs"
                : "text-[#5c5a52] hover:text-[#202020]"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#02cb5a]" />
            <span>Recovered ({stats.recoveredCount})</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#747576]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, phone, checkout #, city..."
            className="w-full pl-10 pr-4 py-2 bg-[#fafafa] border border-[#e7e2d8] focus:border-[#02cb5a] rounded-xl text-[13.5px] outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747576] hover:text-[#202020]"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Abandoned Checkouts Table */}
      <div className="bg-white border border-[#e7e2d8] rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-[#02cb5a] border-t-transparent rounded-full animate-spin" />
            <span className="text-[13px] text-[#5c5a52]">Loading abandoned checkouts...</span>
          </div>
        ) : filteredCheckouts.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-14 h-14 bg-[#f0f7f3] text-[#016c2f] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ShoppingCart size={28} />
            </div>
            <h3 className="text-[17px] font-bold text-[#1f3a2c]">No Abandoned Checkouts Found</h3>
            <p className="text-[13px] text-[#5c5a52] mt-1 max-w-md mx-auto">
              {search
                ? "No checkouts match your search criteria. Try a different term or clear the filter."
                : "Great news! All customers who proceeded to payment either completed their orders or no one has abandoned checkout yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#faf8f5] border-b border-[#e7e2d8] text-[#5c5a52] text-[11.5px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Checkout #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Delivery</th>
                  <th className="py-3 px-4 text-right">Value</th>
                  <th className="py-3 px-4 text-center">Recovery Status</th>
                  <th className="py-3 px-4 text-center">Follow-up</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ede6]">
                {filteredCheckouts.map((c) => {
                  const isRecovered = c.status === "RECOVERED";
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-[#fafaf7] transition-colors ${
                        isRecovered ? "bg-[#fcfdfc]" : ""
                      }`}
                    >
                      {/* Checkout Number */}
                      <td className="py-3.5 px-4 font-bold text-[#1f3a2c] whitespace-nowrap">
                        <button
                          onClick={() => setActiveCheckout(c)}
                          className="hover:underline text-left cursor-pointer flex items-center gap-1 font-mono text-[13px]"
                        >
                          <span>{c.checkoutNumber}</span>
                        </button>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-[#202020]">
                          {formatTimeAgo(c.createdAt)}
                        </div>
                        <div className="text-[11px] text-[#747576]">
                          {istDateTime(c.createdAt)}
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#202020] flex items-center gap-1.5">
                          <span>{c.customerName}</span>
                        </div>
                        <div className="text-[12px] text-[#5c5a52] flex items-center gap-1 mt-0.5 font-mono">
                          <Phone size={11} className="text-[#747576]" />
                          <span>+91 {c.customerPhone}</span>
                        </div>
                        {c.customerEmail && (
                          <div className="text-[11.5px] text-[#747576] truncate max-w-[180px]">
                            {c.customerEmail}
                          </div>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {c.items[0]?.image && (
                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#e7e2d8] shrink-0 bg-[#fafafa]">
                              <img
                                src={c.items[0].image}
                                alt={c.items[0].title}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0 max-w-[200px]">
                            <span className="font-medium text-[#202020] truncate block">
                              {c.items[0]?.title || "Tea Product"}
                            </span>
                            <span className="text-[11px] text-[#747576] block">
                              {c.items.length > 1
                                ? `+${c.items.length - 1} more item${c.items.length > 2 ? "s" : ""}`
                                : `Qty: ${c.items[0]?.quantity || 1} ${
                                    c.items[0]?.weight ? `· ${c.items[0].weight}` : ""
                                  }`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Delivery */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-[#202020] font-medium">{c.city}</div>
                        <div className="text-[11px] text-[#747576]">{c.state} · {c.pincode}</div>
                      </td>

                      {/* Total Value */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-[14px] text-[#1f3a2c]">
                          ₹{c.totalAmount.toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Recovery Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isRecovered ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#eaf8ef] text-[#016c2f] border border-[#a3dfb8]">
                            <CheckCircle2 size={12} />
                            <span>Recovered</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#fff8e1] text-[#b78103] border border-[#ffe082]">
                            <Clock size={12} />
                            <span>Abandoned</span>
                          </span>
                        )}
                        {c.recoveredOrderId && (
                          <div className="text-[10px] text-[#016c2f] font-mono mt-0.5">
                            Order #{c.recoveredOrderId}
                          </div>
                        )}
                      </td>

                      {/* Follow-up Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {c.recoveryStatus === "WHATSAPP_SENT" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#e6f4ea] text-[#137333]">
                            <MessageCircle size={11} />
                            <span>WhatsApp Sent</span>
                          </span>
                        ) : c.recoveryStatus === "EMAIL_SENT" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#e8f0fe] text-[#1a73e8]">
                            <Mail size={11} />
                            <span>Email Sent</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#747576]">No contact</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick WhatsApp */}
                          <button
                            onClick={() => handleSendWhatsApp(c)}
                            title="Send WhatsApp recovery message"
                            className="p-1.5 text-[#016c2f] hover:bg-[#eaf8ef] rounded-lg transition-colors cursor-pointer"
                          >
                            <MessageCircle size={15} />
                          </button>

                          {/* Quick Email */}
                          {c.customerEmail && (
                            <button
                              onClick={() => setEmailModalCheckout(c)}
                              title="Send recovery email"
                              className="p-1.5 text-[#1a73e8] hover:bg-[#e8f0fe] rounded-lg transition-colors cursor-pointer"
                            >
                              <Mail size={15} />
                            </button>
                          )}

                          {/* Copy Link */}
                          <button
                            onClick={() => handleCopyRecoveryLink(c.recoveryToken, c.id)}
                            title="Copy 1-click recovery checkout link"
                            className="p-1.5 text-[#5c5a52] hover:bg-[#f0ede6] rounded-lg transition-colors cursor-pointer"
                          >
                            {copiedId === c.id ? (
                              <Check size={15} className="text-[#02cb5a]" />
                            ) : (
                              <Copy size={15} />
                            )}
                          </button>

                          {/* View Detail Drawer */}
                          <button
                            onClick={() => setActiveCheckout(c)}
                            className="px-2.5 py-1 text-[11.5px] font-semibold text-[#1f3a2c] bg-white border border-[#e7e2d8] hover:border-[#1f3a2c] rounded-lg transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* CHECKOUT DETAIL DRAWER / MODAL */}
      {/* ============================================================ */}
      {activeCheckout && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-end p-0 sm:p-4">
          <div className="w-full sm:max-w-[560px] h-full sm:h-auto sm:max-h-[92vh] bg-white sm:rounded-2xl shadow-xl flex flex-col overflow-hidden border border-[#e7e2d8] animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-[#e7e2d8] flex items-center justify-between bg-[#faf8f5]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[18px] font-bold text-[#1f3a2c]">
                    {activeCheckout.checkoutNumber}
                  </h3>
                  {activeCheckout.status === "RECOVERED" ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#eaf8ef] text-[#016c2f] border border-[#a3dfb8]">
                      Recovered
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fff8e1] text-[#b78103] border border-[#ffe082]">
                      Abandoned
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-[#5c5a52] mt-0.5">
                  Initiated: {istDateTime(activeCheckout.createdAt)} ({formatTimeAgo(activeCheckout.createdAt)})
                </div>
              </div>
              <button
                onClick={() => setActiveCheckout(null)}
                className="p-2 text-[#747576] hover:text-[#202020] rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-[13px]">
              {/* Recovery Banner / Status */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  activeCheckout.status === "RECOVERED"
                    ? "bg-[#eaf8ef] border-[#a3dfb8] text-[#016c2f]"
                    : "bg-[#fff8e1] border-[#ffe082] text-[#856404]"
                }`}
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-[14px]">
                    {activeCheckout.status === "RECOVERED"
                      ? "Checkout Recovered!"
                      : "Customer Left at Payment Step"}
                  </div>
                  <div className="text-[12px] mt-0.5 leading-normal opacity-90">
                    {activeCheckout.status === "RECOVERED"
                      ? `This customer successfully placed an order (${
                          activeCheckout.recoveredOrderId || "Order Confirmed"
                        }).`
                      : "The customer filled out delivery details and clicked 'Proceed to Payment', but did not complete the transaction. Reach out to recover this sale."}
                  </div>
                </div>
              </div>

              {/* Customer & Delivery Address */}
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#747576] mb-2.5">
                  Customer &amp; Shipping Details
                </h4>
                <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[14px] font-bold text-[#1f3a2c]">
                    <User size={15} />
                    <span>{activeCheckout.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#202020] font-mono">
                    <Phone size={14} className="text-[#747576]" />
                    <span>+91 {activeCheckout.customerPhone}</span>
                  </div>
                  {activeCheckout.customerEmail && (
                    <div className="flex items-center gap-2 text-[#202020]">
                      <Mail size={14} className="text-[#747576]" />
                      <span>{activeCheckout.customerEmail}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-[#5c5a52] pt-2 border-t border-[#e7e2d8]">
                    <MapPin size={14} className="text-[#747576] shrink-0 mt-0.5" />
                    <span>
                      {activeCheckout.address}, {activeCheckout.city}, {activeCheckout.state} -{" "}
                      {activeCheckout.pincode}
                      {activeCheckout.landmark && ` (Near: ${activeCheckout.landmark})`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items in Cart */}
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#747576] mb-2.5">
                  Saved Items in Cart ({activeCheckout.items.length})
                </h4>
                <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-xl divide-y divide-[#e7e2d8] overflow-hidden">
                  {activeCheckout.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <div className="w-12 h-12 rounded-lg border border-[#e7e2d8] overflow-hidden bg-white shrink-0">
                            <img
                              src={item.image}
                              alt={item.title}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-[#202020] text-[13.5px]">
                            {item.title}
                          </div>
                          <div className="text-[11.5px] text-[#5c5a52]">
                            Qty: {item.quantity} {item.weight ? `· ${item.weight}` : ""} · ₹{item.price.toLocaleString("en-IN")} each
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-[#1f3a2c] text-[14px]">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#747576] mb-2.5">
                  Financial Breakdown
                </h4>
                <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-xl p-4 space-y-2 text-[13px]">
                  <div className="flex justify-between text-[#5c5a52]">
                    <span>Subtotal</span>
                    <span>₹{activeCheckout.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {activeCheckout.discountAmount > 0 && (
                    <div className="flex justify-between text-[#016c2f]">
                      <span>Discount ({activeCheckout.couponCode || "Coupon"})</span>
                      <span>-₹{activeCheckout.discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#5c5a52]">
                    <span>Pan-India Express Shipping</span>
                    <span>{activeCheckout.shippingFee === 0 ? "FREE" : `₹${activeCheckout.shippingFee}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[15px] text-[#1f3a2c] pt-2 border-t border-[#e7e2d8]">
                    <span>Total Amount</span>
                    <span className="text-[#016c2f]">₹{activeCheckout.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* 1-Click Recovery Link */}
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#747576] mb-2">
                  1-Click Checkout Recovery Link
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/checkout?recover=${activeCheckout.recoveryToken}`}
                    className="flex-1 bg-[#fafafa] border border-[#e7e2d8] rounded-xl px-3 py-2 text-[12px] font-mono select-all outline-none"
                  />
                  <button
                    onClick={() => handleCopyRecoveryLink(activeCheckout.recoveryToken, activeCheckout.id)}
                    className="px-3.5 py-2 bg-[#1f3a2c] hover:bg-[#284c39] text-white rounded-xl text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                  >
                    {copiedId === activeCheckout.id ? (
                      <>
                        <Check size={14} className="text-[#02cb5a]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-[#747576] mt-1.5">
                  Opening this link automatically restores all items, coupons, and delivery details into the customer's cart.
                </p>
              </div>
            </div>

            {/* Actions Bar Footer */}
            <div className="p-4 border-t border-[#e7e2d8] bg-[#faf8f5] flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteCheckout(activeCheckout.id)}
                  disabled={isUpdating}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl text-[12.5px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => handleToggleRecovered(activeCheckout)}
                  disabled={isUpdating}
                  className="px-3 py-2 bg-white border border-[#e7e2d8] hover:border-[#1f3a2c] text-[#1f3a2c] rounded-xl text-[12.5px] font-semibold transition-colors cursor-pointer"
                >
                  {activeCheckout.status === "RECOVERED"
                    ? "Mark as Abandoned"
                    : "Mark as Recovered"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeCheckout.customerEmail && (
                  <button
                    onClick={() => setEmailModalCheckout(activeCheckout)}
                    className="px-3.5 py-2 bg-white border border-[#1a73e8] text-[#1a73e8] hover:bg-blue-50 rounded-xl text-[12.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Mail size={14} />
                    <span>Send Email</span>
                  </button>
                )}
                <button
                  onClick={() => handleSendWhatsApp(activeCheckout)}
                  className="px-4 py-2 bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] rounded-xl text-[12.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <MessageCircle size={15} />
                  <span>Send WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* EMAIL RECOVERY PREVIEW & DISPATCH MODAL */}
      {/* ============================================================ */}
      {emailModalCheckout && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#e7e2d8] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#e7e2d8] flex items-center justify-between bg-[#faf8f5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1a73e8] flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1f3a2c]">
                    Send Cart Recovery Email
                  </h3>
                  <p className="text-[12px] text-[#5c5a52]">
                    To: {emailModalCheckout.customerEmail}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEmailModalCheckout(null)}
                className="p-1.5 text-[#747576] hover:text-[#202020] rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-[13px] overflow-y-auto">
              <div className="bg-[#f0f7f3] border border-[#c9e4d4] rounded-xl p-3.5 text-[#1f3a2c]">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <Sparkles size={14} className="text-[#02cb5a]" />
                  <span>Shopify-Style Recovery Email</span>
                </div>
                <p className="text-[12px] text-[#2e5440] leading-normal">
                  This email invites {emailModalCheckout.customerName} back to complete their purchase with a direct 1-click checkout recovery link and the Demobox 100% Freshness Guarantee.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#747576] mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  readOnly
                  value={`Complete your Demobox order (${emailModalCheckout.items.length} items waiting in your cart)`}
                  className="w-full bg-[#fafafa] border border-[#e7e2d8] rounded-xl px-3 py-2 text-[13px] text-[#202020] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#747576] mb-1">
                  Items to be restored
                </label>
                <div className="bg-[#fafafa] border border-[#e7e2d8] rounded-xl p-3 space-y-2 text-[12.5px]">
                  {emailModalCheckout.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="font-medium text-[#202020]">
                        {i.title} {i.weight ? `(${i.weight})` : ""} × {i.quantity}
                      </span>
                      <span className="font-bold text-[#1f3a2c]">
                        ₹{(i.price * i.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[#e7e2d8] flex justify-between font-bold text-[#016c2f]">
                    <span>Total Amount</span>
                    <span>₹{emailModalCheckout.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#e7e2d8] bg-[#faf8f5] flex items-center justify-end gap-2">
              <button
                onClick={() => setEmailModalCheckout(null)}
                className="px-4 py-2 border border-[#e7e2d8] hover:bg-white text-[#5c5a52] rounded-xl text-[13px] font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendEmail(emailModalCheckout)}
                disabled={isSendingEmail}
                className="px-5 py-2 bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] rounded-xl text-[13px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Send size={14} className={isSendingEmail ? "animate-spin" : ""} />
                <span>{isSendingEmail ? "Sending Email..." : "Send Recovery Email Now"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

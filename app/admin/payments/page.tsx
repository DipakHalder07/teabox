"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react";

interface PaymentLogItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  gateway: string;
  method: "upi" | "cod";
  vpa: string | null;
  utr: string | null;
  status: "PAID" | "PENDING" | "FAILED";
  createdAt: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedVpa, setCopiedVpa] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments");
      const data = await res.json();
      if (data?.payments) {
        setPayments(data.payments);
      }
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleCopyVpa = () => {
    navigator.clipboard.writeText("8617513004@ptaxis");
    setCopiedVpa(true);
    toast.success("Merchant UPI ID copied", {
      description: "8617513004@ptaxis",
    });
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.customerPhone.includes(search) ||
      (p.utr && p.utr.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-[#1f3a2c]">
            UPI &amp; Payment Transactions
          </h1>
          <p className="text-[13.5px] text-[#5c5a52]">
            Audit logs for direct-to-bank YouPI-PG transfers and Cash on Delivery orders.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          className="px-4 py-2 bg-white border border-[#e7e2d8] hover:border-[#1f3a2c] rounded-xl text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Gateway Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e7e2d8] rounded-2xl p-4 shadow-2xs">
          <span className="text-[12px] font-bold text-[#747576] uppercase tracking-wider block mb-1">
            Merchant UPI ID (VPA)
          </span>
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-[15px] text-[#1f3a2c]">
              8617513004@ptaxis
            </span>
            <button
              onClick={handleCopyVpa}
              className="p-1.5 rounded-lg border border-[#e7e2d8] hover:bg-[#fafafa] text-[#202020] transition-colors cursor-pointer"
            >
              {copiedVpa ? <Check size={14} className="text-[#02cb5a]" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#e7e2d8] rounded-2xl p-4 shadow-2xs">
          <span className="text-[12px] font-bold text-[#747576] uppercase tracking-wider block mb-1">
            Gateway Engine
          </span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[15px] text-[#202020]">YouPI-PG Native</span>
            <span className="bg-[#02cb5a]/20 text-[#016c2f] text-[10px] font-bold px-2 py-0.5 rounded">
              Active
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#e7e2d8] rounded-2xl p-4 shadow-2xs">
          <span className="text-[12px] font-bold text-[#747576] uppercase tracking-wider block mb-1">
            Verification Protocol
          </span>
          <div className="flex items-center gap-1.5 text-[14px] font-semibold text-[#1f3a2c]">
            <ShieldCheck size={16} className="text-[#016c2f]" />
            <span>12-Digit NPCI UTR &amp; Observer</span>
          </div>
        </div>
      </div>

      {/* Search & Audit Table */}
      <div className="bg-white border border-[#e7e2d8] rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#e7e2d8]">
          <div className="flex items-center bg-[#fafafa] border border-[#e7e2d8] focus-within:border-[#02cb5a] rounded-xl px-3.5 py-2 max-w-md transition-colors">
            <Search size={16} className="text-[#747576] shrink-0 mr-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions by Order ID, UTR, Name..."
              className="w-full bg-transparent text-[13px] outline-none text-[#202020]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead className="bg-[#fafafa] border-b border-[#e7e2d8] text-[#5c5a52] text-[12px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Txn ID</th>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Method / VPA</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">UPI UTR Ref</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e2d8]">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-[#fafafa]/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-[12px] text-[#747576]">{p.id}</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#1f3a2c]">
                    {p.orderNumber}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-[#202020] block">{p.customerName}</span>
                    <span className="text-[11.5px] text-[#747576] block">{p.customerPhone}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-[12px] text-[#202020] block">
                      {p.method === "upi" ? "UPI (Direct)" : "COD"}
                    </span>
                    {p.vpa && (
                      <span className="font-mono text-[11px] text-[#5c5a52] block">{p.vpa}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#1f3a2c]">
                    ₹{p.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4">
                    {p.utr ? (
                      <span className="font-mono font-bold text-[#016c2f] bg-[#02cb5a]/15 px-2 py-0.5 rounded text-[12px]">
                        {p.utr}
                      </span>
                    ) : (
                      <span className="text-[#a09e99] text-[12px]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                        p.status === "PAID"
                          ? "bg-[#02cb5a]/20 text-[#016c2f]"
                          : "bg-[#fff3cd] text-[#856404]"
                      }`}
                    >
                      {p.status === "PAID" ? (
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
                  <td className="py-3 px-4 text-right text-[12px] text-[#747576] whitespace-nowrap">
                    {new Date(p.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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

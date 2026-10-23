"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, ShieldCheck, ShieldAlert, LogOut, CheckCircle2, XCircle, KeyRound } from "lucide-react";
import { istDateTime } from "@/lib/istTime";

interface Attempt {
  id: string;
  email: string;
  ip: string | null;
  userAgent: string | null;
  success: boolean;
  createdAt: string;
}

interface SecurityData {
  databaseConnected: boolean;
  admin: { email: string; name: string; role: string };
  lastLoginAt: string | null;
  attempts: Attempt[];
  failedLast24h: number;
}

function deviceLabel(ua: string | null) {
  if (!ua) return "Unknown device";
  const os = /iPhone|iPad/.test(ua)
    ? "iPhone/iPad"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X/.test(ua)
        ? "Mac"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "Other";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Browser";
  return `${browser} on ${os}`;
}

export default function AdminSecurityPage() {
  const router = useRouter();
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/security", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: SecurityData | null) => {
        if (!cancelled && body) setData(body);
      })
      .catch((err) => console.error("Failed to load security info:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleRefresh = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  const handleLogoutAll = async () => {
    if (!window.confirm("Sign out of the admin on every device, including this one?")) return;
    setSigningOut(true);
    try {
      const res = await fetch("/api/admin/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout-all" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Could not sign out other devices");
      toast.success("Signed out everywhere");
      router.push("/admin/login");
    } catch (err) {
      toast.error((err as Error).message);
      setSigningOut(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-[#1f3a2c]">Admin Security</h1>
          <p className="text-[13.5px] text-[#5c5a52]">
            Who signed in to the admin, and from where. Sign out all devices if anything looks wrong.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-white border border-[#e7e2d8] hover:border-[#1f3a2c] rounded-xl text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e7e2d8] rounded-2xl p-4 shadow-2xs">
          <span className="text-[12px] font-bold text-[#747576] uppercase tracking-wider block mb-1">
            Signed in as
          </span>
          <span className="font-bold text-[15px] text-[#1f3a2c] block truncate">{data?.admin.email || "…"}</span>
          <span className="text-[12px] text-[#747576]">
            Last sign-in: {data?.lastLoginAt ? istDateTime(data.lastLoginAt) : "—"}
          </span>
        </div>

        <div className="bg-white border border-[#e7e2d8] rounded-2xl p-4 shadow-2xs">
          <span className="text-[12px] font-bold text-[#747576] uppercase tracking-wider block mb-1">
            Wrong passwords (24 h)
          </span>
          <div className="flex items-center gap-2">
            {data && data.failedLast24h > 0 ? (
              <ShieldAlert size={18} className="text-[#d93838]" />
            ) : (
              <ShieldCheck size={18} className="text-[#016c2f]" />
            )}
            <span className="font-bold text-[15px] text-[#202020]">{data ? data.failedLast24h : "…"}</span>
          </div>
          <span className="text-[12px] text-[#747576]">5 wrong tries from one device lock it for 15 minutes.</span>
        </div>

        <div className="bg-white border border-[#e7e2d8] rounded-2xl p-4 shadow-2xs flex flex-col justify-between gap-3">
          <div>
            <span className="text-[12px] font-bold text-[#747576] uppercase tracking-wider block mb-1">
              Sessions
            </span>
            <span className="text-[12.5px] text-[#5c5a52]">Each sign-in lasts 12 hours.</span>
          </div>
          <button
            onClick={handleLogoutAll}
            disabled={signingOut || data?.databaseConnected === false}
            className="px-4 py-2 bg-[#d93838] hover:bg-[#c02f2f] text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
          >
            <LogOut size={14} />
            <span>{signingOut ? "Signing out…" : "Sign out all devices"}</span>
          </button>
        </div>
      </div>

      {/* How to change the password */}
      <div className="bg-[#fffaf0] border border-[#f0e2c0] rounded-2xl p-4 flex gap-3 text-[13px] text-[#5c5a52]">
        <KeyRound size={18} className="text-[#a07400] shrink-0 mt-0.5" />
        <p>
          <strong className="text-[#202020]">To change the admin password:</strong> on Vercel open Project → Settings →
          Environment Variables, change <code className="font-mono">ADMIN_DEFAULT_PASSWORD</code>, and redeploy. The
          old password stops working, and other devices are signed out at your next sign-in.
        </p>
      </div>

      {/* Attempts Table */}
      <div className="bg-white border border-[#e7e2d8] rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#e7e2d8]">
          <h2 className="text-[15px] font-bold text-[#202020]">Recent sign-in attempts</h2>
        </div>

        {data?.databaseConnected === false ? (
          <p className="p-6 text-[13px] text-[#747576]">The database is offline, so sign-in history is not available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead className="bg-[#fafafa] border-b border-[#e7e2d8] text-[#5c5a52] text-[12px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">IP address</th>
                  <th className="py-3 px-4">Device</th>
                  <th className="py-3 px-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e2d8]">
                {data?.attempts.map((a) => (
                  <tr key={a.id} className="hover:bg-[#fafafa]/80 transition-colors">
                    <td className="py-3 px-4">
                      {a.success ? (
                        <span className="inline-flex items-center gap-1 text-[#016c2f] font-semibold">
                          <CheckCircle2 size={14} /> Signed in
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#d93838] font-semibold">
                          <XCircle size={14} /> Wrong password
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#202020]">{a.email}</td>
                    <td className="py-3 px-4 font-mono text-[12px] text-[#5c5a52]">{a.ip || "—"}</td>
                    <td className="py-3 px-4 text-[#5c5a52]">{deviceLabel(a.userAgent)}</td>
                    <td className="py-3 px-4 text-right text-[#747576] whitespace-nowrap">
                      {istDateTime(a.createdAt)}
                    </td>
                  </tr>
                ))}
                {data && data.attempts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-[#747576]">
                      No sign-in attempts yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

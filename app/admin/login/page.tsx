"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowRight, Database, KeyRound } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data?.status === "success") {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data?.error || "Invalid admin credentials. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Could not connect to authentication server.");
      setLoading(false);
    }
  };

  const handleUseDemoCredentials = () => {
    setEmail("admin@demobox.com");
    setPassword("adminTeabox2026!");
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#0e1d15] flex flex-col items-center justify-center p-4 relative overflow-hidden text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#02cb5a]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#1f3a2c]/60 rounded-full blur-[140px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-[440px] bg-[#162a20]/90 border border-[#2e5440] backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-[#02cb5a]/20 border border-[#02cb5a]/40 px-3 py-1 rounded-full text-[#02cb5a] text-[11.5px] font-bold uppercase tracking-wider mb-3">
            <ShieldCheck size={14} />
            <span>Secure Admin Portal</span>
          </div>
          <h1 className="font-stencil text-[30px] font-bold tracking-wider text-white">
            DEMOBOX
          </h1>
          <p className="text-[13px] text-white/70 mt-1">
            Store Administration · PostgreSQL &amp; Prisma ORM
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 bg-[#d93838]/20 border border-[#d93838]/40 text-[#ff8080] text-[13px] rounded-xl p-3 flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-white/80 mb-1.5 uppercase tracking-wider">
              Admin Email
            </label>
            <div className="flex items-center bg-[#0e1d15] border border-[#2e5440] focus-within:border-[#02cb5a] rounded-xl px-3.5 py-3 transition-colors">
              <Mail size={18} className="text-[#02cb5a] shrink-0 mr-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@demobox.com"
                className="w-full bg-transparent text-[14px] outline-none text-white placeholder-white/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-white/80 mb-1.5 uppercase tracking-wider">
              Master Password
            </label>
            <div className="flex items-center bg-[#0e1d15] border border-[#2e5440] focus-within:border-[#02cb5a] rounded-xl px-3.5 py-3 transition-colors">
              <Lock size={18} className="text-[#02cb5a] shrink-0 mr-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-transparent text-[14px] outline-none text-white placeholder-white/40"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#02cb5a] hover:bg-[#02b851] text-[#1f3a2c] py-3.5 px-4 rounded-xl font-bold text-[15px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-60 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[#1f3a2c] border-t-transparent rounded-full animate-spin" />
                <span>Authenticating...</span>
              </span>
            ) : (
              <>
                <span>Sign In to Admin</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Demo Credentials Pill */}
        <div className="mt-6 pt-5 border-t border-[#2e5440]/60 text-center">
          <button
            type="button"
            onClick={handleUseDemoCredentials}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/15 text-[12.5px] text-white/80 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer font-medium"
          >
            <KeyRound size={14} className="text-[#02cb5a]" />
            <span>Click to Fill Master Admin Credentials</span>
          </button>
          <div className="mt-2 text-[11px] text-white/50 flex items-center justify-center gap-1.5">
            <Database size={11} className="text-[#02cb5a]" />
            <span>admin@demobox.com · adminTeabox2026!</span>
          </div>
        </div>
      </div>
    </div>
  );
}

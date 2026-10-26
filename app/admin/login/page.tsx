"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowRight, Check } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("teabox_admin_saved_email");
      if (savedEmail) {
        setEmail(savedEmail);
      }
    } catch {}
  }, []);

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
        try {
          if (rememberMe) {
            localStorage.setItem("teabox_admin_saved_email", email.trim().toLowerCase());
          } else {
            localStorage.removeItem("teabox_admin_saved_email");
          }
        } catch {}

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
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@teabox.com"
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-transparent text-[14px] outline-none text-white placeholder-white/40"
              />
            </div>
          </div>

          {/* Remember Me Option */}
          <div className="flex items-center justify-between pt-1">
            <label
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center gap-2.5 cursor-pointer text-[12.5px] text-white/80 hover:text-white select-none transition-colors"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  rememberMe
                    ? "bg-[#02cb5a] border-[#02cb5a] text-[#0e1d15]"
                    : "bg-[#0e1d15] border-[#2e5440]"
                }`}
              >
                {rememberMe && <Check size={12} strokeWidth={3} />}
              </div>
              <span>Remember me (stay logged in for 30 days)</span>
            </label>
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

        <p className="mt-6 pt-5 border-t border-[#2e5440]/60 text-center text-[11.5px] text-white/50 leading-relaxed">
          Sessions stay securely active for 30 days across browser restarts. Repeated wrong passwords lock sign-in for 15 minutes.
        </p>
      </div>
    </div>
  );
}


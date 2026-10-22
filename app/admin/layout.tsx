"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  CreditCard,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
  Database,
  RefreshCw,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  const [adminUser, setAdminUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [loading, setLoading] = useState(!isLoginPage);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check auth session
  useEffect(() => {
    if (isLoginPage) return;

    fetch("/api/admin/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.admin) {
          setAdminUser(data.admin);
          setLoading(false);
        } else {
          router.push("/admin/login");
        }
      })
      .catch(() => {
        router.push("/admin/login");
      });
  }, [isLoginPage, router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  };

  // If on login page, render full screen without sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  const navItems = [
    {
      label: "Overview",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      label: "Orders",
      href: "/admin/orders",
      icon: ShoppingBag,
      active: pathname.startsWith("/admin/orders"),
    },
    {
      label: "Products & Stock",
      href: "/admin/products",
      icon: Package,
      active: pathname.startsWith("/admin/products"),
    },
    {
      label: "UPI & Payments",
      href: "/admin/payments",
      icon: CreditCard,
      active: pathname.startsWith("/admin/payments"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f6f2] flex flex-col md:flex-row text-[#202020]">
      {/* Mobile Header */}
      <header className="md:hidden bg-[#1f3a2c] text-white px-4 py-3 flex items-center justify-between border-b border-[#2e5440]">
        <div className="flex items-center gap-2">
          <span className="font-stencil text-[18px] tracking-wider text-white">TEABOX</span>
          <span className="bg-[#02cb5a] text-[#1f3a2c] text-[9px] font-bold px-1.5 py-0.5 rounded">
            ADMIN
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg bg-white/10 text-white"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:block md:w-64 bg-[#1f3a2c] text-white flex flex-col shrink-0 border-r border-[#2e5440] min-h-[calc(100vh-53px)] md:min-h-screen sticky top-0 z-40`}
      >
        {/* Brand Logo & DB Badge */}
        <div className="p-5 border-b border-[#2e5440] hidden md:block">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="font-stencil text-[22px] tracking-wider text-white">TEABOX</span>
            <span className="bg-[#02cb5a] text-[#1f3a2c] text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
              ADMIN
            </span>
          </Link>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#02cb5a] font-medium bg-[#14281e] px-2.5 py-1 rounded-md border border-[#2e5440]">
            <Database size={12} />
            <span>PostgreSQL · Prisma ORM</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-[13.5px] transition-all ${
                  item.active
                    ? "bg-[#02cb5a] text-[#1f3a2c] shadow-xs"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-3 mt-3 border-t border-[#2e5440]">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <ExternalLink size={16} />
                <span>View Storefront</span>
              </span>
              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">Live</span>
            </Link>
          </div>
        </nav>

        {/* Admin User Card & Logout */}
        <div className="p-4 border-t border-[#2e5440] bg-[#172d22]">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[13px] font-bold text-white block truncate">
                {adminUser?.name || "Admin"}
              </span>
              <span className="text-[11px] text-[#02cb5a] block truncate">
                {adminUser?.email || "admin@teabox.com"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-white/70 hover:text-white hover:bg-[#d93838]/80 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Stage */}
      <main className="flex-1 min-w-0 overflow-y-auto relative">
        {loading && (
          <div className="absolute inset-0 z-50 bg-[#0e1d15] flex flex-col items-center justify-center text-white min-h-[400px]">
            <RefreshCw size={32} className="animate-spin text-[#02cb5a] mb-3" />
            <p className="text-[14px] text-white/70">Verifying Teabox Admin Session...</p>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

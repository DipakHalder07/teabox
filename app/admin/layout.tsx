import { Suspense } from "react";
import AdminShell from "@/components/admin/AdminShell";

// The admin frame reads the current URL (to highlight the menu), which is only known when the
// page is opened. Suspense lets pages with an id in the URL (e.g. /admin/products/[id]) stream
// in behind a placeholder instead of blocking.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex bg-[#fafafa]">
          <div className="hidden md:block w-64 shrink-0 bg-[#1f3a2c]" />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#02cb5a] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

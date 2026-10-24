"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/account/login");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#fafafa]">
      <div className="w-8 h-8 border-3 border-[#02cb5a] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

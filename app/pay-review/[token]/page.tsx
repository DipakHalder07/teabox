"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import PaymentReview from "./PaymentReview";

// Opened from the shop owner's WhatsApp alert (signed link, no login).
function ReviewFromUrl() {
  const params = useParams();
  return <PaymentReview token={decodeURIComponent(String(params.token || ""))} />;
}

export default function PaymentReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f6f2]" />}>
      <ReviewFromUrl />
    </Suspense>
  );
}

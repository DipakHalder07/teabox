import type { Metadata } from "next";

// Private confirm links: keep them out of search engines.
export const metadata: Metadata = {
  title: "Confirm payment · Teabox",
  robots: { index: false, follow: false },
};

export default function PaymentReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}

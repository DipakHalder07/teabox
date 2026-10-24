import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { LegalSection } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Shipping & Returns | ${LEGAL.brand}`,
  description: `Shipping charges, delivery times, cancellations, returns and refunds at ${LEGAL.brand}.`,
};

const sections: LegalSection[] = [
  {
    id: "shipping-charges",
    title: "Shipping charges",
    body: (
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-[14px] border-collapse min-w-[360px]">
          <thead>
            <tr className="text-left text-[#5c5a52] border-b-2 border-[#e7e2d8]">
              <th className="py-2 pr-3 font-semibold">Order value (after discounts)</th>
              <th className="py-2 font-semibold">Shipping</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#f0ede6]">
              <td className="py-2 pr-3">₹399 or more</td>
              <td className="py-2 font-semibold text-[#016c2f]">Free</td>
            </tr>
            <tr className="border-b border-[#f0ede6]">
              <td className="py-2 pr-3">Below ₹399</td>
              <td className="py-2">₹50</td>
            </tr>
            <tr>
              <td className="py-2 pr-3">Cash on Delivery</td>
              <td className="py-2">+ ₹40 COD fee</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: "delivery-time",
    title: "When will my order arrive?",
    body: (
      <>
        <ul>
          <li>
            <strong>Dispatch:</strong> we pack and hand over your order within {LEGAL.dispatchTime} after it is confirmed
            (UPI orders are confirmed once your payment is received).
          </li>
          <li>
            <strong>Delivery:</strong> usually {LEGAL.deliveryTime} after dispatch, depending on your PIN code. Remote
            areas can take a little longer.
          </li>
        </ul>
        <p>These are estimates. Courier delays, weather or local restrictions can occasionally add a few days.</p>
      </>
    ),
  },
  {
    id: "tracking",
    title: "Tracking your order",
    body: (
      <p>
        Once your order ships, the tracking details appear under <Link href="/account">My Orders</Link> (if you signed in
        with your email) and on the <Link href="/track">Track Your Order</Link> page using your order number or phone
        number.
      </p>
    ),
  },
  {
    id: "address",
    title: "Address and delivery attempts",
    body: (
      <ul>
        <li>Please enter a complete address with a landmark and a phone number the courier can reach.</li>
        <li>
          Need to change the address? <Link href="/contact?topic=order">Contact us</Link> before the order is dispatched.
        </li>
        <li>
          If a parcel comes back because the address was incomplete or nobody was available, we&apos;ll contact you to
          re-ship it. Re-shipping charges may apply.
        </li>
      </ul>
    ),
  },
  {
    id: "cancellations",
    title: "Cancelling an order",
    body: (
      <p>
        You can cancel for free any time <strong>before your order is dispatched</strong>.{" "}
        <Link href="/contact?topic=order">Contact us</Link> with your order number. If you paid by UPI, you get a full
        refund. After dispatch an order can&apos;t be cancelled, but the return rules below still apply.
      </p>
    ),
  },
  {
    id: "returns",
    title: "Returns and replacements",
    body: (
      <>
        <p>
          Tea is a food product, so for hygiene reasons we can&apos;t take back opened packs or accept change-of-mind
          returns. But if something is wrong with your order, we&apos;ll make it right. We replace the item or refund you if
          it arrives:
        </p>
        <ul>
          <li>damaged, leaking or tampered with;</li>
          <li>with a wrong or missing item;</li>
          <li>expired or not fit to drink.</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-to-return",
    title: "How to report a problem",
    body: (
      <ol className="list-decimal pl-5 space-y-1.5">
        <li>
          Within <strong>48 hours of delivery</strong>, <Link href="/contact?topic=return">contact us</Link> with your order
          number.
        </li>
        <li>Attach clear photos of the outer parcel, the shipping label and the product. An unboxing video helps.</li>
        <li>We reply within one business day. If we need the item back, we arrange the pickup or cover the return cost.</li>
        <li>You choose a replacement or a refund.</li>
      </ol>
    ),
  },
  {
    id: "refunds",
    title: "Refunds",
    body: (
      <ul>
        <li>Approved refunds are processed within 5–7 business days.</li>
        <li>UPI payments are refunded to the same UPI account they came from.</li>
        <li>For Cash on Delivery orders, we refund to a UPI ID or bank account you share with us.</li>
        <li>Your bank may take a few extra days to show the credit.</li>
        <li>
          Paid but didn&apos;t get an order confirmation? <Link href="/contact?topic=payment">Send us your UTR</Link>. We&apos;ll
          confirm your order or refund the full amount.
        </li>
      </ul>
    ),
  },
];

export default function ShippingReturnsPage() {
  return (
    <LegalPage
      title="Shipping & Returns"
      intro={
        <p>
          Everything about getting your tea to you: what shipping costs, how long it takes, and what to do if something
          isn&apos;t right. The full rules are in our <Link href="/terms">Terms + Conditions</Link>. Still have a question?{" "}
          <Link href="/contact">Contact us</Link>.
        </p>
      }
      sections={sections}
    />
  );
}

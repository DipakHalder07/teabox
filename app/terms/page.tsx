import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { LegalSection } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Terms + Conditions | ${LEGAL.brand}`,
  description: `The terms that apply when you shop with ${LEGAL.brand}: orders, payments, shipping, returns and refunds.`,
};

const mail = (address: string) => <a href={`mailto:${address}`}>{address}</a>;

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          This website and online store is operated by <strong>{LEGAL.legalName}</strong>, trading as {LEGAL.brand} (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;, &ldquo;our&rdquo;).
        </p>
        <ul>
          <li>Address: {LEGAL.address}</li>
          <li>GSTIN: {LEGAL.gstin}</li>
          <li>Email: {mail(LEGAL.supportEmail)}</li>
          <li>Phone / WhatsApp: {LEGAL.supportPhone}</li>
        </ul>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Your account and sign-in",
    body: (
      <>
        <p>
          You can shop as a guest or sign in with your email address. To sign in, we email you a 6-digit one-time code
          that is valid for 10 minutes. Keep access to your email account secure; anyone who can read your email can
          sign in to your {LEGAL.brand} account.
        </p>
        <p>
          You must be 18 or older to place an order, or have the permission and supervision of a parent or guardian.
          The details you give us (name, phone, email and address) must be accurate and your own.
        </p>
      </>
    ),
  },
  {
    id: "products-pricing",
    title: "Products and prices",
    body: (
      <>
        <ul>
          <li>
            Tea is a natural product. Colour, leaf size, aroma and taste can vary slightly between harvests and batches.
            Product photos are for illustration.
          </li>
          <li>All prices are in Indian Rupees (₹) and include applicable taxes unless stated otherwise.</li>
          <li>
            If a product is listed at a wrong price because of an obvious error, we may cancel the order and refund any
            amount paid in full.
          </li>
          <li>
            Coupon codes are subject to their own conditions, cannot be exchanged for cash, and only one coupon can be
            used per order.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "orders",
    title: "Placing an order",
    body: (
      <>
        <p>
          Your order is confirmed when we show you an order confirmation (and, if you gave an email, send it to you).
          For UPI orders this happens only after your payment is received.
        </p>
        <p>
          We may refuse or cancel an order if a product is out of stock, the price was listed in error, the delivery
          address cannot be served, or we suspect fraud or misuse. If we cancel an order you have paid for, we refund
          the full amount.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    title: "Payments",
    body: (
      <>
        <p>
          <strong>UPI.</strong> At checkout we show a UPI QR code and an exact amount to pay, which may differ from the
          order total by a few paise so we can identify your payment. Please:
        </p>
        <ul>
          <li>pay the exact amount shown, including paise, to the UPI ID shown on the checkout page only;</li>
          <li>complete the payment within the 10-minute window shown on screen;</li>
          <li>keep your UPI transaction reference (UTR) until your order is confirmed.</li>
        </ul>
        <p>
          If you paid a different amount, paid after the window ended, or paid but did not receive a confirmation,
          contact us with your UTR. We will either confirm your order or refund the money.
        </p>
        <p>
          We never ask for your UPI PIN, card number, OTP from your bank, or bank login, and we do not store them.
          Payments are made from your own UPI app and bank.
        </p>
        <p>
          <strong>Cash on Delivery (COD).</strong> Where available, COD orders carry a COD fee of ₹40, shown at checkout.
          We may ask you to verify your phone number first. COD may be unavailable for some orders or addresses, and we
          may stop offering COD to customers who repeatedly refuse deliveries.
        </p>
      </>
    ),
  },
  {
    id: "shipping",
    title: "Shipping and delivery",
    body: (
      <>
        <ul>
          <li>Shipping is free on orders of ₹399 or more (after discounts); a ₹50 shipping fee applies below that.</li>
          <li>
            Delivery times shown are estimates. Delays caused by courier partners, weather, public holidays or other
            events outside our control can happen.
          </li>
          <li>
            Please give a complete and correct address and a reachable phone number. If a parcel is returned because
            the address was wrong or nobody was available, re-shipping charges may apply.
          </li>
          <li>When an order ships, you can follow it from My Orders or the Track Your Order page.</li>
        </ul>
      </>
    ),
  },
  {
    id: "cancellations",
    title: "Cancellations",
    body: (
      <p>
        You can cancel an order free of charge before it is dispatched by contacting us with your order number. Once an
        order has been dispatched it cannot be cancelled, but the returns section below still applies.
      </p>
    ),
  },
  {
    id: "returns-refunds",
    title: "Returns, replacements and refunds",
    body: (
      <>
        <p>
          Tea is a food product, so for hygiene and safety reasons we cannot accept returns of opened packs or change-of-mind
          returns.
        </p>
        <p>We will replace the item or refund you if your order arrives:</p>
        <ul>
          <li>damaged, leaking or tampered with;</li>
          <li>with a wrong or missing item; or</li>
          <li>expired or otherwise not fit to consume.</li>
        </ul>
        <p>
          Contact us within <strong>48 hours of delivery</strong> with your order number and clear photos of the parcel
          and product. We may ask you to return the item; if so, we arrange or pay for the return.
        </p>
        <p>
          <strong>Refunds</strong> are processed within 5–7 business days of approval. UPI payments are refunded to the
          UPI account they came from. For COD orders, we refund to a UPI ID or bank account you give us. Your bank may
          take a few more days to show the credit.
        </p>
      </>
    ),
  },
  {
    id: "health",
    title: "Health information",
    body: (
      <p>
        Our teas may contain caffeine, and blends may contain herbs, spices or other ingredients listed on the product
        page and pack. Check ingredients if you have allergies. If you are pregnant, nursing, taking medication or have a
        medical condition, consult a doctor before drinking herbal or caffeinated teas. Product descriptions are not
        medical advice and our teas are not intended to diagnose, treat or cure any condition.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    title: "Using our website",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>place fake orders, misuse coupons, or attempt fraudulent payments or chargebacks;</li>
          <li>attempt to access accounts, orders or systems that are not yours;</li>
          <li>copy, scrape or resell our content, or disrupt the website.</li>
        </ul>
        <p>We may suspend access or cancel orders connected to misuse.</p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    body: (
      <p>
        The {LEGAL.brand} name, logo, text, photos and design of this website belong to us or our licensors. You may not
        use them without our written permission.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Our responsibility to you",
    body: (
      <>
        <p>
          We take reasonable care to describe products accurately and deliver them in good condition. To the extent the
          law allows, our total liability for any order is limited to the amount you paid for that order, and we are not
          liable for indirect or unforeseeable losses.
        </p>
        <p>
          Nothing in these terms limits your rights as a consumer under the Consumer Protection Act, 2019 or any other law
          that cannot be excluded.
        </p>
      </>
    ),
  },
  {
    id: "privacy",
    title: "Privacy",
    body: (
      <p>
        How we collect and use your personal data is explained in our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law and disputes",
    body: (
      <p>
        These terms are governed by the laws of India. We will try to resolve any complaint with you directly first.
        Subject to your rights under consumer protection law, the courts at {LEGAL.jurisdictionCity} have jurisdiction.
      </p>
    ),
  },
  {
    id: "grievance",
    title: "Grievance Officer",
    body: (
      <>
        <p>
          In line with the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology Act, 2000, our
          Grievance Officer is:
        </p>
        <ul>
          <li>Name: {LEGAL.grievanceOfficer}</li>
          <li>Email: {mail(LEGAL.grievanceEmail)}</li>
          <li>Address: {LEGAL.address}</li>
        </ul>
        <p>
          We acknowledge complaints within 48 hours and aim to resolve them within one month of receipt.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms from time to time. The version on this page, with its &ldquo;last updated&rdquo; date,
        applies to orders placed from that date.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms + Conditions"
      intro={
        <p>
          These terms apply when you use this website or buy from {LEGAL.brand}. By placing an order you agree to them.
          Please read them along with our <Link href="/privacy">Privacy Policy</Link>.
          Questions? Email {mail(LEGAL.supportEmail)}.
        </p>
      }
      sections={sections}
    />
  );
}

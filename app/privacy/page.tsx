import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { LegalSection } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Privacy Policy | ${LEGAL.brand}`,
  description: `What personal data ${LEGAL.brand} collects, why, who it is shared with, and your rights.`,
};

const mail = (address: string) => <a href={`mailto:${address}`}>{address}</a>;

const STORAGE = [
  { name: "teabox_customer_session", kind: "Cookie", purpose: "Keeps you signed in after the email code", lasts: "30 days or until you sign out" },
  { name: "teabox_pay_phone", kind: "Cookie", purpose: "Remembers a phone number you verified by WhatsApp code, so you aren't asked again", lasts: "30 days" },
  { name: "teabox_customer_user", kind: "Local storage", purpose: "Shows your sign-in state and fills your email at checkout", lasts: "Until you sign out" },
  { name: "Cart and recent orders", kind: "Local storage", purpose: "Keeps your cart and lets you reopen recent order pages on this device", lasts: "Until you clear them" },
];

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <p>
        {LEGAL.brand} is operated by <strong>{LEGAL.legalName}</strong>, {LEGAL.address}. We decide how and why your
        personal data is used (we are the &ldquo;Data Fiduciary&rdquo; under the Digital Personal Data Protection Act,
        2023). Contact: {mail(LEGAL.supportEmail)}.
      </p>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <>
        <ul>
          <li>
            <strong>Order details:</strong> your name, phone number, email (optional), delivery address and landmark, the
            products you order, coupon used and order notes.
          </li>
          <li>
            <strong>Account:</strong> your email address when you sign in with an email code, and the orders linked to it.
          </li>
          <li>
            <strong>Payment information:</strong> the amount, payment status and UPI transaction reference (UTR). When
            your payment reaches our bank account, our bank&apos;s credit alert can include your UPI ID or name, which we
            use only to match the payment to your order. We never see or store your UPI PIN, card details or bank login.
          </li>
          <li>
            <strong>Verification:</strong> your phone number when we send you a WhatsApp verification code, and your
            email when we send you a sign-in code. Codes are stored only in scrambled (hashed) form and expire after 10
            minutes.
          </li>
          <li>
            <strong>Technical data:</strong> your IP address and basic request information, used to prevent abuse (for
            example, limiting how often codes can be requested) and to keep the site secure.
          </li>
          <li>
            <strong>Messages:</strong> anything you send us by email or WhatsApp, such as support requests and photos of a
            damaged parcel.
          </li>
        </ul>
        <p>We do not use advertising trackers or sell your data.</p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use your data",
    body: (
      <ul>
        <li>to take, confirm, pack and deliver your order, and to contact you about it;</li>
        <li>to verify and match your payment, and to process refunds;</li>
        <li>to sign you in and show your orders under My Orders;</li>
        <li>to send order emails (confirmation and updates) when you give us your email;</li>
        <li>to prevent fraud, fake orders and misuse of codes or coupons;</li>
        <li>to handle support requests, returns and complaints;</li>
        <li>to keep records required by tax, accounting and other laws.</li>
      </ul>
    ),
  },
  {
    id: "consent",
    title: "Our basis for using your data",
    body: (
      <p>
        We process your data with your consent, which you give when you place an order, sign in or contact us, and for
        purposes the law allows without consent, such as meeting legal obligations. You can withdraw consent at any
        time (see Your rights below). Withdrawing does not affect orders already completed, and we may still need to keep
        some records by law.
      </p>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>We share only what each party needs to do its job:</p>
        <ul>
          <li>
            <strong>Delivery partners</strong>: your name, phone and address, to deliver your order.
          </li>
          <li>
            <strong>Website hosting and database providers</strong>: to run this website and store orders.
          </li>
          <li>
            <strong>Google (Gmail)</strong>: to send sign-in codes and order emails.
          </li>
          <li>
            <strong>WhatsApp (Meta)</strong>: to send phone verification codes.
          </li>
          <li>
            <strong>Government or law enforcement</strong>: when required by law or to protect against fraud.
          </li>
        </ul>
        <p>We do not sell, rent or trade your personal data to anyone.</p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: (
      <>
        <p>We use a few cookies and browser storage items. All of them are needed for the store to work:</p>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[13.5px] border-collapse min-w-[520px]">
            <thead>
              <tr className="text-left text-[#5c5a52] border-b-2 border-[#e7e2d8]">
                <th className="py-2 pr-3 font-semibold">Name</th>
                <th className="py-2 pr-3 font-semibold">Type</th>
                <th className="py-2 pr-3 font-semibold">Purpose</th>
                <th className="py-2 font-semibold">Kept for</th>
              </tr>
            </thead>
            <tbody>
              {STORAGE.map((row) => (
                <tr key={row.name} className="border-b border-[#f0ede6] align-top">
                  <td className="py-2 pr-3 font-mono text-[12.5px] break-all">{row.name}</td>
                  <td className="py-2 pr-3">{row.kind}</td>
                  <td className="py-2 pr-3">{row.purpose}</td>
                  <td className="py-2">{row.lasts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          You can clear these in your browser settings at any time. You will be signed out and your cart will be emptied.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <ul>
        <li>Order and payment records: as long as Indian tax and accounting laws require, usually up to 8 years.</li>
        <li>Sign-in and verification codes: expire after 10 minutes and are deleted within 2 days.</li>
        <li>Your account email: until you ask us to delete your account.</li>
        <li>Support messages: as long as needed to resolve your request and any follow-up.</li>
      </ul>
    ),
  },
  {
    id: "security",
    title: "How we protect it",
    body: (
      <p>
        We use encrypted connections (HTTPS), store sign-in codes only in hashed form, encrypt stored access keys and
        limit access to order data to the people who run the store. No system is perfectly secure; if a data breach
        affects you, we will inform you and the Data Protection Board of India as the law requires.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>Under the Digital Personal Data Protection Act, 2023 you can:</p>
        <ul>
          <li>ask what personal data we hold about you and how we use it;</li>
          <li>ask us to correct or update it;</li>
          <li>ask us to delete it, where we don&apos;t have to keep it by law;</li>
          <li>withdraw your consent;</li>
          <li>nominate someone to exercise these rights on your behalf;</li>
          <li>raise a complaint with our Grievance Officer, and then with the Data Protection Board of India.</li>
        </ul>
        <p>
          Email {mail(LEGAL.supportEmail)} from the email address on your orders, or include your order number and phone
          number. We may ask you to verify your identity before acting on the request.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Our store is meant for adults. If you are under 18, please shop with a parent or guardian&apos;s consent. We do not
        knowingly collect data from children without it; if you think we have, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: "transfers",
    title: "Where your data is stored",
    body: (
      <p>
        Our hosting, database and email providers may store or process data on servers outside India. When they do, we
        use providers that protect it with security standards at least as strong as described here, and transfers follow
        Indian law.
      </p>
    ),
  },
  {
    id: "grievance",
    title: "Grievance Officer",
    body: (
      <>
        <ul>
          <li>Name: {LEGAL.grievanceOfficer}</li>
          <li>Email: {mail(LEGAL.grievanceEmail)}</li>
          <li>Address: {LEGAL.address}</li>
        </ul>
        <p>We acknowledge complaints within 48 hours and aim to resolve them within one month.</p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        If we change this policy, we will update it here with a new &ldquo;last updated&rdquo; date. For important
        changes, we will also let you know by email if you have an account.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          This policy explains what personal data {LEGAL.brand} collects when you visit our website, place an order or
          sign in, why we need it, who we share it with and the choices you have. It should be read with our{" "}
          <Link href="/terms">Terms + Conditions</Link>.
        </p>
      }
      sections={sections}
    />
  );
}

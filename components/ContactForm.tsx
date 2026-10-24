"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { CONTACT_TOPICS, contactSchema } from "@/lib/validations/contact";

const inputClass =
  "w-full border border-[#d6d3cb] focus:border-[#1f3a2c] rounded-lg px-3 py-2.5 text-[14.5px] outline-none focus:ring-2 focus:ring-[#02cb5a]/20 bg-white transition-colors";

export default function ContactForm({ supportEmail }: { supportEmail: string }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    orderNumber: "",
    topic: "order" as string,
    message: "",
    website: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Topic from links like /contact?topic=return, and a signed-in customer's email
  useEffect(() => {
    const first = setTimeout(() => {
      const topic = new URLSearchParams(window.location.search).get("topic");
      if (CONTACT_TOPICS.some((t) => t.id === topic)) setForm((f) => ({ ...f, topic: topic as string }));
      try {
        const saved = JSON.parse(localStorage.getItem("teabox_customer_user") || "null");
        if (saved?.email) setForm((f) => (f.email ? f : { ...f, email: saved.email }));
      } catch {}
    }, 0);
    return () => clearTimeout(first);
  }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const check = contactSchema.safeParse(form);
    if (!check.success) {
      setError(check.error.issues[0]?.message || "Please check the form.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not send your message. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-10 space-y-3">
        <CheckCircle2 size={44} className="mx-auto text-[#02cb5a]" />
        <h2 className="text-[20px] font-bold text-[#1f3a2c]">Message sent</h2>
        <p className="text-[14px] text-[#5c5a52] max-w-[360px] mx-auto">
          Thanks, {form.name.split(" ")[0]}! We&apos;ll reply to <strong>{form.email}</strong> as soon as we can.
        </p>
        <Link href="/" className="inline-block mt-2 text-[14px] font-semibold text-[#1f3a2c] underline">
          Back to the shop
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="block text-[13px] font-semibold text-[#202020] mb-1">Your name *</span>
          <input className={inputClass} value={form.name} onChange={set("name")} autoComplete="name" required />
        </label>
        <label className="block">
          <span className="block text-[13px] font-semibold text-[#202020] mb-1">Email *</span>
          <input className={inputClass} type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
        </label>
        <label className="block">
          <span className="block text-[13px] font-semibold text-[#202020] mb-1">Phone (optional)</span>
          <input className={inputClass} type="tel" inputMode="numeric" value={form.phone} onChange={set("phone")} autoComplete="tel" />
        </label>
        <label className="block">
          <span className="block text-[13px] font-semibold text-[#202020] mb-1">Order number (optional)</span>
          <input className={inputClass} value={form.orderNumber} onChange={set("orderNumber")} placeholder="e.g. TB-12345678" />
        </label>
      </div>

      <label className="block">
        <span className="block text-[13px] font-semibold text-[#202020] mb-1">What is it about? *</span>
        <select className={inputClass} value={form.topic} onChange={set("topic")}>
          {CONTACT_TOPICS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="block text-[13px] font-semibold text-[#202020] mb-1">Message *</span>
        <textarea className={`${inputClass} min-h-[140px] resize-y`} value={form.message} onChange={set("message")} maxLength={2000} required />
        <span className="block text-[11.5px] text-[#747576] mt-1">
          For a damaged or wrong item, mention what&apos;s wrong. We&apos;ll ask for photos by email.
        </span>
      </label>

      {/* Hidden from people; bots that fill it are ignored */}
      <input type="text" name="website" value={form.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {error && (
        <p className="text-[13px] font-semibold text-[#c53030] bg-[#fff5f5] border border-[#feb2b2] rounded-lg p-2.5">
          {error}
          {error.includes("email us") && (
            <>
              {" "}
              <a href={`mailto:${supportEmail}`} className="underline">
                {supportEmail}
              </a>
            </>
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#02cb5a] hover:bg-[#02b851] disabled:opacity-70 text-[#1f3a2c] font-bold text-[15px] px-8 py-3 rounded-xl transition-colors cursor-pointer"
      >
        {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={16} />}
        {sending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

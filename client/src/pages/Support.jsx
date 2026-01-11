import React from "react";
import {
  HelpCircle,
  BookOpen,
  Mail,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function Support() {
  const { content } = useLanguage();
  const support = content?.support || {};

  const quickHelpItems = [
    {
      title: support.quickHelp?.userGuide || "User Guide",
      icon: <BookOpen className="h-6 w-6" />,
    },
    {
      title: support.quickHelp?.faqs || "FAQs",
      icon: <HelpCircle className="h-6 w-6" />,
    },
    {
      title: support.quickHelp?.contactSupport || "Contact Support",
      icon: <Mail className="h-6 w-6" />,
    },
  ];

  const faqs = support.faqs || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-20">
        {/* ---------------- HERO SECTION ---------------- */}
        <section className="text-center space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-300">
            <HelpCircle className="h-4 w-4" />
            {support.tagline || "Support"}
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            {support.heroTitle || "We're Here to Help"}
          </h1>
          <p className="mx-auto max-w-2xl text-slate-300">
            {support.heroSubtitle || "Find answers, guides, and support to use KrishiMitra with confidence."}
          </p>
        </section>

        {/* ---------------- QUICK HELP BUTTONS ---------------- */}
        <section className="grid gap-6 sm:grid-cols-3">
          {quickHelpItems.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border border-emerald-500/20 bg-slate-900/60 p-6 text-center shadow hover:shadow-lg hover:bg-slate-900/80 transition-all cursor-pointer group"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300 group-hover:bg-emerald-500/20">
                {item.icon}
              </div>
              <p className="text-lg font-medium text-slate-100">
                {item.title}
              </p>
            </div>
          ))}
        </section>

        {/* ---------------- FAQs SECTION ---------------- */}
        <section>
          <h2 className="text-3xl font-semibold mb-6 text-center">
            {support.faqTitle || "Frequently Asked Questions"}
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group border border-slate-700 rounded-xl bg-slate-900/70 p-4 cursor-pointer"
              >
                <summary className="flex items-center justify-between text-slate-100 text-lg font-medium">
                  {faq.q}
                  <ChevronDown className="h-5 w-5 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-slate-300 text-sm leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ---------------- CONTACT SUPPORT FORM ---------------- */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold text-center">
            {support.contactTitle || "Contact Support"}
          </h2>
          <p className="text-center text-slate-300 mb-4">
            {support.contactSubtitle || "Send us a message and we'll get back to you as soon as possible."}
          </p>

          <form className="max-w-3xl mx-auto space-y-6 rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-8 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  {support.form?.nameLabel || "Full Name"}
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-slate-200 focus:ring-2 focus:ring-emerald-400 outline-none"
                  placeholder={support.form?.namePlaceholder || "Your Name"}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  {support.form?.emailLabel || "Email Address"}
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-slate-200 focus:ring-2 focus:ring-emerald-400 outline-none"
                  placeholder={support.form?.emailPlaceholder || "your@email.com"}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">
                {support.form?.issueLabel || "Describe your issue"}
              </label>
              <textarea
                rows={5}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-slate-200 focus:ring-2 focus:ring-emerald-400 outline-none"
                placeholder={support.form?.issuePlaceholder || "How can we help you?"}
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 py-3 text-center text-slate-900 font-semibold hover:bg-emerald-400 transition"
            >
              {support.form?.submit || "Send Message"}
            </button>

            <p className="text-center text-sm text-slate-400">
              {support.contactEmailText || "You can also reach us at"}{" "}
              <span className="text-emerald-300 font-medium">
                {support.contactEmail || "Krishimitra2025@gmail.com"}
              </span>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}

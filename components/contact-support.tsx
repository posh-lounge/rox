"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  HeadphonesIcon,
  Mail,
  MessageCircle,
  Clock,
  CheckCircle2,
  ChevronDown,
  AlertCircle,
  BookOpen,
  ShieldCheck,
} from "lucide-react";

const categories = [
  "Account & Login",
  "Billing & Subscription",
  "Technical Issue",
  "Feature Request",
  "Security Concern",
  "Other",
];

const faqs = [
  {
    q: "I forgot my password. What should I do?",
    a: "Use the Forgot Password link on the sign-in page to receive a verification code by email and reset your password.",
  },
  {
    q: "My account is locked. How do I unlock it?",
    a: "After too many failed sign-in attempts your account is temporarily locked. Wait 15 minutes or contact support to unlock it immediately.",
  },
  {
    q: "How do I add team members to my workspace?",
    a: "Admins can invite members via the Employee Management module under Settings. Invitations are sent by email.",
  },
  {
    q: "Can I change the email address on my account?",
    a: "Email changes require verification. Go to Profile → Account Settings and follow the confirmation steps.",
  },
];

const contactInfo = [
  {
    icon: Mail,
    label: "Email Support",
    value: "support@bconn.app",
    color: "text-teal-400",
    border: "border-teal-500/30",
    bg: "bg-teal-500/10",
  },
  {
    icon: Clock,
    label: "Response Time",
    value: "Within 24 hours on business days",
    color: "text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
  },
  {
    icon: ShieldCheck,
    label: "Priority Support",
    value: "Available for Enterprise plans",
    color: "text-violet-400",
    border: "border-violet-500/30",
    bg: "bg-violet-500/10",
  },
];

export default function ContactSupportForm() {
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [category, setCategory]   = useState("");
  const [message, setMessage]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq]     = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !category || !message.trim()) {
      toast.warning("All fields are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, category, message }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Message sent", { description: data.message || "We'll get back to you soon." });
        setSubmitted(true);
      } else {
        toast.error("Failed to send", { description: data.message });
      }
    } catch (err: any) {
      toast.error("Connection error", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#060C1A] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-2xl shadow-2xl border border-white/[0.07]">

        {/* ── Left Panel ── */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-[#0A1628] to-[#0D1F3C] relative overflow-hidden">

          {/* grid texture */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

          {/* Brand */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3">
              <div className="bg-transparent rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <img className="object-contain" style={{ width: "70%", height: "100px" }} src="/logo.png" alt="Logo" />
                  </div>
                  <div className="w-0.5 h-12 bg-white/30" />
                  <div className="text-center">
                    <img className="object-contain" style={{ width: "70%", height: "100px", background: "transparent" }} src="/logo-web.png" alt="Business Connector Logo" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
                We're here<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                  to help you
                </span>{" "}
                succeed.
              </h1>
              <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-sm">
                Reach our support team with any question — account issues, billing, or technical problems. We respond fast.
              </p>
            </div>
          </div>

          {/* Contact info */}
          <div className="relative z-10 mt-10 space-y-3">
            {contactInfo.map(({ icon: Icon, label, value, color, border, bg }) => (
              <div key={label} className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${border} ${bg}`}>
                <div className={`w-8 h-8 rounded-lg ${bg} border ${border} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">{label}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ teaser */}
          <div className="relative z-10 mt-8 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <p className="text-slate-500 text-xs">Check the FAQ on the right — your answer might already be there.</p>
          </div>

          <div className="relative z-10 mt-8 pt-5 border-t border-white/[0.07]">
            <p className="text-slate-500 text-xs">Trusted by teams · Encrypted · Always available</p>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="bg-[#0A0F1E] flex items-start justify-center p-6 sm:p-10 overflow-y-auto">
          <div className="w-full max-w-md">

            {/* Mobile brand */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                <HeadphonesIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="mt-3 text-xl font-bold text-white">Business Connector</h1>
              <p className="text-slate-500 text-sm">Support Centre</p>
            </div>

            {!submitted ? (
              <>
                {/* Heading */}
                <div className="mb-8">
                  <p className="text-teal-400 text-sm font-medium tracking-wide uppercase mb-1">Support Centre</p>
                  <h2 className="text-3xl font-bold text-white leading-tight">Contact Support</h2>
                  <p className="mt-2 text-slate-400 text-sm">
                    Fill in the form and our team will reach out as soon as possible.
                  </p>
                </div>

                {/* FAQ section */}
                <div className="mb-8 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Common Questions</p>
                  </div>
                  {faqs.map((faq, i) => (
                    <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="flex items-center justify-between w-full px-4 py-3 text-left gap-3">
                        <span className="text-slate-300 text-xs font-medium leading-snug">{faq.q}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                      </button>
                      {openFaq === i && (
                        <div className="px-4 pb-3 pt-0">
                          <p className="text-slate-500 text-xs leading-relaxed border-t border-white/[0.05] pt-3">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 border-t border-white/[0.07]" />
                  <span className="text-slate-600 text-xs">Still need help?</span>
                  <div className="flex-1 border-t border-white/[0.07]" />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <div className="space-y-5">

                    {/* Name + Email row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-1.5 block text-sm font-medium text-slate-300">Full Name</Label>
                        <input
                          placeholder="Your name"
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="h-12 rounded-xl bg-white/[0.05] border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500 focus:ring-teal-500/20"
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5 block text-sm font-medium text-slate-300">Email Address</Label>
                        <input
                          placeholder="you@company.com"
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="h-12 rounded-xl bg-white/[0.05] border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500 focus:ring-teal-500/20"
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <Label className="mb-1.5 block text-sm font-medium text-slate-300">Category</Label>
                      <div className="relative">
                        <select
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                          className="w-full h-12 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white px-4 appearance-none focus:border-teal-500 outline-none cursor-pointer"
                          style={{ colorScheme: "dark" }}
                        >
                          <option value="" disabled className="bg-[#0d1020] text-slate-400">Select a category…</option>
                          {categories.map(c => (
                            <option key={c} value={c} className="bg-[#0d1020] text-white">{c}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <Label className="mb-1.5 block text-sm font-medium text-slate-300">Message</Label>
                      <textarea
                        rows={5}
                        placeholder="Describe your issue in as much detail as possible…"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        className="w-full rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm placeholder:text-slate-600 px-4 py-3 focus:border-teal-500 outline-none resize-none leading-relaxed transition-colors"
                      />
                      <p className="text-slate-600 text-[11px] mt-1 text-right">{message.length} / 1000</p>
                    </div>

                    {/* Priority notice */}
                    <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-slate-400 text-xs leading-relaxed">
                        For urgent security issues, email us directly at{" "}
                        <span className="text-teal-400">security@bconn.app</span>
                      </p>
                    </div>

                    <Button type="submit" disabled={loading}
                      className={`w-full h-12 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        loading
                          ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white shadow-lg shadow-teal-500/25"
                      }`}>
                      {loading
                        ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> Sending...</div>
                        : <div className="flex items-center justify-center gap-2"><MessageCircle className="w-4 h-4" /> Send Message</div>
                      }
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              /* ── Success state ── */
              <div className="text-center space-y-6 py-8">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Message received</h2>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
                    Thanks for reaching out. We'll reply to <span className="text-slate-300">{email}</span> within 24 hours on business days.
                  </p>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <Link href="/"
                    className="flex items-center justify-center gap-2 w-full h-12 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white shadow-lg shadow-teal-500/25 transition-all duration-200">
                    Back to Sign In
                  </Link>
                  <button onClick={() => { setSubmitted(false); setName(""); setEmail(""); setCategory(""); setMessage(""); }}
                    className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                    Send another message
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            {!submitted && (
              <div className="mt-8 pt-6 border-t border-white/[0.07] flex items-center justify-between text-xs text-slate-600">
                <Link href="/" className="flex items-center gap-1.5 text-slate-500 hover:text-teal-400 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
                <Link href="/reset-password" className="text-slate-500 hover:text-teal-400 transition-colors">
                  Reset password
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
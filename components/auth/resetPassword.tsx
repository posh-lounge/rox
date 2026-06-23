"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Mail,
  CheckCircle2,
  LockKeyhole,
  EyeIcon,
  EyeOffIcon,
  RefreshCcw,
} from "lucide-react";

const steps = [
  {
    key: "email",
    title: "Reset your password",
    subtitle: "Enter your work email and we'll send you a verification code.",
    label: "Email Address",
  },
  {
    key: "otp",
    title: "Check your inbox",
    subtitle: "We sent a 6-digit code to your email. Enter it below to continue.",
    label: "Verification Code",
  },
  {
    key: "new",
    title: "Set a new password",
    subtitle: "Choose a strong password for your account.",
    label: "New Password",
  },
  {
    key: "done",
    title: "Password updated",
    subtitle: "Your password has been changed successfully. You can now sign in.",
    label: "",
  },
];

const hints = [
  { icon: ShieldCheck, text: "Encrypted reset flow", color: "text-teal-400" },
  { icon: Mail,        text: "Code sent to your email", color: "text-cyan-400" },
  { icon: LockKeyhole, text: "New credentials are instant", color: "text-violet-400" },
];

export default function ResetPasswordForm() {
  const [step, setStep]               = useState(0); // 0 email · 1 otp · 2 new pw · 3 done
  const [email, setEmail]             = useState("");
  const [otp, setOtp]                 = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw, setConfirmPw]     = useState("");
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [resending, setResending]     = useState(false);

  // ── Step 0 — send OTP ────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.warning("Enter your email address"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/authentication/reset-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Code sent", { description: data.message || "Check your inbox" });
        setStep(1);
      } else {
        toast.error("Failed", { description: data.message || "Something went wrong" });
      }
    } catch (err: any) {
      toast.error("Connection error", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────
  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch("/api/authentication/reset-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) toast.success("Code resent", { description: "A new code was sent to your inbox" });
      else toast.error("Failed", { description: data.message });
    } catch (err: any) {
      toast.error("Connection error", { description: err.message });
    } finally {
      setResending(false);
    }
  };

  // ── Step 1 — verify OTP ──────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) { toast.warning("Enter the verification code"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/authentication/reset-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Code verified");
        setStep(2);
      } else {
        toast.error("Invalid code", { description: data.message });
      }
    } catch (err: any) {
      toast.error("Connection error", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 — set new password ────────────────────────────────
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPw) { toast.warning("Fill in both password fields"); return; }
    if (newPassword !== confirmPw)  { toast.warning("Passwords do not match"); return; }
    if (newPassword.length < 8)     { toast.warning("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/authentication/reset-password/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Password updated", { description: data.message });
        setStep(3);
      } else {
        toast.error("Failed", { description: data.message });
      }
    } catch (err: any) {
      toast.error("Connection error", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const current = steps[step];

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
          {/* glow blobs */}
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
                Secure account<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                  recovery,
                </span>{" "}
                made simple.
              </h1>
              <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-sm">
                We use a verified email-based flow to ensure only you can reset access to your workspace.
              </p>
            </div>
          </div>

          {/* Steps visual */}
          <div className="relative z-10 mt-10 space-y-3">
            {["Enter your email", "Verify the code", "Set new password"].map((label, i) => (
              <div key={i} className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-300
                ${step > i
                  ? "bg-teal-500/10 border-teal-500/30"
                  : step === i
                  ? "bg-white/[0.05] border-white/10"
                  : "opacity-40 border-transparent"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${step > i ? "bg-teal-500 text-white" : step === i ? "bg-white/10 text-white" : "bg-white/5 text-slate-500"}`}>
                  {step > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-sm font-medium ${step >= i ? "text-white" : "text-slate-500"}`}>{label}</span>
              </div>
            ))}
          </div>

          {/* Hints */}
          <div className="relative z-10 mt-8 space-y-2">
            {hints.map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0`} />
                <span className="text-slate-500 text-xs">{text}</span>
              </div>
            ))}
          </div>

          <div className="relative z-10 mt-8 pt-5 border-t border-white/[0.07]">
            <p className="text-slate-500 text-xs">Trusted by teams · Encrypted · Always available</p>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="bg-[#0A0F1E] flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">

            {/* Mobile brand */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <h1 className="mt-3 text-xl font-bold text-white">Business Connector</h1>
              <p className="text-slate-500 text-sm">Account recovery</p>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <p className="text-teal-400 text-sm font-medium tracking-wide uppercase mb-1">
                {step === 3 ? "All done" : `Step ${step + 1} of 3`}
              </p>
              <h2 className="text-3xl font-bold text-white leading-tight">{current.title}</h2>
              <p className="mt-2 text-slate-400 text-sm">{current.subtitle}</p>
            </div>

            {/* ── Step 0: Email ── */}
            {step === 0 && (
              <form onSubmit={handleSendOtp}>
                <div className="space-y-5">
                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-slate-300">Email Address</Label>
                    <input
                      placeholder="you@company.com"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="h-12 rounded-xl bg-white/[0.05] border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500 focus:ring-teal-500/20 w-full"
                    />
                  </div>
                  <Button type="submit" disabled={loading}
                    className={`w-full h-12 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      loading
                        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white shadow-lg shadow-teal-500/25"
                    }`}>
                    {loading
                      ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> Sending...</div>
                      : "Send Verification Code"
                    }
                  </Button>
                </div>
              </form>
            )}

            {/* ── Step 1: OTP ── */}
            {step === 1 && (
              <form onSubmit={handleVerifyOtp}>
                <div className="space-y-5">
                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-slate-300">6-Digit Code</Label>
                    <input
                      placeholder="e.g. 482910"
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="h-12 rounded-xl bg-white/[0.05] border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500 focus:ring-teal-500/20 tracking-[0.4em] text-center text-lg font-semibold"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Sent to <span className="text-slate-300">{email}</span></span>
                      <button type="button" onClick={handleResend} disabled={resending}
                        className="flex items-center gap-1 text-teal-400 hover:text-teal-300 transition disabled:opacity-50">
                        <RefreshCcw className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
                        Resend
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading}
                    className={`w-full h-12 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      loading
                        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white shadow-lg shadow-teal-500/25"
                    }`}>
                    {loading
                      ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> Verifying...</div>
                      : "Verify Code"
                    }
                  </Button>
                  <button type="button" onClick={() => setStep(0)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition mx-auto">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to email
                  </button>
                </div>
              </form>
            )}

            {/* ── Step 2: New password ── */}
            {step === 2 && (
              <form onSubmit={handleSetPassword}>
                <div className="space-y-5">
                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-slate-300">New Password</Label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="h-12 rounded-xl pr-12 bg-white/[0.05] border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500 focus:ring-teal-500/20"
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                        {showPw ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-sm font-medium text-slate-300">Confirm Password</Label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Repeat your new password"
                        value={confirmPw}
                        onChange={e => setConfirmPw(e.target.value)}
                        className={`h-12 rounded-xl pr-12 bg-white/[0.05] border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500 focus:ring-teal-500/20
                          ${confirmPw && confirmPw !== newPassword ? "border-rose-500/60" : ""}`}
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                        {showConfirm ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPw && confirmPw !== newPassword && (
                      <p className="mt-1.5 text-xs text-rose-400">Passwords do not match</p>
                    )}
                  </div>

                  {/* Strength hint */}
                  {newPassword.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1">
                        {[8, 10, 12].map((len, i) => (
                          <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300
                            ${newPassword.length >= len
                              ? i === 0 ? "bg-amber-500" : i === 1 ? "bg-teal-500" : "bg-emerald-500"
                              : "bg-white/10"}`} />
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {newPassword.length < 8 ? "Too short" : newPassword.length < 10 ? "Fair" : newPassword.length < 12 ? "Good" : "Strong"}
                      </p>
                    </div>
                  )}

                  <Button type="submit" disabled={loading || (!!confirmPw && confirmPw !== newPassword)}
                    className={`w-full h-12 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      loading
                        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white shadow-lg shadow-teal-500/25"
                    }`}>
                    {loading
                      ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> Updating...</div>
                      : "Update Password"
                    }
                  </Button>
                </div>
              </form>
            )}

            {/* ── Step 3: Done ── */}
            {step === 3 && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-teal-400" />
                </div>
                <p className="text-slate-400 text-sm">You can now use your new password to sign in to your workspace.</p>
                <Link href="/"
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white shadow-lg shadow-teal-500/25 transition-all duration-200">
                  Go to Sign In
                </Link>
              </div>
            )}

            {/* Back to sign in */}
            {step < 3 && (
              <div className="mt-8 pt-6 border-t border-white/[0.07] flex items-center justify-between text-xs text-slate-600">
                <Link href="/" className="flex items-center gap-1.5 text-slate-500 hover:text-teal-400 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
                <Link href="/contact-support" className="text-slate-500 hover:text-teal-400 transition-colors">
                  Need help?
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
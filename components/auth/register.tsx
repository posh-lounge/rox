"use client";
import Label from "@/components/form/Label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeftIcon, User, Lock, Eye, EyeOff, Sparkles,
  Shield, CheckCircle, Upload, X, Building2, AlertTriangle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Image compressor (WebP, same pattern as vision board)              */
/* ------------------------------------------------------------------ */
async function compressToWebP(file: File, maxWidth = 400, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
        "image/webp",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")); };
    img.src = objectUrl;
  });
}

/* ------------------------------------------------------------------ */
/*  Token verification hook                                             */
/* ------------------------------------------------------------------ */
function useInviteToken(token: string | null) {
  const [state, setState] = useState<{
    loading: boolean;
    valid: boolean;
    companyName: string | null;
    companyNo: number | null;
    error: string | null;
  }>({ loading: !!token, valid: !token, companyName: null, companyNo: null, error: null });

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("/api/authentication/verify-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = await res.json();
        if (res.ok && json.valid) {
          setState({ loading: false, valid: true, companyName: json.companyName, companyNo: json.companyNo, error: null });
        } else {
          setState({ loading: false, valid: false, companyName: null, companyNo: null, error: json.message || "Invalid or expired invite link" });
        }
      } catch {
        setState({ loading: false, valid: false, companyName: null, companyNo: null, error: "Failed to verify invite" });
      }
    })();
  }, [token]);

  return state;
}

/* ------------------------------------------------------------------ */
/*  Avatar uploader                                                     */
/* ------------------------------------------------------------------ */
function AvatarUploader({
  onFileSelect,
}: {
  onFileSelect: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    onFileSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex items-center gap-4">
      {preview ? (
        <div className="relative w-20 h-20">
          <img src={preview} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-purple-500" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -right-1 p-0.5 bg-gray-800 rounded-full text-gray-400 hover:text-red-400 border border-gray-700"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-20 h-20 rounded-full border-2 border-dashed border-gray-600 hover:border-purple-500 flex flex-col items-center justify-center gap-1 transition bg-gray-900/50"
        >
          <Upload size={16} className="text-gray-400" />
          <span className="text-[10px] text-gray-500">Photo</span>
        </button>
      )}
      <div>
        <p className="text-gray-300 text-sm font-medium">Profile Photo</p>
        <p className="text-gray-500 text-xs">Optional · JPG, PNG, WebP</p>
        {!preview && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-purple-400 text-xs hover:underline mt-1"
          >
            Upload photo
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                           */
/* ------------------------------------------------------------------ */
export default function CreateAccount() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const invite = useInviteToken(token);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phonenumber: "",
    position: "",
    department: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.firstname || !formData.lastname || !formData.email || !formData.password) {
      toast.warning("Required Fields", { description: "Please fill in all required fields" });
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Password Mismatch", { description: "Passwords do not match" });
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Weak Password", { description: "Password must be at least 6 characters" });
      setLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Invalid Email", { description: "Please enter a valid email address" });
      setLoading(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("firstname", formData.firstname);
      fd.append("lastname", formData.lastname);
      fd.append("email", formData.email);
      fd.append("phonenumber", formData.phonenumber);
      fd.append("position", formData.position);
      fd.append("department", formData.department);
      fd.append("password", formData.password);
      fd.append("base_currency", "RWF");
      if (token) fd.append("token", token);

      if (avatarFile) {
        try {
          const webp = await compressToWebP(avatarFile);
          fd.append("avatar", webp, "avatar.webp");
        } catch {
          toast.error("Image compression failed");
          setLoading(false);
          return;
        }
      }

      const response = await fetch("/api/authentication/sign_up", {
        method: "POST",
        body: fd,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account Created!", {
          description: "Welcome! Please sign in.",
        });
        setTimeout(() => router.push("./"), 2000);
      } else {
        toast.error("Registration Failed", {
          description: data.message || "Failed to create account",
        });
      }
    } catch {
      toast.error("Connection Error", { description: "Unable to connect to server" });
    } finally {
      setLoading(false);
    }
  };

  /* Invite loading state */
  if (token && invite.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Verifying invite link…</p>
        </div>
      </div>
    );
  }

  /* Invalid invite */
  if (token && !invite.valid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="max-w-sm w-full text-center bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-red-800/40 p-8">
          <AlertTriangle size={40} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Invalid Invite Link</h2>
          <p className="text-gray-400 text-sm mb-6">
            {invite.error || "This invite link is invalid or has expired. Please request a new one."}
          </p>
          <Link href="./" className="text-purple-400 hover:underline text-sm">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="./"
            className="inline-flex items-center text-sm text-gray-400 hover:text-gray-200 mb-6 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1" />
            Back to Sign In
          </Link>
          <div className="text-center mb-8">
            <div className="inline-block px-4 py-2 bg-purple-900/30 rounded-lg mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <span className="text-2xl font-bold text-purple-400">PA</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Your Account</h1>
            {invite.companyName ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-900/30 border border-cyan-700/40 rounded-lg mt-2">
                <Building2 size={14} className="text-cyan-400" />
                <p className="text-cyan-300 text-sm">
                  Joining <span className="font-semibold">{invite.companyName}</span>
                </p>
              </div>
            ) : (
              <p className="text-gray-400">Start your journey with your Personal Assistant</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">What You Get</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-200">Personal Dashboard</h3>
                    <p className="text-sm text-gray-400">Your centralized command center</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-200">Secure & Private</h3>
                    <p className="text-sm text-gray-400">Enterprise-grade security</p>
                  </div>
                </div>
                {invite.companyName && (
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-cyan-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Building2 className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-200">Team Access</h3>
                      <p className="text-sm text-gray-400">Collaborate with {invite.companyName}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <h3 className="font-medium text-gray-200">Free 30-day trial</h3>
                </div>
                <p className="text-sm text-gray-400">No credit card required.</p>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="font-medium text-gray-200 mb-2">Already have an account?</h3>
                <Link href="./" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                  Sign in here →
                </Link>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Account Information</h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-5">

                  {/* Avatar */}
                  <AvatarUploader onFileSelect={setAvatarFile} />

                  {/* Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-gray-300">First Name *</Label>
                      <input
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleChange}
                        placeholder="John"
                        required
                        className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-gray-300">Last Name *</Label>
                      <input
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleChange}
                        placeholder="Doe"
                        required
                        className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Email + Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-gray-300">Email Address *</Label>
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        required
                        className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-gray-300">Phone Number</Label>
                      <input
                        name="phonenumber"
                        value={formData.phonenumber}
                        onChange={handleChange}
                        placeholder="+250 788 123 456"
                        className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Position + Department (shown always, useful for company context) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-gray-300">Position</Label>
                      <input
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        placeholder="e.g. Software Engineer"
                        className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-gray-300">Department</Label>
                      <input
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="e.g. Engineering"
                        className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Currency display */}
                  <div className="bg-purple-900/20 border border-purple-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="block text-sm font-medium text-gray-300 mb-1">Base Currency</Label>
                        <p className="text-purple-400 font-semibold text-lg">RWF — Rwandan Franc</p>
                      </div>
                      <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-purple-400 font-bold">R₣</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Fixed to Rwandan Franc for all transactions</p>
                  </div>

                  {/* Passwords */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-gray-300">Password *</Label>
                      <div className="relative">
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="••••••••"
                          required
                          className="w-full px-3 py-2 pr-10 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                    </div>
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-gray-300">Confirm Password *</Label>
                      <div className="relative">
                        <input
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="••••••••"
                          required
                          className="w-full px-3 py-2 pr-10 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex items-center space-x-4 pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className={`px-6 py-3 font-medium transition-all ${
                        loading ? "bg-gray-600 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 text-white"
                      }`}
                    >
                      {!loading ? (
                        <div className="flex items-center">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Create Account
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Creating…
                        </div>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("./")}
                      className="px-6 py-3 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Cancel
                    </Button>
                  </div>

                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
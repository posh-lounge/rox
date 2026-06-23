"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import Image from "next/image";
import {
  EyeIcon,
  EyeOffIcon,
  Sparkles,
  Scissors,
  Shirt,
  Palette,
  Crown,
  Gem,
} from "lucide-react";
const features = [
  {
    icon: Shirt,
    label: "Luxury Fashion",
    desc: "Premium clothing collections",
    color: "from-yellow-500/10 to-yellow-700/5",
    border: "border-yellow-500/20",
    iconColor: "text-yellow-400",
  },
  
  {
    icon: Crown,
    label: "Elegant Styles",
    desc: "Luxury collections & couture",
    color: "from-yellow-500/10 to-yellow-700/5",
    border: "border-yellow-500/20",
    iconColor: "text-yellow-400",
  },
  {
    icon: Gem,
    label: "Premium Fabrics",
    desc: "Finest materials & quality",
    color: "from-amber-500/10 to-amber-700/5",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
  },
 
];

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const [buttonloading, setButtonloading] = React.useState(false);
  const [pageloading, setPageloading] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [passwordnow, setPassword] = React.useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setButtonloading(true);
    e.preventDefault();

    try {
      const formData = { username, password: passwordnow };

      if (!formData.username || !formData.password) {
        toast.warning("Required Fields", {
          description: "Please fill in all required fields",
        });
        setButtonloading(false);
      } else {
        try {
          const response = await fetch("/api/authentication/sign_in", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Origin: window.location.origin,
            },
            body: JSON.stringify({ ...formData }),
          });

          const responseData = await response.json();

          if (response.status === 200) {
            const formMeta = {
              username: responseData.metadata.email,
              password: responseData.metadata.password,
            };

            const signnow = await signIn("credentials", {
              ...formMeta,
              redirect: false,
            });

            if (signnow?.error) {
              toast.error("Authentication Failed", {
                description: signnow?.error,
              });
              setButtonloading(false);
            } else {
              toast.success("Welcome Back", {
                description: responseData.message,
              });
              setButtonloading(false);
              setPageloading(true);
              router.push(`/${responseData.metadata.role}`);
              router.refresh();
            }
          } else {
            toast.error("Access Denied", {
              description: responseData.message,
            });
            setButtonloading(false);
          }
        } catch (error: any) {
          toast.error("Connection Error", {
            description: error?.message || "Something went wrong",
          });
          setButtonloading(false);
        }
      }
    } catch (error: any) {
      toast.error("Error", {
        description: error?.message || "Unexpected error",
      });
      setButtonloading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-2xl shadow-2xl border border-yellow-500/20">

        {/* ── Left Panel ── */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-black via-[#0B0B0B] to-[#151515] relative overflow-hidden">

          {/* subtle grid texture */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* glow blobs */}
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          {/* Brand */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3">
               <div className="bg-transparent rounded-2xl p-6 text-white shadow-lg">
            
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <img
                                       className=" object-contain"
                                       style={{ width: '70%', height: '100px' }}
                                   
                                       src="/logo.png"

                                       alt="Logo"
                                      
                                     />
                   
                  </div>
                
                </div>
              </div>
         
             
                                    
            </div>

            <div className="mt-12">
              <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
                Crafting Elegance,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400">
                 Tailored To,
                </span>{" "}
                Perfection.
              </h1>
              <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-sm">
                Discover premium fashion, luxury fabrics, bespoke tailoring, and timeless designs crafted for excellence.
              </p>
            </div>
          </div>

          {/* Feature grid */}
          <div className="relative z-10 grid grid-cols-2 gap-3 mt-10">
            {features.map(({ icon: Icon, label, desc, color, border, iconColor }) => (
              <div
                key={label}
                className={`flex items-start gap-3 rounded-xl p-3.5 bg-gradient-to-br ${color} border ${border} backdrop-blur-sm`}
              >
                <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold leading-tight">{label}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="relative z-10 mt-8 pt-5 border-t border-white/[0.07]">
            <p className="text-slate-500 text-xs">
              Fashion · Fabrics · Tailoring · Design
            </p>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="bg-[#080808] flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">

            {/* Mobile brand */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-yellow-400 to-amber-400 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
                </svg>
              </div>
              <h1 className="mt-3 text-xl font-bold text-white">ROX HOUSE LTD</h1>
              <p className="text-slate-500 text-sm">Fashion • Fabrics • Tailoring</p>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <p className="text-yellow-400 text-sm font-medium tracking-wide uppercase mb-1">
                ROX HOUSE LTD
              </p>
              <h2 className="text-3xl font-bold text-white leading-tight">
                Welcome To Luxury
              </h2>
              <p className="mt-2 text-slate-400 text-sm">
                Access your fashion and tailoring management platform.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">

                {/* Email */}
                <div>
                  <Label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Email Address
                  </Label>
                  <Input
                    placeholder="you@company.com"
                    name="username"
                    id="username"
                    onChange={(e) => setUsername(e.target.value)}
                    type="email"
                    className="h-12 rounded-xl bg-white/[0.05] border-white/10 text-white placeholder:text-slate-600 focus:border-yellow-500 focus:ring-yellow-500/20"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-sm font-medium text-slate-300">
                      Password
                    </Label>
                    {/*<Link
                      href="/reset-password"
                      className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      Forgot password?
                    </Link>*/}
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl pr-12 bg-white/[0.05] border-white/10 text-white placeholder:text-slate-600 focus:border-yellow-500 focus:ring-yellow-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={buttonloading}
                  className={`w-full h-12 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    buttonloading
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-white shadow-lg shadow-yellow-500/25"
                  }`}
                >
                  {!buttonloading ? (
                    "Sign In to Workspace"
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </div>
                  )}
                </Button>
              </div>
            </form>

            {/* Feature pills — mobile only teaser */}
            <div className="lg:hidden mt-8 flex flex-wrap gap-2 justify-center">
              {features.map(({ icon: Icon, label, iconColor }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs text-slate-400"
                >
                  <Icon className={`w-3 h-3 ${iconColor}`} />
                  {label}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/[0.07] flex items-center justify-between text-xs text-slate-600">
              <span>Authorized users only</span>
           {/*   <Link
                href="/contact-support"
                className="text-slate-500 hover:text-yellow-400 transition-colors"
              >
                Contact Support
              </Link>
              */}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Car, Eye, EyeOff, ArrowRight } from "lucide-react";

function LoginInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim())    return setError("Enter your email address");
    if (!password)        return setError("Enter your password");

    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email:    email.trim().toLowerCase(),
        password,
      });

      if (signInError) throw signInError;
      if (!data.user)  throw new Error("Login failed. Please try again.");

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, email, verification_status")
        .eq("id", data.user.id)
        .single();

      const user = {
        id:                 data.user.id,
        name:               profile?.full_name ?? data.user.email ?? "User",
        email:              profile?.email     ?? data.user.email ?? "",
        phone:              profile?.phone     ?? "",
        verificationStatus: (profile?.verification_status ?? "unverified") as
          "unverified" | "pending" | "approved" | "rejected",
      };

      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("movento:auth"));
      router.push(redirect);
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("invalid"))
        setError("Incorrect email or password. Please try again.");
      else
        setError(msg || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f3] flex flex-col">

      {/* Top bar */}
      <header className="px-6 py-5 flex items-center justify-between max-w-[1100px] mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-[8px] flex items-center justify-center">
            <Car size={14} className="text-green-400" />
          </div>
          <span className="font-black text-[16px] tracking-tight">
            Movento<span className="text-green-500">.</span>
          </span>
        </Link>
        <Link href="/signup" className="text-[13px] font-semibold text-gray-500 hover:text-black transition-colors">
          New here? <span className="text-black font-bold">Create account</span>
        </Link>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px]">

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[28px] font-black tracking-tight text-black mb-1">Welcome back</h1>
            <p className="text-[14px] text-gray-500">Log in to your Movento account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                className="w-full h-12 border border-gray-200 focus:border-black rounded-xl px-4 text-[14px] font-medium bg-white outline-none transition-colors placeholder:text-gray-300"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Password
                </label>
                <Link href="/forgot-password"
                  className="text-[11px] font-bold text-gray-400 hover:text-black transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="w-full h-12 border border-gray-200 focus:border-black rounded-xl px-4 pr-12 text-[14px] font-medium bg-white outline-none transition-colors placeholder:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-[13px] text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-black hover:bg-gray-900 disabled:bg-gray-300 text-white font-black text-[14px] rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Log in <ArrowRight size={15} /></>
              )}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[11px] font-bold text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Sign up CTA */}
          <Link href="/signup"
            className="w-full h-12 border-2 border-gray-200 hover:border-black text-black font-black text-[14px] rounded-xl transition-colors flex items-center justify-center gap-2">
            Create a new account
          </Link>

          {/* Terms */}
          <p className="text-[11px] text-gray-400 text-center mt-5 leading-relaxed">
            By logging in you agree to our{" "}
            <Link href="/terms" className="text-black font-semibold hover:underline">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-black font-semibold hover:underline">Privacy Policy</Link>.
          </p>

        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5f3] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
      </div>
    }>
      <LoginInner />
    </Suspense>
  );
}

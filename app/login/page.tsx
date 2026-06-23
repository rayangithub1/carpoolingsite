"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Car, Eye, EyeOff, ArrowRight } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function LoginInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]         = useState("");
  const [showPass, setShowPass]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return setError("Enter your email address");
    if (!password)     return setError("Enter your password");

    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email:    email.trim().toLowerCase(),
        password,
      });

      if (signInError) throw signInError;
      if (!data.user)  throw new Error("Login failed. Please try again.");

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

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Google login failed.");
      setGoogleLoading(false);
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

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px]">

          <div className="mb-8">
            <h1 className="text-[28px] font-black tracking-tight text-black mb-1">Welcome back</h1>
            <p className="text-[14px] text-gray-500">Log in to your Movento account.</p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full h-12 bg-white border border-gray-200 hover:border-gray-400 text-black font-bold text-[14px] rounded-xl transition-colors flex items-center justify-center gap-3 mb-5 disabled:opacity-60"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <><GoogleIcon /> Continue with Google</>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[11px] font-bold text-gray-400">or continue with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">

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
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-[13px] text-red-600 font-medium">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-12 bg-black hover:bg-gray-900 disabled:bg-gray-300 text-white font-black text-[14px] rounded-xl transition-colors flex items-center justify-center gap-2 mt-2">
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <>Log in <ArrowRight size={15} /></>}
            </button>

          </form>

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

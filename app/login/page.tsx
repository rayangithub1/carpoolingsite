"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Shield, Users, CheckCircle, ArrowRight, Eye, EyeOff,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label, error, children,
}: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[13px] font-bold mb-1.5 text-black">{label}</label>
      {children}
      {error && (
        <p className="text-[12px] text-red-500 font-medium mt-1.5">{error}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router       = useRouter();
  const redirect =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("redirect") ?? "/dashboard"
    : "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors,       setErrors]      = useState<Record<string, string>>({});
  const [loading,      setLoading]     = useState(false);
  const [serverError,  setServerError] = useState("");
  const [showPass,     setShowPass]    = useState(false);

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
    setServerError("");
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.trim())
      e.email = "Enter your email address";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address";
    if (!form.password)
      e.password = "Enter your password";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError("");

    try {
      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("Login failed. Please try again.");

      // 2. Fetch profile for name + phone
      // 2. Fetch profile — add verification_status
const { data: profile } = await supabase
  .from("profiles")
  .select("full_name, phone, email, verification_status")  // ← add this
  .eq("id", authData.user.id)
  .single();

// 3. Save to localStorage — add verificationStatus
localStorage.setItem("user", JSON.stringify({
  id:                 authData.user.id,
  name:               profile?.full_name ?? authData.user.user_metadata?.full_name ?? "Movento User",
  phone:              profile?.phone     ?? authData.user.user_metadata?.phone     ?? "",
  email:              authData.user.email ?? form.email.trim().toLowerCase(),
  verificationStatus: profile?.verification_status ?? "unverified",  // ← add this
}));

      router.push(redirect);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";

      if (msg.toLowerCase().includes("invalid login credentials") ||
          msg.toLowerCase().includes("invalid credentials")) {
        setServerError("Incorrect email or password. Please try again.");
      } else if (msg.toLowerCase().includes("email not confirmed")) {
        setServerError("Please confirm your email address first. Check your inbox.");
      } else {
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-black/5 rounded-full blur-3xl" />
      </div>

      {/* Top-right signup link */}
      <div className="absolute top-6 right-6 z-20">
        <Link href="/signup"
          className="px-5 py-2.5 bg-white border border-gray-200 hover:border-black rounded-xl text-[13px] font-bold transition-colors shadow-sm">
          Create Account
        </Link>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-14 items-center">

          {/* ── LEFT ── */}
          <div>
            <h1 className="text-5xl font-black leading-[1.05] tracking-tight mb-6">
              Welcome back to<br /><span className="text-green-500">Movento.</span>
            </h1>

            <p className="text-gray-500 text-[16px] leading-relaxed mb-10 max-w-md">
              Continue booking rides, managing your trips and connecting with trusted commuters across Karachi.
            </p>

            <div className="space-y-3 mb-10">
              {[
                "Verified commuters & drivers",
                "Safe ride matching",
                "Live ride tracking",
                "Instant booking confirmations",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle size={17} className="text-green-500 flex-shrink-0" />
                  <span className="text-[15px] font-medium">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-8 border-t border-gray-200">
              {[
                { num: "2,400+",  label: "Commuters", color: ""              },
                { num: "4.9★",    label: "Rating",    color: ""              },
                { num: "Rs 4.2M", label: "Saved",     color: "text-green-600"},
              ].map((s, i, arr) => (
                <div key={s.label} className="flex items-center gap-6">
                  <div>
                    <div className={`text-2xl font-black ${s.color}`}>{s.num}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                  {i < arr.length - 1 && <div className="w-px h-10 bg-gray-200" />}
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: FORM ── */}
          <div>
            <div className="bg-white border border-gray-200 rounded-3xl p-8 lg:p-10 shadow-xl">
              <h2 className="text-[28px] font-black tracking-tight mb-1">Login</h2>
              <p className="text-gray-500 text-[14px] mb-8">
                Sign in with your email and password.
              </p>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">

                {/* Email */}
                <Field label="Email Address" error={errors.email}>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full h-13 px-4 border rounded-xl focus:border-black outline-none text-[14px] font-medium transition-colors ${errors.email ? "border-red-300" : "border-gray-200"}`}
                  />
                </Field>

                {/* Password */}
                <Field label="Password" error={errors.password}>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="Your password"
                      className={`w-full h-13 px-4 pr-11 border rounded-xl focus:border-black outline-none text-[14px] font-medium transition-colors ${errors.password ? "border-red-300" : "border-gray-200"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((x) => !x)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1.5">
                    <Link href="/forgot-password"
                      className="text-[12px] text-gray-400 hover:text-black transition-colors font-medium">
                      Forgot password?
                    </Link>
                  </div>
                </Field>

                {/* Server error */}
                {serverError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-[13px] text-red-600 font-medium">{serverError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 bg-green-500 hover:bg-green-600 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-black text-[15px] rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
                  ) : (
                    <>Login <ArrowRight size={17} /></>
                  )}
                </button>

              </form>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-center gap-6 text-[13px] text-gray-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Shield size={14} className="text-green-500" /> Verified Users
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={14} className="text-green-500" /> Trusted Community
                  </div>
                </div>
                <p className="text-center text-[12px] text-gray-400">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-black font-bold underline underline-offset-2 hover:text-green-600 transition-colors">
                    Sign up free
                  </Link>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
